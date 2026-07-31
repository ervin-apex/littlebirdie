import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { createClient } from "@/lib/supabase/server";

export async function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const brandHref = data?.claims ? "/app" : "/";

  return (
    <AppShell maxWidth="max-w-5xl" center headerVariant="home" brandHref={brandHref}>
      <div className="auth-workspace">
        <section className="auth-welcome" aria-labelledby="auth-title">
          <div className="auth-birdee" aria-hidden>
            <BirdeeMascot state="neutral" size={180} />
          </div>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
          <small>Your numbers stay separated by business and venue.</small>
        </section>
        <section className="auth-card">{children}</section>
      </div>
    </AppShell>
  );
}
