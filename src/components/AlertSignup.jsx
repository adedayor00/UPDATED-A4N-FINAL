import React, { useState } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Honeypot from "@/components/Honeypot";
import CityCombobox from "@/components/CityCombobox";
import { BUDGETS } from "@/lib/filters";
import { useT } from "@/lib/i18n";
import { formatPhone, isValidPhone } from "@/lib/validate";
import { notifyByEmail } from "@/lib/notify";
import { track } from "@/lib/analytics";

let uid = 0;

export default function AlertSignup({ defaults = {}, className = "" }) {
  const { t, lang } = useT();
  const [id] = useState(() => `al-${++uid}`);
  const [form, setForm] = useState({
    phone: "",
    city: defaults.city && defaults.city !== "all" ? defaults.city : "any",
    rent_type: defaults.type === "room" ? "per_room" : defaults.type === "unit" ? "whole_unit" : "any",
    max_rent: defaults.max && defaults.max !== "all" ? String(defaults.max) : "any",
  });
  const [trap, setTrap] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState("idle"); // idle | saving | done
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValidPhone(form.phone)) return setError(t("form.phoneInvalid"));
    if (trap) return setState("done");
    setState("saving");
    const row = {
      phone: formatPhone(form.phone),
      city: form.city,
      rent_type: form.rent_type,
      max_rent: form.max_rent === "any" ? null : Number(form.max_rent),
      lang,
      active: true,
    };
    try {
      await api.alerts.create(row);
      notifyByEmail("alert", row);
      track("alert_signup", { city: row.city });
      setState("done");
    } catch {
      setState("idle");
      setError(t("form.saveFailed"));
    }
  };

  if (state === "done") {
    return (
      <div className={`flex flex-col justify-center rounded-3xl bg-card p-6 card-shadow ${className}`} role="status">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0071e3]/10 text-[#0062c4]">
          <Check className="h-5 w-5" />
        </span>
        <p className="mt-4 font-heading text-lg font-semibold">{t("alerts.doneTitle")}</p>
        <p className="mt-1 text-[15px] text-[#6e6e73]">{t("alerts.doneText", { phone: formatPhone(form.phone) })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={`relative rounded-3xl bg-card p-6 card-shadow ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0071e3]/10 text-[#0062c4]">
          <BellRing className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-heading text-lg font-semibold">{t("alerts.title")}</h3>
          <p className="mt-0.5 text-[14px] text-[#6e6e73]">{t("alerts.text")}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
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
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-city`}>{t("form.city")}</Label>
          <CityCombobox id={`${id}-city`} value={form.city} onChange={(v) => set("city", v)} allLabel={t("filters.anyCity")} allValue="any" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-type`}>{t("filters.type")}</Label>
          <Select value={form.rent_type} onValueChange={(v) => set("rent_type", v)}>
            <SelectTrigger id={`${id}-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("filters.anyType")}</SelectItem>
              <SelectItem value="per_room">{t("filters.room")}</SelectItem>
              <SelectItem value="whole_unit">{t("filters.unit")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${id}-max`}>{t("filters.budget")}</Label>
          <Select value={form.max_rent} onValueChange={(v) => set("max_rent", v)}>
            <SelectTrigger id={`${id}-max`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("filters.anyBudget")}</SelectItem>
              {BUDGETS.map((b) => (
                <SelectItem key={b} value={String(b)}>
                  {t("filters.upTo", { amount: `$${b.toLocaleString("en-US")}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Honeypot value={trap} onChange={setTrap} />
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-3 text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-4 w-full gap-2" disabled={state === "saving"}>
        {state === "saving" ? <Loader2 className="animate-spin" /> : <BellRing />}
        {t("alerts.submit")}
      </Button>
      <p className="mt-2 text-center text-[12px] text-[#6e6e73]">{t("alerts.consent")}</p>
    </form>
  );
}
