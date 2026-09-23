import React, { useMemo } from "react";
import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import HowItWorks from "@/components/home/HowItWorks";
import CityTiles from "@/components/home/CityTiles";
import FinalCTA from "@/components/home/FinalCTA";
import ListingsBrowser from "@/components/ListingsBrowser";
import Reveal from "@/components/Reveal";
import { usePublicListings } from "@/hooks/useListings";
import { cityStats } from "@/lib/cityStats";
import { lowestRent, SITE_NAME } from "@/lib/listing";
import { SITE_URL } from "@/lib/site";
import { EMAIL, SMS } from "@/lib/contact";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export default function Home() {
  const { t } = useT();
  const { listings, loading, error, retry } = usePublicListings();
  const stats = useMemo(() => cityStats(listings), [listings]);
  const cities = useMemo(() => Object.keys(stats).sort((a, b) => stats[b].count - stats[a].count), [stats]);
  const counts = useMemo(() => Object.fromEntries(Object.entries(stats).map(([c, s]) => [c, s.count])), [stats]);
  const newest = useMemo(
    () => [...listings].sort((a, b) => String(b.created_date).localeCompare(String(a.created_date))).slice(0, 8),
    [listings],
  );

  useSeo({
    title: "",
    description:
      "Rooms and apartments for rent in Newark, East Orange and across New Jersey. Real rents, rooms that are actually free, no sign-up and no fees to ask or tour.",
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#org`,
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/icon-512.png`,
          email: EMAIL,
          telephone: SMS,
          areaServed: "New Jersey",
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#site`,
          url: SITE_URL,
          name: SITE_NAME,
          publisher: { "@id": `${SITE_URL}/#org` },
        },
      ],
    },
  });

  return (
    <div>
      <Hero counts={counts} />
      <TrustStrip listings={listings.length} cities={cities.length} roomsFrom={lowestRent(listings, "rooms")} />
      <FeaturedCarousel properties={newest} />
      <HowItWorks />
      <CityTiles stats={stats} />

      <section id="listings" className="scroll-mt-14 bg-[#fbfbfd]" aria-labelledby="listings-title">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <h2 id="listings-title" className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {t("listings.title")}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-2 text-[#6e6e73]">{t("listings.sub")}</p>
          </Reveal>
          <ListingsBrowser listings={listings} loading={loading} error={error} onRetry={retry} />
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
