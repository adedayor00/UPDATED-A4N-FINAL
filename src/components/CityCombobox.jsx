import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search, MapPin } from "lucide-react";
import { NJ_TOWNS } from "@/lib/njCities";
import { useT } from "@/lib/i18n";

const norm = (s) =>
  String(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Searchable picker for all 564 New Jersey towns.
 * - `allLabel`: adds an "all" option (value "all") at the top, e.g. "All cities"
 * - `counts`:  { Newark: 9 } shows those towns first with a count ("9 places")
 */
export default function CityCombobox({ id, value, onChange, allLabel, allValue = "all", counts = {}, ariaLabel, className = "", triggerClassName = "" }) {
  const { t } = useT();
  const auto = useId();
  const baseId = id || `city-${auto}`;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const withListings = useMemo(
    () => Object.keys(counts).filter((c) => counts[c] > 0).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b)),
    [counts],
  );

  const options = useMemo(() => {
    const nq = norm(q.trim());
    const match = (town) => !nq || norm(town.name).includes(nq) || norm(`${town.county} county`).includes(nq);
    const items = [];
    if (allLabel && !nq) items.push({ value: allValue, label: allLabel, kind: "all" });
    const top = withListings.map((c) => NJ_TOWNS.find((tw) => tw.name === c) || { name: c, county: "" }).filter(match);
    top.forEach((tw) => items.push({ value: tw.name, label: tw.name, county: tw.county, count: counts[tw.name], kind: "live" }));
    const rest = NJ_TOWNS.filter((tw) => !counts[tw.name] && match(tw));
    // Towns that start with the search text come first.
    if (nq) rest.sort((a, b) => Number(!norm(a.name).startsWith(nq)) - Number(!norm(b.name).startsWith(nq)));
    rest.forEach((tw) => items.push({ value: tw.name, label: tw.name, county: tw.county, kind: "town" }));
    return items;
  }, [q, withListings, counts, allLabel, allValue]);

  const selectedLabel = value === allValue || !value ? allLabel || t("city.pick") : value;

  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    const close = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (v) => {
    onChange(v);
    setOpen(false);
    requestAnimationFrame(() => document.getElementById(baseId)?.focus());
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[active]) choose(options[active].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      document.getElementById(baseId)?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const firstLiveIndex = options.findIndex((o) => o.kind === "live");
  const firstTownIndex = options.findIndex((o) => o.kind === "town");

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${baseId}-list`}
        aria-label={ariaLabel ? `${ariaLabel}: ${selectedLabel}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-white px-3.5 text-left text-[15px] shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm ${triggerClassName}`}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-[260px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-popover card-shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              autoComplete="off"
              aria-label={t("city.searchTowns")}
              aria-controls={`${baseId}-list`}
              aria-activedescendant={options[active] ? `${baseId}-opt-${active}` : undefined}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder={t("city.searchTowns")}
              className="h-11 w-full rounded-xl bg-secondary/70 pl-9 pr-3 text-[16px] outline-none placeholder:text-[#6e6e73] focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            />
          </div>
          <ul ref={listRef} id={`${baseId}-list`} role="listbox" aria-label={ariaLabel || t("filters.city")} className="max-h-[min(55vh,340px)] overflow-y-auto overscroll-contain p-1.5">
            {options.length === 0 && <li className="px-3 py-4 text-center text-[14px] text-[#6e6e73]">{t("city.noTown")}</li>}
            {options.map((o, i) => (
              <React.Fragment key={o.value}>
                {i === firstLiveIndex && (
                  <li role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#6e6e73]">
                    {t("city.withListings")}
                  </li>
                )}
                {i === firstTownIndex && (
                  <li role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#6e6e73]">
                    {t("city.allTowns")}
                  </li>
                )}
                <li
                  id={`${baseId}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o.value)}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[15px] md:text-sm ${
                    i === active ? "bg-secondary" : ""
                  }`}
                >
                  {o.kind === "live" && <MapPin className="h-4 w-4 shrink-0 text-[#0071e3]" aria-hidden="true" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    {o.county && o.kind === "town" && q && <span className="block text-[12px] text-[#6e6e73]">{o.county} County</span>}
                  </span>
                  {o.count > 0 && (
                    <span className="shrink-0 rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0062c4]">
                      {t("city.places", { count: o.count })}
                    </span>
                  )}
                  {o.value === value && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </li>
              </React.Fragment>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
