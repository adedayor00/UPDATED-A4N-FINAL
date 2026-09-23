# Going live — step by step

This takes about 45 minutes, and every service here has a free plan that covers it.
Until step 3 is done, the site runs in **demo mode**: it works and looks right, but
listings and requests only live in each visitor's own browser. The build log warns
you when that's the case.

Button and menu names below match Supabase and Netlify as of September 2026. They
move things around now and then, so look for the closest match.

---

## 1. Put this code in your GitHub repo

Your Netlify site already deploys from `adedayor00/APARTMENT4NEWARK` (branch `main`).
Replace the repo's contents with this folder (keep the `.git` folder if you're copying
over an existing checkout), then push:

```bash
git add -A
git commit -m "Rebuild: real backend, SEO pages, filters, dashboard"
git push origin main
```

Netlify picks up `netlify.toml` automatically (build command `npm run build`, publish folder `dist`).

## 2. Create the database (Supabase)

1. Go to <https://supabase.com> → **New project**. Name it `apartments4newark`, pick region **East US**, and save the database password somewhere safe.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**. It creates the tables, the security rules and the photo storage. It's safe to run again.
3. New query again: paste `supabase/seed.sql` → **Run**. That loads your 11 current listings.
4. Create your manager login: **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, and tick **Auto confirm user**.
5. Make that email a manager. In the SQL Editor, run:
   ```sql
   insert into public.admins(email) values ('you@yourdomain.com');
   ```
   (Use the same email as step 4. Add one line per manager.)
6. **Turn off public sign-ups** so strangers can't create accounts: **Authentication → Sign In / Providers → Email** → switch off **Allow new users to sign up** → Save.
7. **Authentication → URL Configuration**:
   - Site URL: `https://apartments4newark.com`
   - Redirect URLs: add `https://apartments4newark.com/reset-password`

## 3. Connect the site to the database (Netlify)

1. In Supabase: **Project Settings → API** (or **Connect**). Copy the **Project URL** and the **anon / publishable** key. That key is meant to be public, because the security rules are in the database.
2. In Netlify: **Site configuration → Environment variables → Add a variable**:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon/publishable key
3. **Deploys → Trigger deploy → Deploy site**. When it finishes, the build log should say `prerender: … published listings from Supabase`.

## 4. Get an email for every request (Netlify Forms)

Every renter request, alert sign-up and landlord submission is saved in Supabase **and** sent to Netlify Forms, which can email you.

1. Netlify → **Forms**. If asked, click **Enable form detection**, then redeploy once.
2. You should see three forms: `inquiry`, `alert`, `listing`.
3. **Forms → Form notifications → Add notification → Email notification** → your email → "Any form". Netlify's free plan includes a monthly allowance of form submissions, which is plenty for this.

## 5. Keep Google up to date automatically

Each listing and city gets its own pre-built page, and those pages are refreshed on every deploy. To redeploy automatically whenever you change a listing:

1. Netlify → **Site configuration → Build & deploy → Build hooks → Add build hook** (name: "Listings changed"). Copy the URL.
2. Supabase → **Database → Webhooks → Create a new hook**: table `properties`, events Insert / Update / Delete, type **HTTP Request**, method POST, URL = the build hook. Save.

Optional: run the same build hook once a day (for example with a free cron service), so expired listings drop out of Google's sitemap even on quiet days.

## 6. Tell Google about the site

1. <https://search.google.com/search-console> → **Add property → Domain** `apartments4newark.com`, then verify it (IONOS DNS → add the TXT record Google gives you).
2. **Sitemaps** → submit `https://apartments4newark.com/sitemap.xml`.
3. Set up a free **Google Business Profile** for Apartments4Newark (service-area business, Newark NJ). It's the biggest free boost for local searches.

## 7. Optional: visitor stats

Add ONE of these in Netlify environment variables and redeploy:
- `VITE_PLAUSIBLE_DOMAIN=apartments4newark.com` (Plausible, privacy-friendly, paid)
- `VITE_GA_ID=G-XXXXXXXXXX` (Google Analytics 4, free)

The site then records requests sent, WhatsApp/text taps, alert sign-ups and landlord submissions.

## 8. Five-minute check after launch

Do this on your phone:

- [ ] Home page shows your listings (not the demo). `/login` does **not** show "Demo mode".
- [ ] Send a test request from a listing. It appears in **Dashboard → Requests**, and the email arrives.
- [ ] Sign up for an alert. It appears in **Dashboard → Alerts**.
- [ ] Submit a test place from **List your place** with a photo. It appears in **Dashboard → Submissions** with the photo.
- [ ] In the dashboard, approve it, mark a room taken, then delete the test listing.
- [ ] Share a listing link in WhatsApp. The preview shows the title and price.
- [ ] Open `https://apartments4newark.com/sitemap.xml`. Your listings are in it.

---

## Everyday use

- **Add a listing:** Dashboard → **New listing** → save → **Approve & publish**.
- **A room gets rented:** tap that room's chip on the listing ("Room 2: Free" → "Taken"). When every room is taken, the listing hides itself.
- **Listings expire after 30 days** unless you confirm they're still available. The dashboard warns you a week ahead. Press **Still available — renew**.
- **Requests:** reply with the WhatsApp / Text / Call buttons, then mark them Contacted or Closed.
- **Alerts:** when you publish something new, the Alerts tab shows who's waiting for a place like it, with a ready-made message and links.
- **Photos:** upload straight from your phone. They're shrunk automatically. The first photo is the cover (use the ★ button to change it).

## For developers

```bash
npm install
npm run dev            # http://localhost:5173 (demo mode unless .env has Supabase keys)
npm test               # unit + translations + database security tests
npm run build          # production build + pre-built SEO pages → dist/
npm run test:e2e       # browser tests on phone + desktop sizes (needs Chromium; see script)
npm run test:supabase  # production code path against a simulated Supabase
npm run build:preview  # one self-contained HTML file (demo data) → preview-dist/
```

See `CLAUDE.md` for the project map and rules for changes.
