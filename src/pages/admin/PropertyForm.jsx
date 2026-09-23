import React, { useState } from "react";
import { X, Plus, Trash2, Upload, Loader2, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, IS_DEMO } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import CityCombobox from "@/components/CityCombobox";
import { shrinkImage } from "@/lib/image";

const emptyRoom = { name: "", type: "Shared · 1 bath", price: 0, status: "free" };
const MAX_PHOTOS = 20;

const EDITABLE = [
  "title",
  "address",
  "city",
  "neighborhood",
  "bedrooms",
  "bathrooms",
  "rent",
  "rent_type",
  "rooms_free",
  "availability",
  "utilities",
  "deposit",
  "description",
  "photos",
  "rooms",
  "accepts_vouchers",
  "pets",
];

function Field({ id, label, hint, error, children, className = "" }) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-[13px] font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[#6e6e73]">{hint}</p>
      ) : null}
    </div>
  );
}

export default function PropertyForm({ initial, onSubmit, submitting, submitLabel }) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => {
    const base = {
      title: "",
      address: "",
      city: "Newark",
      neighborhood: "",
      bedrooms: 3,
      bathrooms: 1,
      rent: "",
      rent_type: "whole_unit",
      rooms_free: 0,
      availability: "Now",
      utilities: "Ask",
      deposit: "Ask",
      description: "",
      photos: [],
      rooms: [],
      accepts_vouchers: null,
      pets: "ask",
    };
    const merged = { ...base, ...(initial || {}) };
    return Object.fromEntries(EDITABLE.map((k) => [k, merged[k] ?? base[k]]));
  });
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };
  const rooms = form.rent_type === "per_room";
  const hasRoomList = rooms && form.rooms?.length > 0;

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - form.photos.length);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const small = await shrinkImage(file, IS_DEMO ? 1000 : 1600);
        urls.push(await api.storage.uploadPhoto(small, { folder: "listings" }));
      }
      setForm((f) => ({ ...f, photos: [...f.photos, ...urls] }));
      toast({ title: `${urls.length} photo${urls.length === 1 ? "" : "s"} added` });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const movePhoto = (i, dir) => {
    const p = [...form.photos];
    const j = dir === "first" ? 0 : i + dir;
    if (j < 0 || j >= p.length) return;
    const [item] = p.splice(i, 1);
    p.splice(j, 0, item);
    set("photos", p);
  };

  const addRoom = () =>
    set("rooms", [
      ...(form.rooms || []),
      { ...emptyRoom, name: `Room ${(form.rooms?.length || 0) + 1}`, price: Number(form.rent) || 0 },
    ]);
  const updateRoom = (i, k, v) =>
    set(
      "rooms",
      form.rooms.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    );
  const removeRoom = (i) =>
    set(
      "rooms",
      form.rooms.filter((_, idx) => idx !== i),
    );

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = "Give the listing a short title (street or area).";
    if (!Number(form.rent) || Number(form.rent) < 1) errs.rent = "Enter the monthly rent.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const out = {
      ...form,
      title: form.title.trim(),
      rent: Number(form.rent),
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      rooms: rooms ? form.rooms.map((r) => ({ ...r, price: Number(r.price) || 0 })) : [],
    };
    out.rooms_free = rooms
      ? out.rooms.length
        ? out.rooms.filter((r) => r.status === "free").length
        : Number(form.rooms_free) || 0
      : 0;
    onSubmit(out);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pf-title" label="Title *" error={errors.title} hint="Street or area, e.g. “South 20th St”">
          <Input id="pf-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field id="pf-address" label="Address shown to renters" hint="Or “Address on request”">
          <Input id="pf-address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field id="pf-city" label="City">
          <CityCombobox id="pf-city" value={form.city} onChange={(v) => set("city", v)} />
        </Field>
        <Field id="pf-neighborhood" label="Neighborhood">
          <Input
            id="pf-neighborhood"
            value={form.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
            placeholder="e.g. West Ward"
          />
        </Field>
        <Field id="pf-rent_type" label="Rent type">
          <Select value={form.rent_type} onValueChange={(v) => set("rent_type", v)}>
            <SelectTrigger id="pf-rent_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whole_unit">Whole unit</SelectItem>
              <SelectItem value="per_room">Rooms in a shared apartment</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field
          id="pf-rent"
          label={rooms ? "Rent per room (USD / month) *" : "Rent (USD / month) *"}
          error={errors.rent}
        >
          <Input
            id="pf-rent"
            inputMode="numeric"
            value={form.rent}
            onChange={(e) => set("rent", e.target.value.replace(/[^\d]/g, ""))}
          />
        </Field>
        <Field id="pf-bedrooms" label="Bedrooms">
          <Input
            id="pf-bedrooms"
            type="number"
            min="0"
            max="20"
            value={form.bedrooms}
            onChange={(e) => set("bedrooms", e.target.value)}
          />
        </Field>
        <Field id="pf-bathrooms" label="Bathrooms">
          <Input
            id="pf-bathrooms"
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={form.bathrooms}
            onChange={(e) => set("bathrooms", e.target.value)}
          />
        </Field>
        {rooms && (
          <Field
            id="pf-rooms_free"
            label="Rooms free"
            hint={hasRoomList ? "Counted automatically from the room list below." : undefined}
          >
            <Input
              id="pf-rooms_free"
              type="number"
              min="0"
              disabled={hasRoomList}
              value={hasRoomList ? form.rooms.filter((r) => r.status === "free").length : form.rooms_free}
              onChange={(e) => set("rooms_free", e.target.value)}
            />
          </Field>
        )}
        <Field id="pf-availability" label="Available">
          <Input
            id="pf-availability"
            value={form.availability}
            onChange={(e) => set("availability", e.target.value)}
            placeholder="Now, Oct 1…"
          />
        </Field>
        <Field id="pf-utilities" label="Utilities">
          <Input
            id="pf-utilities"
            value={form.utilities}
            onChange={(e) => set("utilities", e.target.value)}
            placeholder="Included / Tenant pays / Ask"
          />
        </Field>
        <Field id="pf-deposit" label="Deposit">
          <Input
            id="pf-deposit"
            value={form.deposit}
            onChange={(e) => set("deposit", e.target.value)}
            placeholder="1 month / Ask"
          />
        </Field>
        <Field
          id="pf-vouchers"
          label="Housing vouchers"
          hint="NJ law bars refusing renters who pay with vouchers (Section 8 etc.), so there's no “No” option."
        >
          <Select
            value={form.accepts_vouchers ? "yes" : "unspecified"}
            onValueChange={(v) => set("accepts_vouchers", v === "yes" ? true : null)}
          >
            <SelectTrigger id="pf-vouchers">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Vouchers welcome (show the badge)</SelectItem>
              <SelectItem value="unspecified">Don't show a badge</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="pf-pets" label="Pets">
          <Select value={form.pets || "ask"} onValueChange={(v) => set("pets", v)}>
            <SelectTrigger id="pf-pets">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Pets allowed</SelectItem>
              <SelectItem value="no">No pets (service animals always allowed)</SelectItem>
              <SelectItem value="ask">Ask</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field id="pf-description" label="About this place">
        <Textarea
          id="pf-description"
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Shared areas, transit, what's included…"
        />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium">Photos</p>
        <p className="text-[12px] text-[#6e6e73]">
          Real photos of this place only. The first photo is the cover. Big phone photos are shrunk automatically.
        </p>
        <div className="flex flex-wrap gap-3">
          {form.photos.map((p, i) => (
            <div key={p + i} className="group relative h-24 w-32 overflow-hidden rounded-xl border border-border">
              <img src={p} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <span className="flex gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(i, "first")}
                      aria-label="Make cover"
                      title="Make cover"
                      className="grid h-7 w-7 place-items-center rounded-full bg-white/90"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(i, -1)}
                      aria-label="Move left"
                      className="grid h-7 w-7 place-items-center rounded-full bg-white/90"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {i < form.photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(i, 1)}
                      aria-label="Move right"
                      className="grid h-7 w-7 place-items-center rounded-full bg-white/90"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "photos",
                      form.photos.filter((_, idx) => idx !== i),
                    )
                  }
                  aria-label="Remove photo"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {form.photos.length < MAX_PHOTOS && (
            <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-xs text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3] focus-within:border-[#0071e3]">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5" /> Upload
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      {rooms && (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Rooms in this apartment</p>
            <Button type="button" size="sm" variant="outline" onClick={addRoom} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add room
            </Button>
          </div>
          {form.rooms.length === 0 && (
            <p className="text-sm text-[#6e6e73]">
              Optional. Add each room to show which are free and which are taken.
            </p>
          )}
          {form.rooms.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-2 items-end gap-2 rounded-xl bg-[#f5f5f7] p-3 sm:grid-cols-[1fr_1.2fr_0.8fr_0.9fr_auto] sm:bg-transparent sm:p-0"
            >
              <Field id={`pf-room-${i}-name`} label="Name">
                <Input
                  id={`pf-room-${i}-name`}
                  value={r.name}
                  onChange={(e) => updateRoom(i, "name", e.target.value)}
                  placeholder="Room 1"
                />
              </Field>
              <Field id={`pf-room-${i}-type`} label="Details">
                <Input
                  id={`pf-room-${i}-type`}
                  value={r.type}
                  onChange={(e) => updateRoom(i, "type", e.target.value)}
                  placeholder="Shared · 1 bath"
                />
              </Field>
              <Field id={`pf-room-${i}-price`} label="Price">
                <Input
                  id={`pf-room-${i}-price`}
                  inputMode="numeric"
                  value={r.price}
                  onChange={(e) => updateRoom(i, "price", e.target.value.replace(/[^\d]/g, ""))}
                />
              </Field>
              <Field id={`pf-room-${i}-status`} label="Status">
                <Select value={r.status} onValueChange={(v) => updateRoom(i, "status", v)}>
                  <SelectTrigger id={`pf-room-${i}-status`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="taken">Taken</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeRoom(i)}
                className="text-destructive"
                aria-label={`Remove ${r.name || "room"}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
        <Button type="submit" disabled={submitting || uploading} className="gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel || (initial?.id ? "Save changes" : "Create listing")}
        </Button>
      </div>
    </form>
  );
}
