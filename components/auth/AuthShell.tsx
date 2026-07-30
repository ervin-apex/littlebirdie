import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { BirdeeMascot } from "@/components/BirdeeMascot";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <AppShell maxWidth="max-w-5xl" center headerVariant="home">
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
