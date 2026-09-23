import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export default function PageNotFound() {
  const { t } = useT();
  useSeo({ title: t("notFound.title"), noindex: true });
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 py-20 text-center">
      <p className="font-heading text-7xl font-bold text-[#d2d2d7]">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">{t("notFound.title")}</h1>
      <p className="mt-2 text-[#6e6e73]">{t("notFound.text")}</p>
      <Button asChild className="mt-8">
        <Link to="/">{t("notFound.home")}</Link>
      </Button>
    </div>
  );
}
