// Demo backend: everything lives in this browser's localStorage.
//
// Used automatically when no Supabase keys are configured (local development,
// the shareable preview). Nothing here is shared between visitors, so it must
// never be the live site's backend. See SETUP.md for switching to Supabase.

import seed from "@/data/properties.seed.json";

export const DEMO_EMAIL = "demo@apartments4newark.com";
export const DEMO_PASSWORD = "demo1234";

const KEY = "a4n_demo_v2";
const DAY = 24 * 60 * 60 * 1000;
const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));
const nowIso = () => new Date().toISOString();
const newId = () => Date.now().toString(16) + Math.random().toString(16).slice(2, 10);

// Keep a copy in memory too, so the demo still works where storage is blocked.
let memory = null;

function sampleData() {
  const now = Date.now();
  const ago = (days, hours = 0) => new Date(now - days * DAY - hours * 3600e3).toISOString();
  // Spread "last confirmed" dates over the past few days so freshness labels
  // look realistic whenever the demo is opened.
  const properties = clone(seed).map((p, i) => ({ ...p, confirmed_at: ago(i % 6, i) }));
  const byTitle = (t) => properties.find((p) => p.title.startsWith(t));
  const s20 = byTitle("South 20th");
  const chad = byTitle("142 Chadwick");
  return {
    properties,
    inquiries: [
      {
        id: newId() + "a",
        created_date: ago(0, 2),
        name: "Sample renter (demo)",
        phone: "(973) 555-0142",
        city: "Newark",
        zip: "07103",
        message: "Is the room still free? I can move in on the 1st.",
        property_id: s20?.id,
        property_title: s20?.title,
        lang: "en",
        status: "new",
      },
      {
        id: newId() + "b",
        created_date: ago(1, 5),
        name: "Sample family (demo)",
        phone: "(862) 555-0178",
        city: "Newark",
        zip: "07106",
        message: "Tenemos voucher de Section 8. ¿Podemos ver el apartamento este fin de semana?",
        property_id: chad?.id,
        property_title: chad?.title,
        lang: "es",
        status: "contacted",
      },
      {
        id: newId() + "c",
        created_date: ago(3),
        name: "Sample student (demo)",
        phone: "(201) 555-0110",
        city: "East Orange",
        zip: "07017",
        message: "Looking for a room under $700 near the train.",
        lang: "en",
        status: "new",
      },
    ],
    alerts: [
      {
        id: newId() + "d",
        created_date: ago(2),
        name: "Sample (demo)",
        phone: "(973) 555-0199",
        city: "Newark",
        rent_type: "per_room",
        max_rent: 750,
        bedrooms_min: null,
        lang: "en",
        active: true,
      },
      {
        id: newId() + "e",
        created_date: ago(4),
        name: "Sample (demo)",
        phone: "(862) 555-0133",
        city: "Irvington",
        rent_type: "whole_unit",
        max_rent: 2000,
        bedrooms_min: 2,
        lang: "pt",
        active: true,
      },
    ],
    submissions: [
      {
        id: newId() + "f",
        created_date: ago(0, 6),
        contact_name: "Sample landlord (demo)",
        contact_phone: "(973) 555-0166",
        contact_email: "landlord@example.com",
        relationship: "owner",
        status: "new",
        photos: [],
        data: {
          title: "Stuyvesant Ave · 2nd floor",
          address: "Stuyvesant Ave (exact address on request)",
          city: "Irvington",
          neighborhood: "",
          rent_type: "whole_unit",
          rent: 1750,
          bedrooms: 2,
          bathrooms: 1,
          availability: "October 1",
          accepts_vouchers: true,
          pets: "ask",
          description: "Freshly painted 2-bed on a quiet block. Heat and hot water included. Near the 107 bus.",
        },
      },
    ],
  };
}

function load() {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw);
  } catch {
    /* storage blocked: fall through to fresh sample data */
  }
  if (!memory) {
    memory = sampleData();
    save();
  }
  return memory;
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* storage blocked: changes last for this visit only */
  }
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const newest = (a, b) => String(b.created_date).localeCompare(String(a.created_date));

function collection(name, defaults = {}) {
  return {
    async list() {
      await delay();
      return clone(load()[name]).sort(newest);
    },
    async get(id) {
      await delay();
      const row = load()[name].find((r) => r.id === id);
      if (!row) throw httpError(404, "Not found");
      return clone(row);
    },
    async create(data) {
      await delay();
      const t = nowIso();
      const row = { ...defaults, ...clone(data), id: newId(), created_date: t, updated_date: t };
      load()[name].push(row);
      save();
      return clone(row);
    },
    async update(id, patch) {
      await delay();
      const rows = load()[name];
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) throw httpError(404, "Not found");
      rows[i] = { ...rows[i], ...clone(patch), id, updated_date: nowIso() };
      save();
      return clone(rows[i]);
    },
    async remove(id) {
      await delay();
      memory[name] = load()[name].filter((r) => r.id !== id);
      save();
      return { id };
    },
  };
}

// Session lives in sessionStorage-like memory + localStorage.
const SESSION_KEY = "a4n_demo_session";
let sessionMemo = null;
const listeners = new Set();
function readSession() {
  if (sessionMemo) return sessionMemo;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) sessionMemo = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return sessionMemo;
}
function writeSession(s) {
  sessionMemo = s;
  try {
    if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((cb) => cb());
}

const properties = collection("properties", { status: "pending" });

export const demoBackend = {
  mode: "demo",

  listings: {
    async list({ all = false } = {}) {
      const rows = await properties.list();
      return all ? rows : rows.filter((p) => p.status === "published");
    },
    get: properties.get,
    async create(data) {
      return properties.create({ status: "pending", confirmed_at: nowIso(), ...data });
    },
    update: properties.update,
    remove: properties.remove,
  },

  inquiries: collection("inquiries", { status: "new" }),
  alerts: collection("alerts", { active: true }),
  submissions: collection("submissions", { status: "new" }),

  auth: {
    async getUser() {
      await delay(30);
      const s = readSession();
      return s ? { email: s.email, role: "admin" } : null;
    },
    async signIn(email, password) {
      await delay(250);
      if (String(email).trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        writeSession({ email: DEMO_EMAIL, at: Date.now() });
        return { email: DEMO_EMAIL, role: "admin" };
      }
      throw httpError(401, "That email and password don't match.");
    },
    async signOut() {
      writeSession(null);
    },
    async requestPasswordReset() {
      await delay(200);
      return { ok: true };
    },
    async updatePassword() {
      throw new Error("Password changes aren't available in the demo.");
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  },

  storage: {
    // Demo only: keeps the photo inline as a data URL (already shrunk by
    // lib/image.js). The real backend uploads to Supabase Storage.
    uploadPhoto(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Couldn't read that file."));
        reader.readAsDataURL(file);
      });
    },
  },

  // Demo helper: wipe local changes and start over with the sample data.
  reset() {
    memory = sampleData();
    save();
  },
};
