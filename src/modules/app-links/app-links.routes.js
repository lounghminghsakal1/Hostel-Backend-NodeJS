import express from "express";
import envValues from "../../configs/envFile.js";
import { ANDROID_PACKAGE_NAME, APP_SCHEME, publicBaseUrl } from "../../utils/app-links.utils.js";

//public pages for links in emails (no auth):
//  GET /open/setup-password?token=...&mode=welcome|reset  - opens the app on the Set password screen
//  GET /.well-known/assetlinks.json                        - lets Android open those links in the app directly (App Links)
const appLinksRouter = express.Router();

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

//tokens are 32 random bytes as hex (see activation-token.utils.js)
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

const page = ({ title, message, appUrl, androidIntentUrl, note }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} · Our Hostel</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#F6F5FB;color:#17153A;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  .card{width:100%;max-width:420px;background:#fff;border:1px solid #E8E6F2;border-radius:22px;padding:32px 26px;text-align:center;box-shadow:0 18px 40px -24px rgba(23,21,58,.35)}
  .logo{width:56px;height:56px;margin:0 auto 18px;border-radius:16px;background:#5B47E0;color:#fff;font-size:28px;font-weight:800;line-height:56px}
  h1{margin:0 0 10px;font-size:23px;line-height:1.3}
  p{margin:0 0 14px;font-size:15.5px;line-height:1.6;color:#3A3758}
  .btn{display:block;margin:22px 0 14px;padding:15px 18px;border-radius:14px;background:#5B47E0;color:#fff;font-size:16px;font-weight:700;text-decoration:none}
  .note{font-size:13.5px;color:#64617D}
</style>
</head>
<body>
<main class="card">
  <div class="logo" aria-hidden="true">H</div>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
  ${appUrl ? `<a class="btn" id="open" href="${escapeHtml(appUrl)}">Open the Our Hostel app</a>` : ""}
  <p class="note">${escapeHtml(note)}</p>
</main>
${appUrl ? `<script>
  (function () {
    var isAndroid = /android/i.test(navigator.userAgent);
    var target = isAndroid ? ${JSON.stringify(androidIntentUrl)} : ${JSON.stringify(appUrl)};
    document.getElementById("open").setAttribute("href", target);
    // try once straight away; the button stays for browsers that need a tap
    setTimeout(function () { window.location.href = target; }, 300);
  })();
</script>` : ""}
</body>
</html>`;

appLinksRouter.get("/open/setup-password", (req, res) => {
  res.set({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
  });

  const token = String(req.query.token ?? "");
  const mode = req.query.mode === "reset" ? "reset" : "welcome";
  const appMissing = req.query.app === "missing";

  if (!TOKEN_PATTERN.test(token)) {
    return res.status(400).type("html").send(page({
      title: "This link isn't valid",
      message: "The link looks incomplete. Open it again from the email, or ask your hostel office to send a new one.",
      note: "Our Hostel",
    }));
  }

  const query = `token=${token}&mode=${mode}`;
  const appUrl = `${APP_SCHEME}://setup-password?${query}`;
  //Chrome on Android: open the app by package; if it isn't installed, come back here with app=missing
  const fallback = `${publicBaseUrl()}/open/setup-password?${query}&app=missing`;
  const androidIntentUrl = `intent://setup-password?${query}#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE_NAME};S.browser_fallback_url=${encodeURIComponent(fallback)};end`;

  const title = mode === "reset" ? "Reset your password" : "Set up your account";
  return res.type("html").send(page({
    title,
    message: appMissing
      ? "The Our Hostel app doesn't seem to be installed on this phone. Install it (ask your hostel office for the link), then open this email link again."
      : "Opening the Our Hostel app so you can choose your password.",
    appUrl,
    androidIntentUrl,
    note: mode === "reset"
      ? "Nothing happened? Make sure the app is installed, then tap the button. The link works once and expires 30 minutes after it was sent."
      : "Nothing happened? Make sure the app is installed, then tap the button. The link works once and expires 48 hours after it was sent.",
  }));
});

//Android App Links: with the app's signing certificate fingerprints in ANDROID_APP_SHA256_FINGERPRINTS,
//Android opens https://<this host>/open/... links straight in the app (no browser page)
appLinksRouter.get("/.well-known/assetlinks.json", (req, res) => {
  const fingerprints = String(envValues.ANDROID_APP_SHA256_FINGERPRINTS ?? "")
    .split(",").map(value => value.trim().toUpperCase()).filter(Boolean);
  if (!fingerprints.length) return res.status(404).json({ message: "App Links are not configured" });
  return res.json([{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: ANDROID_PACKAGE_NAME, sha256_cert_fingerprints: fingerprints }
  }]);
});

export default appLinksRouter;
