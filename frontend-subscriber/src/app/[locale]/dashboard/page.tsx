"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { SummaryCard } from "@/components/shared/summary-card";
import { FabMenu } from "@/components/shared/fab-menu";
import { RevenueExpensesChart } from "@/components/charts/revenue-expenses-chart";
import { FinancialRecordModal } from "@/components/forms/financial-record-modal";
import { CreateBudgetModal } from "@/components/forms/create-budget-modal";
import { financialService } from "@/services/financial.service";
import { eventsService } from "@/services/events.service";
import { budgetsService } from "@/services/budgets.service";
import { useWebSocketEvent } from "@/hooks/use-websocket";
import type {
  FinancialSummary,
  MonthlyTrend,
  CalendarEvent,
  FinancialRecord,
} from "@/lib/types";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Calendar,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  ChevronRight,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

// ─── Date helpers ───────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// Current period: last 30 days. Previous period: 30 days before that.
const PERIOD_DAYS = 30;
const currentStart = () => daysAgo(PERIOD_DAYS);
const currentEnd = () => today();
const prevStart = () => daysAgo(PERIOD_DAYS * 2);
const prevEnd = () => daysAgo(PERIOD_DAYS + 1);

// ─── Formatting helpers ─────────────────────────────────────────────────────

function n(v: unknown): number {
  return typeof v === "string" ? parseFloat(v) || 0 : Number(v) || 0;
}

function formatCurrency(value: unknown): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n(value));
}

function pctChange(current: unknown, previous: unknown): number {
  const c = n(current);
  const p = n(previous);
  if (p === 0) return c > 0 ? 100 : 0;
  return Math.round(((c - p) / p) * 1000) / 10;
}

// ─── Event color assignment ─────────────────────────────────────────────────

const EVENT_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-info",
  "bg-warning",
  "bg-success",
];

function eventColor(index: number): string {
  return EVENT_COLORS[index % EVENT_COLORS.length];
}

// ─── Skeleton components ────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border/50 bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="h-11 w-11 rounded-xl bg-border/50" />
        <div className="h-6 w-14 rounded-full bg-border/50" />
      </div>
      <div className="mt-3.5 h-4 w-24 rounded bg-border/50" />
      <div className="mt-2 h-7 w-32 rounded bg-border/50" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <div className="h-full w-full animate-pulse rounded-lg bg-border/30" />
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <ul className="divide-y divide-border/30">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-3.5">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-border/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-border/50" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-border/50" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Error banner ───────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const tCommon = useTranslations("common");
  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-5 py-4">
      <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
      <p className="flex-1 text-sm text-danger">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-danger/10 px-4 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20"
      >
        {tCommon("retry")}
      </button>
    </div>
  );
}

// ─── Dashboard state ────────────────────────────────────────────────────────

interface DashboardState {
  summary: FinancialSummary | null;
  prevSummary: FinancialSummary | null;
  trend: MonthlyTrend[];
  events: CalendarEvent[];
  transactions: FinancialRecord[];
  pendingBudgets: { count: number; total: number } | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: DashboardState = {
  summary: null,
  prevSummary: null,
  trend: [],
  events: [],
  transactions: [],
  pendingBudgets: null,
  loading: true,
  error: null,
};

// ─── Page component ─────────────────────────────────────────────────────────

type ActiveModal = "income" | "expense" | "budget" | null;

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const fetchData = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    Promise.all([
      financialService.getSummary(currentStart(), currentEnd()),
      financialService.getSummary(prevStart(), prevEnd()),
      financialService.getMonthlyTrend(6),
      eventsService.getUpcoming(5),
      financialService.getRecords({ limit: 8 }),
      budgetsService.getPendingSummary(),
    ])
      .then(([sumRes, prevRes, trendRes, eventsRes, txRes, pendingRes]) => {
        const txRaw = txRes.data as any;
        const trendRaw = trendRes.data as any;
        setState({
          summary: sumRes.data,
          prevSummary: prevRes.data,
          trend: Array.isArray(trendRaw) ? trendRaw : [],
          events: Array.isArray(eventsRes.data) ? eventsRes.data : [],
          transactions: Array.isArray(txRaw) ? txRaw : (txRaw?.records ?? []),
          pendingBudgets: pendingRes.data ?? null,
          loading: false,
          error: null,
        });
      })
      .catch((err: Error) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || t("loadError"),
        }));
      });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Real-time updates via WebSocket ────────────────────────────────────────

  useWebSocketEvent("financial:created", (record) => {
    setState((prev) => {
      const newTransactions = [record, ...prev.transactions].slice(0, 8);
      const newSummary = prev.summary
        ? {
            ...prev.summary,
            total_income:
              prev.summary.total_income +
              (record.type === "income" ? record.amount : 0),
            total_expense:
              prev.summary.total_expense +
              (record.type === "expense" ? record.amount : 0),
            net:
              prev.summary.net +
              (record.type === "income" ? record.amount : -record.amount),
            count: prev.summary.count + 1,
          }
        : prev.summary;
      return { ...prev, transactions: newTransactions, summary: newSummary };
    });
  });

  useWebSocketEvent("event:created", (event) => {
    setState((prev) => ({
      ...prev,
      events: [event, ...prev.events].slice(0, 5),
    }));
  });

  const { summary, prevSummary, trend, events, transactions, pendingBudgets, loading, error } =
    state;

  // Compute % changes
  const revenueChange = pctChange(
    summary?.total_income ?? 0,
    prevSummary?.total_income ?? 0,
  );
  const expenseChange = pctChange(
    summary?.total_expense ?? 0,
    prevSummary?.total_expense ?? 0,
  );
  const profitChange = pctChange(
    summary?.net ?? 0,
    prevSummary?.net ?? 0,
  );

  const fabActions = [
    { icon: FileText, label: t("createBudget"), onClick: () => setActiveModal("budget") },
    { icon: ArrowDownCircle, label: t("registerExpense"), onClick: () => setActiveModal("expense") },
    { icon: ArrowUpCircle, label: t("registerIncome"), onClick: () => setActiveModal("income") },
  ];

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {t("subtitle")}
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {t("aiActive")}
            </span>
          </div>
        </div>

        {/* Error state */}
        {error && <ErrorBanner message={error} onRetry={fetchData} />}

        {/* Summary cards */}
        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : summary ? (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard
              icon={DollarSign}
              label={t("revenue")}
              value={formatCurrency(summary.total_income)}
              change={revenueChange}
              changeLabel={t("vsLastMonth")}
            />
            <SummaryCard
              icon={TrendingDown}
              label={t("expenses")}
              value={formatCurrency(summary.total_expense)}
              change={expenseChange}
              changeLabel={t("vsLastMonth")}
            />
            <SummaryCard
              icon={TrendingUp}
              label={t("profit")}
              value={formatCurrency(summary.net)}
              change={profitChange}
              changeLabel={t("vsLastMonth")}
            />
            <SummaryCard
              icon={ClipboardList}
              label={t("pendingBudgets")}
              value={formatCurrency(pendingBudgets?.total ?? 0)}
              change={0}
              changeLabel={`${pendingBudgets?.count ?? 0} ${t("openDocuments")}`}
            />
          </div>
        ) : null}

        {/* Quick actions (desktop) */}
        <div className="mt-8 hidden flex-wrap gap-3 md:flex">
          <button
            type="button"
            onClick={() => setActiveModal("budget")}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
          >
            <FileText className="h-4 w-4" />
            {t("createBudget")}
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("expense")}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
          >
            <ArrowDownCircle className="h-4 w-4 text-danger" />
            {t("registerExpense")}
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("income")}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
          >
            <ArrowUpCircle className="h-4 w-4 text-success" />
            {t("registerIncome")}
          </button>
        </div>

        {/* Revenue vs Expenses chart */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
            <h2 className="text-base font-semibold text-text-primary">
              {t("revenueVsExpenses")}
            </h2>
            <span className="text-xs font-medium text-text-muted">
              {t("last6Months")}
            </span>
          </div>
          <div className="overflow-x-auto p-5">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <RevenueExpensesChart
                data={trend}
                incomeLabel={t("revenue")}
                expenseLabel={t("expenses")}
              />
            )}
          </div>
        </div>

        {/* Two-column: Events & Transactions */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming events */}
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">
                {t("upcomingEvents")}
              </h2>
              <button className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-dark">
                {t("viewAll")} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {loading ? (
              <ListSkeleton rows={5} />
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                  <Calendar className="h-6 w-6 text-text-muted" />
                </div>
                <p className="mt-3 text-sm font-medium text-text-secondary">
                  {t("noUpcomingEvents")}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/30">
                {events.map((event, idx) => (
                  <li
                    key={event.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-background/50"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${eventColor(idx)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {event.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        {event.event_date}
                        {event.event_time ? ` \u00B7 ${event.event_time}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent transactions */}
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">
                {t("recentTransactions")}
              </h2>
              <button className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-dark">
                {t("viewAll")} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {loading ? (
              <ListSkeleton rows={8} />
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                  <DollarSign className="h-6 w-6 text-text-muted" />
                </div>
                <p className="mt-3 text-sm font-medium text-text-secondary">
                  {t("noRecentTransactions")}
                </p>
                <button
                  onClick={() => setActiveModal("expense")}
                  className="mt-3 text-xs font-medium text-primary hover:text-primary-dark"
                >
                  {t("registerExpense")}
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-border/30">
                {transactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-background/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          tx.type === "income"
                            ? "bg-success/10 ring-1 ring-success/20"
                            : "bg-danger/10 ring-1 ring-danger/20"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpCircle className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-danger" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {tx.description || tx.category || t("transactions")}
                        </p>
                        <p className="text-xs text-text-muted">
                          {tx.reference_person || tx.record_date}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        tx.type === "income" ? "text-success" : "text-danger"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <FabMenu actions={fabActions} />

      {(activeModal === "income" || activeModal === "expense") && (
        <FinancialRecordModal
          type={activeModal}
          onClose={() => setActiveModal(null)}
          onSuccess={fetchData}
        />
      )}
      {activeModal === "budget" && (
        <CreateBudgetModal
          onClose={() => setActiveModal(null)}
          onSuccess={fetchData}
        />
      )}
    </>
  );
}
