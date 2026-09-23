import React from "react";
import { EMAIL, PHONE_DISPLAY } from "@/lib/contact";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export default function Privacy() {
  const { t } = useT();
  useSeo({
    title: "Privacy",
    description: "What Apartments4Newark collects when you send a request, and how it's used.",
    path: "/privacy",
  });
  const sections = ["collect", "use", "share", "keep", "choices"];
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("privacy.title")}</h1>
      <p className="mt-3 text-[15px] text-[#6e6e73]">{t("privacy.updated")}</p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s}>
            <h2 className="font-heading text-lg font-semibold">{t(`privacy.${s}Title`)}</h2>
            <p className="mt-2 leading-relaxed text-[#6e6e73]">
              {t(`privacy.${s}Text`, { email: EMAIL, phone: PHONE_DISPLAY })}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
