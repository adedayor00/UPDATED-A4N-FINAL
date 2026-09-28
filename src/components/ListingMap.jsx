import React from "react";
import { MapPin, Navigation } from "lucide-react";
import { mapEmbedUrl, directionsUrl, mapQuery } from "@/lib/mapEmbed";
import { useT } from "@/lib/i18n";

// Free Google map (no API key, no billing). Loads only when scrolled into view.
export default function ListingMap({ property }) {
  const { t } = useT();
  const src = mapEmbedUrl(property);
  if (!src) return null;
  const exact = /^\d/.test(mapQuery(property));
  return (
    <section>
      <h2 className="font-heading text-lg font-semibold">{t("detail.location")}</h2>
      {!exact && <p className="mt-1 text-[14px] text-[#6e6e73]">{t("detail.locationApprox")}</p>}
      <div className="mt-4 overflow-hidden rounded-3xl bg-[#f5f5f7] card-shadow">
        <iframe
          title={t("detail.mapTitle", { place: mapQuery(property) })}
          src={src}
          className="block h-[280px] w-full border-0 sm:h-[340px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <a
        href={directionsUrl(property)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#f5f5f7] px-4 text-[14px] font-medium text-[#0071e3] hover:bg-[#e8e8ed]"
      >
        <Navigation className="h-4 w-4" aria-hidden="true" /> {t("detail.directions")}
      </a>
    </section>
  );
}
