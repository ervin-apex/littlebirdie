export type BirdeeState = "profit" | "neutral" | "loss";

/**
 * Little Birdie — the yellow hummingbird mascot, drawn to match the locked
 * brand sheet. Implemented as SVG so it stays crisp at every size, themeable,
 * and can change expression live as the predicted profit moves.
 */
export function LittleBirdee({
  state = "neutral",
  size = 76,
  className,
}: {
  state?: BirdeeState;
  size?: number;
  className?: string;
}) {
  const droop = state === "loss";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label={
        state === "profit"
          ? "Little Birdie, happy"
          : state === "loss"
            ? "Little Birdie, worried"
            : "Little Birdie"
      }
      className={className}
    >
      <g
        style={{
          transform: droop ? "rotate(7deg) translateY(4px)" : "rotate(0deg)",
          transformOrigin: "56px 62px",
          transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* tail */}
        <path d="M32 66 L8 76 L34 80 Z" fill="#d97706" />
        {/* body */}
        <ellipse cx="56" cy="63" rx="30" ry="26" fill="#f59e0b" />
        {/* belly highlight */}
        <ellipse cx="52" cy="71" rx="18" ry="14" fill="#fbbf24" />
        {/* wing */}
        <ellipse
          cx="64"
          cy="55"
          rx="16"
          ry="10"
          fill="#d97706"
          transform="rotate(-20 64 55)"
        />
        {/* beak */}
        <path d="M84 53 L115 35 L86 61 Z" fill="#b45309" />
        {/* eye */}
        <circle cx="70" cy="53" r="4" fill="#1f2937" />
        <circle cx="71.4" cy="51.6" r="1.2" fill="#ffffff" />

        {/* mouth — expression by state */}
        {state === "profit" && (
          <path
            d="M63 61 Q69 67 75 61"
            stroke="#b45309"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}
        {state === "neutral" && (
          <line
            x1="64"
            y1="62"
            x2="75"
            y2="62"
            stroke="#b45309"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}
        {state === "loss" && (
          <path
            d="M63 64 Q69 59 75 64"
            stroke="#b45309"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}

        {/* worried stress marks, matching the brand sheet */}
        {state === "loss" && (
          <g stroke="#dc2626" strokeWidth="2.6" strokeLinecap="round">
            <line x1="92" y1="30" x2="98" y2="23" />
            <line x1="101" y1="34" x2="108" y2="29" />
          </g>
        )}
      </g>
    </svg>
  );
}
