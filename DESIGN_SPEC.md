# Apartments4Newark — Design & Build Spec

> **Updated September 2026 (v2).** The tokens, typography, radius, shadows and motion rules below still apply. Changes since the Base44 export:
> - **Home order:** Hero with a search bar (city · type · max rent), no hero photo → stats (listings, cities, rooms-from price, $0 fees) → "Just listed" carousel → How it works → Browse by city (dark tiles with counts, light "Get alerts" tiles) → All listings (search + city/type/budget selects, Filters sheet with beds/vouchers/pets/sort, removable filter chips) → contact form.
> - **No stock photos.** Listings without photos show the branded `PhotoPlaceholder` ("Photos on request").
> - **New pages:** city pages (`/apartments/:city-nj`, `/rooms-for-rent/:city-nj`), `/list-your-place`, `/privacy`. Listing URLs are now `/listing/:id/:slug`.
> - **Inquiry flow:** the form saves the request first ("Request received"), then offers WhatsApp / Text / Call. Instagram and Telegram only show when real handles are set in `src/lib/contact.js`.
> - **Colour additions:** `#0062c4` for blue text on blue-tinted pills (contrast), `#0F7B6C` for WhatsApp buttons (contrast). `#86868b` is no longer used for text.
> - **Nav:** Listings · Cities · How it works · List your place · About, plus a language menu and a "Send a request" button. Manager login moved to the footer.
> - **Data model additions:** `accepts_vouchers` (true / null only), `pets` (yes/no/ask), `confirmed_at` (30-day freshness). The full schema is in `supabase/schema.sql`.
> - The logo is the house-and-"4" mark in `src/components/Logo.jsx` / `public/favicon.svg`.


Captured from the live Base44 app "Newark Living Pro" (preview--newark-living-next.base44.app) on 22 Sep 2026.
Every source file in `src/` was pulled from the Base44 code editor and checked against the original with a content hash, so the UI code is the real code, not a re-creation.

Reference renders are in `docs/screenshots/`. Photos show as a flat tint there only because the capture machine couldn't reach the image host. In a browser the Unsplash photos load normally.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Routing | react-router-dom v6 (BrowserRouter) |
| Styling | Tailwind CSS 3 + CSS variables (shadcn/ui "new-york" conventions) + `tailwindcss-animate` |
| UI primitives | Radix UI (Dialog, Select, Label, Toast, Slot), shadcn wrappers in `src/components/ui/` |
| Icons | lucide-react |
| Motion | framer-motion (hero parallax), custom IntersectionObserver `Reveal` + `useCountUp` |
| Data | `src/api/base44Client.js`: same API surface as the Base44 SDK, backed by localStorage + `src/data/properties.seed.json` |

---

## 2. Design tokens

### Colour
| Token | Value | Use |
|---|---|---|
| Page background | `#fbfbfd` (`--background: 0 0% 99%`) | Body, most sections |
| Alt section | `#f5f5f7` | "How it works", footer, fact tiles, image wells |
| Text | `#1d1d1f` (`--foreground: 240 6% 12%`) | Headlines, body |
| Secondary text | `#6e6e73` | Sub-heads, meta, captions |
| Tertiary text | `#86868b` | Footer headings, step numbers |
| Accent / primary | `#0071e3` (`--primary: 212 100% 45%`) | Buttons, links, badges, focus |
| Accent gradient | `#0071e3 → #5a9be3` | Only on the word "Newark" in the hero |
| Border | `--border: 240 6% 90%` | Hairlines |
| Secondary fill | `--secondary: 240 5% 96%` | Inputs in filter bar, hover fills |
| WhatsApp | `#0F7B6C` (hover `#0b6659`) — darker WhatsApp green that passes contrast with white text | WhatsApp buttons only |
| Destructive | `--destructive: 0 84% 60%` | Delete, errors |

The site is light theme only. There is no dark mode.

### Typography
- Font stack (no web font download): `-apple-system, BlinkMacSystemFont, "SF Pro Display"/"SF Pro Text", "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif`. Mac/iPhone users get SF Pro. Windows shows Arial/Helvetica, which matches the live site.
- Body: 17px, letter-spacing −0.011em. h1–h3: letter-spacing −0.022em. Antialiased.
- Hero H1: 40px / 1.06 (mobile) → 64px / 1.05 (sm) → 80px / 1.03 (lg), bold, tracking-tight.
- Section H2: `text-3xl sm:text-4xl` (How it works: `sm:text-5xl`; final CTA: `text-4xl sm:text-6xl`), bold.
- Card title 16px semibold. Card city label 12px uppercase, tracking-wide, `#6e6e73`. Price `text-xl` bold.
- Nav links 13px medium, `#6e6e73` → foreground on hover.

### Radius, shadow, glass
- `--radius: 0.9rem`. Buttons are fully rounded pills (`rounded-full`). Cards `rounded-3xl`. Hero image and gallery `rounded-[24px]`. Fact tiles `rounded-2xl`.
- `.card-shadow`: `0 1px 2px rgba(29,29,31,.04), 0 8px 24px -12px rgba(29,29,31,.12)`
- `.card-shadow-lg`: `0 2px 4px rgba(29,29,31,.05), 0 24px 48px -20px rgba(29,29,31,.18)`
- `.glass`: `background: rgba(251,251,253,.72); backdrop-filter: saturate(180%) blur(20px)`
- Focus ring: `box-shadow: 0 0 0 3px hsl(212 100% 45% / .4)`

### Layout
- Content max width 1200px (`max-w-[1200px]`), gutters `px-5 sm:px-6`. Hero image 1100px.
- Section padding: `py-16 sm:py-24` typical, `py-20 sm:py-32` for How it works, `py-24 sm:py-32` for the final CTA.
- Breakpoints: Tailwind defaults (sm 640, md 768, lg 1024).

### Buttons (`src/components/ui/button.jsx`, customised from shadcn)
- Base: `rounded-full`, text-sm medium. Default size `h-11 px-5`, sm `h-9 px-3 text-xs`, lg `h-12 px-8`, icon `h-11 w-11` (44px tap targets).
- Variants: default (solid blue), outline, secondary, ghost, link, destructive.
- Secondary CTAs are text links: 15px medium `#0071e3` + `ChevronRight`, underline on hover.

---

## 3. Motion
- **Reveal** (`components/Reveal.jsx`): fade + rise 20px (`translate-y-5`), 600ms ease-out, fires once at 12% visibility. `delay` prop staggers items (grids use `(i % 3) * 80`ms, steps `i*100`, city tiles `i*60`).
- **Count-up** (`hooks/useCountUp.js`): 1400ms ease-out-cubic when 30% visible.
- **Hero parallax**: framer-motion `useScroll`. The image moves y 0 → −30px and scales 1 → 1.08 as the hero scrolls out.
- **Card hover**: lift `-translate-y-1`, shadow → `card-shadow-lg`, image scale 1.05 over 500ms.
- **Smooth scroll** on `html`. `prefers-reduced-motion` turns off all animation and transitions, and Reveal/count-up jump straight to the final state.
- Skeletons (`animate-pulse`, `bg-secondary/50`) instead of spinners while listings load.

---

## 4. Pages & routes (`src/App.jsx`)

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Query params `?city=`, `?q=`, `?sort=` drive the listing filters |
| `/property/:id` | PropertyDetail | Pending listings show "Listing not available" unless the viewer is admin |
| `/keywords` | Keywords | Chips for live cities (→ `/?city=`) and neighbourhoods (→ `/?q=`) + free-text search |
| `/sitemap` | SiteMap | Grouped link list |
| `/about` | AboutUs | Story + 3 value cards + "Want to list a place?" |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth pages | Manager login (`AuthLayout` card) |
| `/admin` | AdminDashboard | Protected. Stats, table, approve/unpublish, create/edit dialog |
| `*` | PageNotFound | |

Public pages render inside `Layout` (Navbar + Footer). `/admin` uses Layout without the footer.

### Navbar
Sticky, 52px tall, `.glass`, bottom hairline. Logo (black 28px rounded square with `Building2` icon + "Apartments4Newark" 15px semibold) on the left. Centred links: Listings, How it works (`/#how`), About, Keywords. On the right: a "Manager" pill (signed out) or Dashboard + Sign out (admin). Mobile: hamburger opens a full-screen white menu with 24px headings.

### Home — section order
1. **Hero**: centred H1 "Find your next place in **Newark** and other cities in New Jersey". Sub-head "Browse available apartments and shared rooms across New Jersey, city by city. Free to ask, free to tour — no sign-up, no fees." Buttons: "Find a place" (→ `#listings`) and "Send a request ›" (→ `#contact`). Below them, a 16:9 rounded featured photo (first live listing with photos) with parallax that links to that listing.
2. **Trust strip**: 4 stats: live listing count, NJ cities covered (distinct cities among live listings), "$0 Fees to browse", "100% Free to tour".
3. **Featured listings**: horizontal snap carousel (first 8 live listings), cards 280px / 340px wide, round arrow buttons on sm+.
4. **How it works** (`#how`, `#f5f5f7`): 3 steps with icon tiles: Browse / Fill one quick form / We reply.
5. **Browse by city**: 6 photo tiles (Newark, East Orange, Irvington, Jersey City, Elizabeth, Maplewood), 2 columns on mobile / 3 on desktop. Dark gradient, "N live" or "Browse" chip.
6. **All listings** (`#listings`): sticky glass filter bar at `top-[52px]` (pill on desktop, full-bleed on mobile). It has search, city select (All cities + every NJ municipality) and sort (Default, Rent low→high, high→low, Most rooms free). Count heading, then a 1/2/3-column grid. There is an empty state with "Reset filters".
7. **Final CTA** (`#contact`): "Your next home is one message away." + InquiryForm card + "Or browse by keyword ›".
8. **Footer** (`#f5f5f7`): brand blurb, Browse / Site / Reach out columns, © line.

### Property card
4:3 image (or `BrandedPlaceholder`, a deterministic Unsplash interior chosen from the listing id). White pill badge top-left: "N room(s) free" or "Whole unit". Then the city (uppercase), title, price ("$600 / room", "$1,825 / mo", or "Price on request"), and a hairline row with beds, baths and "View ›".

### Property detail
Back link. Gallery: vertical thumbnail rail (120px) + large 16:9 image on desktop, horizontal thumbs below on mobile. Swipe to change photos, click to open the lightbox (Esc/arrow keys/swipe, "n / total" counter). Header: blue "free" badge, city · neighbourhood, big title, address, price on the right. 5 key-fact tiles (beds, baths, type, city, availability). Left column: Utilities/Deposit/Available/Type cards, "What's included", "Rooms in this apartment" (Free/Taken pills). Right column: sticky "Request this place" card with InquiryForm. Mobile: fixed bottom glass bar with the price and an "Inquire" button.

### Inquiry flow (`components/InquiryForm.jsx` + `lib/contact.js`)
Step 1 form: Name*, Phone*, City you're looking in (NJ select), ZIP code, Message → "Continue".
Step 2: summary card + "Choose how to send". The buttons are:
- **WhatsApp** (green) → `https://wa.me/18626000056?text=…`
- **Instagram DM** → copies the message, opens `https://ig.me/m/apartments4newark`
- **Text message** → `sms:+18626000056?&body=…`
- **Telegram** → copies the message, opens `https://t.me/apartments4newark`

The Instagram and Telegram handles are placeholders. Set the real ones in `src/lib/contact.js`.

### Admin
- Stat cards: Total, Live, Pending approval, Cities.
- Table columns: Listing/address, City, Beds, Rent, Type, Approval (blue "Live" / amber "Pending"), Actions (Approve or Unpublish, Edit, Delete with confirm).
- New listings save as **pending** and stay hidden publicly until approved.
- The PropertyForm dialog has all fields, photo upload and a per-room editor.

---

## 5. Data model — `Property`
```
title*        string   short label (street or area)
address       string   or "Address on request"
city*         string   any NJ municipality (src/lib/njCities.js)
neighborhood  string   e.g. West Ward, North Newark
bedrooms      number   default 3
bathrooms     number   default 1 (halves allowed)
rent*         number   USD / month
rent_type     "per_room" | "whole_unit"   default whole_unit
rooms_free    number   default 0
availability  string   "Now", "End of June"…
utilities     string   "Ask" | "Included"…
deposit       string
description   string
photos        string[] image URLs
rooms         {name, type, price, status: "free"|"taken"}[]
status        "pending" | "published"     default pending
id, created_date, updated_date            system fields
```
The seed data (the 11 real listings) is in `src/data/properties.seed.json`. The original Base44 entity schemas are in `reference/base44-original/base44/entities/`.

---

## 6. Copy & contact constants
- Phone / WhatsApp: 862-600-0056 (`+1 8626000056`)
- Email: hello@apartments4newark.com
- Tagline: "No account needed · Free to ask, free to tour"
- About page mentions "Adam" by name and a "$75 background check". Review both before launch.

---

## 7. What changed from the Base44 original (and why)
| File | Change |
|---|---|
| `src/api/base44Client.js` | Base44 SDK replaced with a local implementation of the same API (localStorage + seed JSON). Original in `reference/`. |
| `src/lib/app-params.js` | Base44 token bootstrap replaced with a local session check. Original in `reference/`. |
| `src/components/ui/image.jsx` | Base44's Wix-media resizing `<Image>` replaced with a plain `<img>` taking the same props. |
| `package.json`, `vite.config.js`, `jsconfig.json` | Base44 plugin and unused dependencies removed. `@` alias added. |
| `tailwind.config.js` → `.cjs` | Same content. Renamed so it loads under `"type": "module"`. |
| Not copied | `pages/OAuthConsent.jsx` (Base44 MCP-only), Base44 image helpers, and ~50 stock shadcn/ui components the app never imports (add any with `npx shadcn@latest add <name>`). |

All other files are byte-for-byte the Base44 code, apart from whitespace normalisation.
