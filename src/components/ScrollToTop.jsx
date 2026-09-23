import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { scrollToSection } from "@/components/SectionLink";
import { USE_HASH_ROUTER } from "@/lib/site";

// Scrolls to the top on navigation, or to a section when one was requested
// (via navigate state, or a plain /#section link in normal-URL mode).
export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const target =
      location.state?.scrollTo ||
      (!USE_HASH_ROUTER && location.hash ? decodeURIComponent(location.hash.slice(1)) : null);
    if (target) {
      let tries = 0;
      // The section may not exist until listings finish loading.
      const timer = window.setInterval(() => {
        if (scrollToSection(target) || ++tries > 30) window.clearInterval(timer);
      }, 60);
      return () => window.clearInterval(timer);
    }
    if (navigationType !== "POP") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.key, navigationType]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
