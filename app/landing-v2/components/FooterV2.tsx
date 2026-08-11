export function FooterV2() {
  return (
    <footer className="lb2-footer">
      <svg
        className="lb2-footer__curve"
        viewBox="0 0 1440 180"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="lb2-footer__curve-fill" d="M0 0H1440V18Q720 250 0 18Z" />
        <path className="lb2-footer__curve-line" d="M0 18Q720 250 1440 18" />
      </svg>
      <div className="lb2-shell lb2-footer__inner">
        <span className="lb2-footer__legal">© {new Date().getFullYear()} Little Birdee. All rights reserved.</span>
      </div>
    </footer>
  );
}
