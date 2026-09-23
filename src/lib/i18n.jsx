import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en";
import es from "@/locales/es";
import pt from "@/locales/pt";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" },
  { code: "pt", label: "Português", short: "PT" },
];
const DICTS = { en, es, pt };
const KEY = "a4n_lang";

function initialLang() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (DICTS[fromUrl]) return fromUrl;
    const saved = window.localStorage.getItem(KEY);
    if (DICTS[saved]) return saved;
  } catch {
    /* ignore */
  }
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  const base = nav.slice(0, 2).toLowerCase();
  return DICTS[base] ? base : "en";
}

function lookup(dict, key) {
  return key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!DICTS[code]) return;
    setLangState(code);
    try {
      window.localStorage.setItem(KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  // t("cards.roomsFree", { count: 2 }) → picks "roomsFree_one" / "roomsFree_other"
  // when they exist; falls back to English, then to the key itself.
  const t = useCallback(
    (key, vars = {}) => {
      const pick = (dict) => {
        if (vars.count !== undefined) {
          const plural = lookup(dict, `${key}_${vars.count === 1 ? "one" : "other"}`);
          if (plural !== undefined) return plural;
        }
        return lookup(dict, key);
      };
      let s = pick(DICTS[lang]);
      if (s === undefined) s = pick(en);
      if (s === undefined) return key;
      if (typeof s !== "string") return s;
      return s.replace(/\{(\w+)\}/g, (_, v) => (vars[v] !== undefined ? vars[v] : `{${v}}`));
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
