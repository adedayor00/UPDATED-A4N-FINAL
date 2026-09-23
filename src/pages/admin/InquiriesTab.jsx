import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, MessageCircle, Smartphone, Phone, Check, RotateCcw, Archive, Trash2 } from "lucide-react";
import { Pill, FilterChips, Empty, IconAction } from "./shared";
import { replySmsUrl, replyWhatsappUrl } from "@/lib/contact";
import { listingPath } from "@/lib/listing";
import { timeAgo } from "@/lib/time";

const GREETING = {
  en: (n, l) => `Hi ${n}, this is Apartments4Newark. Thanks for your request${l ? ` about ${l}` : ""}! `,
  es: (n, l) => `Hola ${n}, le escribe Apartments4Newark. ¡Gracias por su solicitud${l ? ` sobre ${l}` : ""}! `,
  pt: (n, l) => `Olá ${n}, aqui é a Apartments4Newark. Obrigado pelo seu pedido${l ? ` sobre ${l}` : ""}! `,
};
const LANG = { es: "Spanish", pt: "Portuguese" };

export default function InquiriesTab({ inquiries, listings, onStatus, onDelete }) {
  const [filter, setFilter] = useState("new");
  const count = (s) => inquiries.filter((i) => i.status === s).length;
  const shown = inquiries.filter((i) => filter === "all" || i.status === filter);
  const byId = Object.fromEntries(listings.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "new", label: "New", count: count("new") },
          { value: "contacted", label: "Contacted", count: count("contacted") },
          { value: "closed", label: "Closed", count: count("closed") },
          { value: "all", label: "All", count: inquiries.length },
        ]}
      />
      {shown.length === 0 ? (
        <Empty
          icon={Inbox}
          title={filter === "new" ? "No new requests" : "Nothing here"}
          text="Every request a renter sends from the site lands here, even if they never open WhatsApp."
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((i) => {
            const listing = i.property_id ? byId[i.property_id] : null;
            const greet = (GREETING[i.lang] || GREETING.en)(i.name?.split(" ")[0] || "", i.property_title);
            return (
              <li key={i.id} className="rounded-3xl bg-card p-4 card-shadow sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold">{i.name}</p>
                    <a href={`tel:${i.phone}`} className="text-[14px] text-[#0071e3] hover:underline">
                      {i.phone}
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {LANG[i.lang] && <Pill tone="gray">{LANG[i.lang]}</Pill>}
                    <Pill tone={i.status === "new" ? "blue" : i.status === "contacted" ? "green" : "gray"}>
                      {i.status === "new" ? "New" : i.status === "contacted" ? "Contacted" : "Closed"}
                    </Pill>
                    <span className="text-[12px] text-[#6e6e73]">{timeAgo(i.created_date)}</span>
                  </div>
                </div>
                <p className="mt-2 text-[13px] text-[#6e6e73]">
                  Looking in {i.city || "—"}
                  {i.zip ? ` · ZIP ${i.zip}` : ""}
                  {i.property_title && (
                    <>
                      {" · "}
                      {listing ? (
                        <Link to={listingPath(listing)} className="font-medium text-[#1d1d1f] hover:text-[#0071e3]">
                          {i.property_title}
                        </Link>
                      ) : (
                        <span className="font-medium text-[#1d1d1f]">{i.property_title}</span>
                      )}
                    </>
                  )}
                </p>
                {i.message && (
                  <p className="mt-2 whitespace-pre-line rounded-2xl bg-[#f5f5f7] p-3 text-[14px]">{i.message}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                  <IconAction
                    label="Reply on WhatsApp"
                    href={replyWhatsappUrl(i.phone, greet)}
                    className="text-[#0F7B6C]"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </IconAction>
                  <IconAction label="Reply by text" href={replySmsUrl(i.phone, greet)}>
                    <Smartphone className="h-4 w-4" /> Text
                  </IconAction>
                  <IconAction label="Call" href={`tel:${i.phone}`}>
                    <Phone className="h-4 w-4" /> Call
                  </IconAction>
                  <span className="ml-auto flex gap-1">
                    {i.status === "new" && (
                      <IconAction label="Mark contacted" onClick={() => onStatus(i, "contacted")}>
                        <Check className="h-4 w-4" /> <span className="hidden sm:inline">Contacted</span>
                      </IconAction>
                    )}
                    {i.status !== "closed" ? (
                      <IconAction label="Close" onClick={() => onStatus(i, "closed")}>
                        <Archive className="h-4 w-4" /> <span className="hidden sm:inline">Close</span>
                      </IconAction>
                    ) : (
                      <IconAction label="Reopen" onClick={() => onStatus(i, "new")}>
                        <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Reopen</span>
                      </IconAction>
                    )}
                    <IconAction label="Delete" onClick={() => onDelete(i)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
