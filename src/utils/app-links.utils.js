import envValues from "../configs/envFile.js";

//how long the links in emails work (single use either way)
export const ACTIVATION_LINK_TTL_MS = 48 * 60 * 60 * 1000; //48 hours: students may not open the email straight away
export const PASSWORD_RESET_LINK_TTL_MS = 30 * 60 * 1000;  //30 minutes

export const ANDROID_PACKAGE_NAME = "in.ourhostel.our_hostel";
export const APP_SCHEME = "ourhostel";

//the public https address of this backend (e.g. https://api.ourhostel.in) - BASE_URL in .env
export const publicBaseUrl = () => (envValues.BASE_URL || "http://localhost:2471").replace(/\/+$/, "");

//emails link to an https page on this backend (custom ourhostel:// links aren't clickable in Gmail and most mail apps);
//the page opens the app, and with Android App Links set up the app opens straight away
export const setupPasswordLink = (rawToken, mode) =>
  `${publicBaseUrl()}/open/setup-password?token=${encodeURIComponent(rawToken)}&mode=${mode === "reset" ? "reset" : "welcome"}`;

//"9 Nov, 4:00 pm" in India time
export const formatIstDateTime = (date) => new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit"
}).format(date);
