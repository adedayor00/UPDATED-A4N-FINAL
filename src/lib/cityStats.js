import { isRooms } from "./listing.js";

// { Newark: { count: 9, from: 600, rooms: 3, units: 6 }, ... }
export function cityStats(listings) {
  const out = {};
  listings.forEach((p) => {
    const s = (out[p.city] ||= { count: 0, from: null, rooms: 0, units: 0 });
    s.count++;
    if (isRooms(p)) s.rooms++;
    else s.units++;
    const r = Number(p.rent);
    if (r && (s.from === null || r < s.from)) s.from = r;
  });
  return out;
}
