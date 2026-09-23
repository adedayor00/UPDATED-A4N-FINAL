import { SITE_URL as DEFAULT_SITE_URL } from "@/lib/listing";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
// "browser" (normal URLs, the live site), "hash" or "memory" (self-contained previews).
export const ROUTER_MODE = import.meta.env.VITE_ROUTER || "browser";
export const USE_HASH_ROUTER = ROUTER_MODE !== "browser";
