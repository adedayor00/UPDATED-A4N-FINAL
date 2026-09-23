import React, { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function GalleryLightbox({ photos, open, index, onClose, onIndex, title }) {
  const { t } = useT();
  const closeRef = useRef(null);
  const touchX = useRef(0);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [open, index, photos.length, onClose, onIndex]);

  if (!open || !photos.length) return null;
  const go = (dir) => onIndex((index + dir + photos.length) % photos.length);
  const btn = "grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={title || t("detail.photos")}
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx > 40) go(-1);
        else if (dx < -40) go(1);
      }}
    >
      <button
        ref={closeRef}
        className={`absolute right-4 top-4 ${btn}`}
        onClick={onClose}
        aria-label={t("detail.close")}
      >
        <X className="h-5 w-5" />
      </button>
      {photos.length > 1 && (
        <button
          className={`absolute left-3 ${btn}`}
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          aria-label={t("detail.prevPhoto")}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <img
        src={photos[index]}
        alt={t("detail.photoN", { n: index + 1, total: photos.length })}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain"
      />
      {photos.length > 1 && (
        <button
          className={`absolute right-3 ${btn}`}
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          aria-label={t("detail.nextPhoto")}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/70">
        {index + 1} / {photos.length}
      </span>
    </div>
  );
}
