// Turns src/data/properties.seed.json into supabase/seed.sql.
// Run: node scripts/make-seed-sql.mjs
import fs from "node:fs";

const rows = JSON.parse(fs.readFileSync("src/data/properties.seed.json", "utf8"));
const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => `'${JSON.stringify(v ?? []).replace(/'/g, "''")}'::jsonb`;
const cols = [
  "id",
  "title",
  "address",
  "city",
  "neighborhood",
  "bedrooms",
  "bathrooms",
  "rent",
  "rent_type",
  "rooms_free",
  "availability",
  "utilities",
  "deposit",
  "description",
  "photos",
  "rooms",
  "accepts_vouchers",
  "pets",
  "status",
  "confirmed_at",
  "created_date",
  "updated_date",
];
const values = rows.map(
  (p) =>
    "(" +
    [
      q(p.id),
      q(p.title),
      q(p.address),
      q(p.city),
      q(p.neighborhood),
      p.bedrooms ?? 0,
      p.bathrooms ?? 0,
      p.rent ?? 0,
      q(p.rent_type),
      p.rooms_free ?? 0,
      q(p.availability),
      q(p.utilities),
      q(p.deposit),
      q(p.description),
      j(p.photos),
      j(p.rooms),
      p.accepts_vouchers === true ? "true" : p.accepts_vouchers === false ? "false" : "null",
      q(p.pets || "ask"),
      q(p.status),
      "now()",
      q(p.created_date),
      q(p.updated_date),
    ].join(", ") +
    ")",
);
const sql = `-- Your ${rows.length} current listings. Run after schema.sql (SQL Editor → Run).
-- "confirmed_at" is set to now, so every listing starts fresh for ${30} days.
insert into public.properties (${cols.join(", ")}) values
${values.join(",\n")}
on conflict (id) do nothing;
`;
fs.writeFileSync("supabase/seed.sql", sql);
console.log(`Wrote supabase/seed.sql (${rows.length} listings)`);
