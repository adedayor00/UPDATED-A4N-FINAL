// Google Street View photo of a listing's building, used only when the listing
// has no real photos yet. Pure (no React, no "@/" imports) so Node tests can use it.
//
// Rules:
// - Only for addresses with a house number ("196 Roseville Ave"). A bare street
//   ("Garside St") or "Address on request" would show some other building, so
//   those keep the placeholder.
// - The unit/apt part is dropped ("· Apt 46"); a number range keeps the first
//   number ("493–495 Irvine Turner Blvd" → "493 Irvine Turner Blvd").
// - Images are requested live from Google each time (Google's terms don't allow
//   downloading or storing them) and always show Google's attribution.

export function streetViewAddress(property) {
  if (!property) return null;
  // "282 Belleville Ave, Apt 2" / "196 Roseville Ave · Apt 46" / "181 Woodside Ave (right building)"
  const raw = String(property.address || "")
    .split(/[·,]/)[0]
    .replace(/\([^)]*\)?/g, "")
    .trim();
  if (!/^\d+/.test(raw)) return null;
  const street = raw.replace(/^(\d+)\s*[–—-]\s*\d+/, "$1").replace(/\s+/g, " ");
  if (!/^\d+[A-Za-z]?\s+\S+/.test(street)) return null;
  const city = String(property.city || "").trim();
  return city ? `${street}, ${city}, NJ` : `${street}, NJ`;
}

export function streetViewUrl(property, key, { width = 640, height = 400 } = {}) {
  const location = streetViewAddress(property);
  if (!location || !key) return null;
  const params = new URLSearchParams({
    size: `${Math.min(640, width)}x${Math.min(640, height)}`,
    scale: "2",
    location,
    fov: "80",
    source: "outdoor",
    // 404 instead of a grey "no imagery" picture, so the page can fall back.
    return_error_code: "true",
    key,
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params}`;
}
