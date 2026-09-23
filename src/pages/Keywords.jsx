import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tag, MapPin, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicListings } from "@/hooks/useListings";
import { cityPath } from "@/lib/listing";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

const chip =
  "inline-flex h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-[#0071e3] hover:text-[#0071e3]";

export default function Keywords() {
  const { t } = useT();
  useSeo({
    title: "Search by Area",
    description: "Browse rentals by New Jersey city or neighborhood.",
    path: "/keywords",
  });
  const { listings, loading } = usePublicListings();
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const cities = useMemo(() => Array.from(new Set(listings.map((p) => p.city).filter(Boolean))).sort(), [listings]);
  const areas = useMemo(
    () => Array.from(new Set(listings.map((p) => p.neighborhood).filter(Boolean))).sort(),
    [listings],
  );

  const submit = (e) => {
    e.preventDefault();
    if (term.trim()) navigate(`/?q=${encodeURIComponent(term.trim())}`, { state: { scrollTo: "listings" } });
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("areas.title")}</h1>
      <p className="mt-3 max-w-2xl text-[#6e6e73]">{t("areas.sub")}</p>
      <form onSubmit={submit} role="search" className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
          <Input
            type="search"
            aria-label={t("filters.search")}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t("areas.placeholder")}
            className="pl-10"
          />
        </div>
        <Button type="submit" className="gap-2">
          <Search /> <span className="hidden sm:inline">{t("filters.search")}</span>
        </Button>
      </form>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <MapPin className="h-4 w-4 text-[#0071e3]" /> {t("areas.byCity")}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {cities.map((c) => (
                <Link key={c} to={cityPath(c)} className={chip}>
                  {c}
                </Link>
              ))}
            </div>
          </section>
          {areas.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
                <Tag className="h-4 w-4 text-[#0071e3]" /> {t("areas.byArea")}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {areas.map((n) => (
                  <Link key={n} to={`/?q=${encodeURIComponent(n)}`} state={{ scrollTo: "listings" }} className={chip}>
                    {n}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
