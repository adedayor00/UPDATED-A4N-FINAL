import React from "react";
import { BellRing, MessageCircle, Smartphone, Pause, Play, Trash2 } from "lucide-react";
import { Pill, Empty, IconAction } from "./shared";
import { replySmsUrl, replyWhatsappUrl } from "@/lib/contact";
import { isPubliclyVisible, listingPath, matchesAlert } from "@/lib/listing";
import { SITE_URL } from "@/lib/site";
import { timeAgo } from "@/lib/time";

const INTRO = {
  en: "Hi! You asked Apartments4Newark to text you when a place opens. New match:",
  es: "¡Hola! Nos pidió avisarle cuando haya un lugar disponible. Nueva opción:",
  pt: "Olá! Você pediu para avisarmos quando houver um lugar disponível. Nova opção:",
};

function describe(a) {
  const parts = [a.city && a.city !== "any" ? a.city : "Any city"];
  parts.push(a.rent_type === "per_room" ? "room" : a.rent_type === "whole_unit" ? "whole apartment" : "any type");
  if (a.max_rent) parts.push(`up to $${Number(a.max_rent).toLocaleString("en-US")}`);
  if (a.bedrooms_min) parts.push(`${a.bedrooms_min}+ beds`);
  return parts.join(" · ");
}

export default function AlertsTab({ alerts, listings, onToggle, onDelete }) {
  const live = listings.filter((p) => isPubliclyVisible(p));
  if (!alerts.length)
    return (
      <Empty
        icon={BellRing}
        title="No alerts yet"
        text="When renters ask to be texted about new places, they show up here with the listings that match them."
      />
    );
  return (
    <div className="space-y-3">
      <p className="text-[14px] text-[#6e6e73]">
        Renters waiting to hear about a place. Each card shows the live listings that match — tap WhatsApp or Text to
        send them the links.
      </p>
      <ul className="space-y-3">
        {alerts.map((a) => {
          const matches = live.filter((p) => matchesAlert(p, a));
          const msg = [
            INTRO[a.lang] || INTRO.en,
            ...matches.slice(0, 3).map((p) => `${p.title} (${p.city}) — $${p.rent}: ${SITE_URL}${listingPath(p)}`),
          ].join("\n");
          return (
            <li key={a.id} className={`rounded-3xl bg-card p-4 card-shadow sm:p-5 ${a.active ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <a href={`tel:${a.phone}`} className="font-heading font-semibold hover:text-[#0071e3]">
                    {a.phone}
                  </a>
                  <p className="text-[13px] text-[#6e6e73]">{describe(a)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {!a.active && <Pill tone="gray">Paused</Pill>}
                  <Pill tone={matches.length ? "blue" : "gray"}>
                    {matches.length} match{matches.length === 1 ? "" : "es"}
                  </Pill>
                  <span className="text-[12px] text-[#6e6e73]">{timeAgo(a.created_date)}</span>
                </div>
              </div>
              {matches.length > 0 && (
                <p className="mt-2 text-[13px] text-[#6e6e73]">
                  {matches
                    .slice(0, 4)
                    .map((p) => p.title)
                    .join(" · ")}
                  {matches.length > 4 ? ` +${matches.length - 4} more` : ""}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                {matches.length > 0 && a.active && (
                  <>
                    <IconAction
                      label="Send matches on WhatsApp"
                      href={replyWhatsappUrl(a.phone, msg)}
                      className="text-[#0F7B6C]"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp matches
                    </IconAction>
                    <IconAction label="Text matches" href={replySmsUrl(a.phone, msg)}>
                      <Smartphone className="h-4 w-4" /> Text
                    </IconAction>
                  </>
                )}
                <span className="ml-auto flex gap-1">
                  <IconAction label={a.active ? "Pause" : "Resume"} onClick={() => onToggle(a)}>
                    {a.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span className="hidden sm:inline">{a.active ? "Pause" : "Resume"}</span>
                  </IconAction>
                  <IconAction label="Delete" onClick={() => onDelete(a)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </IconAction>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
