import type { ChirpContent, ChirpKind } from "./types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function assetUrl(actionUrl: string, path: string) {
  return new URL(path, actionUrl).toString();
}

function birdeeAsset(kind: ChirpKind) {
  if (kind === "estimated_result") return "/brand/birdee-reference-profit-v1.png";
  if (kind === "setup_needed") return "/brand/birdee-reference-business-v1.png";
  return "/brand/birdee-reference-neutral-v1.png";
}

function detailRow(line: string) {
  const separator = line.indexOf(":");
  if (separator === -1) {
    return `<tr><td colspan="2" style="padding:15px 0;border-bottom:1px solid #dfe3ea;color:#314361;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:17px;line-height:1.4">${escapeHtml(line)}</td></tr>`;
  }
  const label = line.slice(0, separator);
  const value = line.slice(separator + 1).trim();
  return `<tr>
    <td style="padding:15px 12px 15px 0;border-bottom:1px solid #dfe3ea;color:#10203c;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:17px;line-height:1.4">${escapeHtml(label)}</td>
    <td align="right" style="padding:15px 0;border-bottom:1px solid #dfe3ea;color:#10203c;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:17px;line-height:1.4;font-weight:800;white-space:nowrap">${escapeHtml(value)}</td>
  </tr>`;
}

function visualAmount(label: string) {
  return label.replace(/\s+EBITDA$/i, "");
}

export function renderChirpEmail({
  content,
  actionUrl,
  unsubscribeUrl,
  recipientName,
}: {
  content: ChirpContent;
  actionUrl: string;
  unsubscribeUrl: string;
  recipientName: string;
}) {
  const details = content.detailLines.map(detailRow).join("");
  const amountColor = content.amountCents !== null && content.amountCents < 0
    ? "#c94b43"
    : "#287a53";
  const amount = content.amountLabel
    ? `<p class="score" style="margin:20px 0 4px;font-family:'Poppins','Trebuchet MS',Arial,sans-serif;font-size:62px;line-height:0.96;font-weight:800;letter-spacing:-3px;color:${amountColor}">${escapeHtml(visualAmount(content.amountLabel))}</p>
       <p style="margin:0;color:#566783;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:13px;font-weight:700;line-height:1.4">Estimated EBITDA</p>`
    : "";
  const note = content.assumptionNote
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px"><tr>
        <td width="28" valign="top" style="padding:2px 0 0"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#70809a;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;line-height:20px;text-align:center">i</span></td>
        <td style="padding:0 0 0 8px;color:#566783;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(content.assumptionNote)}</td>
      </tr></table>`
    : "";
  const name = recipientName.trim() || "there";
  const logoUrl = assetUrl(actionUrl, "/brand/birdee-face-square.png");
  const mascotUrl = assetUrl(actionUrl, birdeeAsset(content.kind));
  const heroBackdropUrl = content.kind === "estimated_result"
    ? assetUrl(actionUrl, "/brand/chirp-profit-card-flight-path-v1.png")
    : null;
  const heroBackdropAttribute = heroBackdropUrl
    ? ` background="${escapeHtml(heroBackdropUrl)}"`
    : "";
  const heroBackdropStyle = heroBackdropUrl
    ? `background-color:#fffaf0;background-image:url('${escapeHtml(heroBackdropUrl)}');background-repeat:no-repeat;background-position:center bottom;background-size:100% auto;`
    : "background:#fffaf0;";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(content.subject)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@700;800&display=swap');
    @media only screen and (max-width:620px) {
      .email-shell { width:100% !important; border-radius:0 !important; }
      .outer-pad { padding:0 !important; }
      .masthead { padding:22px 20px !important; }
      .date-pad { padding:22px 20px 14px !important; }
      .hero-wrap { padding:0 14px !important; }
      .hero-panel { height:310px !important; background-size:auto 100% !important; }
      .hero-copy { display:table-cell !important; width:60% !important; padding:28px 4px 50px 20px !important; }
      .hero-birdee { display:table-cell !important; width:40% !important; padding:30px 12px 50px 0 !important; text-align:center !important; }
      .hero-birdee img { width:154px !important; }
      .hero-eyebrow { font-size:12px !important; }
      .hero-title { font-size:23px !important; }
      .hero-intro { font-size:15px !important; }
      .score { font-size:50px !important; letter-spacing:-2px !important; }
      .content-pad { padding:30px 20px 26px !important; }
      .footer-pad { padding:22px 20px 28px !important; }
      .cta { display:block !important; text-align:center !important; }
      .daily-label { font-size:11px !important; }
    }
    @media only screen and (max-width:430px) {
      .masthead { padding:18px 16px !important; }
      .date-pad { padding:20px 16px 12px !important; }
      .hero-wrap { padding:0 10px !important; }
      .hero-panel { height:286px !important; }
      .hero-copy { width:61% !important; padding:24px 2px 42px 14px !important; }
      .hero-birdee { width:39% !important; padding:28px 8px 42px 0 !important; }
      .hero-birdee img { width:126px !important; }
      .hero-eyebrow { margin-bottom:10px !important; font-size:10px !important; }
      .hero-title { font-size:18px !important; letter-spacing:-0.35px !important; }
      .hero-intro { margin-top:14px !important; font-size:13px !important; }
      .score { font-size:42px !important; letter-spacing:-1.5px !important; }
      .content-pad { padding:26px 16px 24px !important; }
      .footer-pad { padding:20px 16px 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f3f6;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;color:#10203c">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(content.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f1f3f6">
    <tr>
      <td class="outer-pad" align="center" style="padding:32px 14px">
        <table class="email-shell" role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:620px;max-width:620px;background:#ffffff;border:1px solid #dfe3ea;border-radius:20px;overflow:hidden;box-shadow:0 8px 28px rgba(16,32,60,0.08)">
          <tr>
            <td class="masthead" style="padding:25px 28px;background:#ffffff;border-bottom:1px solid #dfe3ea">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td valign="middle" style="padding-right:11px"><img src="${escapeHtml(logoUrl)}" width="42" height="42" alt="Little Birdee" style="display:block;width:42px;height:42px;object-fit:contain;border:0"></td>
                        <td valign="middle" style="font-family:'Poppins','Trebuchet MS',Arial,sans-serif;color:#10203c;font-size:23px;font-weight:700;letter-spacing:-0.55px">Little <span style="color:#f59e0b">Birdee</span></td>
                      </tr>
                    </table>
                  </td>
                  <td class="daily-label" align="right" valign="middle" style="color:#10203c;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:13px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase">Daily Chirp</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="date-pad" style="padding:27px 28px 18px;color:#71809a;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:14px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase">${escapeHtml(content.dateLabel)}</td>
          </tr>
          <tr>
            <td class="hero-wrap" style="padding:0 28px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;overflow:hidden;border:1px solid #e9bd4d;border-radius:16px;background:#fffaf0">
                <tr>
                  <td class="hero-panel"${heroBackdropAttribute} height="350" valign="middle" style="height:350px;${heroBackdropStyle}">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td class="hero-copy" width="62%" valign="middle" style="width:62%;padding:38px 8px 58px 30px">
                          <p class="hero-eyebrow" style="margin:0 0 13px;color:#c17b00;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:14px;font-weight:800;letter-spacing:1.05px;text-transform:uppercase">${escapeHtml(content.eyebrow)}</p>
                          <h1 class="hero-title" style="margin:0;font-family:'Poppins','Trebuchet MS',Arial,sans-serif;color:#10203c;font-size:26px;line-height:1.15;font-weight:700;letter-spacing:-0.75px">${escapeHtml(content.heading)}</h1>
                          ${amount}
                          <p class="hero-intro" style="margin:18px 0 0;color:#566783;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:17px;font-weight:600;line-height:1.45">${escapeHtml(content.intro)}</p>
                        </td>
                        <td class="hero-birdee" width="38%" align="center" valign="middle" style="width:38%;padding:42px 18px 52px 2px">
                          <img src="${escapeHtml(mascotUrl)}" width="198" alt="Birdee" style="display:block;width:198px;max-width:100%;height:auto;border:0;margin:0 auto;filter:drop-shadow(0 12px 12px rgba(116,71,0,0.16))">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content-pad" style="padding:34px 28px 30px">
              ${details ? `<h2 style="margin:0 0 12px;color:#10203c;font-family:'Poppins','Trebuchet MS',Arial,sans-serif;font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-0.55px">What Birdee used</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-top:1px solid #dfe3ea">${details}</table>` : ""}
              ${note}
              <p style="margin:26px 0 0"><a class="cta" href="${escapeHtml(actionUrl)}" style="display:block;padding:16px 20px;border:1px solid #10203c;border-radius:11px;background:#10203c;box-shadow:0 3px 0 #07152b;color:#ffffff;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:17px;font-weight:800;line-height:1.2;text-align:center;text-decoration:none">${escapeHtml(content.ctaLabel)} &nbsp;&nbsp;→</a></p>
            </td>
          </tr>
          <tr>
            <td class="footer-pad" align="center" style="padding:22px 28px 28px;background:#f9f9f9;border-top:1px solid #dfe3ea;color:#71809a;font-family:'Nunito','Trebuchet MS',Arial,sans-serif;font-size:13px;line-height:1.6">
              Birdee sends this Chirp because you switched it on.<br>
              <a href="${escapeHtml(unsubscribeUrl)}" style="color:#566783;font-weight:700;text-decoration:underline">Manage Daily Chirps</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "LITTLE BIRDEE — DAILY CHIRP",
    content.dateLabel.toUpperCase(),
    "",
    `Morning ${name}.`,
    content.heading,
    content.amountLabel ?? "",
    content.intro,
    ...content.detailLines.map((line) => `- ${line}`),
    content.assumptionNote ?? "",
    "",
    `${content.ctaLabel}: ${actionUrl}`,
    "",
    `Manage Daily Chirps: ${unsubscribeUrl}`,
  ].filter((line, index, lines) => line !== "" || lines[index - 1] !== "").join("\n");

  return { html, text };
}
