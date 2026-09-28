import React from "react";
import { Link } from "react-router-dom";
import { Bell, Building2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ListingsBrowser from "@/components/ListingsBrowser";
import { usePublicListings } from "@/hooks/useListings";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

// Full listings board. Filters live in the URL (?city=…&type=…&max=…), so
// searches from the home page and links to filtered views land here.
export default function Listings() {
  const { t } = useT();
  const { listings, loading, error, retry } = usePublicListings();
  useSeo({
    title: "Rooms & Apartments for Rent in New Jersey",
    description:
      "Every room and apartment we have for rent in Newark and across New Jersey. Filter by city, budget and room type. No sign-up, no fees to ask or tour.",
    path: "/listings",
  });

  return (
    <div>
      <PageHeader crumb={t("nav.listings")} title={t("pages.listingsTitle")} sub={t("pages.listingsSub")}>
        <Link
          to="/cities"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f5f5f7] px-4 text-[14px] font-medium hover:bg-[#e8e8ed]"
        >
          <Building2 className="h-4 w-4" /> {t("pages.byCity")}
        </Link>
        <Link
          to="/contact"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f5f5f7] px-4 text-[14px] font-medium hover:bg-[#e8e8ed]"
        >
          <Bell className="h-4 w-4" /> {t("pages.cantFind")}
        </Link>
      </PageHeader>
      <section id="listings" className="scroll-mt-14 bg-[#fbfbfd]">
        <div className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-6">
          <ListingsBrowser listings={listings} loading={loading} error={error} onRetry={retry} />
        </div>
      </section>
    </div>
  );
}
