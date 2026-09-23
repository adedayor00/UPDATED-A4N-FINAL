import { useT } from "@/lib/i18n";
import { daysSinceConfirmed, isRooms, priceParts, roomsFree } from "@/lib/listing";

// Translated labels for a listing, shared by cards, detail page and admin.
export function useListingText() {
  const { t } = useT();
  return {
    badge(p) {
      if (!isRooms(p)) return t("cards.wholeUnit");
      return t("cards.roomsFree", { count: roomsFree(p) });
    },
    price(p) {
      const { amount, per } = priceParts(p);
      if (!amount) return { amount: t("cards.priceOnRequest"), per: null, perLong: null };
      return {
        amount,
        per: per === "room" ? t("cards.perRoom") : t("cards.perMonth"),
        perLong: per === "room" ? t("detail.perRoomMonth") : t("detail.perMonth"),
      };
    },
    fresh(p) {
      const d = daysSinceConfirmed(p);
      if (d === 0) return t("fresh.today");
      return t("fresh.days", { count: d });
    },
    freshShort(p) {
      const d = daysSinceConfirmed(p);
      return d === 0 ? t("fresh.shortToday") : t("fresh.shortDays", { count: d });
    },
    type(p) {
      return isRooms(p) ? t("cards.roomShare") : t("cards.wholeUnit");
    },
  };
}
