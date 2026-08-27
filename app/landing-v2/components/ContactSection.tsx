const CONTACT_EMAIL = "hello@littlebirdeetoldme.com";

export function ContactSection() {
  return (
    <section className="lb2-contact" aria-labelledby="lb2-contact-title">
      <div className="lb2-shell lb2-contact__inner">
        <h2 id="lb2-contact-title">
          <span>Got</span>
          <span>questions?</span>
        </h2>
        <p>Email us at</p>
        <a href={`mailto:${CONTACT_EMAIL}`}>
          <svg viewBox="0 0 28 22" aria-hidden="true">
            <rect x="1.5" y="1.5" width="25" height="19" rx="3" />
            <path d="m3.5 4.5 10.5 8 10.5-8" />
          </svg>
          <span>{CONTACT_EMAIL}</span>
        </a>
      </div>
    </section>
  );
}
