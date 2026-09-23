// Pure helpers for listings. No React, no "@/" imports, so the build-time
// page generator (scripts/prerender.mjs) can import this file directly.

export const SITE_URL = "https://apartments4newark.com";
export const SITE_NAME = "Apartments4Newark";

// A published listing drops off the public site this many days after the
// manager last confirmed it's still available. One click ("Renew") resets it.
export const LISTING_FRESH_DAYS = 30;
// The dashboard starts warning this many days before a listing expires.
export const LISTING_WARN_DAYS = 7;

const DAY = 24 * 60 * 60 * 1000;

export function slugify(text = "") {
  return String(text)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

// "Newark" -> "newark-nj", "East Orange" -> "east-orange-nj"
export const citySlug = (city) => `${slugify(city)}-nj`;

export function cityFromSlug(slug, cities) {
  const clean = String(slug || "").toLowerCase();
  return cities.find((c) => citySlug(c) === clean) || null;
}

export function listingSlug(p) {
  const base = slugify(p.title || "") || "listing";
  const city = slugify(p.city || "");
  return base.includes(city) ? base : `${base}-${city}`;
}

export const listingPath = (p) => `/listing/${p.id}/${listingSlug(p)}`;
export const cityPath = (city, kind = "apartments") =>
  kind === "rooms" ? `/rooms-for-rent/${citySlug(city)}` : `/apartments/${citySlug(city)}`;

export const isRooms = (p) => p.rent_type === "per_room";

// Rooms free is derived from the room list whenever one exists, so it can't
// drift out of sync with the room-by-room status.
export function roomsFree(p) {
  if (Array.isArray(p.rooms) && p.rooms.length) return p.rooms.filter((r) => r.status === "free").length;
  return Number(p.rooms_free) || 0;
}

export function confirmedAt(p) {
  return new Date(p.confirmed_at || p.updated_date || p.created_date || 0);
}

export function daysSinceConfirmed(p, now = Date.now()) {
  return Math.max(0, Math.floor((now - confirmedAt(p).getTime()) / DAY));
}

export function daysUntilExpiry(p, now = Date.now()) {
  return LISTING_FRESH_DAYS - daysSinceConfirmed(p, now);
}

export const isExpired = (p, now) => daysUntilExpiry(p, now) < 0;

// What the public can see: approved, not expired, and (for room shares) with
// at least one room still free.
export function isPubliclyVisible(p, now) {
  if (p.status !== "published") return false;
  if (isExpired(p, now)) return false;
  if (isRooms(p) && Array.isArray(p.rooms) && p.rooms.length && roomsFree(p) === 0) return false;
  return true;
}

export function formatMoney(n) {
  const v = Number(n);
  if (!v) return null;
  return `$${v.toLocaleString("en-US")}`;
}

export function priceParts(p) {
  const amount = formatMoney(p.rent);
  return { amount, per: amount ? (isRooms(p) ? "room" : "month") : null };
}

// Lowest price across live listings, used for "Rooms from $600".
export function lowestRent(list, kind) {
  const rents = list
    .filter((p) => (kind === "rooms" ? isRooms(p) : kind === "units" ? !isRooms(p) : true))
    .map((p) => Number(p.rent))
    .filter(Boolean);
  return rents.length ? Math.min(...rents) : null;
}

export function listingDescription(p) {
  const parts = [];
  if (isRooms(p)) {
    const n = roomsFree(p);
    parts.push(`${n || "A"} room${n === 1 || !n ? "" : "s"} for rent in a shared ${p.bedrooms}-bedroom apartment`);
  } else {
    parts.push(`${p.bedrooms}-bedroom, ${p.bathrooms}-bath apartment for rent`);
  }
  parts.push(`in ${p.neighborhood ? `${p.neighborhood}, ` : ""}${p.city}, NJ`);
  let text = parts.join(" ");
  const price = formatMoney(p.rent);
  if (price) text += ` — ${price}${isRooms(p) ? " per room" : ""} a month`;
  text += ". Free to ask, free to tour, no sign-up.";
  return text;
}

export function matchesAlert(p, a) {
  if (a.city && a.city !== "any" && p.city !== a.city) return false;
  if (a.rent_type && a.rent_type !== "any" && p.rent_type !== a.rent_type) return false;
  if (a.max_rent && Number(p.rent) > Number(a.max_rent)) return false;
  if (a.bedrooms_min && !isRooms(p) && Number(p.bedrooms) < Number(a.bedrooms_min)) return false;
  return true;
}
