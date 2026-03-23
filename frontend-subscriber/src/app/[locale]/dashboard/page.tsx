"use client";

import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          {t("title")}
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Revenue card */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm font-medium text-text-secondary">
              {t("revenue")}
            </p>
            <p className="mt-2 text-2xl font-bold text-success">R$ 0,00</p>
          </div>

          {/* Expenses card */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm font-medium text-text-secondary">
              {t("expenses")}
            </p>
            <p className="mt-2 text-2xl font-bold text-danger">R$ 0,00</p>
          </div>

          {/* Profit card */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm font-medium text-text-secondary">
              {t("profit")}
            </p>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              R$ 0,00
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark">
            {t("createBudget")}
          </button>
          <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background">
            {t("registerExpense")}
          </button>
          <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background">
            {t("registerIncome")}
          </button>
        </div>

        {/* Sections */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("recentTransactions")}
            </h2>
            <p className="mt-4 text-sm text-text-muted">--</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("upcomingEvents")}
            </h2>
            <p className="mt-4 text-sm text-text-muted">--</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
