import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { USE_HASH_ROUTER } from "@/lib/site";

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  return true;
}

// Jumps to a section on the home page (or the current page if it has that
// section). Works the same with normal and hash-based URLs.
export function useSectionNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (id, { home = true } = {}) => {
    if ((!home || location.pathname === "/") && scrollToSection(id)) return;
    navigate("/", { state: { scrollTo: id } });
  };
}

export default function SectionLink({ to, home = true, className, children, onClick, ...rest }) {
  const go = useSectionNav();
  return (
    <a
      href={USE_HASH_ROUTER ? "#/" : `/#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
        go(to, { home });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
