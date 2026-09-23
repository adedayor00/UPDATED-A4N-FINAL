import React from "react";
import { Search, ClipboardList, MessageCircle } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useT } from "@/lib/i18n";

const ICONS = [Search, ClipboardList, MessageCircle];

export default function HowItWorks() {
  const { t } = useT();
  const steps = [1, 2, 3].map((n) => ({ title: t(`how.s${n}Title`), text: t(`how.s${n}Text`) }));
  return (
    <section id="how" className="scroll-mt-16 border-y border-border bg-[#f5f5f7]" aria-labelledby="how-title">
      <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <h2 id="how-title" className="text-center font-heading text-3xl font-bold tracking-tight sm:text-5xl">
            {t("how.title")}
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mx-auto mt-3 max-w-md text-center text-[#6e6e73]">{t("how.sub")}</p>
        </Reveal>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal as="li" key={i} delay={i * 100} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-[#0071e3] card-shadow">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <span className="mt-6 block font-mono text-[13px] font-semibold text-[#6e6e73]">0{i + 1}</span>
                <h3 className="mt-1 font-heading text-xl font-semibold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-[15px] text-[#6e6e73]">{s.text}</p>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
