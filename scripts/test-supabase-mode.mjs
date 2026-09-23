// Tests the production (Supabase) code path without a real Supabase project:
// builds the site with Supabase keys, then answers its network calls from the
// browser with a fake Supabase that follows the same rules as schema.sql.
// It checks every write the site makes only uses real table columns.
// Run: npm run test:supabase
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { start } from "./serve-dist.mjs";

const EXE = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SB = "https://fake-project.supabase.co";
const OUT = "dist-supabase-test";

execSync(`npx vite build --outDir ${OUT} --emptyOutDir`, {
  stdio: "pipe",
  env: { ...process.env, VITE_SUPABASE_URL: SB, VITE_SUPABASE_ANON_KEY: "anon-test-key" },
});
fs.copyFileSync(path.join(OUT, "index.html"), path.join(OUT, "app.html"));

// Columns from supabase/schema.sql
const schema = fs.readFileSync("supabase/schema.sql", "utf8");
const columns = {};
for (const m of schema.matchAll(/create table if not exists public\.(\w+) \(([\s\S]*?)\n\);/g)) {
  columns[m[1]] = new Set(
    m[2]
      .split("\n")
      .map((l) => l.trim().match(/^([a-z_]+)\s/)?.[1])
      .filter(Boolean),
  );
}

const seed = JSON.parse(fs.readFileSync("src/data/properties.seed.json", "utf8")).map((p) => ({
  ...p,
  confirmed_at: new Date().toISOString(),
}));
seed[10].status = "pending";
const db = { properties: seed, inquiries: [], alerts: [], listing_submissions: [] };
let signedIn = false;
const problems = [];
const writes = [];

function checkColumns(table, row) {
  for (const k of Object.keys(row)) if (!columns[table]?.has(k)) problems.push(`${table}: unknown column "${k}"`);
}

const server = await start(path.resolve(OUT), 4331);
const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", email: "manager@a4n.test", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const user = {
  id: "u1",
  email: "manager@a4n.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

await page.route(`${SB}/**`, async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const method = req.method();
  const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

  if (url.pathname === "/rest/v1/rpc/is_admin") return json(200, signedIn);
  if (url.pathname === "/auth/v1/token") {
    const body = JSON.parse(req.postData() || "{}");
    if (body.password !== "correct-horse")
      return json(400, { error: "invalid_grant", error_description: "Invalid login credentials" });
    signedIn = true;
    return json(200, {
      access_token: jwt,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "r1",
      user,
    });
  }
  if (url.pathname === "/auth/v1/user") return json(200, user);
  if (url.pathname === "/auth/v1/logout") return ((signedIn = false), route.fulfill({ status: 204 }));

  const table = url.pathname.replace("/rest/v1/", "");
  if (!db[table]) return json(404, { message: `unknown ${table}` });
  const eq = (key) => url.searchParams.get(key)?.replace(/^eq\./, "");
  const single = (req.headers()["accept"] || "").includes("vnd.pgrst.object");

  if (method === "GET") {
    let rows = db[table];
    if (!signedIn && table !== "properties") rows = [];
    if (!signedIn && table === "properties") rows = rows.filter((r) => r.status === "published");
    if (eq("status")) rows = rows.filter((r) => r.status === eq("status"));
    if (eq("id")) rows = rows.filter((r) => r.id === eq("id"));
    if (single)
      return rows.length
        ? json(200, rows[0])
        : json(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
    return json(200, rows);
  }
  if (method === "POST") {
    const body = JSON.parse(req.postData());
    const rows = Array.isArray(body) ? body : [body];
    rows.forEach((r) => checkColumns(table, r));
    if (!signedIn && table === "properties")
      return json(403, { message: "new row violates row-level security policy" });
    if (!signedIn && r0(rows).status && r0(rows).status !== "new" && table !== "alerts")
      return json(403, { message: "rls" });
    const saved = rows.map((r) => ({
      id: Math.random().toString(16).slice(2),
      created_date: new Date().toISOString(),
      ...r,
    }));
    db[table].push(...saved);
    writes.push({ table, method, row: rows[0] });
    return single ? json(201, saved[0]) : route.fulfill({ status: 201 });
  }
  if (method === "PATCH") {
    if (!signedIn) return json(200, []);
    const body = JSON.parse(req.postData());
    checkColumns(table, body);
    const row = db[table].find((r) => r.id === eq("id"));
    Object.assign(row, body);
    writes.push({ table, method, row: body });
    return single ? json(200, row) : json(200, [row]);
  }
  if (method === "DELETE") {
    db[table] = db[table].filter((r) => r.id !== eq("id"));
    return route.fulfill({ status: 204 });
  }
  return json(400, { message: "unsupported" });
});
const r0 = (rows) => rows[0] || {};

const BASE = "http://localhost:4331";
const expect = (c, m) => {
  if (!c) throw new Error(m);
};
let step = "";
try {
  step = "public listings load from Supabase";
  await page.goto(BASE + "/");
  await page.getByText("10 places available").waitFor();

  step = "listing page + inquiry insert";
  await page.goto(BASE + "/listing/6ab29083d137cf0e35e581ad/south-20th-st-newark");
  await page.getByRole("heading", { level: 1, name: "South 20th St" }).waitFor();
  await page.getByRole("button", { name: "Request", exact: true }).click();
  const form = page.locator("#request form");
  await form.getByLabel("Name").fill("Supabase Tester");
  await form.getByLabel("Mobile number").fill("9735550123");
  await form.getByRole("button", { name: "Send request" }).click();
  await page.getByText("Request received").waitFor();
  const inq = writes.find((w) => w.table === "inquiries");
  expect(
    inq &&
      inq.row.phone === "(973) 555-0123" &&
      inq.row.status === "new" &&
      inq.row.property_id === "6ab29083d137cf0e35e581ad",
    "inquiry row wrong",
  );

  step = "pending listing is hidden from the public";
  await page.goto(BASE + "/listing/6ab29083d137cf0e35e581b6");
  await page.getByRole("heading", { name: "This listing isn't available anymore" }).waitFor();

  step = "alert insert";
  await page.goto(BASE + "/apartments/irvington-nj");
  await page.getByText("0 places available").waitFor();
  const alertForms = await page.locator("form", { hasText: "Get a text when a place opens" }).count();
  expect(alertForms === 1, `empty city page should show one alert form, found ${alertForms}`);
  const al = page.locator("form", { hasText: "Get a text when a place opens" }).first();
  await al.getByLabel("Mobile number").fill("(862) 555-0144");
  await al.getByRole("button", { name: "Text me new places" }).click();
  await page.getByText("You're on the list").waitFor();
  expect(writes.find((w) => w.table === "alerts")?.row.city === "Irvington", "alert row wrong");

  step = "listing submission insert";
  await page.goto(BASE + "/list-your-place");
  await page.getByLabel("Name").fill("Owner Test");
  await page.getByLabel("Mobile number").fill("9735550155");
  await page.getByLabel("Monthly rent").fill("1650");
  await page.locator("#ly-confirm").check();
  await page.getByRole("button", { name: "Send for review" }).click();
  await page.getByRole("heading", { name: "Thanks — we've got it" }).waitFor();
  const sub = writes.find((w) => w.table === "listing_submissions");
  expect(sub?.row.data?.rent === 1650 && sub.row.status === "new", "submission row wrong");

  step = "manager sign-in (wrong then right password)";
  await page.goto(BASE + "/login");
  expect((await page.getByText("Demo mode").count()) === 0, "demo banner shown in Supabase mode");
  await page.getByLabel("Email").fill("manager@a4n.test");
  await page.getByLabel("Password").fill("nope");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("alert").getByText("don't match").waitFor();
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/);
  await page.getByText("Signed in as manager@a4n.test").waitFor();
  expect((await page.getByText("Demo mode.").count()) === 0, "demo banner on dashboard in Supabase mode");

  step = "manager sees pending + new request, approves, edits rooms";
  await page.getByText("239 Boyden Ave").first().waitFor();
  await page
    .locator("li", { hasText: "239 Boyden Ave" })
    .getByRole("button", { name: /Approve & publish/ })
    .click();
  await page.getByText("Listing is live").first().waitFor();
  const eo = page.locator("li", { hasText: "East Orange — Address on Request" });
  await eo.getByRole("button", { name: /Room 1: free/ }).click();
  await page.getByText("All rooms taken").first().waitFor();
  await page.getByRole("tab", { name: /Requests/ }).click();
  await page.getByText("Supabase Tester").waitFor();
  await page.getByRole("tab", { name: /Submissions/ }).click();
  await page
    .locator("li", { hasText: "Irvington" })
    .or(page.locator("li", { hasText: "Newark" }))
    .first()
    .getByRole("button", { name: /Review & create listing/ })
    .click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Title *").fill("Test submission place");
  await dlg.getByRole("button", { name: "Create listing" }).click();
  await page.getByText("Listing created").first().waitFor();
  const created = writes.find((w) => w.table === "properties" && w.method === "POST");
  expect(created?.row.status === "pending" && created.row.title === "Test submission place", "created listing wrong");

  step = "sign out";
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(BASE + "/");
  if (errors.length) throw new Error(`console errors: ${errors.join(" | ")}`);
} catch (e) {
  problems.push(`${step}: ${e.message.split("\n")[0]}`);
  await page.screenshot({ path: "test-results/FAIL-supabase-mode.png", fullPage: true }).catch(() => {});
}

await browser.close();
server.close();
fs.rmSync(OUT, { recursive: true, force: true });
console.log(`writes checked: ${writes.map((w) => `${w.method} ${w.table}`).join(", ")}`);
if (problems.length) {
  console.log(`✗ Supabase mode:\n  ${[...new Set(problems)].join("\n  ")}`);
  process.exit(1);
}
console.log("✓ Supabase mode OK — public reads, all four inserts, manager sign-in, approve/edit/create, sign-out");
