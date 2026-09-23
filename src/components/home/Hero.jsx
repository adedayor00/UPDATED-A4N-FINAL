import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SectionLink from "@/components/SectionLink";
import { BUDGETS } from "@/lib/filters";
import CityCombobox from "@/components/CityCombobox";
import { useT } from "@/lib/i18n";

export default function Hero({ counts = {} }) {
  const { t } = useT();
  const navigate = useNavigate();
  const [city, setCity] = useState("all");
  const [type, setType] = useState("all");
  const [max, setMax] = useState("all");

  const search = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city !== "all") p.set("city", city);
    if (type !== "all") p.set("type", type);
    if (max !== "all") p.set("max", max);
    navigate({ pathname: "/", search: p.toString() ? `?${p}` : "" }, { state: { scrollTo: "listings" } });
  };

  return (
    <section className="relative overflow-hidden bg-[#fbfbfd]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[520px] max-w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(0,113,227,0.10),transparent)]"
      />
      <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24">
        {/* Headline kept word-for-word per the brand brief; only the translation changes. */}
        <h1 className="mx-auto max-w-[980px] font-heading text-[40px] font-bold leading-[1.06] tracking-tight sm:text-[64px] sm:leading-[1.05] lg:text-[80px] lg:leading-[1.03]">
          {t("hero.titleA")}{" "}
          <span className="bg-gradient-to-r from-[#0071e3] to-[#5a9be3] bg-clip-text text-transparent">Newark</span>{" "}
          {t("hero.titleB")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] text-[#6e6e73] sm:text-xl">{t("hero.sub")}</p>

        <form
          onSubmit={search}
          role="search"
          className="mx-auto mt-10 grid max-w-[860px] gap-3 rounded-3xl bg-card p-3 text-left card-shadow-lg sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end sm:gap-2 sm:rounded-full sm:p-2 sm:pl-5"
        >
          <div className="space-y-1 sm:space-y-0">
            <Label htmlFor="hero-city" className="px-1 text-[12px] font-semibold text-[#6e6e73] sm:sr-only">
              {t("filters.city")}
            </Label>
            <CityCombobox
              id="hero-city"
              value={city}
              onChange={setCity}
              allLabel={t("filters.allCities")}
              counts={counts}
              triggerClassName="sm:border-0 sm:bg-transparent sm:shadow-none"
            />
          </div>
          <div className="space-y-1 sm:space-y-0 sm:border-l sm:border-border sm:pl-2">
            <Label htmlFor="hero-type" className="px-1 text-[12px] font-semibold text-[#6e6e73] sm:sr-only">
              {t("filters.type")}
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="hero-type" className="sm:border-0 sm:bg-transparent sm:shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.anyType")}</SelectItem>
                <SelectItem value="room">{t("filters.room")}</SelectItem>
                <SelectItem value="unit">{t("filters.unit")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:space-y-0 sm:border-l sm:border-border sm:pl-2">
            <Label htmlFor="hero-max" className="px-1 text-[12px] font-semibold text-[#6e6e73] sm:sr-only">
              {t("filters.budget")}
            </Label>
            <Select value={max} onValueChange={setMax}>
              <SelectTrigger id="hero-max" className="sm:border-0 sm:bg-transparent sm:shadow-none">
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
          </div>
          <Button type="submit" size="lg" className="gap-2 px-7">
            <Search /> {t("hero.search")}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-1">
          <SectionLink
            to="contact"
            className="inline-flex h-11 items-center gap-1 text-[15px] font-medium text-[#0071e3] hover:underline"
          >
            {t("hero.request")} <ChevronRight className="h-4 w-4" />
          </SectionLink>
          <Link
            to="/list-your-place"
            className="inline-flex h-11 items-center gap-1 text-[15px] font-medium text-[#0071e3] hover:underline"
          >
            {t("hero.landlord")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
