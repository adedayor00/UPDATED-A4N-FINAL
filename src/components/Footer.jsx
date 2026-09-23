import React from "react";
import { Link } from "react-router-dom";
import { MapPin, MessageCircle, Mail, Phone, Send, Instagram } from "lucide-react";
import Logo from "@/components/Logo";
import { useT } from "@/lib/i18n";
import { cityPath } from "@/lib/listing";
import { EMAIL, PHONE_DISPLAY, SMS, whatsappUrl, telegramUrl, instagramUrl, TELEGRAM_USERNAME, INSTAGRAM_USERNAME } from "@/lib/contact";

const FOOTER_CITIES = ["Newark", "East Orange", "Irvington", "Maplewood"];

export default function Footer() {
  const { t } = useT();
  const link = "inline-flex min-h-[32px] items-center text-[#1d1d1f]/80 hover:text-[#0071e3]";
  return (
    <footer className="border-t border-border bg-[#f5f5f7]">
      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[#6e6e73]">{t("footer.blurb")}</p>
          </div>
          <div>
            <h2 className="mb-3.5 text-[12px] font-semibold uppercase tracking-wide text-[#6e6e73]">
              {t("footer.browse")}
            </h2>
            <ul className="space-y-1.5 text-[13px]">
              {FOOTER_CITIES.map((c) => (
                <li key={c}>
                  <Link to={cityPath(c)} className={link}>
                    {t("footer.apartmentsIn", { city: c })}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={cityPath("Newark", "rooms")} className={link}>
                  {t("footer.roomsIn", { city: "Newark" })}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3.5 text-[12px] font-semibold uppercase tracking-wide text-[#6e6e73]">
              {t("footer.site")}
            </h2>
            <ul className="space-y-1.5 text-[13px]">
              <li>
                <Link to="/list-your-place" className={link}>
                  {t("nav.listYourPlace")}
                </Link>
              </li>
              <li>
                <Link to="/about" className={link}>
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link to="/keywords" className={link}>
                  {t("footer.areas")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={link}>
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className={link}>
                  {t("footer.sitemap")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3.5 text-[12px] font-semibold uppercase tracking-wide text-[#6e6e73]">
              {t("footer.reach")}
            </h2>
            <ul className="space-y-1.5 text-[13px]">
              <li>
                <a href={whatsappUrl(t("footer.waHello"))} target="_blank" rel="noreferrer" className={`${link} gap-2`}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </li>
              <li>
                <a href={`tel:${SMS}`} className={`${link} gap-2`}>
                  <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className={`${link} gap-2 break-all`}>
                  <Mail className="h-4 w-4 shrink-0" /> {EMAIL}
                </a>
              </li>
              {telegramUrl() && (
                <li>
                  <a href={telegramUrl()} target="_blank" rel="noreferrer" className={`${link} gap-2`}>
                    <Send className="h-4 w-4" /> Telegram @{TELEGRAM_USERNAME}
                  </a>
                </li>
              )}
              {instagramUrl() && (
                <li>
                  <a href={instagramUrl()} target="_blank" rel="noreferrer" className={`${link} gap-2`}>
                    <Instagram className="h-4 w-4" /> Instagram DM @{INSTAGRAM_USERNAME}
                  </a>
                </li>
              )}
              <li>
                <span className={`${link} gap-2`}>
                  <MapPin className="h-4 w-4" /> Newark, NJ
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex gap-3 rounded-2xl bg-white/70 p-4 text-[12px] leading-relaxed text-[#6e6e73]">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0 text-[#6e6e73]" aria-hidden="true">
            <path
              d="M3 11 12 4l9 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M5 10v10h14V10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 13h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p>
            <strong className="font-semibold text-[#1d1d1f]">{t("footer.ehoTitle")}</strong> {t("footer.eho")}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-[12px] text-[#6e6e73]">
            © {new Date().getFullYear()} Apartments4Newark. {t("footer.rights")}
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-[32px] items-center text-[12px] text-[#6e6e73] hover:text-[#0071e3]"
          >
            {t("footer.manager")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
