# Audit & rebuild report — 23 September 2026

Two full review passes over the Base44 export, covering front end, back end, database, UI/UX, mobile, SEO and legal/trust. Everything below is fixed in this version unless it's listed under **Decisions for you**.

## Test results (all passing)

| Suite | What it checks | Result |
|---|---|---|
| `npm test` → unit | slugs, 30-day expiry, room-share visibility, alert matching, filters & sorting, phone/ZIP/email validation, seed data is clean | 10 groups ✓ |
| `npm test` → i18n | every key used in code exists in English, Spanish and Portuguese; languages identical | 311 keys ✓ |
| `npm test` → database | real `schema.sql` in an in-memory Postgres: what visitors, signed-in non-managers and managers can each read and write; storage upload rules; constraints; re-running the schema | 10 checks ✓ |
| `npm run test:e2e` | 9 flows × phone (390px) and desktop (1440px), including the searchable city picker,, plus static-HTML checks: home, hero search, filters sheet, empty state, alert sign-up, listing page & request, city pages, 404s, old links, Spanish/Portuguese, List your place, full manager dashboard. Each flow also checks no console errors, no sideways scrolling, 44px tap targets and zero axe (WCAG 2 A/AA) violations | 19 ✓ |
| `npm run test:supabase` | the production (Supabase) code path against a simulated Supabase: public reads, all four kinds of submissions, pending listings hidden, manager sign-in (wrong and right password), approve, room toggle, create from submission, sign-out; every write checked against real table columns | ✓ |

## Critical issues found in the original

1. **Listings weren't shared between visitors.** Data lived in each visitor's browser (localStorage), so nothing you added or approved in the dashboard reached renters. → Replaced with a real Supabase database. A demo mode is kept for previews and flagged everywhere ("Demo mode" banner; the build log warns if the live site deploys without keys).
2. **The admin password was public.** `VITE_ADMIN_PASSWORD` is compiled into the JavaScript anyone can download, and the check ran in the browser. → Real Supabase login; manager rights come from a server-side `admins` table; security enforced by row-level security (tested).
3. **Requests were lost.** The form only opened WhatsApp or a text; if the renter didn't hit send, you never knew. → Every request, alert and landlord submission is saved to the database first, emailed to you via Netlify Forms, and listed in the dashboard.
4. **Stock photos presented as real apartments,** with the same photo reused on different listings. → All removed. A branded "Photos on request" placeholder plus an "Ask for photos or a video tour" button.
5. **Placeholder Instagram/Telegram handles** could have sent renters to someone else's account. → Hidden until you add real handles in `src/lib/contact.js`.
6. **Stale and unconfirmed copy:** "Available: End of June" (in September), "chat with Adam", "the only charge is a $75 background check". → Availability set to "Ask"; the name and fee claim were removed (see Decisions).
7. **Google could barely see the site.** One generic title for every page, no sitemap, no robots.txt, no per-listing previews. → A pre-built page per listing and city, each with its own title, description, social preview and structured data (breadcrumbs, FAQ, apartment/room), plus `sitemap.xml` and `robots.txt`.

## Other fixes (first pass)

- **Mobile:** form fields and buttons enlarged to 44px; the phone keyboard shows digits for phone and ZIP; safe-area padding on the sticky bottom bar; a phone-friendly Filters sheet.
- **Search & filters:** budget, type, bedrooms, vouchers, pets, sort; removable filter chips; filters live in the URL, so a search can be shared; every city picker is now searchable and covers **all 564 New Jersey municipalities** in all 21 counties. Towns with listings show first with a count; repeated names carry their county, e.g. "Franklin Township (Somerset County)".
- **Freshness:** "Updated 2 days ago" on every card; listings auto-hide 30 days after last confirmation; room shares auto-hide when every room is taken; the dashboard warns a week before expiry.
- **New pages:** city pages with rent ranges and an FAQ, List your place (landlord form with photo upload), Privacy, a proper 404.
- **Renter tools:** text alerts ("text me when a place opens"), share button, similar listings, a voucher checkbox on requests, move-in timing.
- **Languages:** full Spanish and Portuguese for everything renters see, with automatic detection, a switcher, and the preference remembered.
- **Dashboard:** tabs for Listings / Requests / Submissions / Alerts; tap-to-toggle rooms; renew; approve; one-tap WhatsApp/text/call replies in the renter's language; alert matches with ready-made messages; turn a submission into a listing; photo reorder/cover; phone photos shrunk automatically before upload; in-page confirm dialogs.
- **Trust & fair housing:** Equal Housing Opportunity statement; the voucher option can only be "welcome" or unmentioned (turning away voucher holders is illegal in NJ); a service-animal note on no-pet listings; "never pay before you see it" safety tip; spam traps on every form.
- **Brand:** new house-plus-"4" logo, favicon, app icons and a social preview image; wordmark with the blue "4".
- **Performance & cleanup:** dropped framer-motion and unused Base44 leftovers (sign-up/OTP/Google pages, OAuth stubs); admin and secondary pages load on demand; long-lived caching for assets; security headers.

## Second-pass findings (also fixed)

- A hidden screen-reader label made the whole page scroll sideways on phones (the carousel). Fixed, and the e2e test now catches it.
- The carousel's first card was clipped on the left on phones.
- Blue-on-blue pills, grey footer headings and the WhatsApp button failed colour contrast. Darker shades are now used, and axe reports zero violations.
- Toast close buttons had no label and were invisible on touch screens.
- Error messages stayed on screen after the field was fixed, on all forms.
- The listing page showed "Updated yesterday" twice, and the phone photo area was cramped.
- The phone footer was hidden behind the listing page's sticky "Request" bar.
- A flash of plain text appeared before the app loaded on pre-built pages.
- The city list was missing nearby towns (Nutley, Glen Ridge, Caldwell, West Caldwell, North Bergen and more). It has been rebuilt from county records with all 564 NJ municipalities (`scripts/make-nj-towns.py`).
- Empty city pages showed the alert form twice.
- Supabase's login listener could freeze if it called the database directly (a documented pitfall). It now defers.
- A failed listings load showed "0 places". It now shows an error with a Try again button.
- A Spanish grammar slip.
- **Dependencies:** `npm audit` flagged React Router 6 (moderate, including an open-redirect pattern). Upgraded to React Router 7.18 (0 known vulnerabilities in production dependencies) and hardened the login page's "return to" check against backslash and control-character tricks.

## Decisions for you

1. **Who renters talk to.** The About page used to name "Adam". It now says "us". To show a name, set `CONTACT_PERSON` in `src/lib/contact.js`.
2. **Fees.** The "$75 background check" claim is gone. The About page now says: *"If a landlord charges an application or screening fee, we tell you the amount before anything is paid."* Make sure that's how you work, and check any screening fee against New Jersey's Fair Chance in Housing Act (it limits when criminal history can be asked about). I'm not a lawyer, so it's worth a quick check with one.
3. **hello@apartments4newark.com** is shown in the footer. Make sure that mailbox exists (IONOS can set it up or forward it).
4. **Instagram / Telegram:** add your real handles in `src/lib/contact.js` and the buttons reappear.
5. **Real photos.** Upload them from the dashboard. Listings with photos get far more requests, and they appear in WhatsApp link previews.
6. **Translations.** The Spanish and Portuguese are careful but machine-written. Have a native speaker skim `src/locales/es.js` and `pt.js` before launch.
7. **Alert texts are sent by you** (one tap from the dashboard), not automatically. Automatic texting would need a paid SMS service such as Twilio, plus opt-in rules. That's easy to add later.
8. **Deploying** replaces what's in your GitHub repo `adedayor00/APARTMENT4NEWARK` and goes live on the next Netlify build. Follow `SETUP.md` in order.

## Not included (good next steps)

- A map view (needs geocoded addresses; many listings are "address on request").
- Renter accounts and saved favorites (the site deliberately needs no sign-up today).
- Automatic SMS alerts (see 7).
