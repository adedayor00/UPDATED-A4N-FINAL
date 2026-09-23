import React, { useState } from "react";
import { MessageCircle, Send, Instagram, Smartphone, Pencil, CheckCircle2, Phone, Loader2 } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Honeypot from "@/components/Honeypot";
import CityCombobox from "@/components/CityCombobox";
import { SMS, buildInquiryMessage, instagramUrl, smsUrl, telegramUrl, whatsappUrl } from "@/lib/contact";
import { listingPath } from "@/lib/listing";
import { SITE_URL } from "@/lib/site";
import { useT } from "@/lib/i18n";
import { formatPhone, isValidPhone, isValidZip } from "@/lib/validate";
import { notifyByEmail } from "@/lib/notify";
import { track } from "@/lib/analytics";

const MOVE_IN = ["asap", "month", "later", "flexible"];
let uid = 0;

export default function InquiryForm({ property, defaultCity }) {
  const { t, lang } = useT();
  const { toast } = useToast();
  const [id] = useState(() => `iq-${++uid}`);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: defaultCity || property?.city || "Newark",
    zip: "",
    move_in: "asap",
    voucher: false,
    message: property ? t("inquiry.defaultMessage", { title: property.title }) : "",
  });
  const [trap, setTrap] = useState("");
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form"); // form | saving | sent
  const [saved, setSaved] = useState(true);
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  const listingUrl = property ? SITE_URL + listingPath(property) : undefined;
  const message = buildInquiryMessage(
    { ...form, move_in: t(`inquiry.moveIn.${form.move_in}`), lang },
    property,
    listingUrl,
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t("form.nameRequired");
    if (!isValidPhone(form.phone)) e.phone = t("form.phoneInvalid");
    if (!isValidZip(form.zip)) e.zip = t("form.zipInvalid");
    setErrors(e);
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problems = Object.keys(validate());
    if (problems.length) {
      document.getElementById(`${id}-${problems[0]}`)?.focus();
      return;
    }
    if (trap) return setStep("sent"); // bot
    setStep("saving");
    const row = {
      name: form.name.trim().slice(0, 120),
      phone: formatPhone(form.phone),
      city: form.city,
      zip: form.zip.trim(),
      message: [
        form.message.trim(),
        `Move-in: ${t(`inquiry.moveIn.${form.move_in}`)}`,
        form.voucher ? "Has a housing voucher." : "",
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 2000),
      property_id: property?.id || null,
      property_title: property?.title || "",
      lang,
      status: "new",
    };
    try {
      await api.inquiries.create(row);
      setSaved(true);
    } catch {
      setSaved(false);
    }
    notifyByEmail("inquiry", { ...row, listing: listingUrl });
    track("inquiry_submitted", { city: row.city, listing: property ? "yes" : "no" });
    setStep("sent");
  };

  const channel = (name) => track("contact_channel", { channel: name });

  const copyAndOpen = async (url, label) => {
    channel(label);
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: t("inquiry.copied"), description: t("inquiry.pasteInto", { app: label }) });
    } catch {
      /* clipboard can be blocked; the app still opens */
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (step !== "sent") {
    const err = (k) =>
      errors[k] ? (
        <p id={`${id}-${k}-err`} className="text-[13px] font-medium text-destructive">
          {errors[k]}
        </p>
      ) : null;
    const described = (k) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${id}-${k}-err` } : {});
    return (
      <form onSubmit={handleSubmit} noValidate className="relative space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-name`}>{t("form.name")}</Label>
          <Input
            id={`${id}-name`}
            autoComplete="name"
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={t("form.namePlaceholder")}
            {...described("name")}
          />
          {err("name")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-phone`}>{t("form.phone")}</Label>
          <Input
            id={`${id}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder={t("form.phonePlaceholder")}
            {...described("phone")}
          />
          {err("phone")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`${id}-city`}>{t("form.city")}</Label>
            <CityCombobox id={`${id}-city`} value={form.city} onChange={(v) => set("city", v)} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`${id}-zip`}>{t("form.zip")}</Label>
            <Input
              id={`${id}-zip`}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              value={form.zip}
              onChange={(e) => set("zip", e.target.value.replace(/\D/g, ""))}
              placeholder="07103"
              {...described("zip")}
            />
            {err("zip")}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-move`}>{t("inquiry.moveInLabel")}</Label>
          <Select value={form.move_in} onValueChange={(v) => set("move_in", v)}>
            <SelectTrigger id={`${id}-move`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOVE_IN.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(`inquiry.moveIn.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-2 text-[15px] md:text-sm">
          <input
            type="checkbox"
            checked={form.voucher}
            onChange={(e) => set("voucher", e.target.checked)}
            className="h-5 w-5 accent-[#0071e3]"
          />
          {t("inquiry.voucher")}
        </label>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-message`}>{t("form.message")}</Label>
          <Textarea
            id={`${id}-message`}
            rows={3}
            maxLength={1500}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder={t("inquiry.messagePlaceholder")}
          />
        </div>
        <Honeypot value={trap} onChange={setTrap} />
        <Button type="submit" className="w-full gap-2" disabled={step === "saving"}>
          {step === "saving" ? <Loader2 className="animate-spin" /> : <Send />}
          {t("inquiry.submit")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t("inquiry.tagline")}</p>
      </form>
    );
  }

  const ig = instagramUrl();
  const tg = telegramUrl();

  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className={`rounded-2xl p-4 ${saved ? "bg-[#0071e3]/[0.07]" : "bg-amber-50"}`}>
        <div className="flex items-center gap-2 font-heading font-semibold">
          <CheckCircle2 className={`h-5 w-5 ${saved ? "text-[#0071e3]" : "text-amber-600"}`} />
          {saved ? t("inquiry.sentTitle") : t("inquiry.notSavedTitle")}
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#1d1d1f]/80">
          {saved ? t("inquiry.sentText", { phone: formatPhone(form.phone) }) : t("inquiry.notSavedText")}
        </p>
        <dl className="mt-3 space-y-0.5 text-[13px] text-[#6e6e73]">
          <div>
            <dt className="inline font-medium text-foreground">{t("form.name")}:</dt>{" "}
            <dd className="inline">{form.name}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-foreground">{t("form.phone")}:</dt>{" "}
            <dd className="inline">{formatPhone(form.phone)}</dd>
          </div>
          {property && (
            <div>
              <dt className="inline font-medium text-foreground">{t("inquiry.listing")}:</dt>{" "}
              <dd className="inline">{property.title}</dd>
            </div>
          )}
        </dl>
        <Button variant="ghost" size="sm" onClick={() => setStep("form")} className="mt-2 -ml-2 gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> {t("inquiry.edit")}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">{saved ? t("inquiry.faster") : t("inquiry.sendVia")}</p>
        <div className="grid gap-2">
          <Button
            onClick={() => {
              channel("whatsapp");
              window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
            }}
            className="gap-2 bg-[#0F7B6C] text-white hover:bg-[#0b6659]"
          >
            <MessageCircle /> WhatsApp
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                channel("sms");
                window.location.href = smsUrl(message);
              }}
            >
              <Smartphone /> {t("inquiry.text")}
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href={`tel:${SMS}`} onClick={() => channel("call")}>
                <Phone /> {t("inquiry.call")}
              </a>
            </Button>
          </div>
          {(ig || tg) && (
            <div className="grid grid-cols-2 gap-2">
              {ig && (
                <Button variant="outline" className="gap-2" onClick={() => copyAndOpen(ig, "Instagram")}>
                  <Instagram /> Instagram
                </Button>
              )}
              {tg && (
                <Button variant="outline" className="gap-2" onClick={() => copyAndOpen(tg, "Telegram")}>
                  <Send /> Telegram
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
