import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Clock,
  EyeOff,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Search,
  BellRing,
  Camera,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pill, FilterChips, Empty, IconAction } from "./shared";
import {
  LISTING_WARN_DAYS,
  daysUntilExpiry,
  isExpired,
  isPubliclyVisible,
  isRooms,
  listingPath,
  matchesAlert,
  roomsFree,
} from "@/lib/listing";

function statusOf(p) {
  if (p.status !== "published") return "pending";
  if (isExpired(p)) return "expired";
  if (!isPubliclyVisible(p)) return "full";
  if (daysUntilExpiry(p) <= LISTING_WARN_DAYS) return "expiring";
  return "live";
}

const STATUS_PILL = {
  live: { tone: "blue", icon: CheckCircle2, label: "Live" },
  expiring: { tone: "amber", icon: Clock, label: "Expiring" },
  expired: { tone: "red", icon: EyeOff, label: "Expired" },
  full: { tone: "gray", icon: EyeOff, label: "All rooms taken" },
  pending: { tone: "amber", icon: Clock, label: "Pending" },
};

export default function ListingsTab({
  listings,
  alerts,
  inquiries,
  onEdit,
  onNew,
  onApprove,
  onUnpublish,
  onRenew,
  onDelete,
  onToggleRoom,
}) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => listings.map((p) => ({ p, s: statusOf(p) })), [listings]);
  const counts = rows.reduce((acc, r) => ((acc[r.s] = (acc[r.s] || 0) + 1), acc), {});
  const needsAttention = (counts.expiring || 0) + (counts.expired || 0);
  const inquiryCount = useMemo(() => {
    const c = {};
    inquiries.forEach((i) => i.property_id && (c[i.property_id] = (c[i.property_id] || 0) + 1));
    return c;
  }, [inquiries]);

  const shown = rows.filter(({ p, s }) => {
    if (filter === "live" && s !== "live" && s !== "expiring") return false;
    if (filter === "pending" && s !== "pending") return false;
    if (filter === "attention" && s !== "expiring" && s !== "expired" && s !== "full") return false;
    if (q.trim()) {
      const hay = `${p.title} ${p.address} ${p.city} ${p.neighborhood}`.toLowerCase();
      if (!hay.includes(q.toLowerCase().trim())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: listings.length },
            { value: "live", label: "Live", count: (counts.live || 0) + (counts.expiring || 0) },
            { value: "pending", label: "Pending", count: counts.pending || 0 },
            { value: "attention", label: "Needs attention", count: needsAttention + (counts.full || 0) },
          ]}
        />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
          <Input
            type="search"
            aria-label="Search listings"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search listings"
            className="pl-10"
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty
          icon={Building2}
          title={listings.length ? "Nothing matches" : "No listings yet"}
          text={listings.length ? "Try another filter." : "Create your first listing to get started."}
        >
          {!listings.length && (
            <Button onClick={onNew} className="mt-4">
              New listing
            </Button>
          )}
        </Empty>
      ) : (
        <ul className="space-y-3">
          {shown.map(({ p, s }) => {
            const pill = STATUS_PILL[s];
            const days = daysUntilExpiry(p);
            const matches = alerts.filter((a) => a.active && matchesAlert(p, a)).length;
            const nInq = inquiryCount[p.id] || 0;
            return (
              <li key={p.id} className="rounded-3xl bg-card p-4 card-shadow sm:p-5">
                <div className="flex gap-4">
                  <div className="hidden h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#f5f5f7] sm:block">
                    {p.photos?.[0] ? (
                      <img src={p.photos[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[#6e6e73]" title="No photos yet">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-heading font-semibold">{p.title}</p>
                        <p className="truncate text-[13px] text-[#6e6e73]">
                          {p.city}
                          {p.neighborhood ? ` · ${p.neighborhood}` : ""} · {p.bedrooms} bd · {p.bathrooms} ba
                        </p>
                      </div>
                      <p className="font-heading font-bold">
                        ${Number(p.rent).toLocaleString("en-US")}
                        <span className="ml-1 text-[12px] font-normal text-[#6e6e73]">
                          {isRooms(p) ? "/ room" : "/ mo"}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Pill tone={pill.tone}>
                        <pill.icon className="h-3.5 w-3.5" /> {pill.label}
                      </Pill>
                      {p.status === "published" && (
                        <span
                          className={`text-[12px] ${days <= LISTING_WARN_DAYS ? "font-medium text-amber-700" : "text-[#6e6e73]"}`}
                        >
                          {days < 0
                            ? `Expired ${-days} day${-days === 1 ? "" : "s"} ago`
                            : days === 0
                              ? "Expires today"
                              : `Expires in ${days} day${days === 1 ? "" : "s"}`}
                        </span>
                      )}
                      {!p.photos?.length && <Pill tone="gray">No photos</Pill>}
                      {p.accepts_vouchers && <Pill tone="green">Vouchers</Pill>}
                      {nInq > 0 && (
                        <Pill tone="gray">
                          {nInq} inquir{nInq === 1 ? "y" : "ies"}
                        </Pill>
                      )}
                      {matches > 0 && (
                        <Pill tone="blue">
                          <BellRing className="h-3 w-3" /> {matches} waiting
                        </Pill>
                      )}
                    </div>

                    {isRooms(p) && p.rooms?.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[12px] text-[#6e6e73]">Rooms ({roomsFree(p)} free) — tap to switch:</span>
                        {p.rooms.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => onToggleRoom(p, i)}
                            className={`inline-flex h-8 items-center rounded-full px-3 text-[12px] font-semibold transition-colors ${
                              r.status === "free"
                                ? "bg-[#0071e3]/10 text-[#0062c4] hover:bg-[#0071e3]/20"
                                : "bg-secondary text-[#6e6e73] hover:bg-[#e8e8ed]"
                            }`}
                            aria-label={`${r.name || `Room ${i + 1}`}: ${r.status}. Switch to ${r.status === "free" ? "taken" : "free"}`}
                          >
                            {r.name || `Room ${i + 1}`}: {r.status === "free" ? "Free" : "Taken"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                  {p.status === "published" ? (
                    <>
                      {days <= LISTING_WARN_DAYS + 7 && (
                        <Button size="sm" onClick={() => onRenew(p)} className="gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5" /> Still available — renew
                        </Button>
                      )}
                      <IconAction label="Unpublish" onClick={() => onUnpublish(p)} className="text-[#6e6e73]">
                        <EyeOff className="h-4 w-4" /> <span className="hidden sm:inline">Unpublish</span>
                      </IconAction>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => onApprove(p)} className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve & publish
                    </Button>
                  )}
                  <IconAction label="Edit" onClick={() => onEdit(p)}>
                    <Pencil className="h-4 w-4" /> <span className="hidden sm:inline">Edit</span>
                  </IconAction>
                  <Link
                    to={listingPath(p)}
                    className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-medium hover:bg-secondary"
                    aria-label="View on site"
                    title="View on site"
                  >
                    <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View</span>
                  </Link>
                  <IconAction label="Delete" onClick={() => onDelete(p)} className="ml-auto text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </IconAction>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
