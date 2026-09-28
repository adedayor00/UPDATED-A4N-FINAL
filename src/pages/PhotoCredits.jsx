import React from "react";
import { CITY_PHOTOS } from "@/lib/cityPhotos";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

// Credits for the Wikimedia Commons city photos (required by CC BY / CC BY-SA).
// Kept on its own page, linked only from the footer.
export default function PhotoCredits() {
  const { t } = useT();
  useSeo({ title: t("pages.photoCredits"), path: "/photo-credits", noindex: true });
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("pages.photoCredits")}</h1>
      <p className="mt-3 text-[15px] text-[#6e6e73]">{t("pages.photoCreditsText")}</p>
      <ul className="mt-6 space-y-1 text-[14px] text-[#6e6e73]">
        {CITY_PHOTOS.map((p) => (
          <li key={p.city}>
            <a
              href={p.source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center hover:text-[#0071e3] sm:min-h-0 sm:py-1"
            >
              {p.city}: {p.landmark} — {p.author}, {p.license}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
