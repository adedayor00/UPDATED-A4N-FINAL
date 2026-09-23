import React from "react";

// The A4N mark: a house whose roofline frames a bold "4".
export function LogoMark({ className = "h-7 w-7", title }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <rect width="32" height="32" rx="8" fill="#1d1d1f" />
      <path
        d="M6.5 15.2 16 7.4l9.5 7.8"
        fill="none"
        stroke="#2997ff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 14v10.6h14V14"
        fill="none"
        stroke="#ffffff"
        strokeOpacity=".28"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.4 24.6V12.8l-7 8.1h9.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }) {
  return (
    <span className={`font-heading text-[15px] font-semibold tracking-tight ${className}`}>
      Apartments<span className="text-[#0071e3]">4</span>Newark
    </span>
  );
}

export default function Logo({ className = "" }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark />
      <Wordmark />
    </span>
  );
}
