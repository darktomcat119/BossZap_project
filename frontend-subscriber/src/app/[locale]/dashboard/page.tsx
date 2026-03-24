"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { SummaryCard } from "@/components/shared/summary-card";
import { FabMenu } from "@/components/shared/fab-menu";
import { RevenueExpensesChart } from "@/components/charts/revenue-expenses-chart";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Calendar,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

// ── Mock data ──────────────────────────────────────────────
const mockChartData = [
  { month: "Jan", income: 4200, expense: 2800 },
  { month: "Feb", income: 3800, expense: 3100 },
  { month: "Mar", income: 5100, expense: 2900 },
  { month: "Apr", income: 4600, expense: 3400 },
  { month: "May", income: 5800, expense: 3200 },
  { month: "Jun", income: 6200, expense: 3600 },
];

const mockEvents = [
  { id: 1, title: "Client meeting - Silva Corp", date: "2026-03-25", time: "10:00" },
  { id: 2, title: "Invoice due - Project Alpha", date: "2026-03-26", time: "12:00" },
  { id: 3, title: "Tax payment deadline", date: "2026-03-28", time: "18:00" },
  { id: 4, title: "Service delivery - Maria Santos", date: "2026-03-30", time: "14:00" },
  { id: 5, title: "Monthly report review", date: "2026-03-31", time: "09:00" },
];

const mockTransactions = [
  { id: 1, type: "income" as const, description: "Web design - Silva Corp", amount: 2500, date: "2026-03-24" },
  { id: 2, type: "expense" as const, description: "Cloud hosting", amount: -89.90, date: "2026-03-23" },
  { id: 3, type: "income" as const, description: "Logo design - Bakery", amount: 800, date: "2026-03-22" },
  { id: 4, type: "expense" as const, description: "Software license", amount: -49.90, date: "2026-03-21" },
  { id: 5, type: "income" as const, description: "Social media - Gym", amount: 1200, date: "2026-03-20" },
  { id: 6, type: "expense" as const, description: "Office supplies", amount: -125.00, date: "2026-03-19" },
  { id: 7, type: "income" as const, description: "Consultation - Tech Co", amount: 450, date: "2026-03-18" },
  { id: 8, type: "expense" as const, description: "Internet bill", amount: -119.90, date: "2026-03-17" },
  { id: 9, type: "income" as const, description: "Maintenance contract", amount: 1800, date: "2026-03-16" },
  { id: 10, type: "expense" as const, description: "Transport", amount: -65.00, date: "2026-03-15" },
];

// ── Skeleton loader ────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-lg bg-border" />
        <div className="h-5 w-14 rounded-full bg-border" />
      </div>
      <div className="mt-3 h-4 w-24 rounded bg-border" />
      <div className="mt-2 h-7 w-32 rounded bg-border" />
      <div className="mt-1 h-3 w-20 rounded bg-border" />
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [loading] = useState(false);

  const fabActions = [
    {
      icon: FileText,
      label: t("createBudget"),
      onClick: () => console.log("create budget"),
    },
    {
      icon: ArrowDownCircle,
      label: t("registerExpense"),
      onClick: () => console.log("register expense"),
    },
    {
      icon: ArrowUpCircle,
      label: t("registerIncome"),
      onClick: () => console.log("register income"),
    },
  ];

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          {t("title")}
        </h1>

        {/* Summary cards */}
        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard
              icon={DollarSign}
              label={t("revenue")}
              value="R$ 6.200,00"
              change={12.5}
              changeLabel={t("vsLastMonth")}
            />
            <SummaryCard
              icon={TrendingDown}
              label={t("expenses")}
              value="R$ 3.600,00"
              change={-4.2}
              changeLabel={t("vsLastMonth")}
            />
            <SummaryCard
              icon={TrendingUp}
              label={t("profit")}
              value="R$ 2.600,00"
              change={8.3}
              changeLabel={t("vsLastMonth")}
            />
            <SummaryCard
              icon={Calendar}
              label={t("upcomingEvents")}
              value="5"
              change={0}
              changeLabel={t("thisWeek")}
            />
          </div>
        )}

        {/* Quick actions (desktop) */}
        <div className="mt-8 hidden flex-wrap gap-3 md:flex">
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

        {/* Revenue vs Expenses chart */}
        <div className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            {t("revenueVsExpenses")}
          </h2>
          <RevenueExpensesChart
            data={mockChartData}
            incomeLabel={t("revenue")}
            expenseLabel={t("expenses")}
          />
        </div>

        {/* Two-column: Events & Transactions */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming events */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("upcomingEvents")}
            </h2>
            <ul className="mt-4 space-y-3">
              {mockEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-background"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10">
                    <Calendar className="h-4 w-4 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {event.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {event.date} - {event.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent transactions */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("recentTransactions")}
            </h2>
            <ul className="mt-4 space-y-2">
              {mockTransactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        tx.type === "income"
                          ? "bg-success/10"
                          : "bg-danger/10"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <ArrowUpCircle className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-danger" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {tx.description}
                      </p>
                      <p className="text-xs text-text-muted">{tx.date}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === "income" ? "text-success" : "text-danger"
                    }`}
                  >
                    {tx.type === "income" ? "+" : ""}
                    R$ {Math.abs(tx.amount).toFixed(2).replace(".", ",")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <FabMenu actions={fabActions} />
    </AppShell>
  );
}
