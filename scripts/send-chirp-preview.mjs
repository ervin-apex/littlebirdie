import { Resend } from "resend";
import { renderChirpEmail } from "../lib/chirps/email.ts";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

const apiKey = required("RESEND_API_KEY");
const to = required("CHIRP_PREVIEW_TO");
const appBaseUrl = (process.env.APP_BASE_URL?.trim() || "https://littlebirdeetoldme.com")
  .replace(/\/$/, "");
const from = process.env.CHIRP_FROM_EMAIL?.trim() || "Little Birdee <onboarding@resend.dev>";
const replyTo = process.env.CHIRP_REPLY_TO_EMAIL?.trim() || to;

const content = {
  kind: "estimated_result",
  subject: "Your Little Birdee update is ready",
  preheader: "Newtown's estimated EBITDA for Monday is ready.",
  dateLabel: "Monday, 3 August",
  eyebrow: "Yesterday's result",
  heading: "Your estimated profit",
  intro: "Newtown finished ahead.",
  amountCents: 113600,
  amountLabel: "+$1,136 EBITDA",
  detailLines: [
    "Revenue excluding GST: $3,200",
    "COGS: $960",
    "Labour: $760",
    "Other operating costs: $344",
  ],
  assumptionNote: "Labour and other costs use Monday's share of your weekly budget.",
  ctaLabel: "See Monday's numbers",
  destination: "day",
};

const rendered = renderChirpEmail({
  content,
  actionUrl: `${appBaseUrl}/app?period=yesterday`,
  unsubscribeUrl: `${appBaseUrl}/account#daily-chirps`,
  recipientName: process.env.CHIRP_PREVIEW_NAME?.trim() || "Ervin",
});

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from,
  to,
  replyTo,
  subject: content.subject,
  html: rendered.html,
  text: rendered.text,
  headers: {
    "X-Entity-Ref-ID": `little-birdee-chirp-preview-${new Date().toISOString().slice(0, 10)}`,
  },
});

if (error) throw new Error(error.message);
console.log(`Chirp preview sent. Message ID: ${data?.id ?? "unknown"}`);
