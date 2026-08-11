import { describe, expect, it } from "vitest";
import { renderChirpEmail } from "./email";

describe("renderChirpEmail", () => {
  it("escapes operator-controlled values and includes text fallback", () => {
    const email = renderChirpEmail({
      content: {
        kind: "revenue_needed",
        subject: "Birdee needs one number from you",
        preheader: "Add actual",
        dateLabel: "Monday, 3 August",
        eyebrow: "Daily check-in",
        heading: "How did <Venue> go?",
        intro: "Add yesterday's number.",
        amountCents: null,
        amountLabel: null,
        detailLines: [],
        assumptionNote: null,
        ctaLabel: "Add actual",
        destination: "check-in",
      },
      actionUrl: "https://example.com/chirps/open?x=1&y=2",
      unsubscribeUrl: "https://example.com/chirps/unsubscribe?token=one&two=2",
      recipientName: "<Ervin>",
    });
    expect(email.html).toContain("How did &lt;Venue&gt; go?");
    expect(email.html).not.toContain("<Ervin>");
    expect(email.html).toContain("/brand/birdee-face-square.png");
    expect(email.html).toContain("/brand/birdee-semantic-one-number-v1.png");
    expect(email.text).toContain("Add actual: https://example.com/chirps/open");
  });

  it("renders a positive result as the dominant green score", () => {
    const email = renderChirpEmail({
      content: {
        kind: "estimated_result",
        subject: "Your Little Birdee update is ready",
        preheader: "Yesterday's estimated result is ready.",
        dateLabel: "Monday, 3 August",
        eyebrow: "Yesterday's result",
        heading: "Newtown made an estimated",
        intro: "Monday's actual has been combined with the saved cost assumptions.",
        amountCents: 113600,
        amountLabel: "+$1,136 EBITDA",
        detailLines: ["Actual excluding GST: $3,200", "Labour: $920"],
        assumptionNote: "Labour and other costs use the locked weekly budget.",
        ctaLabel: "See yesterday's numbers",
        destination: "day",
      },
      actionUrl: "https://littlebirdee.example/chirps/open",
      unsubscribeUrl: "https://littlebirdee.example/chirps/unsubscribe",
      recipientName: "Ervin",
    });

    expect(email.html).toContain("+$1,136");
    expect(email.html).not.toContain(">+$1,136 EBITDA<");
    expect(email.html).toContain("Estimated EBITDA");
    expect(email.html).toContain("color:#287a53");
    expect(email.html).toContain("/brand/birdee-semantic-encouraging-v1.png");
    expect(email.html).toContain("/brand/chirp-profit-card-flight-path-v1.png");
    expect(email.html).toContain("What Birdee used");
    expect(email.html).toContain("Actual excluding GST");
    expect(email.html).toContain(".hero-copy { display:table-cell !important;");
    expect(email.html).toContain(".hero-birdee { display:table-cell !important;");
    expect(email.html).not.toContain(".hero-copy { display:block !important;");
  });

  it("uses the loss colour when the estimated result is negative", () => {
    const email = renderChirpEmail({
      content: {
        kind: "estimated_result",
        subject: "Your Little Birdee update is ready",
        preheader: "Yesterday's estimated result is ready.",
        dateLabel: "Monday, 3 August",
        eyebrow: "Yesterday's result",
        heading: "Newtown made an estimated",
        intro: "The result uses the saved weekly plan.",
        amountCents: -24300,
        amountLabel: "−$243 EBITDA",
        detailLines: [],
        assumptionNote: null,
        ctaLabel: "See yesterday's numbers",
        destination: "day",
      },
      actionUrl: "https://littlebirdee.example/chirps/open",
      unsubscribeUrl: "https://littlebirdee.example/chirps/unsubscribe",
      recipientName: "Ervin",
    });

    expect(email.html).toContain("color:#c94b43");
    expect(email.html).toContain("/brand/birdee-semantic-supportive-v1.png");
  });
});
