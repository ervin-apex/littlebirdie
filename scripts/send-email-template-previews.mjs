import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import { renderChirpEmail } from "../lib/chirps/email.ts";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

const apiKey = required("RESEND_API_KEY");
const to = required("EMAIL_PREVIEW_TO");
const appBaseUrl = (process.env.APP_BASE_URL?.trim() || "https://littlebirdeetoldme.com")
  .replace(/\/$/, "");
const from = process.env.CHIRP_FROM_EMAIL?.trim() || "Little Birdee <onboarding@resend.dev>";
const replyTo = process.env.CHIRP_REPLY_TO_EMAIL?.trim() || to;
const previewScope = process.env.EMAIL_PREVIEW_SCOPE?.trim().toLowerCase() || "all";

const chirpFixtures = [
  {
    kind: "revenue_needed",
    subject: "Birdee needs one number from you",
    preheader: "Add Monday's revenue to see how Newtown went.",
    dateLabel: "Monday, 3 August",
    eyebrow: "Daily check-in",
    heading: "What did Newtown make?",
    intro: "Pop in one revenue number and Birdee will work out the rest from the weekly budget.",
    amountCents: null,
    amountLabel: null,
    detailLines: ["One revenue number is all Birdee needs at launch."],
    assumptionNote: "Labour remains an estimate allocated from the weekly budget.",
    ctaLabel: "Add Monday's revenue",
    destination: "check-in",
  },
  {
    kind: "setup_needed",
    subject: "A quick setup note from Little Birdee",
    preheader: "Finish Newtown's weekly budget to unlock daily Chirps.",
    dateLabel: "Monday, 3 August",
    eyebrow: "One quick setup step",
    heading: "Finish Newtown's weekly budget.",
    intro: "Once that is saved, I can turn each day's revenue into an estimated EBITDA update.",
    amountCents: null,
    amountLabel: null,
    detailLines: [
      "Your venue stays separate from every other venue.",
      "Labour and other costs come from the saved weekly budget.",
    ],
    assumptionNote: null,
    ctaLabel: "Finish venue setup",
    destination: "setup",
  },
];

const chirpEmails = chirpFixtures.map((content) => {
  const actionPath = content.destination === "setup" ? "/setup" : "/app/check-in";
  const rendered = renderChirpEmail({
    content,
    actionUrl: `${appBaseUrl}${actionPath}`,
    unsubscribeUrl: `${appBaseUrl}/account#daily-chirps`,
    recipientName: "Ervin",
  });
  return {
    from,
    to,
    replyTo,
    subject: `[Preview][Chirp] ${content.subject}`,
    html: rendered.html,
    text: rendered.text,
  };
});

const authTemplates = [
  ["confirmation.html", "Confirm your Little Birdee account"],
  ["invite.html", "You're invited to Little Birdee"],
  ["magic-link.html", "Your Little Birdee sign-in link"],
  ["email-change.html", "Confirm your new Little Birdee email"],
  ["recovery.html", "Reset your Little Birdee password"],
  ["reauthentication.html", "482913 is your Little Birdee code"],
];

const replacements = new Map([
  ["{{ .ConfirmationURL }}", `${appBaseUrl}/auth?email-preview=1`],
  ["{{ .Token }}", "482913"],
  ["{{ .Email }}", to],
  ["{{ .NewEmail }}", "new-email@example.com"],
]);

const authEmails = await Promise.all(authTemplates.map(async ([filename, subject]) => {
  let html = await readFile(join(process.cwd(), "supabase", "templates", filename), "utf8");
  for (const [placeholder, value] of replacements) {
    html = html.replaceAll(placeholder, value);
  }
  return {
    from,
    to,
    replyTo,
    subject: `[Preview][Auth] ${subject}`,
    html,
  };
}));

const previewEmails = previewScope === "auth"
  ? authEmails
  : previewScope === "chirps"
    ? chirpEmails
    : [...chirpEmails, ...authEmails];
const resend = new Resend(apiKey);
const { data, error } = await resend.batch.send(previewEmails);

if (error) throw new Error(error.message);
console.log(`Sent ${data?.data?.length ?? previewEmails.length} template previews.`);
