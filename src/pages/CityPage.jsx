import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import ListingsBrowser from "@/components/ListingsBrowser";
import AlertSignup from "@/components/AlertSignup";
import InquiryForm from "@/components/InquiryForm";
import PageNotFound from "@/pages/PageNotFound";
import { usePublicListings } from "@/hooks/useListings";
import { NJ_CITIES } from "@/lib/njCities";
import { cityFromSlug, cityPath, isRooms, lowestRent } from "@/lib/listing";
import { cityStats } from "@/lib/cityStats";
import { SITE_URL } from "@/lib/site";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

const money = (n) => `$${Number(n).toLocaleString("en-US")}`;

export default function CityPage({ kind = "apartments" }) {
  const { city: slug } = useParams();
  const { t } = useT();
  const city = cityFromSlug(slug, NJ_CITIES);
  const { listings, loading, error, retry } = usePublicListings();
  const rooms = kind === "rooms";

  const inCity = useMemo(
    () => listings.filter((p) => p.city === city && (!rooms || isRooms(p))),
    [listings, city, rooms],
  );
  const stats = useMemo(() => cityStats(listings), [listings]);
  const roomFrom = lowestRent(inCity, "rooms");
  const unitFrom = lowestRent(inCity, "units");
  const otherCities = Object.keys(stats).filter((c) => c !== city);
  const path = city ? cityPath(city, kind) : undefined;

  const h1 = rooms ? t("city.roomsTitle", { city }) : t("city.title", { city });
  const faqs = city
    ? [
        {
          q: t("city.faqRentQ", { city }),
          a:
            roomFrom || unitFrom
              ? [
                  roomFrom ? t("city.faqRentRooms", { amount: money(roomFrom) }) : "",
                  unitFrom ? t("city.faqRentUnits", { amount: money(unitFrom) }) : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              : t("city.faqRentNone", { city }),
        },
        { q: t("city.faqFeeQ"), a: t("city.faqFeeA") },
        { q: t("city.faqVoucherQ"), a: t("city.faqVoucherA") },
        { q: t("city.faqHowQ"), a: t("city.faqHowA") },
      ]
    : [];

  useSeo(
    city
      ? {
          title: rooms ? `Rooms for Rent in ${city}, NJ` : `Apartments & Rooms for Rent in ${city}, NJ`,
          description: inCity.length
            ? `${inCity.length} ${rooms ? "rooms" : "places"} for rent in ${city}, NJ${
                (rooms ? roomFrom : lowestRent(inCity))
                  ? ` from ${money(rooms ? roomFrom : lowestRent(inCity))}/month`
                  : ""
              }. Real rents, updated listings, no sign-up and no fees to ask or tour.`
            : `Looking for a place in ${city}, NJ? Get a text as soon as a room or apartment opens. No sign-up, no fees.`,
          path,
          noindex: !loading && inCity.length === 0,
          jsonLd: {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
                  { "@type": "ListItem", position: 2, name: `${city}, NJ`, item: SITE_URL + path },
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ],
          },
        }
      : { title: "Not found", noindex: true },
  );

  if (!city) return <PageNotFound />;

  return (
    <div>
      <section className="border-b border-border bg-[#fbfbfd]">
        <div className="mx-auto max-w-[1200px] px-5 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-[#6e6e73]">
            <Link to="/" className="inline-flex h-11 items-center hover:text-foreground">
              {t("nav.home")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-current="page">{city}, NJ</span>
          </nav>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">{h1}</h1>
          <p className="mt-4 max-w-2xl text-[17px] text-[#6e6e73]">
            {loading
              ? t("listings.loading")
              : inCity.length
                ? t("city.intro", { count: inCity.length, city })
                : t("city.introEmpty", { city })}
          </p>
          {(roomFrom || unitFrom) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {roomFrom && (
                <span className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[14px]">
                  <span className="block text-[12px] text-[#6e6e73]">{t("city.roomsFrom")}</span>
                  <strong className="font-heading text-lg">{money(roomFrom)}</strong>
                </span>
              )}
              {unitFrom && !rooms && (
                <span className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[14px]">
                  <span className="block text-[12px] text-[#6e6e73]">{t("city.unitsFrom")}</span>
                  <strong className="font-heading text-lg">{money(unitFrom)}</strong>
                </span>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to={cityPath(city)}
              aria-current={!rooms ? "page" : undefined}
              className={`inline-flex h-11 items-center rounded-full px-4 text-[14px] font-medium ${!rooms ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] hover:bg-[#e8e8ed]"}`}
            >
              {t("city.allTab")}
            </Link>
            <Link
              to={cityPath(city, "rooms")}
              aria-current={rooms ? "page" : undefined}
              className={`inline-flex h-11 items-center rounded-full px-4 text-[14px] font-medium ${rooms ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] hover:bg-[#e8e8ed]"}`}
            >
              {t("city.roomsTab")}
            </Link>
          </div>
        </div>
      </section>

      <section id="listings" className="scroll-mt-14">
        <div className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-6">
          <ListingsBrowser
            listings={inCity}
            loading={loading}
            error={error}
            onRetry={retry}
            lockCity={city}
            lockType={rooms ? "room" : undefined}
          />
        </div>
      </section>

      <section className="border-t border-border bg-[#f5f5f7]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">{t("city.faqTitle", { city })}</h2>
            <dl className="mt-6 space-y-5">
              {faqs.map((f) => (
                <div key={f.q}>
                  <dt className="font-heading font-semibold">{f.q}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-[#6e6e73]">{f.a}</dd>
                </div>
              ))}
            </dl>
            {otherCities.length > 0 && (
              <div className="mt-10">
                <h2 className="font-heading text-lg font-semibold">{t("city.other")}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {otherCities.map((c) => (
                    <Link
                      key={c}
                      to={cityPath(c, kind)}
                      className="inline-flex h-11 items-center rounded-full border border-border bg-white px-4 text-[14px] font-medium hover:border-[#0071e3] hover:text-[#0071e3]"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            {/* The empty state already shows an alert form; don't repeat it. */}
            {(loading || inCity.length > 0) && <AlertSignup defaults={{ city, type: rooms ? "room" : "all" }} />}
            <div id="contact" className="scroll-mt-20 rounded-3xl bg-card p-5 card-shadow sm:p-6">
              <h2 className="font-heading text-lg font-semibold">{t("city.askTitle", { city })}</h2>
              <p className="mb-4 mt-1 text-[13px] text-[#6e6e73]">{t("detail.requestSub")}</p>
              <InquiryForm defaultCity={city} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
