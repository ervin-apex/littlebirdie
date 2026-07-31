import Link from "next/link";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";

export function OnboardingHeader({ href = "/app" }: { href?: string }) {
  return (
    <header className="onboarding-header">
      <Link href={href} className="onboarding-brand" aria-label="Little Birdee home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath(BRAND_LOGO_PATH)} width={38} height={38} alt="" />
        <span>Little Birdee</span>
      </Link>
    </header>
  );
}
