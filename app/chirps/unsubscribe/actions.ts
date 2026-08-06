"use server";

import { redirect } from "next/navigation";
import { getChirpTokenSecret } from "@/lib/chirps/config";
import { disableChirpsWithToken } from "@/lib/chirps/unsubscribe";

export async function unsubscribeFromChirps(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) redirect("/chirps/unsubscribe?status=invalid");
  const result = await disableChirpsWithToken(token, getChirpTokenSecret());
  redirect(`/chirps/unsubscribe?status=${result.ok ? "done" : "expired"}`);
}
