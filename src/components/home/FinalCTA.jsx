import React from "react";
import Reveal from "@/components/Reveal";
import InquiryForm from "@/components/InquiryForm";
import { useT } from "@/lib/i18n";

export default function FinalCTA() {
  const { t } = useT();
  return (
    <section id="contact" className="scroll-mt-16 border-t border-border bg-[#fbfbfd]" aria-labelledby="contact-title">
      <div className="mx-auto max-w-[1200px] px-5 py-20 text-center sm:px-6 sm:py-28">
        <Reveal>
          <h2 id="contact-title" className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">
            {t("contact.title")}
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mx-auto mt-5 max-w-md text-[17px] text-[#6e6e73]">{t("contact.sub")}</p>
        </Reveal>
        <Reveal delay={160}>
          <div className="mx-auto mt-10 max-w-xl rounded-3xl bg-card p-5 text-left card-shadow sm:p-8">
            <InquiryForm defaultCity="Newark" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
