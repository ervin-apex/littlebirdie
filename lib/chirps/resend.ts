import "server-only";
import { Resend } from "resend";

export async function sendChirpEmail({
  apiKey,
  from,
  replyTo,
  to,
  subject,
  html,
  text,
  unsubscribeUrl,
  idempotencyKey,
}: {
  apiKey: string;
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
  idempotencyKey: string;
}) {
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo,
    subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }, { idempotencyKey });

  if (error || !data?.id) {
    const message = error?.message ?? "Resend did not return a message id.";
    throw new Error(message);
  }
  return data.id;
}
