import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { buildChirpContent } from "@/lib/chirps/content";
import { getChirpDeliveryConfig, chirpSchedulerEnabled } from "@/lib/chirps/config";
import { renderChirpEmail } from "@/lib/chirps/email";
import { sendChirpEmail } from "@/lib/chirps/resend";
import { loadChirpSource } from "@/lib/chirps/source";
import { createUnsubscribeToken } from "@/lib/chirps/tokens";
import type { ClaimedChirpDelivery } from "@/lib/chirps/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request, expected: string) {
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function claimFrom(row: Record<string, unknown>): ClaimedChirpDelivery {
  return {
    deliveryId: String(row.delivery_id),
    preferenceId: String(row.preference_id),
    businessId: String(row.business_id),
    venueId: String(row.venue_id),
    userId: String(row.user_id),
    serviceDate: String(row.service_date),
    scheduledFor: String(row.scheduled_for),
    attemptCount: Number(row.attempt_count),
  };
}

function nextAttempt(attemptCount: number) {
  const delayMinutes = Math.min(240, 5 * (2 ** Math.max(0, attemptCount - 1)));
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}

async function processDelivery(
  admin: ReturnType<typeof createAdminClient>,
  claim: ClaimedChirpDelivery,
  config: ReturnType<typeof getChirpDeliveryConfig>,
) {
  const { data: preference } = await admin
    .from("chirp_preferences")
    .select("enabled, unsubscribe_token_version")
    .eq("id", claim.preferenceId)
    .maybeSingle();
  if (!preference?.enabled) {
    await admin.from("chirp_deliveries").update({
      status: "skipped",
      last_error_code: "preference_disabled",
      last_error_message: "The operator disabled this venue's Chirps before send.",
    }).eq("id", claim.deliveryId);
    return "skipped" as const;
  }

  try {
    const source = await loadChirpSource(admin, claim);
    const content = buildChirpContent(source);
    const actionUrl = new URL("/chirps/open", config.appBaseUrl);
    actionUrl.searchParams.set("venue", source.venueId);
    actionUrl.searchParams.set("date", source.serviceDate);
    actionUrl.searchParams.set("destination", content.destination);
    const token = createUnsubscribeToken({
      preferenceId: source.preferenceId,
      version: preference.unsubscribe_token_version,
    }, config.tokenSecret);
    const unsubscribeUrl = new URL("/api/chirps/unsubscribe", config.appBaseUrl);
    unsubscribeUrl.searchParams.set("token", token);
    const rendered = renderChirpEmail({
      content,
      actionUrl: actionUrl.toString(),
      unsubscribeUrl: unsubscribeUrl.toString(),
      recipientName: source.recipientName,
    });
    const digest = createHash("sha256")
      .update(`${content.subject}\n${rendered.text}`)
      .digest("hex");
    const messageId = await sendChirpEmail({
      apiKey: config.resendApiKey,
      from: config.fromEmail,
      replyTo: config.replyToEmail,
      to: source.recipientEmail,
      subject: content.subject,
      html: rendered.html,
      text: rendered.text,
      unsubscribeUrl: unsubscribeUrl.toString(),
      idempotencyKey: `chirp/${claim.preferenceId}/${claim.serviceDate}`,
    });
    const { error } = await admin.from("chirp_deliveries").update({
      kind: content.kind,
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_message_id: messageId,
      content_version: "g6-v1",
      content_digest: digest,
      last_error_code: null,
      last_error_message: null,
    }).eq("id", claim.deliveryId);
    if (error) throw new Error("Email sent, but its delivery record could not be updated.");
    return "sent" as const;
  } catch (error) {
    const retry = claim.attemptCount < 5;
    await admin.from("chirp_deliveries").update({
      status: retry ? "retryable" : "failed",
      next_attempt_at: retry ? nextAttempt(claim.attemptCount) : null,
      last_error_code: retry ? "send_retry" : "send_failed",
      last_error_message: error instanceof Error ? error.message.slice(0, 500) : "Unknown send failure",
    }).eq("id", claim.deliveryId);
    return retry ? "retryable" as const : "failed" as const;
  }
}

async function run(request: Request) {
  if (!chirpSchedulerEnabled()) {
    return NextResponse.json({ ok: true, scheduler: "disabled", processed: 0 });
  }
  const config = getChirpDeliveryConfig();
  if (!authorized(request, config.cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_due_chirp_deliveries", {
    p_now: new Date().toISOString(),
    p_limit: 25,
  });
  if (error) return NextResponse.json({ error: "Birdee could not claim due Chirps." }, { status: 500 });
  const claims = ((data ?? []) as Record<string, unknown>[]).map(claimFrom);
  const results = await Promise.all(claims.map((claim) => processDelivery(admin, claim, config)));
  return NextResponse.json({
    ok: true,
    processed: results.length,
    sent: results.filter((status) => status === "sent").length,
    skipped: results.filter((status) => status === "skipped").length,
    retryable: results.filter((status) => status === "retryable").length,
    failed: results.filter((status) => status === "failed").length,
  });
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
