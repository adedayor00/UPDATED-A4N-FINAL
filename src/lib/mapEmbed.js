// Free, keyless Google map for a listing page. Pure (no React, no "@/" imports).
//
// Uses the public google.com/maps "output=embed" link: no API key, no billing
// account, no per-view charge. Never shows more than the listing already shows:
// - "196 Roseville Ave · Apt 46"  → "196 Roseville Ave, Newark, NJ" (unit dropped)
// - "South 20th St" / "Address on request" → just the city: "Newark, NJ"

export function mapQuery(property) {
  if (!property) return null;
  const city = String(property.city || "").trim();
  const street = String(property.address || "")
    .split(/[·,]/)[0]
    .replace(/\([^)]*\)?/g, "")
    .replace(/^(\d+)\s*[–—-]\s*\d+/, "$1")
    .replace(/\s+/g, " ")
    .trim();
  // Only a real house number gets a pin. A bare street ("Garside St") doesn't
  // resolve reliably on Google's free embed, and "Address on request" must stay
  // private, so both show the city instead.
  const exact = /^\d+[A-Za-z]?\s+\S+/.test(street);
  if (exact) return city ? `${street}, ${city}, NJ` : `${street}, NJ`;
  return city ? `${city}, NJ` : null;
}

export function mapEmbedUrl(property) {
  const q = mapQuery(property);
  if (!q) return null;
  // City-only maps stay zoomed out so they read as an area, not a spot.
  const exact = /^\d/.test(q);
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${exact ? 16 : 12}&output=embed`;
}

export function directionsUrl(property) {
  const q = mapQuery(property);
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : null;
}
