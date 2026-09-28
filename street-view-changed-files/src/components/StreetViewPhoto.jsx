import React from "react";
import { cn } from "@/lib/utils";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { streetViewUrl } from "@/lib/streetView";
import { useT } from "@/lib/i18n";

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

export const hasStreetViewKey = () => Boolean(KEY);

// Street View picture of the building's outside, for listings with no photos.
// Falls back to the normal placeholder when there's no key, no usable address,
// or Google has no imagery there. Always labeled so renters know it isn't the unit.
export default function StreetViewPhoto({ property, size = "card", placeholderLabel, className = "" }) {
  const { t } = useT();
  const big = size === "large";
  const src = streetViewUrl(property, KEY, big ? { width: 640, height: 360 } : { width: 480, height: 360 });
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);

  if (!src || failed) return <PhotoPlaceholder size={size} label={placeholderLabel} className={className} />;

  return (
    <div className={cn("relative h-full w-full", className)}>
      <img
        src={src}
        alt={t("photos.streetViewAlt", { address: property.address, city: property.city })}
        loading="lazy"
        decoding="async"
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
      <span
        className={cn(
          // Kept clear of Google's logo and copyright along the bottom edge.
          "absolute rounded-full bg-black/55 font-medium text-white backdrop-blur",
          big ? "left-4 top-4 px-3 py-1.5 text-[13px]" : "bottom-8 left-3 px-2.5 py-1 text-[11px]",
        )}
      >
        {t("photos.streetView")}
      </span>
    </div>
  );
}
