import React, { useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Sparkles,
  Check,
  Home,
  PawPrint,
  BadgeCheck,
  MapPin,
  Camera,
  EyeOff,
} from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import InquiryForm from "@/components/InquiryForm";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import GalleryLightbox from "@/components/GalleryLightbox";
import ShareButton from "@/components/ShareButton";
import PropertyCard from "@/components/PropertyCard";
import AlertSignup from "@/components/AlertSignup";
import { scrollToSection } from "@/components/SectionLink";
import { usePublicListings } from "@/hooks/useListings";
import {
  cityPath,
  isPubliclyVisible,
  isRooms,
  listingDescription,
  listingPath,
  listingSlug,
  roomsFree,
} from "@/lib/listing";
import { SITE_URL } from "@/lib/site";
import { whatsappUrl } from "@/lib/contact";
import { useListingText } from "@/lib/useListingText";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

function useListing(id) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      try {
        return await api.listings.get(id);
      } catch (e) {
        if (e.status === 404 || e.status === 406) return null;
        throw e;
      }
    },
  });
}

function Unavailable({ property }) {
  const { t } = useT();
  const { listings } = usePublicListings();
  const similar = listings.filter((p) => p.id !== property?.id && (!property || p.city === property.city)).slice(0, 3);
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{t("detail.goneTitle")}</h1>
        <p className="mt-3 text-[#6e6e73]">{t("detail.goneText")}</p>
        <Button asChild className="mt-6">
          <Link to={property ? cityPath(property.city) : "/"}>
            {property ? t("detail.moreIn", { city: property.city }) : t("detail.back")}
          </Link>
        </Button>
      </div>
      {similar.length > 0 && (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
      <div className="mx-auto mt-14 max-w-xl">
        <AlertSignup
          defaults={{ city: property?.city, type: property ? (isRooms(property) ? "room" : "unit") : "all" }}
        />
      </div>
    </div>
  );
}

export default function PropertyDetail() {
  const { id, slug } = useParams();
  const { isAdmin } = useAuth();
  const { t } = useT();
  const text = useListingText();
  const { data: property, isLoading } = useListing(id);
  const { listings } = usePublicListings();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [touchX, setTouchX] = useState(null);

  const visible = property && isPubliclyVisible(property);
  const path = property ? listingPath(property) : undefined;

  const jsonLd = useMemo(() => {
    if (!property || !visible) return null;
    const url = SITE_URL + listingPath(property);
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": isRooms(property) ? "Room" : "Apartment",
          name: property.title,
          description: property.description || listingDescription(property),
          url,
          image: property.photos?.length ? property.photos : undefined,
          numberOfRooms: property.bedrooms,
          numberOfBathroomsTotal: property.bathrooms,
          petsAllowed: property.pets === "yes" ? true : property.pets === "no" ? false : undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: property.city,
            addressRegion: "NJ",
            addressCountry: "US",
          },
          offers: property.rent
            ? {
                "@type": "Offer",
                price: property.rent,
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: property.rent,
                  priceCurrency: "USD",
                  unitCode: "MON",
                },
              }
            : undefined,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
            {
              "@type": "ListItem",
              position: 2,
              name: `${property.city}, NJ`,
              item: SITE_URL + cityPath(property.city),
            },
            { "@type": "ListItem", position: 3, name: property.title, item: url },
          ],
        },
      ],
    };
  }, [property, visible]);

  useSeo(
    property && visible
      ? {
          title: `${property.title}, ${property.city} NJ — ${text.price(property).amount}${
            text.price(property).per ? ` / ${isRooms(property) ? "room" : "mo"}` : ""
          }`,
          description: listingDescription(property),
          path,
          image: property.photos?.[0],
          jsonLd,
        }
      : { title: t("detail.goneTitle"), noindex: true },
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-6" role="status" aria-label={t("listings.loading")}>
        <div className="aspect-[16/9] animate-pulse rounded-[24px] bg-secondary" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded-lg bg-secondary" />
        <div className="mt-3 h-5 w-1/3 animate-pulse rounded-lg bg-secondary" />
      </div>
    );
  }

  if (!property || (!visible && !isAdmin))
    return <Unavailable property={property && property.status === "published" ? property : null} />;

  // Old or mistyped slug → send to the canonical URL.
  if (slug !== listingSlug(property)) return <Navigate to={listingPath(property)} replace />;

  const photos = property.photos || [];
  const price = text.price(property);
  const listingUrl = SITE_URL + listingPath(property);
  const similar = listings.filter((p) => p.id !== property.id && p.city === property.city).slice(0, 3);

  const facts = [
    { icon: BedDouble, label: t("detail.beds", { count: property.bedrooms }) },
    { icon: Bath, label: t("detail.baths", { count: property.bathrooms }) },
    { icon: Home, label: text.type(property) },
    {
      icon: PawPrint,
      label:
        property.pets === "yes"
          ? t("detail.petsYes")
          : property.pets === "no"
            ? t("detail.petsNo")
            : t("detail.petsAsk"),
    },
    property.accepts_vouchers
      ? { icon: BadgeCheck, label: t("detail.vouchersYes"), strong: true }
      : { icon: MapPin, label: property.neighborhood ? `${property.neighborhood}, ${property.city}` : property.city },
  ];

  const onSwipe = (e) => {
    if (touchX === null || photos.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) setActive((a) => (a + (dx < 0 ? 1 : -1) + photos.length) % photos.length);
    setTouchX(null);
  };

  const askPhotosUrl = whatsappUrl(t("detail.askPhotosMsg", { title: property.title, url: listingUrl }));

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-28 pt-4 sm:px-6 lg:pb-16">
      {!visible && isAdmin && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
          <EyeOff className="h-4 w-4 shrink-0" />
          Preview only — this listing is hidden from the public (
          {property.status !== "published" ? "pending approval" : "expired or fully taken"}).
        </div>
      )}

      <nav aria-label="Breadcrumb" className="mb-4 flex min-w-0 items-center gap-1 text-[13px] text-[#6e6e73]">
        <Link to="/" className="inline-flex h-11 items-center gap-1.5 rounded-full pr-2 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={cityPath(property.city)}
          className="inline-flex h-11 items-center truncate px-1 hover:text-foreground"
        >
          {property.city}
        </Link>
      </nav>

      {/* Gallery */}
      {photos.length > 0 ? (
        <div className={`grid gap-3 lg:gap-4 ${photos.length > 1 ? "lg:grid-cols-[120px_1fr]" : ""}`}>
          {photos.length > 1 && (
            <div className="no-scrollbar order-2 flex gap-3 overflow-x-auto lg:order-1 lg:max-h-[620px] lg:flex-col lg:overflow-y-auto">
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={t("detail.photoN", { n: i + 1, total: photos.length })}
                  aria-current={active === i}
                  className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl lg:h-24 lg:w-full ${
                    active === i ? "ring-2 ring-[#0071e3]" : "ring-1 ring-border"
                  }`}
                >
                  <Image src={p} alt="" className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setLightbox(true)}
            onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
            onTouchEnd={onSwipe}
            className="relative order-1 aspect-[4/3] overflow-hidden rounded-[24px] bg-[#f5f5f7] card-shadow sm:aspect-[16/10] lg:order-2 lg:aspect-[16/9]"
            aria-label={t("detail.openGallery")}
          >
            <Image
              src={photos[active]}
              alt={t("cards.photoAlt", { title: property.title, city: property.city })}
              className="h-full w-full"
            />
            {photos.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[12px] font-medium text-white">
                {active + 1} / {photos.length}
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] card-shadow sm:aspect-[21/8]">
          <PhotoPlaceholder size="large" label={t("detail.photosSoon")} />
          <a
            href={askPhotosUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 left-1/2 inline-flex h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#1d1d1f] px-5 text-[14px] font-medium text-white hover:bg-black"
          >
            <Camera className="h-4 w-4" /> {t("detail.askPhotos")}
          </a>
        </div>
      )}
      <GalleryLightbox
        photos={photos}
        open={lightbox}
        index={active}
        onClose={() => setLightbox(false)}
        onIndex={setActive}
        title={property.title}
      />

      {/* Header */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0071e3]/10 px-2.5 py-1 text-[12px] font-semibold text-[#0062c4]">
              <Sparkles className="h-3.5 w-3.5" /> {text.badge(property)}
            </span>
            <span className="text-[13px] text-[#6e6e73]">
              {property.city}
              {property.neighborhood ? ` · ${property.neighborhood}` : ""}
            </span>
          </div>
          <h1 className="mt-3 break-words font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {property.title}
          </h1>
          {property.address && property.address !== property.title && (
            <p className="mt-1.5 text-[#6e6e73]">{property.address}</p>
          )}
        </div>
        <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
          <div className="text-left sm:text-right">
            <p className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{price.amount}</p>
            {price.perLong && <p className="text-[13px] text-[#6e6e73]">{price.perLong}</p>}
          </div>
          <ShareButton url={listingUrl} title={`${property.title} — ${property.city}, NJ`} />
        </div>
      </div>

      {/* Key facts */}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {facts.map((f, i) => (
          <li
            key={i}
            className={`rounded-2xl p-4 ${f.strong ? "bg-[#0071e3]/[0.07]" : "bg-[#f5f5f7]"} ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <f.icon className="h-5 w-5 text-[#0071e3]" strokeWidth={1.75} aria-hidden="true" />
            <p className="mt-2 text-[13px] font-medium">{f.label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("detail.utilities"), value: property.utilities || t("detail.ask") },
              { label: t("detail.deposit"), value: property.deposit || t("detail.ask") },
              { label: t("detail.available"), value: property.availability || t("detail.ask") },
              { label: t("detail.updated"), value: text.freshShort(property) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card p-4 card-shadow">
                <dt className="text-[11px] uppercase tracking-wide text-[#6e6e73]">{s.label}</dt>
                <dd className="mt-1 break-words font-heading font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>

          {property.description && (
            <section>
              <h2 className="font-heading text-lg font-semibold">{t("detail.about")}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-[#6e6e73]">{property.description}</p>
            </section>
          )}

          {property.rooms?.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold">{t("detail.rooms")}</h2>
              <p className="mt-1 text-[14px] text-[#6e6e73]">
                {t("detail.roomsFreeOf", { free: roomsFree(property), total: property.rooms.length })}
              </p>
              <ul className="mt-4 space-y-2.5">
                {property.rooms.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 card-shadow">
                    <div className="min-w-0">
                      <p className="font-medium">{r.name || t("detail.roomN", { n: i + 1 })}</p>
                      {r.type && <p className="text-[12px] text-[#6e6e73]">{r.type}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {r.status === "free" && r.price ? (
                        <span className="font-semibold">${Number(r.price).toLocaleString("en-US")}</span>
                      ) : null}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          r.status === "free" ? "bg-[#0071e3]/10 text-[#0062c4]" : "bg-muted text-[#6e6e73]"
                        }`}
                      >
                        {r.status === "free" ? (
                          <>
                            <Check className="h-3 w-3" /> {t("detail.free")}
                          </>
                        ) : (
                          t("detail.taken")
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl bg-[#f5f5f7] p-5 text-[14px] leading-relaxed text-[#6e6e73]">
            <h2 className="font-heading text-[15px] font-semibold text-foreground">{t("detail.goodToKnow")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{t("detail.know1")}</li>
              <li>{t("detail.know2")}</li>
              {property.pets === "no" && <li>{t("detail.serviceAnimals")}</li>}
            </ul>
          </section>
        </div>

        {/* Inquiry panel (sticky on desktop) */}
        <div id="request" className="scroll-mt-20 lg:pt-2">
          <div className="rounded-3xl bg-card p-5 card-shadow-lg sm:p-6 lg:sticky lg:top-20">
            <h2 className="font-heading text-lg font-semibold">{t("detail.requestTitle")}</h2>
            <p className="mt-1 text-[13px] text-[#6e6e73]">{t("detail.requestSub")}</p>
            <div className="mt-4">
              <InquiryForm property={property} />
            </div>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16" aria-labelledby="similar-title">
          <h2 id="similar-title" className="font-heading text-2xl font-bold tracking-tight">
            {t("detail.moreIn", { city: property.city })}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] glass lg:hidden">
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold leading-none tracking-tight">{price.amount}</p>
          {price.perLong && <p className="mt-1 text-[11px] text-[#6e6e73]">{price.perLong}</p>}
        </div>
        <Button className="h-11 px-6" onClick={() => scrollToSection("request")}>
          {t("detail.inquire")}
        </Button>
      </div>
    </div>
  );
}
