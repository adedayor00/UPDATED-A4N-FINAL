import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useT } from "@/lib/i18n";
import Logo, { Wordmark, LogoMark } from "@/components/Logo";
import SectionLink, { useSectionNav } from "@/components/SectionLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const goSection = useSectionNav();
  const { isAdmin } = useAuth();
  const { t } = useT();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const links = [
    { label: t("nav.listings"), section: "listings" },
    { label: t("nav.cities"), section: "cities" },
    { label: t("nav.how"), section: "how" },
    { label: t("nav.listYourPlace"), to: "/list-your-place" },
    { label: t("nav.about"), to: "/about" },
  ];

  const linkClass =
    "inline-flex h-11 items-center rounded-full px-3 text-[13px] font-medium text-[#6e6e73] transition-colors hover:text-foreground";

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-border/70" style={{ height: 52 }}>
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-3 px-5 sm:px-6">
          <Link to="/" aria-label={t("nav.home")} className="flex min-h-[44px] items-center">
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden lg:flex items-center gap-0.5">
            {links.map((l) =>
              l.to ? (
                <Link key={l.label} to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              ) : (
                <SectionLink key={l.label} to={l.section} className={linkClass}>
                  {l.label}
                </SectionLink>
              ),
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-1">
            <LanguageSwitcher />
            {isAdmin ? (
              <Button size="sm" variant="outline" onClick={() => navigate("/admin")} className="h-9 gap-1.5">
                <LayoutDashboard /> {t("nav.dashboard")}
              </Button>
            ) : (
              <Button size="sm" onClick={() => goSection("contact")} className="h-9 gap-1.5 px-4">
                <MessageCircle /> {t("nav.sendRequest")}
              </Button>
            )}
          </div>

          <div className="flex items-center lg:hidden">
            <LanguageSwitcher />
            <button
              className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"
              onClick={() => setOpen(true)}
              aria-label={t("nav.openMenu")}
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-background lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu")}
        >
          <div className="flex h-[52px] items-center justify-between border-b border-border px-5">
            <Link to="/" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center gap-2">
              <LogoMark />
              <Wordmark />
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("nav.closeMenu")}
              className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-6">
            {links.map((l) =>
              l.to ? (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-2 py-3 font-heading text-2xl font-semibold tracking-tight hover:bg-secondary"
                >
                  {l.label}
                </Link>
              ) : (
                <SectionLink
                  key={l.label}
                  to={l.section}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-2 py-3 font-heading text-2xl font-semibold tracking-tight hover:bg-secondary"
                >
                  {l.label}
                </SectionLink>
              ),
            )}
            <div className="mt-6">
              <p className="mb-3 px-2 text-[12px] font-semibold uppercase tracking-wide text-[#6e6e73]">
                {t("nav.language")}
              </p>
              <LanguageSwitcher variant="inline" />
            </div>
          </nav>
          <div className="flex flex-col gap-3 px-5 pb-8">
            {isAdmin ? (
              <Button onClick={() => navigate("/admin")} className="h-12 gap-2">
                <LayoutDashboard /> {t("nav.dashboard")}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setOpen(false);
                  goSection("contact");
                }}
                className="h-12 gap-2"
              >
                <MessageCircle /> {t("nav.sendRequest")}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
