// Runs after `vite build`. Writes a real HTML file for the home page, every
// city page and every live listing, each with its own title, description,
// social-preview tags, structured data and a plain-HTML summary of the page.
// Google and link previews (WhatsApp, Facebook, iMessage) read these directly;
// visitors get the full app on top as soon as it loads.
//
// Listings come from Supabase when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// are set (as on Netlify), otherwise from src/data/properties.seed.json.
// Rebuild to refresh (see SETUP.md → "Keep Google up to date").

import fs from "node:fs";
import path from "node:path";
import {
  SITE_NAME,
  citySlug,
  cityPath,
  isPubliclyVisible,
  isRooms,
  listingDescription,
  listingPath,
  lowestRent,
  roomsFree,
} from "../src/lib/listing.js";

const DIST = "dist";
const SITE_URL = (process.env.VITE_SITE_URL || "https://apartments4newark.com").replace(/\/$/, "");
const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

// Clean shell for every other URL (admin, login, unknown pages).
fs.writeFileSync(
  path.join(DIST, "app.html"),
  template.replace("<!--prerender:head-->", "").replace("<!--prerender:body-->", ""),
);

async function loadListings() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/properties?select=*&status=eq.published&limit=1000`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      console.log(`prerender: ${rows.length} published listings from Supabase`);
      return rows;
    } catch (e) {
      console.warn(`prerender: couldn't reach Supabase (${e.message}); pages will list no listings`);
      return [];
    }
  }
  if (process.env.NETLIFY || process.env.VERCEL) {
    console.warn(
      "\n⚠️  prerender: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set, so this deploy runs in DEMO MODE:\n" +
        "   listings and requests are saved only in each visitor's browser. Add the keys (SETUP.md, step 3) and redeploy.\n",
    );
  }
  const rows = JSON.parse(fs.readFileSync("src/data/properties.seed.json", "utf8"));
  // Seed dates are fixed; treat them as freshly confirmed for the static build.
  const now = new Date().toISOString();
  console.log(`prerender: ${rows.length} listings from seed file (demo mode)`);
  return rows.map((p) => ({ ...p, confirmed_at: now }));
}

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (n) => `$${Number(n).toLocaleString("en-US")}`;
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

// Minimal styling for the static summary. Hidden as soon as JavaScript runs
// (the app shows the same content); crawlers without JavaScript read it.
const STYLE = `<script>document.documentElement.classList.add("js")</script><style>.js .pr{display:none}.pr{max-width:1100px;margin:0 auto;padding:32px 20px;font:17px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif;color:#1d1d1f}.pr h1{font-size:34px;line-height:1.1;letter-spacing:-.02em;margin:0 0 12px}.pr h2{font-size:20px;margin:28px 0 8px}.pr p{color:#6e6e73;margin:0 0 12px}.pr ul{padding-left:20px}.pr li{margin:6px 0}.pr a{color:#0071e3}</style>`;

function page({ route, title, description, image, jsonLd, body, noindex }) {
  const url = SITE_URL + route;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Rooms & Apartments for Rent in Newark, NJ`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(description)}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${esc(url)}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(fullTitle)}"`)
    .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${esc(fullTitle)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(description)}"`)
    .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(description)}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${esc(url)}"`);
  if (image) {
    html = html
      .replace(/(<meta property="og:image" content=")[^"]*"/, `$1${esc(image)}"`)
      .replace(/(<meta name="twitter:image" content=")[^"]*"/, `$1${esc(image)}"`)
      .replace(/\s*<meta property="og:image:width"[^>]*>\s*<meta property="og:image:height"[^>]*>/, "");
  }
  if (noindex) html = html.replace(/(<meta name="robots" content=")[^"]*"/, `$1noindex, follow"`);
  html = html
    .replace("<!--prerender:head-->", STYLE + (jsonLd ? ld(jsonLd) : ""))
    .replace("<!--prerender:body-->", `<div class="pr">${body}</div>`);
  const file = route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return route;
}

const listingItem = (p) =>
  `<li><a href="${esc(listingPath(p))}">${esc(p.title)}</a> — ${esc(p.city)}${p.neighborhood ? `, ${esc(p.neighborhood)}` : ""}: ${
    p.rent ? `${money(p.rent)}${isRooms(p) ? " per room" : ""}/month` : "price on request"
  }, ${isRooms(p) ? `${roomsFree(p)} room(s) free in a ${p.bedrooms}-bed share` : `${p.bedrooms} bed, ${p.bathrooms} bath`}</li>`;

const crumbs = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, route], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: SITE_URL + route,
  })),
});

const all = (await loadListings()).filter((p) => isPubliclyVisible(p));
const byCity = {};
all.forEach((p) => (byCity[p.city] ||= []).push(p));
const cities = Object.keys(byCity).sort((a, b) => byCity[b].length - byCity[a].length);
const written = [];

// Home
written.push(
  page({
    route: "/",
    description:
      "Rooms and apartments for rent in Newark, East Orange and across New Jersey. Real rents, rooms that are actually free, no sign-up and no fees to ask or tour.",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#org`,
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/icon-512.png`,
          areaServed: "New Jersey",
        },
        { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: SITE_URL, name: SITE_NAME },
      ],
    },
    body: `<h1>Find your next place in Newark and other cities in New Jersey</h1>
<p>Browse available apartments and shared rooms across New Jersey, city by city. Free to ask, free to tour — no sign-up, no fees.</p>
<h2>Browse by city</h2><ul>${cities.map((c) => `<li><a href="${cityPath(c)}">Apartments &amp; rooms for rent in ${esc(c)}, NJ</a> (${byCity[c].length})</li>`).join("")}</ul>
<h2>Available now</h2><ul>${all.map(listingItem).join("")}</ul>
<p><a href="/list-your-place">List your place</a> · <a href="/about">About</a> · Text or WhatsApp <a href="tel:+18626000056">(862) 600-0056</a></p>`,
  }),
);

// City pages
for (const city of cities) {
  const list = byCity[city];
  const rooms = list.filter(isRooms);
  const rf = lowestRent(list, "rooms");
  const uf = lowestRent(list, "units");
  const faq = [
    [
      `How much is rent in ${city} on Apartments4Newark?`,
      [
        rf ? `Rooms in shared apartments start at ${money(rf)} a month.` : "",
        uf ? `Whole apartments start at ${money(uf)} a month.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    ],
    [
      "Do I have to pay to see a place?",
      "No. Browsing, asking questions and touring are free, and there's no account to create.",
    ],
    [
      "Can I use a Section 8 or other housing voucher?",
      "Yes. New Jersey law protects renters who pay with vouchers or other lawful income. Listings marked “Vouchers welcome” have told us they take them, and you can ask about any listing.",
    ],
  ];
  const mk = (kind, items) => {
    const route = cityPath(city, kind);
    const from = lowestRent(items, kind === "rooms" ? "rooms" : undefined);
    written.push(
      page({
        route,
        title: kind === "rooms" ? `Rooms for Rent in ${city}, NJ` : `Apartments & Rooms for Rent in ${city}, NJ`,
        description: `${items.length} ${kind === "rooms" ? "rooms" : "places"} for rent in ${city}, NJ${from ? ` from ${money(from)}/month` : ""}. Real rents, updated listings, no sign-up and no fees to ask or tour.`,
        jsonLd: {
          "@context": "https://schema.org",
          "@graph": [
            crumbs([
              ["Home", "/"],
              [`${city}, NJ`, route],
            ]),
            {
              "@type": "FAQPage",
              mainEntity: faq.map(([q, a]) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ],
        },
        body: `<h1>${kind === "rooms" ? `Rooms for rent in ${esc(city)}, NJ` : `Apartments &amp; rooms for rent in ${esc(city)}, NJ`}</h1>
<p>${items.length} ${items.length === 1 ? "place" : "places"} available in ${esc(city)} right now. Real rents, updated regularly — free to ask, free to tour.</p>
<ul>${items.map(listingItem).join("")}</ul>
${faq.map(([q, a]) => `<h2>${esc(q)}</h2><p>${esc(a)}</p>`).join("")}`,
      }),
    );
  };
  mk("apartments", list);
  if (rooms.length) mk("rooms", rooms);
}

// Listing pages
for (const p of all) {
  const route = listingPath(p);
  const url = SITE_URL + route;
  const price = p.rent ? `${money(p.rent)}${isRooms(p) ? " / room" : " / mo"}` : "Price on request";
  written.push(
    page({
      route,
      title: `${p.title}, ${p.city} NJ — ${price}`,
      description: listingDescription(p),
      image: p.photos?.[0],
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": isRooms(p) ? "Room" : "Apartment",
            name: p.title,
            description: p.description || listingDescription(p),
            url,
            image: p.photos?.length ? p.photos : undefined,
            numberOfRooms: p.bedrooms,
            numberOfBathroomsTotal: p.bathrooms,
            address: { "@type": "PostalAddress", addressLocality: p.city, addressRegion: "NJ", addressCountry: "US" },
            offers: p.rent
              ? { "@type": "Offer", price: p.rent, priceCurrency: "USD", availability: "https://schema.org/InStock" }
              : undefined,
          },
          crumbs([
            ["Home", "/"],
            [`${p.city}, NJ`, cityPath(p.city)],
            [p.title, route],
          ]),
        ],
      },
      body: `<h1>${esc(p.title)}</h1>
<p>${esc(p.city)}${p.neighborhood ? ` · ${esc(p.neighborhood)}` : ""} — <strong>${esc(price)}</strong></p>
<p>${esc(listingDescription(p))}</p>
${p.description ? `<h2>About this place</h2><p>${esc(p.description)}</p>` : ""}
<ul><li>Bedrooms: ${esc(p.bedrooms)}</li><li>Bathrooms: ${esc(p.bathrooms)}</li><li>Available: ${esc(p.availability || "Ask")}</li><li>Utilities: ${esc(p.utilities || "Ask")}</li><li>Deposit: ${esc(p.deposit || "Ask")}</li>${p.accepts_vouchers ? "<li>Housing vouchers welcome</li>" : ""}</ul>
<p><a href="${esc(cityPath(p.city))}">More places in ${esc(p.city)}</a> · Text or WhatsApp <a href="tel:+18626000056">(862) 600-0056</a></p>`,
    }),
  );
}

// Simple pages
const simple = [
  [
    "/about",
    "About Us",
    "Apartments4Newark is a small, hands-on listing service for rooms and apartments in Newark and across New Jersey.",
  ],
  [
    "/list-your-place",
    "List Your Rental in Newark & NJ",
    "Have a room or apartment for rent in Newark or elsewhere in New Jersey? Tell us about it and we'll put it in front of renters who are looking now.",
  ],
  ["/privacy", "Privacy", "What Apartments4Newark collects when you send a request, and how it's used."],
  ["/keywords", "Search by Area", "Browse rentals by New Jersey city or neighborhood."],
  ["/sitemap", "Site Map", "Every page on Apartments4Newark."],
];
for (const [route, title, description] of simple) {
  written.push(page({ route, title, description, body: `<h1>${esc(title)}</h1><p>${esc(description)}</p>` }));
}

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const lastmod = (r) => {
  const p = all.find((x) => listingPath(x) === r);
  return (p?.confirmed_at || p?.updated_date || today).slice(0, 10);
};
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${written.map((r) => `  <url><loc>${SITE_URL}${r === "/" ? "/" : r}</loc><lastmod>${lastmod(r)}</lastmod></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);
console.log(
  `prerender: wrote ${written.length} pages + sitemap.xml (${cities.length} cities: ${cities.map(citySlug).join(", ")})`,
);
