import { ArrowRight, SignIn, UserPlus } from "@phosphor-icons/react/dist/ssr";
import { AppShell } from "@/components/AppShell";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import { createClient } from "@/lib/supabase/server";
import "./home.css";

/**
 * Account gateway. The old localStorage check could mistake demo numbers for
 * a real account, so authentication now owns the route into setup and results.
 */
export const dynamic = "force-dynamic";

export default async function HomeHub() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const brandHref = data?.claims ? "/app" : "/";

  return (
    <AppShell maxWidth="max-w-7xl" headerVariant="home" brandHref={brandHref}>
      <div className="home-hub fade-up">
        <section className="home-workspace" aria-labelledby="home-question">
          <div className="home-birdee-stage" aria-hidden>
            <BirdeeMascot state="neutral" size={300} className="home-birdee" float />
          </div>

          <div className="home-choice-pane">
            <h1 id="home-question">What would you like to do?</h1>

            <div className="home-actions">
              <ProductButton
                href="/auth/login"
                variant="secondary"
                size="choice"
                fullWidth
                leadingIcon={<SignIn weight="regular" />}
                description="Return to my business and venues."
              >
                I already have an account
              </ProductButton>

              <ProductButton
                href="/auth/create-account"
                variant="primary"
                size="choice"
                fullWidth
                leadingIcon={<UserPlus weight="regular" />}
                trailingIcon={<ArrowRight weight="regular" />}
                description="Add my business and first venue."
              >
                Create my account
              </ProductButton>
            </div>
          </div>
        </section>

        <footer className="home-rhythm-note">
          <span aria-hidden />
          <p>Check daily. Update weekly.</p>
          <span aria-hidden />
        </footer>
      </div>
    </AppShell>
  );
}
