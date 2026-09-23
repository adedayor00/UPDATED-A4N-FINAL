import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useT } from "@/lib/i18n";
import { track } from "@/lib/analytics";

export default function ShareButton({ url, title, className = "" }) {
  const { t } = useT();
  const { toast } = useToast();
  const share = async () => {
    track("share");
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("share.copied"), description: t("share.copiedText") });
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, "_blank", "noopener,noreferrer");
    }
  };
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={share}
      className={`h-11 gap-1.5 px-4 text-[13px] ${className}`}
    >
      <Share2 /> {t("share.share")}
    </Button>
  );
}
