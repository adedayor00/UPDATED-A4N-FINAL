// Browser tests: clicks through the built site (demo mode) like a renter and
// like the manager, on a phone-sized and a desktop-sized screen.
// Run: npm run build && npm run test:e2e
// Needs Chromium (set CHROME_PATH if it isn't at the default location).
// Screenshots go to test-results/.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { start } from "./serve-dist.mjs";

const EXE = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 4321;
const BASE = `http://localhost:${PORT}`;
const OUT = "test-results";
fs.mkdirSync(OUT, { recursive: true });
const AXE = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const server = await start(path.resolve("dist"), PORT);
const browser = await chromium.launch({ executablePath: EXE });

let passed = 0;
const failures = [];
const a11y = new Map();

async function run(name, viewport, fn) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600,
    locale: "en-US",
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" || (m.type() === "warning" && /React|Warning/.test(m.text())))
      errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on("popup", (p) => p.close().catch(() => {}));
  const label = `${name} [${viewport.width}px]`;
  try {
    await fn(page, { mobile: viewport.width < 600, tag: `${name.replace(/\W+/g, "-")}-${viewport.width}` });
    if (errors.length) throw new Error(`console errors:\n    ${errors.join("\n    ")}`);
    passed++;
    console.log(`✓ ${label}`);
  } catch (e) {
    failures.push(label);
    console.log(`✗ ${label}\n    ${e.message.split("\n").join("\n    ")}`);
    await page
      .screenshot({ path: `${OUT}/FAIL-${name.replace(/\W+/g, "-")}-${viewport.width}.png`, fullPage: true })
      .catch(() => {});
  } finally {
    await ctx.close();
  }
}

const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

async function noHorizontalScroll(page, where) {
  const { sw, iw, culprit } = await page.evaluate(() => {
    const iw = window.innerWidth;
    let culprit = "";
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.right > iw + 1 && getComputedStyle(el).position !== "fixed") {
        let p = el.parentElement,
          clipped = false;
        while (p) {
          const o = getComputedStyle(p).overflowX;
          if (o === "hidden" || o === "auto" || o === "scroll" || o === "clip") {
            clipped = true;
            break;
          }
          p = p.parentElement;
        }
        if (!clipped) {
          culprit = `${el.tagName}.${String(el.className).slice(0, 80)} → ${Math.round(r.right)}px`;
          break;
        }
      }
    }
    return { sw: document.documentElement.scrollWidth, iw, culprit };
  });
  expect(sw <= iw, `horizontal scroll on ${where}: page ${sw}px wide vs ${iw}px screen. ${culprit}`);
}

async function smallTapTargets(page) {
  return page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll(
      "a[href], button, [role=combobox], input:not([type=hidden]), select, textarea",
    )) {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (
        !r.width ||
        !r.height ||
        st.visibility === "hidden" ||
        el.closest("[aria-hidden=true]") ||
        el.closest(".sr-only")
      )
        continue;
      if (el.type === "checkbox" || el.type === "radio") continue;
      // inline text links inside paragraphs are fine
      if (el.tagName === "A" && el.closest("p")) continue;
      if (r.height < 32 || r.width < 32)
        bad.push(
          `${el.tagName} "${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`,
        );
    }
    return bad;
  });
}

async function axe(page, where) {
  await page.addScriptTag({ content: AXE });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      n: v.nodes.length,
      sample: v.nodes[0]?.target?.join(" "),
    }));
  });
  for (const v of res) {
    const key = `${v.id} (${v.impact})`;
    if (!a11y.has(key)) a11y.set(key, []);
    a11y.get(key).push(`${where}: ${v.n}× e.g. ${v.sample}`);
  }
  return res;
}

function mobileOrDesktop(page, vp) {
  return vp.width < 1024 ? page.locator("#hero-city") : page.locator("#filter-city");
}

async function pick(page, trigger, optionName) {
  await trigger.click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  await run("home loads cleanly", vp, async (page, { mobile, tag }) => {
    await page.goto(BASE + "/");
    const h1 = (await page.locator("h1").first().innerText()).replace(/\s+/g, " ").trim();
    expect(h1 === "Find your next place in Newark and other cities in New Jersey", `hero headline changed: "${h1}"`);
    await page
      .getByText(/places? available/)
      .first()
      .waitFor();
    const count = await page.locator("#listings a[href^='/listing/']").count();
    expect(count === 11, `expected 11 listing cards, got ${count}`);
    expect((await page.locator("img[src*='unsplash']").count()) === 0, "stock photos still on the page");
    await noHorizontalScroll(page, "home");
    const small = await smallTapTargets(page);
    expect(small.length === 0, `small tap targets:\n    ${small.slice(0, 8).join("\n    ")}`);
    await axe(page, `home ${vp.width}`);
    await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true });
  });

  await run("hero search filters listings", vp, async (page) => {
    await page.goto(BASE + "/");
    await pick(page, page.locator("#hero-type"), "Room in a share");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForURL(/type=room/);
    await page.getByText("4 places available").waitFor({ timeout: 4000 });
    const cards = await page.locator("#listings a[href^='/listing/']").count();
    expect(cards === 4, `expected 4 room shares, got ${cards}`);
    await page.getByRole("button", { name: /Remove filter: Room in a share/ }).click();
    await page.getByText("11 places available").waitFor();
  });

  await run("city picker searches every NJ town", vp, async (page, { tag }) => {
    await page.goto(BASE + "/");
    await page.locator("#hero-city").click();
    const search = page.getByRole("textbox", { name: /Search 564 NJ towns/ });
    await search.waitFor();
    const total = await page.locator("#hero-city-list [role=option]").count();
    expect(total === 565, `expected All cities + 564 towns, got ${total}`);
    await noHorizontalScroll(page, "city picker open");
    await page.screenshot({ path: `${OUT}/${tag}.png` });
    await search.fill("nutl");
    await page.getByRole("option", { name: "Nutley" }).click();
    expect((await page.locator("#hero-city").innerText()).includes("Nutley"), "Nutley not selected");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForURL(/city=Nutley/);
    await page.getByText("Nothing matches").first().waitFor();
    const alertCity = await page.locator("form", { hasText: "Get a text when a place opens" }).getByRole("combobox").first().innerText();
    expect(alertCity.includes("Nutley"), `alert form should default to Nutley, got ${alertCity}`);
    // keyboard: open the filter-bar picker, type, Enter
    await page.goto(BASE + "/");
    const trigger = mobileOrDesktop(page, vp);
    await trigger.click();
    await page.keyboard.type("east or");
    await page.keyboard.press("Enter");
    if (vp.width < 1024) await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByText("1 place available").waitFor();
  });

  await run("filters sheet + empty state + alert signup", vp, async (page, { tag }) => {
    await page.goto(BASE + "/?max=700&type=unit");
    await page.getByText("No listings match").or(page.getByText("Nothing matches")).first().waitFor();
    await page.getByRole("button", { name: /^Filters/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    await noHorizontalScroll(page, "filters sheet");
    await page.screenshot({ path: `${OUT}/${tag}-sheet.png` });
    await dialog.getByRole("button", { name: "Clear all" }).click();
    await dialog.getByRole("button", { name: /Show 11 places/ }).click();
    await page.goto(BASE + "/?max=700&type=unit");
    const form = page.locator("form", { hasText: "Get a text when a place opens" });
    await form.getByRole("button", { name: "Text me new places" }).click();
    await form.getByText("10-digit").waitFor();
    await form.getByLabel("Mobile number").fill("973 555 0188");
    await form.getByRole("button", { name: "Text me new places" }).click();
    await page.getByText("You're on the list").waitFor();
  });

  await run("listing page + inquiry flow", vp, async (page, { mobile, tag }) => {
    await page.goto(BASE + "/");
    await page.locator("#listings a[href*='south-20th-st']").first().click();
    await page.waitForURL(/\/listing\/6ab29083d137cf0e35e581ad\/south-20th-st-newark$/);
    await page.getByRole("heading", { level: 1, name: "South 20th St" }).waitFor();
    const canonical = await page.locator("link[rel=canonical]").getAttribute("href");
    expect(
      canonical === "https://apartments4newark.com/listing/6ab29083d137cf0e35e581ad/south-20th-st-newark",
      `canonical: ${canonical}`,
    );
    const title = await page.title();
    expect(/South 20th St, Newark NJ — \$600 \/ room/.test(title), `title: ${title}`);
    expect((await page.locator("script#page-jsonld").count()) === 1, "no structured data");
    await noHorizontalScroll(page, "listing");
    if (mobile) {
      await page.getByRole("button", { name: "Request", exact: true }).click();
    }
    const form = page.locator("#request form");
    await form.getByRole("button", { name: "Send request" }).click();
    await form.getByText("Please add your name.").waitFor();
    await form.getByText("10-digit").waitFor();
    await form.getByLabel("Name").fill("Playwright Tester");
    await form.getByLabel("Mobile number").fill("8625550100");
    await form.getByLabel("ZIP code").fill("07103");
    await pick(page, form.getByLabel("When do you want to move?"), "Within a month");
    await form.getByText("I'm using a housing voucher").click();
    await form.getByRole("button", { name: "Send request" }).click();
    await page.getByText("Request received").waitFor();
    await page.getByText("(862) 555-0100").first().waitFor();
    const wa = page.getByRole("button", { name: "WhatsApp" });
    await wa.waitFor();
    expect(
      (await page.getByRole("button", { name: "Instagram" }).count()) === 0,
      "placeholder Instagram button is showing",
    );
    await axe(page, `listing ${vp.width}`);
    await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true });
  });

  await run("city pages + 404s + old links", vp, async (page, { tag }) => {
    await page.goto(BASE + "/apartments/newark-nj");
    await page.getByRole("heading", { level: 1, name: "Apartments & rooms for rent in Newark, NJ" }).waitFor();
    await page
      .getByText(/9 places available/)
      .first()
      .waitFor();
    await noHorizontalScroll(page, "city page");
    await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true });
    await page.getByRole("link", { name: "Rooms only" }).click();
    await page.waitForURL(/rooms-for-rent\/newark-nj/);
    await page.getByRole("heading", { level: 1, name: "Rooms for rent in Newark, NJ" }).waitFor();
    await page.goto(BASE + "/apartments/atlantis-nj");
    await page.getByRole("heading", { name: "Page not found" }).waitFor();
    await page.goto(BASE + "/listing/doesnotexist");
    await page.getByRole("heading", { name: "This listing isn't available anymore" }).waitFor();
    await page.goto(BASE + "/property/6ab29083d137cf0e35e581b6");
    await page.waitForURL(/\/listing\/6ab29083d137cf0e35e581b6\/239-boyden-ave-apt-2-townhouse-maplewood$/);
    await page.goto(BASE + "/no/such/page");
    await page.getByRole("heading", { name: "Page not found" }).waitFor();
  });

  await run("Spanish + Portuguese", vp, async (page, { mobile, tag }) => {
    await page.goto(BASE + "/");
    await page.getByRole("button", { name: /^Language/ }).click();
    await page.getByRole("menuitemradio", { name: "Español" }).click();
    await page.getByRole("heading", { level: 1, name: /Encuentra tu próximo hogar en Newark/ }).waitFor();
    expect((await page.locator("html").getAttribute("lang")) === "es", "html lang not updated");
    await page.getByText("11 lugares disponibles").waitFor();
    await noHorizontalScroll(page, "home (es)");
    await page.screenshot({ path: `${OUT}/${tag}-es.png` });
    await page.reload();
    await page.getByRole("heading", { level: 1, name: /Encuentra/ }).waitFor();
    await page.goto(BASE + "/?lang=pt");
    await page.getByRole("heading", { level: 1, name: /Encontre seu próximo lar em Newark/ }).waitFor();
    await noHorizontalScroll(page, "home (pt)");
  });

  await run("list your place", vp, async (page, { tag }) => {
    await page.goto(BASE + "/list-your-place");
    await page.getByRole("button", { name: "Send for review" }).click();
    await page.getByText("Please confirm before sending.").waitFor();
    await page.getByLabel("Name").fill("Test Landlord");
    expect(
      (await page.getByText("Please add your name.").count()) === 0,
      "name error still showing after typing a name",
    );
    await page.getByLabel("Mobile number").fill("(973) 555-0177");
    await pick(page, page.getByLabel("Type"), "Rooms in a shared apartment");
    await page.getByLabel("Rent per room, per month").fill("750");
    await page.getByLabel("Street address").fill("12 Test St");
    await page.locator("#ly-confirm").check();
    await noHorizontalScroll(page, "list your place");
    await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true });
    await page.getByRole("button", { name: "Send for review" }).click();
    await page.getByRole("heading", { name: "Thanks — we've got it" }).waitFor();
    await axe(page, `list-your-place ${vp.width}`);
  });

  await run("manager dashboard end to end", vp, async (page, { mobile, tag }) => {
    await page.goto(BASE + "/admin");
    await page.waitForURL(/\/login\?returnTo=%2Fadmin/);
    await page.getByLabel("Email").fill("demo@apartments4newark.com");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("alert").getByText("don't match").waitFor();
    await page.getByRole("button", { name: "Fill in for me" }).click();
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/admin$/);
    await page.getByRole("heading", { name: "Dashboard" }).waitFor();
    await page.getByText("East Orange — Address on Request").first().waitFor();
    await noHorizontalScroll(page, "dashboard");
    await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true });

    // Toggle a room to taken on the East Orange share → listing disappears publicly
    const eo = page.locator("li", { hasText: "East Orange — Address on Request" });
    await eo.getByRole("button", { name: /Room 1: free/ }).click();
    await page.getByText("All rooms taken").first().waitFor();

    // Unpublish then approve
    const s15 = page.locator("li", { hasText: "South 15th St" });
    await s15.getByRole("button", { name: "Unpublish" }).click();
    await s15.getByRole("button", { name: /Approve & publish/ }).click();
    await page.getByText("Listing is live").first().waitFor();

    // Edit rent
    await s15.getByRole("button", { name: "Edit" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel(/Rent per room/).fill("725");
    await dlg.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Listing saved").first().waitFor();
    await s15.getByText("$725").waitFor();

    // Delete uses an in-page confirm (not window.confirm)
    const gar = page.locator("li", { hasText: "Garside St" });
    await gar.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await gar.waitFor();

    // Requests tab has the samples
    await page.getByRole("tab", { name: /Requests/ }).click();
    await page.getByText("Sample renter (demo)").waitFor();
    const req = page.locator("li", { hasText: "Sample renter (demo)" });
    const waHref = await req.getByRole("link", { name: "Reply on WhatsApp" }).getAttribute("href");
    expect(waHref.startsWith("https://wa.me/19735550142?text="), `bad WhatsApp reply link ${waHref}`);
    await page.screenshot({ path: `${OUT}/${tag}-requests.png`, fullPage: true });
    await req.getByRole("button", { name: "Mark contacted" }).click();
    await page.getByRole("tab", { name: /Contacted/ }).click();
    await page.getByText("Sample renter (demo)").waitFor();

    // Submissions → create listing
    await page.getByRole("tab", { name: /Submissions/ }).click();
    await page
      .locator("li", { hasText: "Stuyvesant Ave" })
      .getByRole("button", { name: /Review & create listing/ })
      .click();
    const dlg2 = page.getByRole("dialog");
    await dlg2.getByRole("heading", { name: "Create listing from submission" }).waitFor();
    expect((await dlg2.getByLabel("Title *").inputValue()).includes("Stuyvesant"), "submission title not carried over");
    await dlg2.getByRole("button", { name: "Create listing" }).click();
    await page.getByText("Listing created").first().waitFor();

    // Alerts tab shows matches
    await page.getByRole("tab", { name: /Alerts/ }).click();
    await page
      .getByText(/\d+ match(es)?/)
      .first()
      .waitFor();

    // New pending listing appears in the listings tab; the East Orange one is hidden from the public board
    await page.getByRole("tab", { name: /Listings/ }).click();
    await page.getByRole("tab", { name: /Pending/ }).click();
    await page.locator("li", { hasText: "Stuyvesant Ave" }).waitFor();
    await axe(page, `dashboard ${vp.width}`);
    await page.goto(BASE + "/");
    await page.getByText("10 places available").waitFor();
    expect(
      (await page.locator("#listings a[href*='east-orange-address']").count()) === 0,
      "fully-taken share still public",
    );
    await page.goto(BASE + "/admin");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(BASE + "/");
  });
}

// Prerendered HTML (what Google / WhatsApp see without JavaScript)
await run("pre-built pages have real content", { width: 1440, height: 900 }, async (page) => {
  const ctx = page.context();
  const raw = await (await ctx.request.get(BASE + "/apartments/newark-nj")).text();
  expect(
    raw.includes("<title>Apartments &amp; Rooms for Rent in Newark, NJ | Apartments4Newark</title>"),
    "city page title missing in HTML",
  );
  expect(raw.includes('"@type":"FAQPage"'), "FAQ structured data missing");
  expect(/South 20th St/.test(raw), "listings missing from static HTML");
  const listing = await (await ctx.request.get(BASE + "/listing/6ab29083d137cf0e35e581ad/south-20th-st-newark")).text();
  expect(
    listing.includes(
      '<link rel="canonical" href="https://apartments4newark.com/listing/6ab29083d137cf0e35e581ad/south-20th-st-newark"',
    ),
    "listing canonical missing",
  );
  expect(
    listing.includes('property="og:title" content="South 20th St, Newark NJ — $600 / room | Apartments4Newark"'),
    "listing og:title missing",
  );
  const sm = await (await ctx.request.get(BASE + "/sitemap.xml")).text();
  expect((sm.match(/<loc>/g) || []).length === 22, "sitemap should list 22 pages");
  expect(!sm.includes("/admin"), "admin in sitemap");
  const app = await (await ctx.request.get(BASE + "/admin")).text();
  expect(!app.includes('class="pr"'), "fallback shell should be empty");
  const robots = await (await ctx.request.get(BASE + "/robots.txt")).text();
  expect(robots.includes("Disallow: /admin"), "robots.txt");
});

await browser.close();
server.close();

if (a11y.size) {
  console.log("\nAccessibility (axe, WCAG 2 A/AA):");
  for (const [k, v] of a11y) console.log(`  ${k}\n    ${v.join("\n    ")}`);
}
console.log(`\n${passed} passed, ${failures.length} failed${failures.length ? `: ${failures.join(", ")}` : ""}`);
process.exit(failures.length || a11y.size ? 1 : 0);
