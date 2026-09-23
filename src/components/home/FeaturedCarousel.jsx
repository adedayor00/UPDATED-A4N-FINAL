import React, { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";
import { useT } from "@/lib/i18n";

export default function FeaturedCarousel({ properties, title, subtitle }) {
  const { t } = useT();
  const ref = useRef(null);
  if (!properties.length) return null;
  const scroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <section className="bg-[#fbfbfd]" aria-labelledby="featured-title">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Reveal>
              <h2 id="featured-title" className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {title || t("featured.title")}
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-2 text-[#6e6e73]">{subtitle || t("featured.sub")}</p>
            </Reveal>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => scroll(-1)}
              aria-label={t("featured.prev")}
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label={t("featured.next")}
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card hover:bg-secondary"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="relative -mx-5 mt-8 overflow-hidden sm:mx-0">
          <div
            ref={ref}
            className="no-scrollbar relative flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-3 pt-1 sm:scroll-px-0 sm:px-0"
          >
            {properties.map((p) => (
              <div key={p.id} className="w-[280px] shrink-0 snap-start sm:w-[340px]">
                <PropertyCard property={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
