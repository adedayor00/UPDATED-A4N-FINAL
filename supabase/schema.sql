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

-- A manager must be signed in with a CONFIRMED email that is listed in
-- public.admins. Checking auth.users (not just the email in the login token)
-- means an unconfirmed sign-up using a manager's address gets nothing.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_date() returns trigger
language plpgsql set search_path = public as $$
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

-- ─── Hardening: size limits on public forms ─────────────────────────────────
-- Every field a visitor can fill in has a length cap, so nobody can stuff
-- huge values into the database. Safe to run again (drops and re-adds).
alter table public.inquiries drop constraint if exists inquiries_sizes;
alter table public.inquiries add constraint inquiries_sizes check (
  char_length(coalesce(city, '')) <= 120 and char_length(coalesce(property_id, '')) <= 64
  and char_length(coalesce(property_title, '')) <= 300 and char_length(coalesce(lang, '')) <= 10) not valid;
alter table public.alerts drop constraint if exists alerts_sizes;
alter table public.alerts add constraint alerts_sizes check (
  char_length(coalesce(city, '')) <= 120 and char_length(coalesce(lang, '')) <= 10
  and (max_rent is null or max_rent between 0 and 100000)
  and (bedrooms_min is null or bedrooms_min between 0 and 20)) not valid;
alter table public.listing_submissions drop constraint if exists submissions_sizes;
alter table public.listing_submissions add constraint submissions_sizes check (
  char_length(coalesce(relationship, '')) <= 40 and pg_column_size(data) <= 20000
  and jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 10) not valid;

-- ─── Hardening: rate limits on public forms ─────────────────────────────────
-- Stops bots from flooding the inbox: per phone number, and a site-wide cap.
-- Managers are never limited.
create or replace function public.a4n_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  digits text;
  per_phone int;
  total int;
begin
  if public.is_admin() then return new; end if;
  if tg_table_name = 'inquiries' then
    digits := regexp_replace(new.phone, '\D', '', 'g');
    select count(*) filter (where regexp_replace(phone, '\D', '', 'g') = digits), count(*)
      into per_phone, total from public.inquiries where created_date > now() - interval '1 hour';
    if per_phone >= 5 or total >= 100 then
      raise exception 'Too many requests. Please try again later.' using errcode = 'P0429';
    end if;
  elsif tg_table_name = 'alerts' then
    digits := regexp_replace(new.phone, '\D', '', 'g');
    select count(*) filter (where regexp_replace(phone, '\D', '', 'g') = digits), count(*)
      into per_phone, total from public.alerts where created_date > now() - interval '1 hour';
    if per_phone >= 5 or total >= 100 then
      raise exception 'Too many requests. Please try again later.' using errcode = 'P0429';
    end if;
  elsif tg_table_name = 'listing_submissions' then
    digits := regexp_replace(new.contact_phone, '\D', '', 'g');
    select count(*) filter (where regexp_replace(contact_phone, '\D', '', 'g') = digits), count(*)
      into per_phone, total from public.listing_submissions where created_date > now() - interval '1 day';
    if per_phone >= 5 or total >= 50 then
      raise exception 'Too many requests. Please try again later.' using errcode = 'P0429';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.a4n_rate_limit() from public, anon, authenticated;

drop trigger if exists inquiries_rate_limit on public.inquiries;
create trigger inquiries_rate_limit before insert on public.inquiries
  for each row execute function public.a4n_rate_limit();
drop trigger if exists alerts_rate_limit on public.alerts;
create trigger alerts_rate_limit before insert on public.alerts
  for each row execute function public.a4n_rate_limit();
drop trigger if exists submissions_rate_limit on public.listing_submissions;
create trigger submissions_rate_limit before insert on public.listing_submissions
  for each row execute function public.a4n_rate_limit();
