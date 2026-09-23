// Every way renters reach Apartments4Newark. Change a value here and it
// updates across the whole site.

// Phone / WhatsApp / text: 862-600-0056
export const PHONE_DISPLAY = "(862) 600-0056";
export const WHATSAPP = "18626000056"; // country code + number, digits only
export const SMS = "+18626000056";
export const EMAIL = "admin@apartments4newark.com";

// Optional channels. Leave "" to hide the button everywhere. Only fill these
// in with handles you actually own, e.g. INSTAGRAM_USERNAME = "apartments4newark".
export const INSTAGRAM_USERNAME = "adedayo";
export const TELEGRAM_USERNAME = "NEXUS09111";

// Optional: the first name renters will be talking to (shown on the About
// page). Leave "" to say "us".
export const CONTACT_PERSON = "";

export const whatsappUrl = (message) =>
  `https://wa.me/${WHATSAPP}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

// iOS and Android disagree on the separator; "?&body=" works on both.
export const smsUrl = (message) => `sms:${SMS}?&body=${encodeURIComponent(message)}`;
export const telegramUrl = () => (TELEGRAM_USERNAME ? `https://t.me/${TELEGRAM_USERNAME}` : null);
export const instagramUrl = () => (INSTAGRAM_USERNAME ? `https://ig.me/m/${INSTAGRAM_USERNAME}` : null);

// For replying to a renter from the dashboard.
export function digitsForWhatsApp(phone = "") {
  const d = String(phone).replace(/\D/g, "");
  if (d.length === 10) return `1${d}`;
  return d;
}
export const replyWhatsappUrl = (phone, message) =>
  `https://wa.me/${digitsForWhatsApp(phone)}?text=${encodeURIComponent(message)}`;
export const replySmsUrl = (phone, message) =>
  `sms:${String(phone).replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(message)}`;

const LANG_NAMES = { en: "English", es: "Español", pt: "Português" };

export function buildInquiryMessage(data, property, url) {
  const lines = ["Hi, I'm interested in renting with Apartments4Newark."];
  if (data.name) lines.push(`Name: ${data.name}`);
  if (data.phone) lines.push(`Phone: ${data.phone}`);
  if (data.city) lines.push(`Looking in: ${data.city}${data.zip ? ` (ZIP ${data.zip})` : ""}`);
  if (data.move_in) lines.push(`Move-in: ${data.move_in}`);
  if (data.voucher) lines.push("I have a housing voucher.");
  if (property) {
    const per = property.rent_type === "per_room" ? "/room" : "/mo";
    lines.push(`Listing: ${property.title} (${property.city})${property.rent ? ` — $${property.rent}${per}` : ""}`);
    if (url) lines.push(url);
  }
  if (data.message) lines.push(`Message: ${data.message}`);
  if (data.lang && data.lang !== "en") lines.push(`Preferred language: ${LANG_NAMES[data.lang] || data.lang}`);
  return lines.join("\n");
}
