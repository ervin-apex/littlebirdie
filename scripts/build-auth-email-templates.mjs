import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = join(process.cwd(), "supabase", "templates");
const logoUrl = "https://littlebirdie-gray.vercel.app/brand/birdee-face-square.png";

const templates = [
  {
    filename: "confirmation.html",
    title: "Confirm your Little Birdee account",
    preheader: "Confirm your email to finish creating your Little Birdee account.",
    eyebrow: "Account setup",
    heading: "You’re one tap away.",
    body: "Confirm this email address to finish creating your Little Birdee account.",
    actionLabel: "Confirm my email",
    actionUrl: "{{ .ConfirmationURL }}",
    noteLabel: "What happens next?",
    note: "Birdee will take you into setup so you can add your first venue’s numbers.",
    safety: "If you didn’t create this account, you can safely ignore this email.",
  },
  {
    filename: "invite.html",
    title: "You’re invited to Little Birdee",
    preheader: "Accept your invitation to join a Little Birdee business.",
    eyebrow: "Team invitation",
    heading: "A Little Birdee is waiting.",
    body: "You’ve been invited to join a Little Birdee business. Accept the invitation to access the venues shared with you.",
    actionLabel: "Accept my invitation",
    actionUrl: "{{ .ConfirmationURL }}",
    noteLabel: "Your numbers stay organised",
    note: "Each venue keeps its own plan, actuals and results, even when a team works together.",
    safety: "Not expecting this invitation? Ignore this email and nothing will change.",
  },
  {
    filename: "magic-link.html",
    title: "Sign in to Little Birdee",
    preheader: "Use your secure one-time link to sign in to Little Birdee.",
    eyebrow: "Secure sign-in",
    heading: "Here’s your way back in.",
    body: "Use this one-time link to sign in to Little Birdee. No password needed.",
    actionLabel: "Sign in securely",
    actionUrl: "{{ .ConfirmationURL }}",
    noteLabel: "A quick security chirp",
    note: "This link expires soon and only works for the account that requested it.",
    safety: "If you didn’t request this link, you can safely ignore this email.",
  },
  {
    filename: "email-change.html",
    title: "Confirm your new Little Birdee email",
    preheader: "Confirm the new email address for your Little Birdee account.",
    eyebrow: "Email change",
    heading: "Confirm your new email.",
    body: "Use the button below to confirm that Little Birdee should use this address:",
    highlight: "{{ .NewEmail }}",
    actionLabel: "Confirm new email",
    actionUrl: "{{ .ConfirmationURL }}",
    noteLabel: "Until you confirm",
    note: "Your current sign-in email stays unchanged.",
    safety: "Didn’t request this change? Don’t confirm it. Your account will keep its current email.",
  },
  {
    filename: "recovery.html",
    title: "Reset your Little Birdee password",
    preheader: "Use this secure link to choose a new Little Birdee password.",
    eyebrow: "Password reset",
    heading: "Choose a new password.",
    body: "Use this secure link to set a new password and get back into Little Birdee.",
    actionLabel: "Reset my password",
    actionUrl: "{{ .ConfirmationURL }}",
    noteLabel: "Keep this link private",
    note: "It expires soon and should never be forwarded or shared.",
    safety: "Didn’t ask for a password reset? Ignore this email and your password will not change.",
    safetyTone: "danger",
  },
  {
    filename: "reauthentication.html",
    title: "Your Little Birdee verification code",
    preheader: "Your one-time Little Birdee verification code.",
    eyebrow: "Security check",
    heading: "Just checking it’s you.",
    body: "Enter this one-time code in Little Birdee to continue:",
    code: "{{ .Token }}",
    noteLabel: "One use only",
    note: "This code expires soon. Little Birdee will never ask you to send it to another person.",
    safety: "Didn’t request this code? You can safely ignore this email.",
    safetyTone: "danger",
  },
];

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function renderHighlight(value) {
  if (!value) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px">
    <tr><td style="padding:14px 16px;background:#fff5d6;border:1px solid #e9bd4d;border-radius:10px;color:#10203c;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:15px;line-height:1.45;font-weight:800;word-break:break-all">${value}</td></tr>
  </table>`;
}

function renderAction(template) {
  if (!template.actionUrl) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td bgcolor="#fcb400" align="center" style="background:#fcb400;border:1px solid #10203c;border-bottom:4px solid #c88400;border-radius:11px;mso-padding-alt:16px 24px">
      <a href="${template.actionUrl}" style="display:block;padding:14px 24px;color:#10203c;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:16px;line-height:1.25;font-weight:800;text-align:center;text-decoration:none">${template.actionLabel} &nbsp;→</a>
    </td></tr>
  </table>`;
}

function renderCode(value) {
  if (!value) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td class="email-code" align="center" style="padding:20px 16px;background:#fff5d6;border:1px solid #e9bd4d;border-radius:12px;color:#10203c;font-family:'Courier New',monospace;font-size:38px;line-height:1.2;font-weight:700;letter-spacing:7px">${value}</td></tr>
  </table>`;
}

function renderFallback(actionUrl) {
  if (!actionUrl) return "";
  return `<p style="margin:26px 0 7px;color:#71809a;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:12px;line-height:1.5">Button not working? Copy this secure link into your browser:</p>
  <p style="margin:0;color:#315b98;font-family:Arial,sans-serif;font-size:11px;line-height:1.55;word-break:break-all"><a href="${actionUrl}" style="color:#315b98;text-decoration:underline">${actionUrl}</a></p>`;
}

function renderTemplate(template) {
  const safetyBackground = template.safetyTone === "danger" ? "#fbefed" : "#f1f3f6";
  const safetyBorder = template.safetyTone === "danger" ? "#c94b43" : "#dfe3ea";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${template.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@700;800&display=swap');
    @media only screen and (max-width:620px) {
      .outer-pad { padding:0 !important; }
      .email-shell { width:100% !important; border-radius:0 !important; }
      .email-header { padding:20px !important; }
      .email-body { padding:30px 20px 26px !important; }
      .email-title { font-size:28px !important; letter-spacing:-0.7px !important; }
      .email-footer { padding:20px !important; }
    }
    @media only screen and (max-width:400px) {
      .brand-name { font-size:20px !important; }
      .header-label { font-size:9px !important; letter-spacing:0.8px !important; }
      .email-title { font-size:25px !important; }
      .email-code { font-size:32px !important; letter-spacing:5px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f3f6;color:#10203c;font-family:'Nunito','Trebuchet MS',Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${template.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f1f3f6">
    <tr><td class="outer-pad" align="center" style="padding:32px 12px">
      <table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #dfe3ea;border-radius:20px;overflow:hidden;box-shadow:0 8px 28px rgba(16,32,60,0.08)">
        <tr><td class="email-header" style="padding:24px 28px;background:#ffffff;border-bottom:1px solid #dfe3ea">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td valign="middle">
              <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                <td valign="middle" style="padding-right:11px"><img src="${logoUrl}" width="42" height="42" alt="" style="display:block;width:42px;height:42px;object-fit:contain;border:0"></td>
                <td class="brand-name" valign="middle" style="color:#10203c;font-family:'Poppins','Trebuchet MS',Arial,sans-serif;font-size:23px;line-height:1.1;font-weight:700;letter-spacing:-0.55px">Little <span style="color:#f59e0b">Birdee</span></td>
              </tr></table>
            </td>
            <td class="header-label" align="right" valign="middle" style="color:#71809a;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:10px;line-height:1.3;font-weight:800;letter-spacing:1.1px;text-transform:uppercase">Account email</td>
          </tr></table>
        </td></tr>
        <tr><td style="height:8px;background:#fcb400;font-size:0;line-height:0">&nbsp;</td></tr>
        <tr><td class="email-body" style="padding:38px 34px 32px;background:#ffffff">
          <p style="margin:0 0 12px;color:#c17b00;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:12px;line-height:1.4;font-weight:800;letter-spacing:1.05px;text-transform:uppercase">${template.eyebrow}</p>
          <h1 class="email-title" style="margin:0 0 16px;color:#10203c;font-family:'Poppins','Trebuchet MS',Arial,sans-serif;font-size:32px;line-height:1.14;font-weight:700;letter-spacing:-0.9px">${template.heading}</h1>
          <p style="margin:0 0 24px;color:#566783;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:16px;line-height:1.6">${template.body}</p>
          ${renderHighlight(template.highlight)}
          ${renderAction(template)}
          ${renderCode(template.code)}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px">
            <tr>
              <td width="38" valign="top"><img src="${logoUrl}" width="30" height="30" alt="" style="display:block;width:30px;height:30px;object-fit:contain;border:0"></td>
              <td style="padding:2px 0 0 8px;color:#10203c;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:14px;line-height:1.5"><strong>${template.noteLabel}</strong><br><span style="color:#566783">${template.note}</span></td>
            </tr>
          </table>
          <p style="margin:24px 0 0;padding:14px 16px;background:${safetyBackground};border-left:3px solid ${safetyBorder};border-radius:8px;color:#314361;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:13px;line-height:1.55">${template.safety}</p>
          ${renderFallback(template.actionUrl)}
        </td></tr>
        <tr><td class="email-footer" align="center" style="padding:20px 28px 24px;background:#f9f9f9;border-top:1px solid #dfe3ea;color:#71809a;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:12px;line-height:1.6">
          Little Birdee &middot; Account security<br>
          This message relates to ${template.filename === "email-change.html" ? "an email change" : "{{ .Email }}"}.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`.replace(/[ \t]+$/gm, "");
}

await Promise.all(templates.map((template) => writeFile(
  join(outputDirectory, template.filename),
  renderTemplate(template),
  "utf8",
)));

console.log(`Built ${templates.length} Little Birdee auth email templates.`);
