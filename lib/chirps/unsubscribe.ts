import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "./tokens";

export async function disableChirpsWithToken(token: string, secret: string) {
  const payload = verifyUnsubscribeToken(token, secret);
  if (!payload) return { ok: false as const, reason: "invalid" as const };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chirp_preferences")
    .update({
      enabled: false,
      unsubscribe_token_version: payload.version + 1,
    })
    .eq("id", payload.preferenceId)
    .eq("unsubscribe_token_version", payload.version)
    .select("id")
    .maybeSingle();
  if (error) throw new Error("Birdee could not update the Chirp preference.");
  if (!data) return { ok: false as const, reason: "expired" as const };
  return { ok: true as const };
}
