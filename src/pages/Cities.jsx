import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import AlertSignup from "@/components/AlertSignup";
import { CityTile, TARGET_CITIES } from "@/components/home/CityTiles";
import { usePublicListings } from "@/hooks/useListings";
import { cityStats } from "@/lib/cityStats";
import { SITE_URL } from "@/lib/site";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export default function Cities() {
  const { t } = useT();
  const { listings, loading } = usePublicListings();
  const stats = useMemo(() => cityStats(listings), [listings]);
  const live = Object.keys(stats).sort((a, b) => stats[b].count - stats[a].count);
  const soon = TARGET_CITIES.filter((c) => !stats[c]);

  useSeo({
    title: "Cities We Cover in New Jersey",
    description:
      "Rooms and apartments for rent city by city: Newark, East Orange, Irvington, Elizabeth, Jersey City and more across New Jersey.",
    path: "/cities",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
        { "@type": "ListItem", position: 2, name: "Cities", item: SITE_URL + "/cities" },
      ],
    },
  });

  return (
    <div>
      <PageHeader crumb={t("nav.cities")} title={t("pages.citiesTitle")} sub={t("pages.citiesSub")} />

      <section className="bg-[#fbfbfd]" aria-labelledby="live-title">
        <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-6 sm:py-16">
          <h2 id="live-title" className="font-heading text-2xl font-bold tracking-tight">
            {t("pages.citiesLive")}
          </h2>
          {loading && live.length === 0 ? (
            <p className="mt-4 text-[#6e6e73]">{t("listings.loading")}</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {live.map((c, i) => (
                <Reveal key={c} delay={Math.min(i, 6) * 50}>
                  <CityTile city={c} stats={stats[c]} />
                </Reveal>
              ))}
            </div>
          )}

          {soon.length > 0 && (
            <>
              <h2 className="mt-14 font-heading text-2xl font-bold tracking-tight">{t("pages.citiesSoon")}</h2>
              <p className="mt-2 text-[#6e6e73]">{t("pages.citiesSoonSub")}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {soon.map((c) => (
                  <CityTile key={c} city={c} />
                ))}
              </div>
            </>
          )}

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-[#f5f5f7] p-6 sm:p-8">
              <h2 className="font-heading text-xl font-semibold">{t("pages.otherTown")}</h2>
              <p className="mt-2 text-[15px] text-[#6e6e73]">{t("pages.otherTownSub")}</p>
              <Link
                to="/keywords"
                className="mt-4 inline-flex h-11 items-center gap-1 text-[15px] font-medium text-[#0062c4] hover:underline"
              >
                {t("footer.areas")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <AlertSignup defaults={{ city: "Newark", type: "all" }} />
          </div>
        </div>
      </section>

    </div>
  );
}
