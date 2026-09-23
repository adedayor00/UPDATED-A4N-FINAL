// Optional visitor stats. Set ONE of these in Netlify → Site settings →
// Environment variables, then redeploy:
//   VITE_PLAUSIBLE_DOMAIN=apartments4newark.com   (plausible.io, privacy-friendly)
//   VITE_GA_ID=G-XXXXXXXXXX                        (Google Analytics 4)
// With neither set, nothing is loaded and track() does nothing.

const PLAUSIBLE = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const GA = import.meta.env.VITE_GA_ID;

function addScript(src, attrs = {}) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (PLAUSIBLE) {
    window.plausible =
      window.plausible ||
      function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };
    addScript("https://plausible.io/js/script.js", { "data-domain": PLAUSIBLE });
  }
  if (GA) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA);
    addScript(`https://www.googletagmanager.com/gtag/js?id=${GA}`);
  }
}

// Key actions: inquiry_submitted, contact_channel, alert_signup, listing_submitted, share
export function track(event, props = {}) {
  try {
    if (window.plausible) window.plausible(event, { props });
    if (window.gtag) window.gtag("event", event, props);
  } catch {
    /* never let analytics break the page */
  }
}
