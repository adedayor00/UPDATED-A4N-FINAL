// Tests the real database rules (supabase/schema.sql) in an in-memory
// Postgres. It stubs the small parts of Supabase the schema relies on
// (auth.jwt(), the storage tables, the anon/authenticated roles), then checks
// what visitors, signed-in non-managers and managers can each do.
// Run: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";

const db = new PGlite();
const q = (sql, params) => db.query(sql, params);

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create schema storage;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id serial primary key, bucket_id text, name text);
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  alter table storage.objects enable row level security;
  grant usage on schema auth, storage to anon, authenticated;
  grant execute on function auth.jwt() to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  grant usage, select on all sequences in schema storage to anon, authenticated;
  grant select on storage.buckets to anon, authenticated;
`);

const schema = fs.readFileSync("supabase/schema.sql", "utf8");
await db.exec(schema);
await db.exec(schema); // must be safe to run twice
await db.exec(fs.readFileSync("supabase/seed.sql", "utf8"));
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant all on all tables in schema public to anon, authenticated;
  insert into public.admins(email) values ('Manager@Apartments4Newark.com');
  update public.properties set status = 'pending' where id = '6ab29083d137cf0e35e581b6';
`);

async function as(who, fn) {
  await db.exec("reset role; select set_config('request.jwt.claims', '', false);");
  if (who === "anon") await db.exec("set role anon");
  else {
    const email = who === "manager" ? "manager@apartments4newark.com" : "someone@example.com";
    await db.exec(
      `select set_config('request.jwt.claims', '${JSON.stringify({ email, role: "authenticated" })}', false); set role authenticated;`,
    );
  }
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claims', '', false);");
  }
}
const rejects = async (p, msg) => {
  try {
    await p;
  } catch {
    return;
  }
  assert.fail(msg);
};

let passed = 0;
const check = async (name, fn) => {
  await fn();
  passed++;
  console.log(`✓ ${name}`);
};

await check("visitors see only published listings", () =>
  as("anon", async () => {
    const { rows } = await q("select id, status from properties");
    assert.equal(rows.length, 10);
    assert.ok(rows.every((r) => r.status === "published"));
  }),
);

await check("visitors can't create, edit or delete listings", () =>
  as("anon", async () => {
    await rejects(
      q("insert into properties (title, city, rent, status) values ('x','Newark',1,'published')"),
      "anon insert allowed",
    );
    const u = await q("update properties set rent = 1");
    assert.equal(u.affectedRows, 0);
    const d = await q("delete from properties");
    assert.equal(d.affectedRows, 0);
  }),
);

await check("visitors can send an inquiry but not read any", () =>
  as("anon", async () => {
    await q("insert into inquiries (name, phone, city, message) values ('Test','(973) 555-0100','Newark','hi')");
    const { rows } = await q("select * from inquiries");
    assert.equal(rows.length, 0);
  }),
);

await check("visitors can't smuggle in a pre-set status or junk", () =>
  as("anon", async () => {
    await rejects(
      q("insert into inquiries (name, phone, status) values ('T','(973) 555-0100','contacted')"),
      "status bypass",
    );
    await rejects(q("insert into inquiries (name, phone) values ('T','12')"), "short phone accepted");
    await rejects(
      q("insert into inquiries (name, phone, message) values ('T','(973) 555-0100', repeat('x', 2001))"),
      "huge message accepted",
    );
    await rejects(q("insert into alerts (phone, active) values ('(973) 555-0100', false)"), "inactive alert");
    await rejects(
      q(
        "insert into listing_submissions (contact_name, contact_phone, status) values ('A','(973) 555-0100','converted')",
      ),
      "submission status bypass",
    );
  }),
);

await check("visitors can sign up for alerts and submit a place, but not read them", () =>
  as("anon", async () => {
    await q("insert into alerts (phone, city, rent_type, max_rent) values ('(973) 555-0101','Newark','per_room',800)");
    await q(
      `insert into listing_submissions (contact_name, contact_phone, data) values ('Owner','(973) 555-0102','{"city":"Irvington","rent":1700}')`,
    );
    assert.equal((await q("select * from alerts")).rows.length, 0);
    assert.equal((await q("select * from listing_submissions")).rows.length, 0);
    assert.equal((await q("select * from admins")).rows.length, 0);
    assert.equal((await q("select public.is_admin() as a")).rows[0].a, false);
  }),
);

await check("a signed-in non-manager gets visitor rights only", () =>
  as("user", async () => {
    assert.equal((await q("select * from properties")).rows.length, 10);
    assert.equal((await q("select * from inquiries")).rows.length, 0);
    assert.equal((await q("update properties set rent = 1")).affectedRows, 0);
    assert.equal((await q("select public.is_admin() as a")).rows[0].a, false);
  }),
);

await check("the manager can see and manage everything", () =>
  as("manager", async () => {
    assert.equal((await q("select public.is_admin() as a")).rows[0].a, true, "email match should ignore case");
    assert.equal((await q("select * from properties")).rows.length, 11, "manager sees pending too");
    assert.equal((await q("select * from inquiries")).rows.length, 1);
    assert.equal((await q("select * from alerts")).rows.length, 1);
    assert.equal((await q("select * from listing_submissions")).rows.length, 1);
    await q("update properties set status = 'published' where id = '6ab29083d137cf0e35e581b6'");
    await q("update inquiries set status = 'contacted'");
    const { rows } = await q(
      "insert into properties (title, city, rent) values ('New place','Irvington',1500) returning id, status, confirmed_at",
    );
    assert.equal(rows[0].status, "pending", "new listings default to pending");
    assert.equal(rows[0].id.length, 32);
    await q("delete from properties where id = $1", [rows[0].id]);
  }),
);

await check("updated_date moves on every edit", async () => {
  const before = (await q("select updated_date from properties where id = '6ab29083d137cf0e35e581ad'")).rows[0]
    .updated_date;
  await as("manager", () => q("update properties set rent = 650 where id = '6ab29083d137cf0e35e581ad'"));
  const after = (await q("select updated_date, rent from properties where id = '6ab29083d137cf0e35e581ad'")).rows[0];
  assert.ok(after.updated_date > before);
  assert.equal(Number(after.rent), 650);
});

await check("photo uploads: public only into submissions/, manager anywhere", async () => {
  await as("anon", async () => {
    await q("insert into storage.objects (bucket_id, name) values ('listing-photos','submissions/1.jpg')");
    await rejects(
      q("insert into storage.objects (bucket_id, name) values ('listing-photos','listings/1.jpg')"),
      "anon wrote to listings/",
    );
    await rejects(
      q("insert into storage.objects (bucket_id, name) values ('listing-photos','x.jpg')"),
      "anon wrote to bucket root",
    );
    assert.equal((await q("delete from storage.objects")).affectedRows, 0, "anon deleted photos");
  });
  await as("manager", async () => {
    await q("insert into storage.objects (bucket_id, name) values ('listing-photos','listings/2.jpg')");
    assert.equal((await q("delete from storage.objects where name = 'listings/2.jpg'")).affectedRows, 1);
  });
  const b = (await q("select * from storage.buckets where id = 'listing-photos'")).rows[0];
  assert.equal(b.public, true);
  assert.equal(Number(b.file_size_limit), 5242880);
});

await check("check constraints reject bad values", () =>
  as("manager", async () => {
    await rejects(q("update properties set rent_type = 'weekly'"), "bad rent_type");
    await rejects(q("update properties set pets = 'maybe'"), "bad pets");
    await rejects(q("update properties set status = 'deleted'"), "bad status");
  }),
);

console.log(`\ndatabase tests OK — ${passed} checks`);
