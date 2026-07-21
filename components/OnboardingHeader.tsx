import Link from "next/link";
import { assetPath } from "@/lib/site";

export function OnboardingHeader({ href = "/" }: { href?: string }) {
  return (
    <header className="onboarding-header">
      <Link href={href} className="onboarding-brand" aria-label="Little Birdee home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/brand/birdee-mark.png")} width={38} height={38} alt="" />
        <span>Little Birdee</span>
      </Link>
    </header>
  );
}
