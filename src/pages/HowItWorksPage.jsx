import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/home/HowItWorks";
import { SITE_URL } from "@/lib/site";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

const FAQ_KEYS = ["fee", "account", "voucher", "roomsFree", "fresh", "landlord"];

export default function HowItWorksPage() {
  const { t } = useT();
  const faqs = FAQ_KEYS.map((k) => ({ k, q: t(`faq.${k}Q`), a: t(`faq.${k}A`) }));
  useSeo({
    title: "How It Works",
    description:
      "How renting through Apartments4Newark works: browse, send one short form, and we text or WhatsApp you back. No account and no fees to ask or tour.",
    path: "/how-it-works",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
            { "@type": "ListItem", position: 2, name: "How it works", item: SITE_URL + "/how-it-works" },
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
  });

  return (
    <div>
      <PageHeader crumb={t("nav.how")} title={t("pages.howTitle")} sub={t("pages.howSub")} />
      <HowItWorks bare />

      <section className="bg-[#fbfbfd]" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
          <h2 id="faq-title" className="font-heading text-3xl font-bold tracking-tight">
            {t("faq.title")}
          </h2>
          <div className="mt-8 divide-y divide-border rounded-3xl bg-card card-shadow">
            {faqs.map((f) => (
              <details key={f.k} className="group px-5 sm:px-6">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-heading text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="text-xl font-normal text-[#6e6e73] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-[15px] leading-relaxed text-[#6e6e73]">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              to="/listings"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0071e3] px-6 text-[15px] font-medium text-white hover:bg-[#0062c4]"
            >
              <Search className="h-4 w-4" /> {t("pages.browseNow")}
            </Link>
            <Link
              to="/contact"
              className="inline-flex h-12 items-center gap-1 rounded-full px-4 text-[15px] font-medium text-[#0071e3] hover:underline"
            >
              {t("nav.sendRequest")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
