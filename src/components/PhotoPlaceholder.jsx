import React from "react";
import { Camera } from "lucide-react";
import { useT } from "@/lib/i18n";

// Shown when a listing has no real photos yet. Deliberately NOT a stock
// photo: renters should never see a picture that isn't the actual place.
export default function PhotoPlaceholder({ size = "card", label, className = "" }) {
  const { t } = useT();
  const big = size === "large";
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#eef4fd] via-[#f5f5f7] to-[#f5f5f7] ${className}`}
    >
      <svg
        viewBox="0 0 120 100"
        aria-hidden="true"
        className={`absolute ${big ? "h-[70%]" : "h-[62%]"} text-[#0071e3]/[0.07]`}
      >
        <path
          d="M10 48 60 8l50 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M22 42v50h76V42" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
        <rect x="50" y="62" width="20" height="30" rx="2" fill="currentColor" />
      </svg>
      <span
        className={`relative inline-flex items-center gap-1.5 rounded-full bg-white/80 font-medium text-[#6e6e73] backdrop-blur ${
          big ? "px-4 py-2 text-[14px]" : "px-3 py-1.5 text-[12px]"
        }`}
      >
        <Camera className={big ? "h-4 w-4" : "h-3.5 w-3.5"} />
        {label || t("photos.onRequest")}
      </span>
    </div>
  );
}
