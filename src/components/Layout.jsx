import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n";

export default function Layout() {
  const location = useLocation();
  const { t } = useT();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-[#0071e3] focus:px-4 focus:py-2 focus:text-white"
      >
        {t("nav.skip")}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      {!isAdmin && (
        // Listing pages have a fixed "Request" bar on phones; keep the footer clear of it.
        <div className={location.pathname.startsWith("/listing/") ? "pb-20 lg:pb-0" : ""}>
          <Footer />
        </div>
      )}
    </div>
  );
}
