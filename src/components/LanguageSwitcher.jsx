import React, { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, useT } from "@/lib/i18n";

export default function LanguageSwitcher({ variant = "nav" }) {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("nav.language")}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
            className={`h-11 rounded-full px-4 text-[15px] font-medium transition-colors ${
              lang === l.code ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  const current = LANGUAGES.find((l) => l.code === lang);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("nav.language")}: ${current.label}`}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[#6e6e73] hover:bg-secondary hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        {current.short}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1.5 card-shadow-lg"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="menuitemradio"
              aria-checked={lang === l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className="flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] hover:bg-secondary"
            >
              {l.label}
              {lang === l.code && <Check className="h-4 w-4 text-[#0071e3]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
