import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, X, Loader2, CheckCircle2, ShieldCheck, Clock, Users } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Honeypot from "@/components/Honeypot";
import CityCombobox from "@/components/CityCombobox";
import { shrinkImage } from "@/lib/image";
import { formatPhone, isValidEmail, isValidPhone } from "@/lib/validate";
import { notifyByEmail } from "@/lib/notify";
import { track } from "@/lib/analytics";
import { useSeo } from "@/lib/seo";
import { useT } from "@/lib/i18n";
import { IS_DEMO } from "@/api/client";

const MAX_PHOTOS = 10;

function Field({ id, label, error, hint, children }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-[12px] text-[#6e6e73]">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ListYourPlace() {
  const { t, lang } = useT();
  useSeo({
    title: "List Your Rental in Newark & NJ",
    description:
      "Have a room or apartment for rent in Newark or elsewhere in New Jersey? Tell us about it and we'll put it in front of renters who are looking now.",
    path: "/list-your-place",
  });

  const [f, setF] = useState({
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    relationship: "owner",
    city: "Newark",
    neighborhood: "",
    address: "",
    rent_type: "whole_unit",
    rent: "",
    bedrooms: "2",
    bathrooms: "1",
    rooms_free: "1",
    availability: "",
    utilities: "",
    accepts_vouchers: "yes",
    pets: "ask",
    description: "",
    confirm: false,
  });
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [trap, setTrap] = useState("");
  const [state, setState] = useState("idle"); // idle | saving | done
  const set = (k, v) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((e) => (e[k] || e.form ? { ...e, [k]: undefined, form: undefined } : e));
  };
  const rooms = f.rent_type === "per_room";

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photos.length);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const small = await shrinkImage(file, IS_DEMO ? 1000 : 1600);
        urls.push(await api.storage.uploadPhoto(small, { folder: "submissions" }));
      }
      setPhotos((p) => [...p, ...urls]);
    } catch {
      setErrors((x) => ({ ...x, photos: t("list.photoFailed") }));
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!f.contact_name.trim()) e.contact_name = t("form.nameRequired");
    if (!isValidPhone(f.contact_phone)) e.contact_phone = t("form.phoneInvalid");
    if (!isValidEmail(f.contact_email)) e.contact_email = t("form.emailInvalid");
    if (!Number(f.rent) || Number(f.rent) < 100) e.rent = t("list.rentInvalid");
    if (!f.confirm) e.confirm = t("list.confirmRequired");
    setErrors(e);
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const problems = Object.keys(validate());
    if (problems.length) {
      document.getElementById(`ly-${problems[0]}`)?.focus();
      return;
    }
    if (trap) return setState("done");
    setState("saving");
    const data = {
      title: f.address.trim()
        ? f.address.trim().split(",")[0]
        : `${f.neighborhood || f.city} ${rooms ? "room" : "apartment"}`,
      address: f.address.trim(),
      city: f.city,
      neighborhood: f.neighborhood.trim(),
      rent_type: f.rent_type,
      rent: Number(f.rent),
      bedrooms: Number(f.bedrooms),
      bathrooms: Number(f.bathrooms),
      rooms_free: rooms ? Number(f.rooms_free) : 0,
      availability: f.availability.trim(),
      utilities: f.utilities.trim(),
      accepts_vouchers: f.accepts_vouchers === "yes" ? true : null,
      pets: f.pets,
      description: f.description.trim().slice(0, 3000),
    };
    const row = {
      contact_name: f.contact_name.trim().slice(0, 120),
      contact_phone: formatPhone(f.contact_phone),
      contact_email: f.contact_email.trim(),
      relationship: f.relationship,
      data: { ...data, lang },
      photos,
      status: "new",
    };
    try {
      await api.submissions.create(row);
      notifyByEmail("listing", {
        contact_name: row.contact_name,
        contact_phone: row.contact_phone,
        contact_email: row.contact_email,
        city: data.city,
        rent: data.rent,
        type: data.rent_type,
        address: data.address,
        photos: photos.length,
      });
      track("listing_submitted", { city: data.city });
      setState("done");
      window.scrollTo({ top: 0 });
    } catch {
      setState("idle");
      setErrors({ form: t("form.saveFailed") });
    }
  };

  if (state === "done") {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center sm:py-28">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0071e3]/10 text-[#0062c4]">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight">{t("list.doneTitle")}</h1>
        <p className="mt-3 text-[17px] text-[#6e6e73]">{t("list.doneText", { phone: formatPhone(f.contact_phone) })}</p>
        <Button asChild className="mt-8">
          <Link to="/">{t("list.backHome")}</Link>
        </Button>
      </div>
    );
  }

  const aria = (k) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `ly-${k}-err` } : {});

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-6 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">{t("list.title")}</h1>
          <p className="mt-4 text-[17px] text-[#6e6e73]">{t("list.sub")}</p>
          <ul className="mt-8 space-y-5">
            {[
              { icon: Users, title: t("list.b1Title"), text: t("list.b1Text") },
              { icon: ShieldCheck, title: t("list.b2Title"), text: t("list.b2Text") },
              { icon: Clock, title: t("list.b3Title"), text: t("list.b3Text") },
            ].map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0071e3]/10 text-[#0062c4]">
                  <b.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold">{b.title}</p>
                  <p className="mt-0.5 text-[15px] text-[#6e6e73]">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 rounded-2xl bg-[#f5f5f7] p-4 text-[13px] leading-relaxed text-[#6e6e73]">
            {t("list.fairHousing")}
          </p>
        </div>

        <form onSubmit={submit} noValidate className="relative space-y-8 rounded-3xl bg-card p-5 card-shadow-lg sm:p-8">
          <fieldset className="space-y-4">
            <legend className="font-heading text-lg font-semibold">{t("list.you")}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ly-contact_name" label={t("form.name")} error={errors.contact_name}>
                <Input
                  id="ly-contact_name"
                  autoComplete="name"
                  value={f.contact_name}
                  onChange={(e) => set("contact_name", e.target.value)}
                  {...aria("contact_name")}
                />
              </Field>
              <Field id="ly-contact_phone" label={t("form.phone")} error={errors.contact_phone}>
                <Input
                  id="ly-contact_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={f.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                  placeholder={t("form.phonePlaceholder")}
                  {...aria("contact_phone")}
                />
              </Field>
              <Field id="ly-contact_email" label={t("list.email")} error={errors.contact_email}>
                <Input
                  id="ly-contact_email"
                  type="email"
                  autoComplete="email"
                  value={f.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                  {...aria("contact_email")}
                />
              </Field>
              <Field id="ly-relationship" label={t("list.relationship")}>
                <Select value={f.relationship} onValueChange={(v) => set("relationship", v)}>
                  <SelectTrigger id="ly-relationship">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">{t("list.relOwner")}</SelectItem>
                    <SelectItem value="manager">{t("list.relManager")}</SelectItem>
                    <SelectItem value="tenant">{t("list.relTenant")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-heading text-lg font-semibold">{t("list.place")}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ly-city" label={t("list.cityLabel")}>
                <CityCombobox id="ly-city" value={f.city} onChange={(v) => set("city", v)} />
              </Field>
              <Field id="ly-neighborhood" label={t("list.neighborhood")}>
                <Input
                  id="ly-neighborhood"
                  value={f.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                  placeholder={t("list.neighborhoodPh")}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field id="ly-address" label={t("list.address")} hint={t("list.addressHint")}>
                  <Input
                    id="ly-address"
                    autoComplete="street-address"
                    value={f.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder={t("list.addressPh")}
                  />
                </Field>
              </div>
              <Field id="ly-rent_type" label={t("filters.type")}>
                <Select value={f.rent_type} onValueChange={(v) => set("rent_type", v)}>
                  <SelectTrigger id="ly-rent_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whole_unit">{t("filters.unit")}</SelectItem>
                    <SelectItem value="per_room">{t("list.roomsInShare")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="ly-rent" label={rooms ? t("list.rentPerRoom") : t("list.rentMonthly")} error={errors.rent}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73]">
                    $
                  </span>
                  <Input
                    id="ly-rent"
                    inputMode="numeric"
                    value={f.rent}
                    onChange={(e) => set("rent", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-7"
                    placeholder="1500"
                    {...aria("rent")}
                  />
                </div>
              </Field>
              <Field id="ly-bedrooms" label={t("list.bedrooms")}>
                <Select value={f.bedrooms} onValueChange={(v) => set("bedrooms", v)}>
                  <SelectTrigger id="ly-bedrooms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "1", "2", "3", "4", "5", "6"].map((n) => (
                      <SelectItem key={n} value={n}>
                        {n === "0" ? t("list.studio") : n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="ly-bathrooms" label={t("list.bathrooms")}>
                <Select value={f.bathrooms} onValueChange={(v) => set("bathrooms", v)}>
                  <SelectTrigger id="ly-bathrooms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1", "1.5", "2", "2.5", "3", "3.5"].map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {rooms && (
                <Field id="ly-rooms_free" label={t("list.roomsFree")}>
                  <Select value={f.rooms_free} onValueChange={(v) => set("rooms_free", v)}>
                    <SelectTrigger id="ly-rooms_free">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["1", "2", "3", "4", "5"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field id="ly-availability" label={t("list.availability")}>
                <Input
                  id="ly-availability"
                  value={f.availability}
                  onChange={(e) => set("availability", e.target.value)}
                  placeholder={t("list.availabilityPh")}
                />
              </Field>
              <Field id="ly-utilities" label={t("detail.utilities")}>
                <Input
                  id="ly-utilities"
                  value={f.utilities}
                  onChange={(e) => set("utilities", e.target.value)}
                  placeholder={t("list.utilitiesPh")}
                />
              </Field>
              <Field id="ly-vouchers" label={t("list.vouchers")} hint={t("list.vouchersHint")}>
                <Select value={f.accepts_vouchers} onValueChange={(v) => set("accepts_vouchers", v)}>
                  <SelectTrigger id="ly-vouchers">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("list.vouchersYes")}</SelectItem>
                    <SelectItem value="unspecified">{t("list.vouchersUnspecified")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="ly-pets" label={t("list.pets")}>
                <Select value={f.pets} onValueChange={(v) => set("pets", v)}>
                  <SelectTrigger id="ly-pets">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("detail.petsYes")}</SelectItem>
                    <SelectItem value="no">{t("detail.petsNo")}</SelectItem>
                    <SelectItem value="ask">{t("detail.petsAsk")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field id="ly-description" label={t("list.description")}>
                  <Textarea
                    id="ly-description"
                    rows={4}
                    maxLength={3000}
                    value={f.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder={t("list.descriptionPh")}
                  />
                </Field>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-heading text-lg font-semibold">{t("list.photos")}</legend>
            <p className="text-[13px] text-[#6e6e73]">{t("list.photosHint")}</p>
            <div className="flex flex-wrap gap-3">
              {photos.map((p, i) => (
                <div key={p} className="relative h-24 w-28 overflow-hidden rounded-xl border border-border">
                  <img
                    src={p}
                    alt={t("detail.photoN", { n: i + 1, total: photos.length })}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((x) => x.filter((u) => u !== p))}
                    aria-label={t("list.removePhoto")}
                    className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex h-24 w-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-[12px] text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3] focus-within:border-[#0071e3]">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" /> {t("list.addPhotos")}
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={addPhotos}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            {errors.photos && <p className="text-[13px] font-medium text-destructive">{errors.photos}</p>}
          </fieldset>

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed">
              <input
                id="ly-confirm"
                type="checkbox"
                checked={f.confirm}
                onChange={(e) => set("confirm", e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#0071e3]"
                {...aria("confirm")}
              />
              <span>{t("list.confirm")}</span>
            </label>
            {errors.confirm && (
              <p id="ly-confirm-err" className="mt-1 pl-8 text-[13px] font-medium text-destructive">
                {errors.confirm}
              </p>
            )}
          </div>

          <Honeypot value={trap} onChange={setTrap} />
          {errors.form && (
            <p role="alert" className="text-[14px] font-medium text-destructive">
              {errors.form}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full gap-2" disabled={state === "saving" || uploading}>
            {state === "saving" && <Loader2 className="animate-spin" />}
            {t("list.submit")}
          </Button>
          <p className="text-center text-[12px] text-[#6e6e73]">
            {t("list.privacy")}{" "}
            <Link to="/privacy" className="text-[#0071e3] hover:underline">
              {t("footer.privacy")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
