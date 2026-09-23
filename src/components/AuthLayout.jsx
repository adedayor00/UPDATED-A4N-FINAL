import React from "react";
import { Link } from "react-router-dom";
import { LogoMark, Wordmark } from "@/components/Logo";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex min-h-[44px] items-center gap-2" aria-label="Apartments4Newark home">
            <LogoMark className="h-9 w-9" />
            <Wordmark className="text-[17px]" />
          </Link>
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[#6e6e73]">{subtitle}</p>}
        </div>
        <div className="rounded-3xl bg-card p-6 card-shadow-lg sm:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-[#6e6e73]">{footer}</div>}
      </div>
    </div>
  );
}
