import React from "react";
import { Link } from "react-router-dom";
import { BedDouble, Bath, ChevronRight, BadgeCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { listingPath } from "@/lib/listing";
import { useListingText } from "@/lib/useListingText";
import { useT } from "@/lib/i18n";

export default function PropertyCard({ property }) {
  const { t } = useT();
  const text = useListingText();
  const photo = property.photos?.[0];
  const price = text.price(property);

  return (
    <Link
      to={listingPath(property)}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card card-shadow transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f5f7] sm:aspect-[4/3]">
        {photo ? (
          <Image
            src={photo}
            alt={t("cards.photoAlt", { title: property.title, city: property.city })}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <PhotoPlaceholder />
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#0071e3] backdrop-blur">
          {text.badge(property)}
        </span>
        {property.accepts_vouchers && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1d1d1f] backdrop-blur">
            <BadgeCheck className="h-3.5 w-3.5 text-[#0071e3]" /> {t("cards.vouchers")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-[12px] font-medium uppercase tracking-wide text-[#6e6e73]">
          {property.city}
          {property.neighborhood ? ` · ${property.neighborhood}` : ""}
        </p>
        <h3 className="mt-0.5 truncate font-heading text-[16px] font-semibold tracking-tight">{property.title}</h3>
        <p className="mt-3 font-heading text-xl font-bold tracking-tight">
          {price.amount}
          {price.per && <span className="ml-1 text-[12px] font-normal text-[#6e6e73]">/ {price.per}</span>}
        </p>
        <div className="mt-auto flex items-center gap-4 border-t border-border pt-3 text-[13px] text-[#6e6e73]">
          <span className="flex items-center gap-1.5" title={t("cards.beds")}>
            <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{t("cards.beds")}:</span> {property.bedrooms}
          </span>
          <span className="flex items-center gap-1.5" title={t("cards.baths")}>
            <Bath className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{t("cards.baths")}:</span> {property.bathrooms}
          </span>
          <span className="hidden text-[12px] sm:inline">{text.fresh(property)}</span>
          <span className="ml-auto flex items-center gap-1 text-foreground/70 group-hover:text-[#0071e3]">
            {t("cards.view")} <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
