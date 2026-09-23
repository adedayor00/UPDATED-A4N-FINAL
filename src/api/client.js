// The one place the app talks to data. Pages and components import `api`
// from here and never touch storage or the network directly.
//
// With VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set, `api` is the real
// shared backend. Without them it falls back to the in-browser demo, which is
// what the preview build and local development use.

import { demoBackend } from "./demoBackend";
import { createSupabaseBackend } from "./supabaseBackend";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const api = url && key ? createSupabaseBackend(url, key) : demoBackend;
export const IS_DEMO = api.mode === "demo";
