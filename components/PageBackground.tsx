import { assetPath } from "@/lib/site";

/**
 * Shared full-bleed app background — the generated cream canvas illustration,
 * fixed behind all content, with a cream fallback to avoid any load flash.
 *
 * `faint` dials the illustration right down (for data-dense screens like the
 * dashboard) so numbers stay crisp; the warm cream base stays.
 */
export function PageBackground({ faint = false }: { faint?: boolean }) {
  return (
    <div aria-hidden className="fixed inset-0 z-0 bg-[#fbf3e6]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity"
        style={{
          backgroundImage: `url(${assetPath("/brand/bg-canvas.png")})`,
          opacity: faint ? 0.28 : 1,
        }}
      />
    </div>
  );
}
