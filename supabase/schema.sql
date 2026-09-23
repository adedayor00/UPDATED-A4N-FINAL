-- Apartments4Newark — Supabase schema
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.
--
-- Who can do what (enforced by Postgres row-level security, not the website):
--   • Anyone:        read published listings; send an inquiry; sign up for
--                    alerts; submit a place to list; upload photos with a submission.
--   • Managers only: everything else (see/approve/edit listings, read inquiries …).
-- A "manager" is any signed-in user whose email is in public.admins.


-- ─── Managers ────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  email text primary key,
  created_date timestamptz not null default now()
);
alter table public.admins enable row level security;
-- No policies: nobody can read or change this table through the API.
-- Add managers in the SQL editor:  insert into public.admins(email) values ('you@example.com');

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_date() returns trigger
language plpgsql as $$
begin
  new.updated_date := now();
  return new;
end $$;

-- ─── Listings ────────────────────────────────────────────────────────────────
create table if not exists public.properties (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  title text not null,
  address text default '',
  city text not null,
  neighborhood text default '',
  bedrooms numeric default 3,
  bathrooms numeric default 1,
  rent numeric not null default 0,
  rent_type text not null default 'whole_unit' check (rent_type in ('per_room', 'whole_unit')),
  rooms_free integer default 0,
  availability text default '',
  utilities text default 'Ask',
  deposit text default 'Ask',
  description text default '',
  photos jsonb not null default '[]'::jsonb,
  rooms jsonb not null default '[]'::jsonb,
  accepts_vouchers boolean,
  pets text default 'ask' check (pets in ('yes', 'no', 'ask')),
  status text not null default 'pending' check (status in ('pending', 'published')),
  confirmed_at timestamptz not null default now(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists properties_status_idx on public.properties (status);
drop trigger if exists properties_touch on public.properties;
create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_date();

alter table public.properties enable row level security;
drop policy if exists "public reads published" on public.properties;
create policy "public reads published" on public.properties
  for select using (status = 'published' or public.is_admin());
drop policy if exists "managers write" on public.properties;
create policy "managers write" on public.properties
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Inquiries (renter requests) ─────────────────────────────────────────────
create table if not exists public.inquiries (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 7 and 40),
  city text default '',
  zip text default '' check (char_length(zip) <= 10),
  message text default '' check (char_length(message) <= 2000),
  property_id text,
  property_title text default '',
  lang text default 'en',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
drop trigger if exists inquiries_touch on public.inquiries;
create trigger inquiries_touch before update on public.inquiries
  for each row execute function public.touch_updated_date();
alter table public.inquiries enable row level security;
drop policy if exists "anyone can send" on public.inquiries;
create policy "anyone can send" on public.inquiries
  for insert to anon, authenticated with check (status = 'new');
drop policy if exists "managers manage" on public.inquiries;
create policy "managers manage" on public.inquiries
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Alerts ("text me when a place opens") ───────────────────────────────────
create table if not exists public.alerts (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  name text default '' check (char_length(name) <= 120),
  phone text not null check (char_length(phone) between 7 and 40),
  city text default 'any',
  rent_type text default 'any' check (rent_type in ('any', 'per_room', 'whole_unit')),
  max_rent numeric,
  bedrooms_min numeric,
  lang text default 'en',
  active boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
drop trigger if exists alerts_touch on public.alerts;
create trigger alerts_touch before update on public.alerts
  for each row execute function public.touch_updated_date();
alter table public.alerts enable row level security;
drop policy if exists "anyone can subscribe" on public.alerts;
create policy "anyone can subscribe" on public.alerts
  for insert to anon, authenticated with check (active = true);
drop policy if exists "managers manage" on public.alerts;
create policy "managers manage" on public.alerts
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Listing submissions ("List your place") ─────────────────────────────────
-- Landlord details stay in this private table. Nothing here is public; a
-- manager turns a submission into a listing from the dashboard.
create table if not exists public.listing_submissions (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  contact_name text not null check (char_length(contact_name) between 1 and 120),
  contact_phone text not null check (char_length(contact_phone) between 7 and 40),
  contact_email text default '' check (char_length(contact_email) <= 200),
  relationship text default 'owner',
  data jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new', 'converted', 'rejected')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
drop trigger if exists submissions_touch on public.listing_submissions;
create trigger submissions_touch before update on public.listing_submissions
  for each row execute function public.touch_updated_date();
alter table public.listing_submissions enable row level security;
drop policy if exists "anyone can submit" on public.listing_submissions;
create policy "anyone can submit" on public.listing_submissions
  for insert to anon, authenticated with check (status = 'new');
drop policy if exists "managers manage" on public.listing_submissions;
create policy "managers manage" on public.listing_submissions
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Photo storage ───────────────────────────────────────────────────────────
-- Public bucket (photos are shown on the site), 5 MB per file, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "a4n public submission uploads" on storage.objects;
create policy "a4n public submission uploads" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = 'submissions');

drop policy if exists "a4n managers manage photos" on storage.objects;
create policy "a4n managers manage photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'listing-photos' and public.is_admin())
  with check (bucket_id = 'listing-photos' and public.is_admin());
