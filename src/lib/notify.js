// Email notifications via Netlify Forms.
//
// Every inquiry, alert sign-up and listing submission is also posted to a
// Netlify form, and Netlify emails it to you (Netlify → Forms → Form
// notifications). This works even before Supabase is connected, so a lead is
// never lost. The hidden forms Netlify needs to detect are in index.html.
// Turned on with VITE_NETLIFY_FORMS=true (set in netlify.toml).

const ENABLED = import.meta.env.VITE_NETLIFY_FORMS === "true";

export async function notifyByEmail(formName, fields) {
  if (!ENABLED) return;
  const body = new URLSearchParams({ "form-name": formName });
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") body.append(k, String(v));
  });
  try {
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    /* the database copy is the source of truth; email is a bonus */
  }
}
