// Unit tests for the listing rules, filters and validation. Run: npm test
import assert from "node:assert/strict";
import * as L from "../src/lib/listing.js";
import { applyFilters, readFilters, activeCount } from "../src/lib/filters.js";
import { cityStats } from "../src/lib/cityStats.js";
import { isValidPhone, formatPhone, isValidZip, isValidEmail } from "../src/lib/validate.js";
import fs from "node:fs";
import { streetViewAddress, streetViewUrl } from "../src/lib/streetView.js";
import { NJ_CITIES, NJ_TOWNS, COUNTY_OF } from "../src/lib/njCities.js";

let n = 0;
const test = (name, fn) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
};
const DAY = 864e5;
const ago = (d) => new Date(Date.now() - d * DAY).toISOString();
const base = {
  id: "a1",
  title: "South 20th St",
  city: "Newark",
  status: "published",
  rent: 600,
  rent_type: "whole_unit",
  bedrooms: 3,
  bathrooms: 1,
  confirmed_at: ago(1),
};

test("slugs", () => {
  assert.equal(L.citySlug("East Orange"), "east-orange-nj");
  assert.equal(
    L.listingSlug({ title: "493–495 Irvine Turner Blvd · Apt 4", city: "Newark" }),
    "493-495-irvine-turner-blvd-apt-4-newark",
  );
  assert.equal(
    L.listingSlug({ title: "East Orange — Address on Request", city: "East Orange" }),
    "east-orange-address-on-request",
  );
  assert.equal(L.cityFromSlug("EAST-ORANGE-NJ", ["Newark", "East Orange"]), "East Orange");
  assert.equal(L.cityFromSlug("nowhere-nj", ["Newark"]), null);
  assert.equal(L.listingPath(base), "/listing/a1/south-20th-st-newark");
});

test("freshness and expiry", () => {
  assert.equal(L.isPubliclyVisible(base), true);
  assert.equal(L.isPubliclyVisible({ ...base, confirmed_at: ago(31) }), false, "expired after 30 days");
  assert.equal(L.isPubliclyVisible({ ...base, confirmed_at: ago(30) }), true, "day 30 still live");
  assert.equal(L.isPubliclyVisible({ ...base, status: "pending" }), false);
  assert.equal(L.daysUntilExpiry({ ...base, confirmed_at: ago(25) }), 5);
});

test("room shares hide when every room is taken", () => {
  const share = { ...base, rent_type: "per_room", rooms: [{ status: "taken" }, { status: "taken" }] };
  assert.equal(L.roomsFree(share), 0);
  assert.equal(L.isPubliclyVisible(share), false);
  assert.equal(L.isPubliclyVisible({ ...share, rooms: [{ status: "free" }, { status: "taken" }] }), true);
  assert.equal(L.roomsFree({ rent_type: "per_room", rooms: [], rooms_free: 2 }), 2);
});

test("alert matching", () => {
  assert.equal(L.matchesAlert(base, { city: "any", rent_type: "any" }), true);
  assert.equal(L.matchesAlert(base, { city: "Irvington" }), false);
  assert.equal(L.matchesAlert(base, { max_rent: 500 }), false);
  assert.equal(L.matchesAlert(base, { rent_type: "per_room" }), false);
  assert.equal(L.matchesAlert(base, { bedrooms_min: 4 }), false);
});

test("filters", () => {
  const list = [
    base,
    {
      ...base,
      id: "b",
      city: "East Orange",
      rent: 1800,
      rent_type: "whole_unit",
      accepts_vouchers: true,
      pets: "yes",
      bedrooms: 2,
    },
    { ...base, id: "c", rent_type: "per_room", rent: 700, rooms_free: 2, neighborhood: "West Ward" },
  ];
  const f = (q) => applyFilters(list, readFilters(new URLSearchParams(q))).map((p) => p.id);
  assert.deepEqual(f("city=East%20Orange"), ["b"]);
  assert.deepEqual(f("type=room"), ["c"]);
  assert.deepEqual(f("max=1000").sort(), ["a1", "c"]);
  assert.deepEqual(f("vouchers=1"), ["b"]);
  assert.deepEqual(f("pets=1"), ["b"]);
  assert.deepEqual(f("beds=3").sort(), ["a1", "c"]);
  assert.deepEqual(f("q=west%20ward"), ["c"]);
  assert.deepEqual(f("sort=rent_asc"), ["a1", "c", "b"]);
  assert.deepEqual(f("sort=rent_desc"), ["b", "c", "a1"]);
  assert.equal(activeCount(readFilters(new URLSearchParams("city=Newark&max=1000&vouchers=1"))), 3);
  assert.equal(activeCount(readFilters(new URLSearchParams("city=Newark")), { lockCity: "Newark" }), 0);
});

test("city stats", () => {
  const s = cityStats([base, { ...base, rent: 400, rent_type: "per_room" }, { ...base, city: "Irvington" }]);
  assert.deepEqual(s.Newark, { count: 2, from: 400, rooms: 1, units: 1 });
  assert.equal(s.Irvington.count, 1);
});

test("validation", () => {
  assert.ok(isValidPhone("(862) 600-0056"));
  assert.ok(isValidPhone("+1 862 600 0056"));
  assert.ok(!isValidPhone("600-0056"));
  assert.equal(formatPhone("18626000056"), "(862) 600-0056");
  assert.ok(isValidZip("07103") && isValidZip("") && !isValidZip("0710"));
  assert.ok(isValidEmail("") && isValidEmail("a@b.co") && !isValidEmail("a@b"));
});

test("seed data is clean", () => {
  const seed = JSON.parse(fs.readFileSync("src/data/properties.seed.json", "utf8"));
  assert.equal(seed.length, 11);
  for (const p of seed) {
    assert.deepEqual(p.photos, [], `${p.title} still has stock photos`);
    assert.ok(p.title && p.city && p.rent > 0, `${p.id} missing basics`);
    assert.ok(!/june/i.test(p.availability), `${p.title} has a stale date`);
    if (p.rooms?.length) assert.equal(p.rooms_free, L.roomsFree(p), `${p.title} rooms_free out of sync`);
  }
  const slugs = seed.map(L.listingSlug);
  assert.equal(new Set(seed.map((p) => p.id)).size, seed.length, "duplicate ids");
  assert.ok(slugs.every((s) => /^[a-z0-9-]+$/.test(s)));
});

test("listing description", () => {
  assert.match(
    L.listingDescription({ ...base, rent_type: "per_room", rooms_free: 1 }),
    /1 room for rent in a shared 3-bedroom apartment in Newark, NJ — \$600 per room a month/,
  );
  assert.match(L.listingDescription(base), /3-bedroom, 1-bath apartment for rent in Newark, NJ — \$600 a month/);
});

test("every New Jersey town is in the picker", () => {
  assert.equal(NJ_TOWNS.length, 564, "NJ has 564 municipalities");
  assert.equal(new Set(NJ_CITIES).size, 564, "names must be unique");
  assert.equal(new Set(NJ_TOWNS.map((t) => t.county)).size, 21, "21 counties");
  for (const t of ["Newark", "East Orange", "Irvington", "Nutley", "Glen Ridge", "Jersey City", "Paterson", "Cherry Hill", "Toms River"])
    assert.ok(NJ_CITIES.includes(t), t);
  assert.equal(COUNTY_OF["Newark"], "Essex");
  assert.ok(NJ_CITIES.includes("Franklin Township (Somerset County)"));
  const seed = JSON.parse(fs.readFileSync("src/data/properties.seed.json", "utf8"));
  for (const p of seed) assert.ok(NJ_CITIES.includes(p.city), `listing city not in list: ${p.city}`);
});

test("Street View only for real street addresses", () => {
  const sv = (address, city = "Newark") => streetViewAddress({ address, city });
  assert.equal(sv("196 Roseville Ave · Apt 46"), "196 Roseville Ave, Newark, NJ");
  assert.equal(sv("493–495 Irvine Turner Blvd · Apt 4"), "493 Irvine Turner Blvd, Newark, NJ");
  assert.equal(sv("239 Boyden Ave · Apt 2 · Townhouse", "Maplewood"), "239 Boyden Ave, Maplewood, NJ");
  assert.equal(sv("282 Belleville Ave, Apt 2", "Belleville"), "282 Belleville Ave, Belleville, NJ");
  assert.equal(sv("181 Woodside Ave (right building), Apt 3F"), "181 Woodside Ave, Newark, NJ");
  assert.equal(sv("145 Roseville Ave, 4BR units (Apts 3, 5, 6, 7, 8)"), "145 Roseville Ave, Newark, NJ");
  assert.equal(sv("56–58 Kent St"), "56 Kent St, Newark, NJ");
  assert.equal(sv("98 16th Ave"), "98 16th Ave, Newark, NJ");
  assert.equal(sv("15th Ave, Apt 1"), null, "street name that starts with a number is not a house number");
  assert.equal(sv("Bergen St (townhouse)"), null);
  assert.equal(sv("Garside St"), null, "no house number → would show the wrong building");
  assert.equal(sv("South 20th St"), null);
  assert.equal(sv("Address on request", "East Orange"), null);
  assert.equal(sv(""), null);
  assert.equal(streetViewUrl({ address: "196 Roseville Ave", city: "Newark" }, ""), null, "no key → no image");
  const url = streetViewUrl({ address: "196 Roseville Ave", city: "Newark" }, "KEY");
  assert.ok(url.startsWith("https://maps.googleapis.com/maps/api/streetview?"));
  assert.ok(url.includes("return_error_code=true") && url.includes("source=outdoor"));
});

console.log(process.exitCode ? "unit tests FAILED" : `unit tests OK — ${n} groups`);
