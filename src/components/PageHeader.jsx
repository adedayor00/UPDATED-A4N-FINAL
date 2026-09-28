import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";

// Top of every inner page: breadcrumb, headline, one-line intro, optional actions.
export default function PageHeader({ crumb, title, sub, children }) {
  const { t } = useT();
  return (
    <section className="border-b border-border bg-[#fbfbfd]">
      <div className="mx-auto max-w-[1200px] px-5 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-[#6e6e73]">
          <Link to="/" className="inline-flex h-11 items-center hover:text-foreground">
            {t("nav.home")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span aria-current="page">{crumb || title}</span>
        </nav>
        <h1 className="mt-2 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {sub && <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-[#6e6e73]">{sub}</p>}
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
