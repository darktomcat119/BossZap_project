"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Upload, Save, Building2, CreditCard, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock data ──────────────────────────────────────────────
const mockProfile = {
  name: "Silva Design Studio",
  address: "Rua das Flores, 123 - Centro, Sao Paulo - SP",
  phone: "(11) 99999-8888",
  email: "contato@silvadesign.com.br",
};

const mockSubscription = {
  plan: "Pro",
  status: "active" as const,
  nextBilling: "2026-04-15",
};

const mockPayments = [
  { id: 1, date: "2026-03-15", amount: 49.90, status: "paid" },
  { id: 2, date: "2026-02-15", amount: 49.90, status: "paid" },
  { id: 3, date: "2026-01-15", amount: 49.90, status: "paid" },
  { id: 4, date: "2025-12-15", amount: 49.90, status: "paid" },
  { id: 5, date: "2025-11-15", amount: 49.90, status: "paid" },
];

const SUBSCRIPTION_STATUS: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-danger/10 text-danger",
  trial: "bg-warning/10 text-warning",
};

export default function ProfilePage() {
  const t = useTranslations("profile");

  const [name, setName] = useState(mockProfile.name);
  const [address, setAddress] = useState(mockProfile.address);
  const [phone, setPhone] = useState(mockProfile.phone);
  const [email, setEmail] = useState(mockProfile.email);
  const [language, setLanguage] = useState("pt-BR");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          {t("title")}
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column: Business info + Logo */}
          <div className="space-y-6 lg:col-span-2">
            {/* Business info form */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {t("businessInfo")}
                </h2>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t("businessName")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t("address")}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t("phone")}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Logo section */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">
                {t("logo")}
              </h2>
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-background">
                  <Building2 className="h-10 w-10 text-text-muted" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">
                    {t("logoHint")}
                  </p>
                  <button className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface">
                    <Upload className="h-4 w-4" />
                    {t("uploadLogo")}
                  </button>
                </div>
              </div>
            </div>

            {/* Language preference */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">
                {t("languagePreference")}
              </h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-48"
              >
                <option value="pt-BR">Portugues (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Espanol</option>
              </select>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors",
                saved
                  ? "bg-success"
                  : "bg-primary hover:bg-primary-dark",
                saving && "opacity-60"
              )}
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t("saved")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {saving ? t("saving") : t("saveChanges")}
                </>
              )}
            </button>
          </div>

          {/* Right column: Subscription + Payment history */}
          <div className="space-y-6">
            {/* Subscription */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {t("subscription")}
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{t("plan")}</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {mockSubscription.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{t("status")}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      SUBSCRIPTION_STATUS[mockSubscription.status]
                    )}
                  >
                    {t(mockSubscription.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{t("nextBilling")}</span>
                  <span className="text-sm text-text-primary">
                    {mockSubscription.nextBilling}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment history */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">
                {t("paymentHistory")}
              </h2>
              <div className="mt-4 space-y-2">
                {mockPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-background"
                  >
                    <div>
                      <p className="text-sm text-text-primary">{payment.date}</p>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        {t(payment.status)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      R$ {payment.amount.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
