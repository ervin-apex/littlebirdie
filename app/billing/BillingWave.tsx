export function BillingWave() {
  return (
    <svg
      className="billing-wave"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="billing-wave__edge"
        d="M167 0H1000V1000H177C177 870 222 830 222 700C222 560 107 540 107 400C107 240 167 180 167 0Z"
      />
      <path
        className="billing-wave__fill"
        d="M185 0H1000V1000H195C195 870 240 830 240 700C240 560 125 540 125 400C125 240 185 180 185 0Z"
      />
    </svg>
  );
}
