import * as React from "react";
import { cn } from "@/lib/utils";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

// <img> that fills its box and falls back to the branded placeholder if the
// photo fails to load (instead of a broken-image icon).
const Image = React.forwardRef(({ src, fit = "cover", className, onError, ...props }, ref) => {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <PhotoPlaceholder className={className} />;
  return (
    <img
      ref={ref}
      src={src}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      className={cn(fit === "contain" ? "object-contain" : "object-cover", className)}
      {...props}
    />
  );
});
Image.displayName = "Image";

export { Image };
