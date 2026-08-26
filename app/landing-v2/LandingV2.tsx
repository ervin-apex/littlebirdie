import { AccountantStory } from "./components/AccountantStory";
import { CallToActionSection } from "./components/CallToActionSection";
import { CommunitySection } from "./components/CommunitySection";
import { DailyChirpSection } from "./components/DailyChirpSection";
import { FitSection } from "./components/FitSection";
import { FooterV2 } from "./components/FooterV2";
import { HeroSection } from "./components/HeroSection";
import { LandingPreloader } from "./components/LandingPreloader";
import { PricingSection } from "./components/PricingSection";
import { PrivacySection } from "./components/PrivacySection";
import { ProfitMachineStory } from "./components/ProfitMachineStory";
import { SiteNavV2 } from "./components/SiteNavV2";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { VisibilityStory } from "./components/VisibilityStory";
import { WhatWeDoSection } from "./components/WhatWeDoSection";
import "./landing-v2.css";

type LandingV2Props = {
  fontClassName: string;
  isAuthenticated: boolean;
};

export function LandingV2({ fontClassName, isAuthenticated }: LandingV2Props) {
  const primaryAction = {
    label: "Create account",
    href: "/auth?mode=signup",
  };

  return (
    <div className={`lb2-page ${fontClassName}`}>
      <LandingPreloader>
        <a className="lb2-skip" href="#lb2-main">Skip to content</a>
        <SiteNavV2 isAuthenticated={isAuthenticated} />
        <main id="lb2-main" tabIndex={-1}>
          <HeroSection primaryAction={primaryAction} />
          <VisibilityStory />
          <WhatWeDoSection />
          <AccountantStory />
          <ProfitMachineStory />
          <DailyChirpSection />
          <PricingSection primaryAction={primaryAction} />
          <FitSection />
          <PrivacySection />
          <CallToActionSection primaryAction={primaryAction} />
          <CommunitySection />
          <TestimonialsSection />
        </main>
        <FooterV2 />
      </LandingPreloader>
    </div>
  );
}
