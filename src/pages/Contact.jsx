import React from "react";
import { MessageCircle, Phone, Mail, Send, Instagram } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import InquiryForm from "@/components/InquiryForm";
import {
  EMAIL,
  INSTAGRAM_USERNAME,
  PHONE_DISPLAY,
  SMS,
  TELEGRAM_USERNAME,
  instagramUrl,
  telegramUrl,
  whatsappUrl,
} from "@/lib/contact";
import { SITE_URL } from "@/lib/site";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export default function Contact() {
  const { t } = useT();
  useSeo({
    title: "Contact Us — Send a Request",
    description:
      "Tell us what you're looking for in Newark or anywhere in New Jersey and we'll text or WhatsApp you back. No account, no fees.",
    path: "/contact",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      url: SITE_URL + "/contact",
      mainEntity: { "@id": `${SITE_URL}/#org` },
    },
  });

  const channels = [
    { icon: MessageCircle, label: "WhatsApp", value: PHONE_DISPLAY, href: whatsappUrl(t("footer.waHello")), ext: true },
    { icon: Phone, label: t("pages.callText"), value: PHONE_DISPLAY, href: `tel:${SMS}` },
    { icon: Mail, label: t("pages.email"), value: EMAIL, href: `mailto:${EMAIL}` },
    telegramUrl() && { icon: Send, label: "Telegram", value: `@${TELEGRAM_USERNAME}`, href: telegramUrl(), ext: true },
    instagramUrl() && {
      icon: Instagram,
      label: "Instagram",
      value: `@${INSTAGRAM_USERNAME}`,
      href: instagramUrl(),
      ext: true,
    },
  ].filter(Boolean);

  return (
    <div>
      <PageHeader crumb={t("sitemap.contact")} title={t("pages.contactTitle")} sub={t("pages.contactSub")} />
      <section id="contact" className="bg-[#fbfbfd]">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl bg-card p-5 card-shadow sm:p-8">
            <InquiryForm defaultCity="Newark" />
          </div>
          <aside aria-labelledby="other-ways">
            <h2 id="other-ways" className="font-heading text-lg font-semibold">
              {t("pages.otherWays")}
            </h2>
            <ul className="mt-4 space-y-2">
              {channels.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    {...(c.ext ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-[#f5f5f7] px-4 py-3 transition-colors hover:bg-[#e8e8ed]"
                  >
                    <c.icon className="h-5 w-5 shrink-0 text-[#0071e3]" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-[12px] text-[#6e6e73]">{c.label}</span>
                      <span className="block truncate text-[15px] font-medium">{c.value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13px] leading-relaxed text-[#6e6e73]">{t("pages.contactNote")}</p>
          </aside>
        </div>
      </section>
    </div>
  );
}
