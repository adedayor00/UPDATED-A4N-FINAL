import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Building2 } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";
import AlertSignup from "@/components/AlertSignup";
import CityCombobox from "@/components/CityCombobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { BUDGETS, BED_OPTIONS, activeCount, applyFilters, readFilters } from "@/lib/filters";

function Toggle({ checked, onChange, children }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors ${
        checked
          ? "border-[#0071e3] bg-[#0071e3]/10 text-[#0062c4]"
          : "border-border bg-white text-[#1d1d1f] hover:bg-secondary"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${checked ? "bg-[#0071e3]" : "bg-[#d2d2d7]"}`} />
      {children}
    </button>
  );
}

export default function ListingsBrowser({
  listings,
  loading,
  error,
  onRetry,
  lockCity,
  lockType,
}) {
  const { t } = useT();
  const [params, setParams] = useSearchParams();
  const f = readFilters(params);
  if (lockCity) f.city = lockCity;
  if (lockType) f.type = lockType;
  const [query, setQuery] = useState(f.q);
  const [sheet, setSheet] = useState(false);

  // Keep the search box in sync if the URL changes (e.g. hero search, back button).
  useEffect(() => setQuery(f.q), [f.q]);

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    const empty = value === "all" || value === "" || value === false || value === "newest" || value == null;
    if (empty) next.delete(key);
    else next.set(key, value === true ? "1" : String(value));
    setParams(next, { replace: true, preventScrollReset: true });
  };

  // Debounce typing into the URL.
  useEffect(() => {
    if (query === f.q) return;
    const id = setTimeout(() => set("q", query.trim() ? query : ""), 250);
    return () => clearTimeout(id);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    const next = new URLSearchParams();
    const lang = params.get("lang");
    if (lang) next.set("lang", lang);
    setParams(next, { replace: true, preventScrollReset: true });
    setQuery("");
  };

  const cityCounts = useMemo(() => {
    const counts = {};
    listings.forEach((p) => (counts[p.city] = (counts[p.city] || 0) + 1));
    return counts;
  }, [listings]);

  const results = useMemo(() => applyFilters(listings, f), [listings, params, lockCity, lockType]); // eslint-disable-line react-hooks/exhaustive-deps
  const extra = activeCount(f, { lockCity, lockType });

  const citySelect = (inSheet) =>
    !lockCity && (
      <CityCombobox
        id={inSheet ? "filter-city-sheet" : "filter-city"}
        value={f.city}
        onChange={(v) => set("city", v)}
        allLabel={t("filters.allCities")}
        counts={cityCounts}
        ariaLabel={t("filters.city")}
        className={inSheet ? "" : "lg:w-[180px]"}
        triggerClassName="rounded-full bg-secondary/60"
      />
    );
  const typeSelect = !lockType && (
    <Select value={f.type} onValueChange={(v) => set("type", v)}>
      <SelectTrigger aria-label={t("filters.type")} className="rounded-full bg-secondary/60 lg:w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("filters.anyType")}</SelectItem>
        <SelectItem value="room">{t("filters.room")}</SelectItem>
        <SelectItem value="unit">{t("filters.unit")}</SelectItem>
      </SelectContent>
    </Select>
  );
  const budgetSelect = (
    <Select value={f.max} onValueChange={(v) => set("max", v)}>
      <SelectTrigger aria-label={t("filters.budget")} className="rounded-full bg-secondary/60 lg:w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("filters.anyBudget")}</SelectItem>
        {BUDGETS.map((b) => (
          <SelectItem key={b} value={String(b)}>
            {t("filters.upTo", { amount: `$${b.toLocaleString("en-US")}` })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const bedsSelect = (
    <Select value={f.beds} onValueChange={(v) => set("beds", v)}>
      <SelectTrigger aria-label={t("filters.beds")} className="rounded-full bg-secondary/60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("filters.anyBeds")}</SelectItem>
        {BED_OPTIONS.map((b) => (
          <SelectItem key={b} value={String(b)}>
            {t("filters.bedsPlus", { count: b })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const sortSelect = (
    <Select value={f.sort} onValueChange={(v) => set("sort", v)}>
      <SelectTrigger aria-label={t("filters.sort")} className="rounded-full bg-secondary/60 lg:w-[170px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">{t("filters.newest")}</SelectItem>
        <SelectItem value="rent_asc">{t("filters.rentAsc")}</SelectItem>
        <SelectItem value="rent_desc">{t("filters.rentDesc")}</SelectItem>
        <SelectItem value="rooms_free">{t("filters.roomsFree")}</SelectItem>
      </SelectContent>
    </Select>
  );

  const chips = [];
  if (!lockCity && f.city !== "all") chips.push({ key: "city", label: f.city });
  if (!lockType && f.type !== "all")
    chips.push({ key: "type", label: f.type === "room" ? t("filters.room") : t("filters.unit") });
  if (f.max !== "all")
    chips.push({ key: "max", label: t("filters.upTo", { amount: `$${Number(f.max).toLocaleString("en-US")}` }) });
  if (f.beds !== "all") chips.push({ key: "beds", label: t("filters.bedsPlus", { count: Number(f.beds) }) });
  if (f.vouchers) chips.push({ key: "vouchers", label: t("filters.vouchers") });
  if (f.pets) chips.push({ key: "pets", label: t("filters.pets") });
  if (f.q) chips.push({ key: "q", label: `“${f.q}”` });

  return (
    <div>
      {/* Filter bar — sticky under the 52px nav */}
      <div className="sticky top-[52px] z-30 -mx-5 mb-4 mt-6 border-y border-border px-5 py-3 glass sm:mx-0 sm:rounded-full sm:border sm:px-3 sm:py-2">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              aria-label={t("filters.search")}
              className="rounded-full border-border bg-secondary/60 pl-10"
            />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            {citySelect(false)}
            {typeSelect}
            {budgetSelect}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSheet(true)}
            className="shrink-0 gap-2 px-4"
            aria-label={extra ? `${t("filters.filters")} (${extra})` : t("filters.filters")}
          >
            <SlidersHorizontal />
            <span className="hidden sm:inline">{t("filters.filters")}</span>
            {extra > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#0071e3] px-1 text-[11px] font-semibold text-white">
                {extra}
              </span>
            )}
          </Button>
          <div className="hidden lg:block">{sortSelect}</div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => (c.key === "q" ? setQuery("") : set(c.key, "all"))}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0071e3]/10 px-3 text-[13px] font-medium text-[#0062c4] hover:bg-[#0071e3]/15"
              aria-label={t("filters.remove", { label: c.label })}
            >
              {c.label} <X className="h-3.5 w-3.5" />
            </button>
          ))}
          <button
            onClick={reset}
            className="inline-flex h-9 items-center px-2 text-[13px] font-medium text-[#6e6e73] hover:text-foreground"
          >
            {t("filters.clearAll")}
          </button>
        </div>
      )}

      <div className="mb-6 flex items-end justify-between">
        <h3 className="font-heading text-lg font-semibold" aria-live="polite">
          {loading ? t("listings.loading") : t("listings.count", { count: results.length })}
        </h3>
      </div>

      {error && !loading && !listings.length ? (
        <div role="alert" className="flex flex-col items-center rounded-3xl bg-[#f5f5f7] px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold">{t("listings.errorTitle")}</p>
          <p className="mt-1 max-w-sm text-sm text-[#6e6e73]">{t("listings.errorText")}</p>
          {onRetry && (
            <Button variant="outline" className="mt-5" onClick={() => onRetry()}>
              {t("listings.retry")}
            </Button>
          )}
        </div>
      ) : loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-3xl bg-secondary/50" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#f5f5f7] px-6 py-16 text-center">
            <Building2 className="h-10 w-10 text-[#86868b]/40" />
            <p className="mt-4 font-heading text-lg font-semibold">{t("listings.emptyTitle")}</p>
            <p className="mt-1 max-w-sm text-sm text-[#6e6e73]">{t("listings.emptyText")}</p>
            {chips.length > 0 && (
              <Button variant="outline" className="mt-5" onClick={reset}>
                {t("filters.clearAll")}
              </Button>
            )}
          </div>
          <AlertSignup defaults={{ city: f.city !== "all" ? f.city : lockCity, type: f.type, max: f.max }} />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80} className="h-full">
              <PropertyCard property={p} />
            </Reveal>
          ))}
        </div>
      )}

      <Dialog open={sheet} onOpenChange={setSheet}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("filters.filters")}</DialogTitle>
            <DialogDescription>{t("filters.sheetHint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!lockCity && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t("filters.city")}</p>
                {citySelect(true)}
              </div>
            )}
            {!lockType && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t("filters.type")}</p>
                {typeSelect}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t("filters.budget")}</p>
                {budgetSelect}
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t("filters.beds")}</p>
                {bedsSelect}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("filters.sort")}</p>
              {sortSelect}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Toggle checked={f.vouchers} onChange={(v) => set("vouchers", v)}>
                {t("filters.vouchers")}
              </Toggle>
              <Toggle checked={f.pets} onChange={(v) => set("pets", v)}>
                {t("filters.pets")}
              </Toggle>
            </div>
            <p className="text-[12px] leading-relaxed text-[#6e6e73]">{t("filters.voucherNote")}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={reset} className="flex-1">
              {t("filters.clearAll")}
            </Button>
            <Button onClick={() => setSheet(false)} className="flex-1">
              {t("filters.show", { count: results.length })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
