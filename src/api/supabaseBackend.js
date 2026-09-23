// Production backend: Supabase (Postgres + Auth + Storage).
//
// Security is enforced by the database, not by this file: the row-level
// security policies in supabase/schema.sql decide who can read and write what.
// The anon key used here is designed to be public.

import { createClient } from "@supabase/supabase-js";

const PHOTO_BUCKET = "listing-photos";

export function createSupabaseBackend(url, anonKey) {
  const sb = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  const check = ({ data, error }) => {
    if (error) {
      const err = new Error(error.message || "Something went wrong");
      err.status = error.status || (error.code === "PGRST116" ? 404 : 400);
      throw err;
    }
    return data;
  };

  function table(name) {
    return {
      async list() {
        return check(await sb.from(name).select("*").order("created_date", { ascending: false }).limit(1000));
      },
      async get(id) {
        return check(await sb.from(name).select("*").eq("id", id).single());
      },
      // Public forms insert without reading the row back: anonymous visitors
      // are allowed to add rows but not to read them.
      async create(data) {
        check(await sb.from(name).insert(data));
        return { ...data };
      },
      async update(id, patch) {
        const { id: _drop, created_date: _c, updated_date: _u, ...rest } = patch;
        return check(await sb.from(name).update(rest).eq("id", id).select().single());
      },
      async remove(id) {
        check(await sb.from(name).delete().eq("id", id));
        return { id };
      },
    };
  }

  const properties = table("properties");

  async function isAdmin() {
    const { data, error } = await sb.rpc("is_admin");
    return !error && data === true;
  }

  return {
    mode: "supabase",

    listings: {
      async list({ all = false } = {}) {
        let q = sb.from("properties").select("*").order("created_date", { ascending: false }).limit(1000);
        if (!all) q = q.eq("status", "published");
        return check(await q);
      },
      get: properties.get,
      async create(data) {
        return check(
          await sb
            .from("properties")
            .insert({ status: "pending", confirmed_at: new Date().toISOString(), ...data })
            .select()
            .single(),
        );
      },
      update: properties.update,
      remove: properties.remove,
    },

    inquiries: table("inquiries"),
    alerts: table("alerts"),
    submissions: table("listing_submissions"),

    auth: {
      async getUser() {
        const { data } = await sb.auth.getSession();
        const email = data?.session?.user?.email;
        if (!email) return null;
        return (await isAdmin()) ? { email, role: "admin" } : { email, role: "user" };
      },
      async signIn(email, password) {
        const res = await sb.auth.signInWithPassword({ email: String(email).trim(), password });
        if (res.error) {
          const err = new Error("That email and password don't match.");
          err.status = 401;
          throw err;
        }
        if (!(await isAdmin())) {
          await sb.auth.signOut();
          const err = new Error("This account isn't set up as a manager. Add it to the admins table.");
          err.status = 403;
          throw err;
        }
        return { email: res.data.user.email, role: "admin" };
      },
      async signOut() {
        await sb.auth.signOut();
      },
      async requestPasswordReset(email) {
        await sb.auth.resetPasswordForEmail(String(email).trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { ok: true };
      },
      async updatePassword(password) {
        check(await sb.auth.updateUser({ password }));
        return { ok: true };
      },
      onChange(cb) {
        // Supabase warns against calling it from inside this callback (it can
        // deadlock), so the refresh runs on the next tick.
        const { data } = sb.auth.onAuthStateChange(() => setTimeout(cb, 0));
        return () => data.subscription.unsubscribe();
      },
    },

    storage: {
      // folder "listings" is manager-only; "submissions" accepts uploads from
      // the public "List your place" form (see storage policies in schema.sql).
      async uploadPhoto(file, { folder = "listings" } = {}) {
        const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await sb.storage
          .from(PHOTO_BUCKET)
          .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
        if (error) throw new Error(error.message || "Upload failed");
        return sb.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
      },
    },
  };
}
