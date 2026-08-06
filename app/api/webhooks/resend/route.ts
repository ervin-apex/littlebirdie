import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { getResendWebhookSecret } from "@/lib/chirps/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ResendEvent = {
  type?: string;
  created_at?: string;
  data?: { email_id?: string };
};

const DELIVERY_STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

export async function POST(request: Request) {
  const raw = await request.text();
  const eventId = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!eventId || !timestamp || !signature) {
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  }

  let event: ResendEvent;
  try {
    event = new Webhook(getResendWebhookSecret()).verify(raw, {
      "svix-id": eventId,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    }) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const messageId = event.data?.email_id ?? null;
  const admin = createAdminClient();
  const { data: delivery } = messageId
    ? await admin
      .from("chirp_deliveries")
      .select("id, preference_id")
      .eq("provider_message_id", messageId)
      .maybeSingle()
    : { data: null };
  const { error: insertError } = await admin.from("chirp_delivery_events").insert({
    delivery_id: delivery?.id ?? null,
    provider_event_id: eventId,
    provider_message_id: messageId,
    event_type: event.type ?? "unknown",
    occurred_at: event.created_at ?? new Date().toISOString(),
    payload: { type: event.type ?? "unknown", email_id: messageId },
  });
  // Resend retries duplicate webhook deliveries. The unique provider id makes
  // acknowledging the replay safe and avoids repeating side effects.
  if (insertError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (insertError) return NextResponse.json({ error: "Webhook event could not be stored." }, { status: 500 });

  const status = event.type ? DELIVERY_STATUS[event.type] : undefined;
  if (delivery && status) {
    await admin.from("chirp_deliveries").update({
      status,
      delivered_at: status === "delivered" ? (event.created_at ?? new Date().toISOString()) : undefined,
      last_error_code: ["bounced", "complained", "failed"].includes(status) ? status : null,
    }).eq("id", delivery.id);
    if (status === "bounced" || status === "complained") {
      await admin.from("chirp_preferences").update({ enabled: false }).eq("id", delivery.preference_id);
    }
  }
  return NextResponse.json({ ok: true });
}
