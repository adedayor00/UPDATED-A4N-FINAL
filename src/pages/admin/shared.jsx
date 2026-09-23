import React from "react";

export function Pill({ tone = "gray", children, className = "" }) {
  const tones = {
    blue: "bg-[#0071e3]/10 text-[#0062c4]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-50 text-red-700",
    gray: "bg-secondary text-[#6e6e73]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function FilterChips({ value, onChange, options }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
            value === o.value ? "bg-[#1d1d1f] text-white" : "bg-secondary text-[#1d1d1f] hover:bg-[#e8e8ed]"
          }`}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={`text-[12px] ${value === o.value ? "text-white/70" : "text-[#6e6e73]"}`}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      {Icon && <Icon className="mx-auto h-10 w-10 text-[#86868b]/50" />}
      <p className="mt-3 font-medium">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-[#6e6e73]">{text}</p>}
      {children}
    </div>
  );
}

export function IconAction({ label, onClick, href, children, className = "", ...rest }) {
  const cls = `inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors hover:bg-secondary ${className}`;
  if (href)
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noreferrer"
        className={cls}
        aria-label={label}
        title={label}
        {...rest}
      >
        {children}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
