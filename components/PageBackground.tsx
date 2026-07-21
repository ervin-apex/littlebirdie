/**
 * Shared full-bleed app background. It carries the approved clean paper and
 * yellow palette without competing with the financial information above it.
 */
export function PageBackground({ faint = false }: { faint?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: "var(--lb-paper)" }}
    >
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          backgroundImage:
            "radial-gradient(circle at 102% -8%, color-mix(in srgb, var(--lb-yellow) 18%, transparent) 0 18%, transparent 45%), radial-gradient(circle at -8% 108%, color-mix(in srgb, var(--lb-yellow) 10%, transparent) 0 16%, transparent 42%)",
          opacity: faint ? 0.4 : 0.68,
        }}
      />
    </div>
  );
}
