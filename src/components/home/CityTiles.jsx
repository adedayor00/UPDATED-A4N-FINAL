import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { cityPath } from "@/lib/listing";
import { useT } from "@/lib/i18n";

// Cities we want a tile for even before they have listings (renters can
// still sign up for alerts there).
export const TARGET_CITIES = ["Newark", "East Orange", "Irvington", "Maplewood", "Jersey City", "Elizabeth"];

export default function CityTiles({ stats = {} }) {
  const { t } = useT();
  const withListings = Object.keys(stats).sort((a, b) => stats[b].count - stats[a].count);
  const cities = [...withListings, ...TARGET_CITIES.filter((c) => !stats[c])].slice(0, 6);

  return (
    <section id="cities" className="scroll-mt-16 bg-[#fbfbfd]" aria-labelledby="cities-title">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <h2 id="cities-title" className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {t("cities.title")}
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-2 text-[#6e6e73]">{t("cities.sub")}</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {cities.map((c, i) => {
            const s = stats[c];
            return (
              <Reveal key={c} delay={i * 60}>
                <Link
                  to={cityPath(c)}
                  className={`group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg sm:aspect-[16/10] sm:p-6 ${
                    s ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
                  }`}
                >
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
                  <span
                    className={`relative self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      s ? "bg-[#0071e3] text-white" : "bg-white text-[#6e6e73]"
                    }`}
                  >
                    {s ? t("cities.live", { count: s.count }) : t("cities.soon")}
                  </span>
                  <div className="relative">
                    <p className="font-heading text-lg font-semibold tracking-tight sm:text-2xl">{c}</p>
                    <p className={`mt-0.5 text-[12px] sm:text-[14px] ${s ? "text-white/70" : "text-[#6e6e73]"}`}>
                      {s?.from
                        ? t("cities.from", { amount: `$${s.from.toLocaleString("en-US")}` })
                        : t("cities.getAlerts")}
                    </p>
                  </div>
                  <ArrowRight
                    className={`absolute bottom-4 right-4 h-4 w-4 transition-transform group-hover:translate-x-1 sm:bottom-6 sm:right-6 ${
                      s ? "text-white/80" : "text-[#6e6e73]"
                    }`}
                  />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
