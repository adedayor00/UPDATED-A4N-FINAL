import { isRooms, roomsFree } from "./listing.js";

export const BUDGETS = [700, 1000, 1500, 2000, 2500, 3000];
export const BED_OPTIONS = [1, 2, 3, 4];

export function readFilters(params) {
  return {
    q: params.get("q") || "",
    city: params.get("city") || "all",
    type: params.get("type") || "all", // all | room | unit
    max: params.get("max") || "all",
    beds: params.get("beds") || "all",
    vouchers: params.get("vouchers") === "1",
    pets: params.get("pets") === "1",
    sort: params.get("sort") || "newest",
  };
}

export function applyFilters(list, f) {
  let out = list.filter((p) => {
    if (f.city !== "all" && p.city !== f.city) return false;
    if (f.type === "room" && !isRooms(p)) return false;
    if (f.type === "unit" && isRooms(p)) return false;
    if (f.max !== "all" && Number(p.rent) > Number(f.max)) return false;
    if (f.beds !== "all" && Number(p.bedrooms) < Number(f.beds)) return false;
    if (f.vouchers && !p.accepts_vouchers) return false;
    if (f.pets && p.pets !== "yes") return false;
    if (f.q.trim()) {
      const hay = [p.title, p.address, p.city, p.neighborhood, p.description].filter(Boolean).join(" ").toLowerCase();
      if (
        !f.q
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .every((w) => hay.includes(w))
      )
        return false;
    }
    return true;
  });
  const byDate = (p) => String(p.confirmed_at || p.created_date || "");
  if (f.sort === "rent_asc") out = [...out].sort((a, b) => a.rent - b.rent);
  else if (f.sort === "rent_desc") out = [...out].sort((a, b) => b.rent - a.rent);
  else if (f.sort === "rooms_free") out = [...out].sort((a, b) => roomsFree(b) - roomsFree(a));
  else out = [...out].sort((a, b) => byDate(b).localeCompare(byDate(a)));
  return out;
}

// How many "extra" filters are on (shown as a count on the Filters button).
export function activeCount(f, { lockCity, lockType } = {}) {
  let n = 0;
  if (!lockCity && f.city !== "all") n++;
  if (!lockType && f.type !== "all") n++;
  if (f.max !== "all") n++;
  if (f.beds !== "all") n++;
  if (f.vouchers) n++;
  if (f.pets) n++;
  return n;
}
