import React from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { useT } from "@/lib/i18n";

function Stat({ value, prefix = "", label }) {
  const [v, ref] = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {prefix}
        {v.toLocaleString("en-US")}
      </p>
      <p className="mt-2 text-sm text-[#6e6e73]">{label}</p>
    </div>
  );
}

// "$650 / $1,800" — lowest room rent and lowest whole-apartment rent side by side.
function PriceStat({ rooms, units, label }) {
  const [r, rRef] = useCountUp(rooms || 0);
  const [u, uRef] = useCountUp(units || 0);
  const fmt = (n) => "$" + n.toLocaleString("en-US");
  return (
    <div className="text-center">
      <p className="whitespace-nowrap font-heading text-[26px] font-bold tracking-tight sm:text-5xl">
        {rooms ? <span ref={rRef}>{fmt(r)}</span> : null}
        {rooms && units ? <span className="mx-1 font-normal text-[#6e6e73] sm:mx-2">/</span> : null}
        {units ? <span ref={uRef}>{fmt(u)}</span> : null}
      </p>
      <p className="mt-2 text-sm text-[#6e6e73]">{label}</p>
    </div>
  );
}

export default function TrustStrip({ listings, cities, roomsFrom, unitsFrom }) {
  const { t } = useT();
  return (
    <section className="border-y border-border bg-[#fbfbfd]" aria-label={t("trust.label")}>
      <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <Stat value={listings} label={t("trust.live")} />
          <Stat value={cities} label={t("trust.cities")} />
          {roomsFrom || unitsFrom ? (
            <PriceStat
              rooms={roomsFrom}
              units={unitsFrom}
              label={
                roomsFrom && unitsFrom
                  ? t("trust.bothFrom")
                  : roomsFrom
                    ? t("trust.roomsFrom")
                    : t("trust.unitsFrom")
              }
            />
          ) : (
            <Stat value={0} prefix="$" label={t("trust.fees")} />
          )}
          <Stat value={0} prefix="$" label={roomsFrom || unitsFrom ? t("trust.fees") : t("trust.toTour")} />
        </div>
      </div>
    </section>
  );
}
