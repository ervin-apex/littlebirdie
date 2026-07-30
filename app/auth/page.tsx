import { redirect } from "next/navigation";
import { AuthGateway, type AuthGatewayMode } from "@/components/auth/AuthGateway";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const loginErrors: Record<string, string> = {
  confirmation: "That confirmation link could not be completed. Please log in or try again.",
  oauth: "Google sign-in could not be completed. Please try again or use email.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/auth/finish-setup");

  const { mode, error } = await searchParams;
  const initialMode: AuthGatewayMode = mode === "login" ? "login" : "signup";
  const loginMessage = error ? loginErrors[error] ?? "Sign-in could not be completed." : undefined;

  return <AuthGateway initialMode={initialMode} loginMessage={loginMessage} />;
}
