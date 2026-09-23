import { useEffect } from "react";
import { SITE_URL } from "@/lib/site";
import { SITE_NAME } from "@/lib/listing";

const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// Keeps the tab title, description, canonical link, social preview tags and
// structured data in sync with the page. The build step (scripts/prerender.mjs)
// writes the same tags into static HTML so Google and WhatsApp see them
// without running JavaScript.
export function useSeo({ title, description, path, image, jsonLd, noindex = false }) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Rooms & Apartments for Rent in Newark, NJ`;
    document.title = fullTitle;
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }
    setMeta("property", "og:title", fullTitle);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("property", "og:image", image || DEFAULT_IMAGE);
    setMeta("name", "twitter:image", image || DEFAULT_IMAGE);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    if (path !== undefined) {
      const url = SITE_URL + path;
      setLink("canonical", url);
      setMeta("property", "og:url", url);
    }
    let script = document.getElementById("page-jsonld");
    if (ld) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "page-jsonld";
        document.head.appendChild(script);
      }
      script.textContent = ld;
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, image, ld, noindex]);
}
