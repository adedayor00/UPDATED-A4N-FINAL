import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { cityPath } from "@/lib/listing";
import { cityPhoto } from "@/lib/cityPhotos";
import { useT } from "@/lib/i18n";

// Cities we want a tile for even before they have listings (renters can
// still sign up for alerts there).
export const TARGET_CITIES = ["Newark", "East Orange", "Irvington", "Maplewood", "Jersey City", "Elizabeth"];

// One city card: landmark photo when we have one, otherwise the skyline drawing.
export function CityTile({ city: c, stats: s }) {
  const { t } = useT();
  const photo = cityPhoto(c);
  const dark = Boolean(s || photo);
  return (
    <Link
      to={cityPath(c)}
      className={`group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg sm:aspect-[16/10] sm:p-6 ${
        dark ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
      }`}
    >
      {photo ? (
        <>
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="(min-width: 640px) 380px, 50vw"
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        </>
      ) : (
        <svg
          viewBox="0 0 200 80"
          aria-hidden="true"
          className={`absolute -bottom-1 right-0 w-[85%] ${s ? "text-white/[0.07]" : "text-[#1d1d1f]/[0.05]"}`}
        >
          <path
            fill="currentColor"
            d="M0 80V52h14V38h10v14h8V26h16v26h6V44h12v36zm70 0V30l14-12 14 12v50zm32 0V46h10V20h18v26h8v34zm40 0V36h12V24h8v12h10v44zm32 0V50h26v30z"
          />
        </svg>
      )}
      <span
        className={`relative self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          s ? "bg-[#0071e3] text-white" : dark ? "bg-white/90 text-[#1d1d1f]" : "bg-white text-[#6e6e73]"
        }`}
      >
        {s ? t("cities.live", { count: s.count }) : t("cities.soon")}
      </span>
      <div className="relative pr-6">
        <p className="font-heading text-lg font-semibold tracking-tight sm:text-2xl">{c}</p>
        <p className={`mt-0.5 text-[12px] sm:text-[14px] ${dark ? "text-white/80" : "text-[#6e6e73]"}`}>
          {s?.from ? t("cities.from", { amount: `$${s.from.toLocaleString("en-US")}` }) : t("cities.getAlerts")}
        </p>
        {photo && <p className="mt-1 hidden truncate text-[11px] text-white/60 sm:block">{photo.landmark}</p>}
      </div>
      <ArrowRight
        className={`absolute bottom-4 right-4 h-4 w-4 transition-transform group-hover:translate-x-1 sm:bottom-6 sm:right-6 ${
          dark ? "text-white/80" : "text-[#6e6e73]"
        }`}
      />
    </Link>
  );
}

export default function CityTiles({ stats = {} }) {
  const { t } = useT();
  const withListings = Object.keys(stats).sort((a, b) => stats[b].count - stats[a].count);
  const cities = [...withListings, ...TARGET_CITIES.filter((c) => !stats[c])].slice(0, 6);
  const more = new Set([...withListings, ...TARGET_CITIES]).size > cities.length;

  return (
    <section id="cities" className="scroll-mt-16 bg-[#fbfbfd]" aria-labelledby="cities-title">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Reveal>
              <h2 id="cities-title" className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {t("cities.title")}
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-2 text-[#6e6e73]">{t("cities.sub")}</p>
            </Reveal>
          </div>
          <Link
            to="/cities"
            className="inline-flex h-11 items-center gap-1 text-[15px] font-medium text-[#0071e3] hover:underline"
          >
            {more ? t("pages.allCities") : t("pages.aboutCities")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {cities.map((c, i) => (
            <Reveal key={c} delay={i * 60}>
              <CityTile city={c} stats={stats[c]} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
