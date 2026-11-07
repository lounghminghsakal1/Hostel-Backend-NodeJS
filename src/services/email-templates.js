//transactional emails: table layout + inline styles so they render the same in Gmail, Outlook and phone mail apps
//colours match the app (Our Hostel palette: iris #5B47E0, ink #17153A)

const BRAND = {
  primary: "#5B47E0",
  primaryDeep: "#33259A",
  ink: "#17153A",
  inkSoft: "#3A3758",
  muted: "#64617D",
  line: "#E8E6F2",
  background: "#F6F5FB",
  soft: "#F1EEFF",
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const firstName = (name) => String(name ?? "").trim().split(/\s+/)[0] || "";

const layout = ({ preheader, title, greeting, paragraphs, buttonLabel, link, expiryNote, safetyNote, footer }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.background};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr>
          <td style="padding:0 4px 16px 4px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="36" height="36" align="center" valign="middle" style="background:${BRAND.primary};border-radius:10px;color:#ffffff;font-size:18px;font-weight:800;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">H</td>
                <td style="padding-left:10px;font-size:18px;font-weight:800;color:${BRAND.ink};letter-spacing:-0.2px;">Our Hostel</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid ${BRAND.line};border-radius:18px;padding:32px 28px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <h1 style="margin:0 0 18px 0;font-size:24px;line-height:1.3;color:${BRAND.ink};font-weight:800;">${escapeHtml(title)}</h1>
            <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:${BRAND.inkSoft};">${escapeHtml(greeting)}</p>
            ${paragraphs.map(p => `<p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:${BRAND.inkSoft};">${p}</p>`).join("\n            ")}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 22px 0;">
              <tr>
                <td align="center" bgcolor="${BRAND.primary}" style="border-radius:12px;">
                  <a href="${escapeHtml(link)}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(buttonLabel)}</a>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.soft};border-radius:12px;">
              <tr>
                <td style="padding:14px 16px;font-size:14px;line-height:1.55;color:${BRAND.inkSoft};">
                  ${expiryNote}<br>
                  Open this email on the phone that has the Our Hostel app.
                </td>
              </tr>
            </table>
            <p style="margin:22px 0 6px 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">Button not working? Copy this link into your phone's browser:</p>
            <p style="margin:0 0 22px 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${escapeHtml(link)}" target="_blank" style="color:${BRAND.primary};">${escapeHtml(link)}</a></p>
            <p style="margin:0;padding-top:18px;border-top:1px solid ${BRAND.line};font-size:13px;line-height:1.55;color:${BRAND.muted};">${safetyNote}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 8px 0 8px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">
            ${footer}<br>
            This is an automated message, so replies aren't read.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

//sent when a hostel admin adds a student (and on "Resend activation link")
export const accountActivationEmail = ({ studentName, hostelName, link, expiresAt }) => {
  const name = firstName(studentName);
  const hostel = hostelName || "your hostel";
  const greeting = name ? `Hi ${name},` : "Hi,";
  const subject = `Welcome to ${hostel} on Our Hostel - set up your account`;
  const html = layout({
    preheader: `Set your password to start using Our Hostel. The link expires on ${expiresAt}.`,
    title: "Set up your account",
    greeting,
    paragraphs: [
      `${escapeHtml(hostel)} has added you to <strong style="color:${BRAND.ink};">Our Hostel</strong>, the app for your hostel attendance, leave requests, mess fees and notices.`,
      "Tap the button below to choose a password. You can sign in to the app right after.",
    ],
    buttonLabel: "Set my password",
    link,
    expiryNote: `This link works once and expires on <strong style="color:${BRAND.ink};">${escapeHtml(expiresAt)}</strong> (IST).`,
    safetyNote: "Weren't expecting this? You can ignore this email: nothing happens to your account until a password is set. If the link has expired, ask your hostel office to send a new one.",
    footer: `Sent by Our Hostel for ${escapeHtml(hostel)}.`,
  });
  const text = [
    greeting,
    "",
    `${hostel} has added you to Our Hostel, the app for your hostel attendance, leave requests, mess fees and notices.`,
    "",
    "Open this link on the phone that has the Our Hostel app to choose a password:",
    link,
    "",
    `The link works once and expires on ${expiresAt} (IST). If it has expired, ask your hostel office to send a new one.`,
    "",
    "Weren't expecting this? You can ignore this email.",
    "",
    "Our Hostel",
  ].join("\n");
  return { subject, html, text };
};

//sent from "Forgot password"
export const passwordResetEmail = ({ studentName, email, link, expiresAt }) => {
  const name = firstName(studentName);
  const greeting = name ? `Hi ${name},` : "Hi,";
  const subject = "Reset your Our Hostel password";
  const html = layout({
    preheader: `Choose a new password. The link expires at ${expiresAt}.`,
    title: "Reset your password",
    greeting,
    paragraphs: [
      `We received a request to reset the password for your Our Hostel account${email ? ` (<strong style="color:${BRAND.ink};">${escapeHtml(email)}</strong>)` : ""}.`,
      "Tap the button below to choose a new one.",
    ],
    buttonLabel: "Reset my password",
    link,
    expiryNote: `This link works once and expires at <strong style="color:${BRAND.ink};">${escapeHtml(expiresAt)}</strong> (IST).`,
    safetyNote: "Didn't ask for this? You can ignore this email: your password stays the same. If you keep getting these emails, tell your hostel office.",
    footer: "Sent by Our Hostel.",
  });
  const text = [
    greeting,
    "",
    `We received a request to reset the password for your Our Hostel account${email ? ` (${email})` : ""}.`,
    "",
    "Open this link on the phone that has the Our Hostel app to choose a new password:",
    link,
    "",
    `The link works once and expires at ${expiresAt} (IST).`,
    "",
    "Didn't ask for this? You can ignore this email: your password stays the same.",
    "",
    "Our Hostel",
  ].join("\n");
  return { subject, html, text };
};
