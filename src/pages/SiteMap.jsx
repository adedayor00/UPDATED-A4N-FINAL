import React from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Info, MessageCircle } from "lucide-react";
import { usePublicListings } from "@/hooks/useListings";
import { cityPath, listingPath } from "@/lib/listing";
import { EMAIL, whatsappUrl } from "@/lib/contact";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export default function SiteMap() {
  const { t } = useT();
  useSeo({ title: "Site Map", description: "Every page on Apartments4Newark.", path: "/sitemap" });
  const { listings } = usePublicListings();
  const cities = Array.from(new Set(listings.map((p) => p.city))).sort();
  const groups = [
    {
      title: t("sitemap.browse"),
      icon: LayoutGrid,
      links: [
        { label: t("sitemap.all"), to: "/" },
        ...cities.map((c) => ({ label: t("footer.apartmentsIn", { city: c }), to: cityPath(c) })),
        ...listings.map((p) => ({ label: `${p.title} — ${p.city}`, to: listingPath(p) })),
      ],
    },
    {
      title: t("sitemap.about"),
      icon: Info,
      links: [
        { label: t("footer.about"), to: "/about" },
        { label: t("nav.listYourPlace"), to: "/list-your-place" },
        { label: t("footer.areas"), to: "/keywords" },
        { label: t("footer.privacy"), to: "/privacy" },
      ],
    },
    {
      title: t("sitemap.contact"),
      icon: MessageCircle,
      links: [
        { label: "WhatsApp", href: whatsappUrl() },
        { label: EMAIL, href: `mailto:${EMAIL}` },
        { label: t("footer.manager"), to: "/login" },
      ],
    },
  ];
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("sitemap.title")}</h1>
      <div className="mt-8 space-y-6">
        {groups.map((g) => (
          <section key={g.title} className="rounded-3xl bg-card p-6 card-shadow">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <g.icon className="h-4 w-4 text-[#0071e3]" /> {g.title}
            </h2>
            <ul className="mt-3 divide-y divide-border">
              {g.links.map((l) => (
                <li key={l.label + (l.to || l.href)}>
                  {l.to ? (
                    <Link
                      to={l.to}
                      className="flex min-h-[44px] items-center justify-between gap-3 text-sm hover:text-[#0071e3]"
                    >
                      <span className="min-w-0 truncate">{l.label}</span>
                      <span className="text-[#6e6e73]" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-[44px] items-center justify-between gap-3 text-sm hover:text-[#0071e3]"
                    >
                      <span className="min-w-0 truncate">{l.label}</span>
                      <span className="text-[#6e6e73]" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
