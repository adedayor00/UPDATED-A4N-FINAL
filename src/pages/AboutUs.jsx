import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShieldCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/Logo";
import SectionLink from "@/components/SectionLink";
import { CONTACT_PERSON } from "@/lib/contact";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export default function AboutUs() {
  const { t } = useT();
  useSeo({
    title: "About Us",
    description:
      "Apartments4Newark is a small, hands-on listing service for rooms and apartments in Newark and across New Jersey. No accounts, no fees to ask or tour.",
    path: "/about",
  });
  const cards = [
    { icon: Heart, title: t("about.c1Title"), text: t("about.c1Text") },
    { icon: ShieldCheck, title: t("about.c2Title"), text: t("about.c2Text") },
    { icon: MessageCircle, title: t("about.c3Title"), text: t("about.c3Text") },
  ];
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <div className="flex items-center gap-4">
        <LogoMark className="h-12 w-12" />
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("about.title")}</h1>
      </div>

      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-[#6e6e73]">
        <p>{t("about.p1")}</p>
        <p>{CONTACT_PERSON ? t("about.p2Named", { name: CONTACT_PERSON }) : t("about.p2")}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-3xl bg-card p-5 card-shadow">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0071e3]/10 text-[#0062c4]">
              <c.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-heading font-semibold">{c.title}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-[#6e6e73]">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-[#f5f5f7] p-6">
        <h2 className="font-heading text-lg font-semibold">{t("about.listTitle")}</h2>
        <p className="mt-2 text-[15px] text-[#6e6e73]">{t("about.listText")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/list-your-place">{t("nav.listYourPlace")}</Link>
          </Button>
          <Button asChild variant="outline">
            <SectionLink to="contact">{t("nav.sendRequest")}</SectionLink>
          </Button>
        </div>
      </div>
    </div>
  );
}
