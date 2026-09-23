import React, { useState } from "react";
import { Home, MessageCircle, Phone, Mail, FilePlus2, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, FilterChips, Empty, IconAction } from "./shared";
import { replyWhatsappUrl } from "@/lib/contact";
import { timeAgo } from "@/lib/time";

const REL = { owner: "Owner", manager: "Property manager", tenant: "Current tenant" };

export default function SubmissionsTab({ submissions, onConvert, onReject, onDelete }) {
  const [filter, setFilter] = useState("new");
  const count = (s) => submissions.filter((x) => x.status === s).length;
  const shown = submissions.filter((x) => filter === "all" || x.status === filter);
  return (
    <div className="space-y-4">
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "new", label: "New", count: count("new") },
          { value: "converted", label: "Listed", count: count("converted") },
          { value: "rejected", label: "Declined", count: count("rejected") },
          { value: "all", label: "All", count: submissions.length },
        ]}
      />
      {shown.length === 0 ? (
        <Empty
          icon={Home}
          title="No submissions here"
          text="Places sent in from the “List your place” page show up here for you to review."
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((s) => {
            const d = s.data || {};
            return (
              <li key={s.id} className="rounded-3xl bg-card p-4 card-shadow sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold">
                      {d.address || d.title || "Untitled"}{" "}
                      <span className="font-normal text-[#6e6e73]">· {d.city}</span>
                    </p>
                    <p className="text-[13px] text-[#6e6e73]">
                      {d.rent_type === "per_room" ? `Room share · ${d.rooms_free || 1} free` : "Whole unit"} ·{" "}
                      {d.bedrooms} bd · {d.bathrooms} ba ·{" "}
                      <strong className="text-[#1d1d1f]">${Number(d.rent || 0).toLocaleString("en-US")}</strong>
                      {d.rent_type === "per_room" ? " / room" : " / mo"}
                      {d.availability ? ` · ${d.availability}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {d.accepts_vouchers && <Pill tone="green">Vouchers</Pill>}
                    <Pill tone={s.status === "new" ? "blue" : s.status === "converted" ? "green" : "gray"}>
                      {s.status === "new" ? "New" : s.status === "converted" ? "Listed" : "Declined"}
                    </Pill>
                    <span className="text-[12px] text-[#6e6e73]">{timeAgo(s.created_date)}</span>
                  </div>
                </div>
                {d.description && <p className="mt-2 rounded-2xl bg-[#f5f5f7] p-3 text-[14px]">{d.description}</p>}
                {s.photos?.length > 0 && (
                  <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                    {s.photos.map((p, i) => (
                      <img
                        key={i}
                        src={p}
                        alt={`Submitted photo ${i + 1}`}
                        className="h-20 w-24 shrink-0 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[13px]">
                  <strong>{s.contact_name}</strong>{" "}
                  <span className="text-[#6e6e73]">({REL[s.relationship] || s.relationship})</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                  {s.status === "new" && (
                    <Button size="sm" onClick={() => onConvert(s)} className="gap-1.5">
                      <FilePlus2 className="h-3.5 w-3.5" /> Review & create listing
                    </Button>
                  )}
                  <IconAction
                    label="WhatsApp"
                    href={replyWhatsappUrl(
                      s.contact_phone,
                      `Hi ${s.contact_name?.split(" ")[0] || ""}, this is Apartments4Newark about the place you sent us${d.address ? ` on ${d.address}` : ""}. `,
                    )}
                    className="text-[#0F7B6C]"
                  >
                    <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">WhatsApp</span>
                  </IconAction>
                  <IconAction label={`Call ${s.contact_phone}`} href={`tel:${s.contact_phone}`}>
                    <Phone className="h-4 w-4" /> <span className="hidden sm:inline">{s.contact_phone}</span>
                  </IconAction>
                  {s.contact_email && (
                    <IconAction label={`Email ${s.contact_email}`} href={`mailto:${s.contact_email}`}>
                      <Mail className="h-4 w-4" />
                    </IconAction>
                  )}
                  <span className="ml-auto flex gap-1">
                    {s.status === "new" && (
                      <IconAction label="Decline" onClick={() => onReject(s)}>
                        <X className="h-4 w-4" /> <span className="hidden sm:inline">Decline</span>
                      </IconAction>
                    )}
                    <IconAction label="Delete" onClick={() => onDelete(s)} className="text-destructive">
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
