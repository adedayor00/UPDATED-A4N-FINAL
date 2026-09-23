import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  Inbox,
  LogOut,
  Home,
  BellRing,
  Info,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { api, IS_DEMO } from "@/api/client";
import { demoBackend } from "@/api/demoBackend";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import PropertyForm from "./PropertyForm";
import ListingsTab from "./ListingsTab";
import InquiriesTab from "./InquiriesTab";
import AlertsTab from "./AlertsTab";
import SubmissionsTab from "./SubmissionsTab";
import { LISTING_WARN_DAYS, daysUntilExpiry, isPubliclyVisible, matchesAlert } from "@/lib/listing";
import { useSeo } from "@/lib/seo";

const TABS = [
  { id: "listings", label: "Listings", icon: Building2 },
  { id: "inquiries", label: "Requests", icon: Inbox },
  { id: "submissions", label: "Submissions", icon: Home },
  { id: "alerts", label: "Alerts", icon: BellRing },
];

export default function AdminDashboard() {
  useSeo({ title: "Dashboard", noindex: true });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "listings";
  const setTab = (id) => setParams(id === "listings" ? {} : { tab: id }, { replace: true });

  const listingsQ = useQuery({ queryKey: ["listings", "all"], queryFn: () => api.listings.list({ all: true }) });
  const inquiriesQ = useQuery({ queryKey: ["inquiries"], queryFn: () => api.inquiries.list() });
  const alertsQ = useQuery({ queryKey: ["alerts"], queryFn: () => api.alerts.list() });
  const submissionsQ = useQuery({ queryKey: ["submissions"], queryFn: () => api.submissions.list() });

  const listings = listingsQ.data || [];
  const inquiries = inquiriesQ.data || [];
  const alerts = alertsQ.data || [];
  const submissions = submissionsQ.data || [];
  const loading = listingsQ.isLoading || inquiriesQ.isLoading || alertsQ.isLoading || submissionsQ.isLoading;
  const loadError = listingsQ.error || inquiriesQ.error || alertsQ.error || submissionsQ.error;

  const [editing, setEditing] = useState(null); // { initial, fromSubmission? }
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const refresh = (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const refreshListings = () => {
    refresh("listings");
    qc.invalidateQueries({ queryKey: ["listing"] });
  };

  const run = async (fn, success, keys = ["listings"]) => {
    try {
      await fn();
      if (success) toast(typeof success === "string" ? { title: success } : success);
    } catch (err) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      if (keys.includes("listings")) refreshListings();
      refresh(...keys.filter((k) => k !== "listings"));
    }
  };

  const now = new Date().toISOString();
  const waitingFor = (p) => alerts.filter((a) => a.active && matchesAlert(p, a)).length;

  const handleSave = async (form) => {
    setSubmitting(true);
    try {
      if (editing.initial?.id) {
        await api.listings.update(editing.initial.id, form);
        toast({ title: "Listing saved" });
      } else {
        await api.listings.create({ ...form, status: "pending", confirmed_at: now });
        if (editing.fromSubmission) await api.submissions.update(editing.fromSubmission.id, { status: "converted" });
        toast({ title: "Listing created", description: "It's pending — approve it to put it on the site." });
      }
      setEditing(null);
    } catch (err) {
      toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      refreshListings();
      refresh("submissions");
    }
  };

  const actions = {
    onNew: () => setEditing({ initial: null }),
    onEdit: (p) => setEditing({ initial: p }),
    onApprove: (p) =>
      run(
        () => api.listings.update(p.id, { status: "published", confirmed_at: new Date().toISOString() }),
        waitingFor(p)
          ? {
              title: "Listing is live",
              description: `${waitingFor(p)} renter(s) have alerts that match — see the Alerts tab to text them.`,
            }
          : "Listing is live",
      ),
    onUnpublish: (p) => run(() => api.listings.update(p.id, { status: "pending" }), "Hidden from the site"),
    onRenew: (p) =>
      run(() => api.listings.update(p.id, { confirmed_at: new Date().toISOString() }), "Renewed for another 30 days"),
    onToggleRoom: (p, i) => {
      const rooms = p.rooms.map((r, idx) => (idx === i ? { ...r, status: r.status === "free" ? "taken" : "free" } : r));
      const free = rooms.filter((r) => r.status === "free").length;
      run(
        () => api.listings.update(p.id, { rooms, rooms_free: free }),
        free === 0
          ? { title: "All rooms taken", description: "The listing is hidden until a room frees up." }
          : `${free} room${free === 1 ? "" : "s"} free`,
      );
    },
    onDelete: (p) =>
      setConfirm({
        title: `Delete “${p.title}”?`,
        description: "This removes it for good. To hide it for now, use Unpublish instead.",
        onConfirm: () => run(() => api.listings.remove(p.id), "Listing deleted"),
      }),
  };

  const stats = useMemo(() => {
    const live = listings.filter((p) => isPubliclyVisible(p)).length;
    const pending = listings.filter((p) => p.status !== "published").length;
    const expiring = listings.filter((p) => p.status === "published" && daysUntilExpiry(p) <= LISTING_WARN_DAYS).length;
    const newReq = inquiries.filter((i) => i.status === "new").length;
    return [
      { label: "Live on site", value: live, icon: CheckCircle2, tab: "listings" },
      { label: "Pending approval", value: pending, icon: Clock, tab: "listings" },
      { label: "Expiring / expired", value: expiring, icon: RotateCcw, tab: "listings", warn: expiring > 0 },
      { label: "New requests", value: newReq, icon: Inbox, tab: "inquiries", warn: newReq > 0 },
    ];
  }, [listings, inquiries]);

  const badge = {
    inquiries: inquiries.filter((i) => i.status === "new").length,
    submissions: submissions.filter((s) => s.status === "new").length,
    alerts: alerts.filter((a) => a.active).length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {IS_DEMO && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-[#0071e3]/[0.07] p-4 text-[14px] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0071e3]" />
            <span>
              <strong>Demo mode.</strong> This dashboard runs on sample data saved in your browser only. Connect
              Supabase (see SETUP.md) to go live.
            </span>
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setConfirm({
                title: "Reset the demo?",
                description: "Puts back the original listings and sample requests.",
                confirmLabel: "Reset",
                destructive: false,
                onConfirm: () => {
                  demoBackend.reset();
                  qc.invalidateQueries();
                  toast({ title: "Demo data reset" });
                },
              })
            }
            className="shrink-0 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset demo
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="truncate text-sm text-[#6e6e73]">Signed in as {user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={actions.onNew} className="gap-2">
            <Plus className="h-4 w-4" /> New listing
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => setTab(s.tab)}
            className={`rounded-3xl p-4 text-left transition-colors sm:p-5 ${s.warn ? "bg-amber-50 hover:bg-amber-100/70" : "bg-card card-shadow hover:bg-secondary/60"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] text-[#6e6e73]">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.warn ? "text-amber-700" : "text-[#6e6e73]"}`} />
            </div>
            <p className="mt-1 font-heading text-3xl font-bold">{loading ? "—" : s.value}</p>
          </button>
        ))}
      </div>

      <div
        className="no-scrollbar -mx-4 mt-8 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Dashboard sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px inline-flex h-12 shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-[14px] sm:gap-2 sm:px-3 font-medium transition-colors ${
              tab === t.id
                ? "border-[#0071e3] text-foreground"
                : "border-transparent text-[#6e6e73] hover:text-foreground"
            }`}
          >
            <t.icon className="hidden h-4 w-4 sm:block" /> {t.label}
            {badge[t.id] > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#0071e3] px-1.5 text-[11px] font-semibold text-white">
                {badge[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {loadError ? (
          <div role="alert" className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            Couldn't load your data: {loadError.message}. Check your connection and refresh.
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16" role="status" aria-label="Loading">
            <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
          </div>
        ) : tab === "listings" ? (
          <ListingsTab listings={listings} alerts={alerts} inquiries={inquiries} {...actions} />
        ) : tab === "inquiries" ? (
          <InquiriesTab
            inquiries={inquiries}
            listings={listings}
            onStatus={(i, status) => run(() => api.inquiries.update(i.id, { status }), null, ["inquiries"])}
            onDelete={(i) =>
              setConfirm({
                title: `Delete the request from ${i.name}?`,
                onConfirm: () => run(() => api.inquiries.remove(i.id), "Request deleted", ["inquiries"]),
              })
            }
          />
        ) : tab === "submissions" ? (
          <SubmissionsTab
            submissions={submissions}
            onConvert={(s) =>
              setEditing({
                initial: { ...s.data, title: s.data?.title || s.data?.address || "", photos: s.photos || [] },
                fromSubmission: s,
              })
            }
            onReject={(s) =>
              run(() => api.submissions.update(s.id, { status: "rejected" }), "Marked as declined", ["submissions"])
            }
            onDelete={(s) =>
              setConfirm({
                title: "Delete this submission?",
                description: "The landlord's contact details are removed too.",
                onConfirm: () => run(() => api.submissions.remove(s.id), "Submission deleted", ["submissions"]),
              })
            }
          />
        ) : (
          <AlertsTab
            alerts={alerts}
            listings={listings}
            onToggle={(a) =>
              run(() => api.alerts.update(a.id, { active: !a.active }), a.active ? "Alert paused" : "Alert resumed", [
                "alerts",
              ])
            }
            onDelete={(a) =>
              setConfirm({
                title: `Delete the alert for ${a.phone}?`,
                onConfirm: () => run(() => api.alerts.remove(a.id), "Alert deleted", ["alerts"]),
              })
            }
          />
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.initial?.id
                ? "Edit listing"
                : editing?.fromSubmission
                  ? "Create listing from submission"
                  : "New listing"}
            </DialogTitle>
            <DialogDescription>
              {editing?.initial?.id
                ? "Changes show on the site right away."
                : "New listings start as pending until you approve them."}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <PropertyForm
              key={editing.initial?.id || editing.fromSubmission?.id || "new"}
              initial={editing.initial}
              onSubmit={handleSave}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        destructive={confirm?.destructive !== false}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm.onConfirm();
          setConfirm(null);
        }}
      />
    </div>
  );
}
