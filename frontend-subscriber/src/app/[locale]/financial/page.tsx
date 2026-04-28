"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, Download, ChevronLeft, ChevronRight, Tags, Plus, Pencil, Trash2, X } from "lucide-react";

import { financialService } from "@/services/financial.service";
import { categoriesService } from "@/services/categories.service";
import type { PaginationMeta } from "@/lib/api";
import type {
  FinancialRecord,
  FinancialSummary,
  CategoryBreakdown,
  DailyTotal,
  MonthlyTrend,
  FinancialRecordType,
  SubscriberCategory,
  CategoryType,
} from "@/lib/types";
import { RevenueExpensesChart } from "@/components/charts/revenue-expenses-chart";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { ProfitBarChart } from "@/components/charts/profit-bar-chart";
import { cn } from "@/lib/utils";

// ── Period helpers ────────────────────────────────────────────────────────────

const PERIODS = ["thisWeek", "thisMonth", "thisYear", "custom"] as const;
type Period = (typeof PERIODS)[number];

const fmt = (d: Date) => d.toISOString().slice(0, 10);

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const today = new Date();
  const end = fmt(today);
  if (period === "thisWeek") {
    const day = today.getDay();
    const mon = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day + (day === 0 ? -6 : 1));
    return { startDate: fmt(mon), endDate: end };
  }
  if (period === "thisYear") return { startDate: fmt(new Date(today.getFullYear(), 0, 1)), endDate: end };
  // thisMonth + custom fallback
  return { startDate: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: end };
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-border/50", className)} />;
}
function ChartSkeleton() {
  return <div className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-[300px] w-full" /></div>;
}
function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
      ))}
    </tr>
  );
}

// ── Categories panel ─────────────────────────────────────────────────────────

function CategoriesPanel({ onClose }: { onClose: () => void }) {
  const tc = useTranslations("categoryManager");
  const [items, setItems] = useState<SubscriberCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<CategoryType>("both");
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CategoryType>("both");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesService.list();
      if (res.success) setItems(res.data as SubscriberCategory[]);
    } catch {
      setError(tc("loadError"));
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (cat: SubscriberCategory) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditType(cat.type as CategoryType);
    setAddMode(false);
  };

  const cancelEdit = () => { setEditId(null); setEditName(""); };

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    try {
      await categoriesService.update(editId, { name: editName.trim(), type: editType });
      setEditId(null);
      await load();
    } catch {
      setError(tc("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const saveNew = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await categoriesService.create({ name: newName.trim(), type: newType });
      setNewName("");
      setNewType("both");
      setAddMode(false);
      await load();
    } catch {
      setError(tc("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setSaving(true);
    try {
      await categoriesService.remove(id);
      await load();
    } catch {
      setError(tc("deleteError"));
    } finally {
      setSaving(false);
    }
  };

  const typeLabels: Record<CategoryType, string> = {
    income: tc("income"),
    expense: tc("expense"),
    both: tc("both"),
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-surface border-l border-border shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold text-text-primary">{tc("title")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-background">
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))
          ) : items.length === 0 && !addMode ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-secondary">{tc("noCategories")}</p>
              <p className="mt-1 text-xs text-text-secondary">{tc("noCategoriesHint")}</p>
            </div>
          ) : (
            items.map((cat) =>
              editId === cat.id ? (
                <div key={cat.id} className="rounded-lg border border-primary/40 bg-background p-3 space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder={tc("namePlaceholder")}
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as CategoryType)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    {(["income", "expense", "both"] as CategoryType[]).map((t) => (
                      <option key={t} value={t}>{typeLabels[t]}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving || !editName.trim()}
                      className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                      {tc("save")}
                    </button>
                    <button onClick={cancelEdit} disabled={saving}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary">
                      {tc("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div key={cat.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{cat.name}</p>
                    <p className="text-xs text-text-secondary">{typeLabels[cat.type as CategoryType]}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(cat)} className="rounded p-1 hover:bg-border">
                      <Pencil className="h-3.5 w-3.5 text-text-secondary" />
                    </button>
                    <button onClick={() => remove(cat.id)} disabled={saving} className="rounded p-1 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              )
            )
          )}

          {addMode && (
            <div className="rounded-lg border border-primary/40 bg-background p-3 space-y-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") setAddMode(false); }}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                placeholder={tc("namePlaceholder")}
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CategoryType)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              >
                {(["income", "expense", "both"] as CategoryType[]).map((t) => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={saveNew} disabled={saving || !newName.trim()}
                  className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                  {tc("save")}
                </button>
                <button onClick={() => setAddMode(false)} disabled={saving}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary">
                  {tc("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={() => { setAddMode(true); setEditId(null); }}
            disabled={addMode}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {tc("addCategory")}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

export default function FinancialPage() {
  const t = useTranslations("financial");
  const tc = useTranslations("categoryManager");

  // Filters
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | FinancialRecordType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Data
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [dailyData, setDailyData] = useState<DailyTotal[]>([]);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  // Loading flags
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  // Computed date range
  const dateRange =
    period === "custom" && customStart && customEnd
      ? { startDate: customStart, endDate: customEnd }
      : getDateRange(period);

  const fetchCharts = useCallback(async () => {
    setLoadingCharts(true);
    try {
      const [summaryRes, trendRes, catRes, dailyRes] = await Promise.all([
        financialService.getSummary(dateRange.startDate, dateRange.endDate),
        financialService.getMonthlyTrend(6),
        financialService.getCategories(dateRange.startDate, dateRange.endDate, "expense"),
        financialService.getDailyTotals(dateRange.startDate, dateRange.endDate),
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (trendRes.success) {
        const t = trendRes.data as any;
        setTrendData(Array.isArray(t) ? t : []);
      }
      if (catRes.success) {
        const c = catRes.data as any;
        const catList = Array.isArray(c) ? c : [];
        setCategoryData(catList);
        setCategories(catList.map((item: any) => item.category).filter(Boolean));
      }
      if (dailyRes.success) {
        const d = dailyRes.data as any;
        setDailyData(Array.isArray(d) ? d : []);
      }
    } catch {
      // Silently handle - data stays empty
    } finally {
      setLoadingCharts(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchRecords = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await financialService.getRecords({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: typeFilter === "all" ? undefined : typeFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        search: search || undefined,
        page,
        limit: ITEMS_PER_PAGE,
      });
      if (res.success) {
        const raw = res.data as any;
        const list = Array.isArray(raw) ? raw : (raw?.records ?? []);
        setRecords(list);
        const paginationMeta = res.meta ?? (raw?.total ? { page: raw.page ?? page, limit: ITEMS_PER_PAGE, total: raw.total, totalPages: Math.ceil(raw.total / ITEMS_PER_PAGE) } : null);
        setMeta(paginationMeta);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoadingTable(false);
    }
  }, [dateRange.startDate, dateRange.endDate, typeFilter, categoryFilter, search, page]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, categoryFilter, search, period, customStart, customEnd]);

  const handleExport = async () => {
    try {
      const blob = await financialService.exportCsv(
        dateRange.startDate,
        dateRange.endDate,
        typeFilter === "all" ? undefined : typeFilter,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-${dateRange.startDate}-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // export failed silently
    }
  };

  const revenueChartData = trendData.map((m) => ({
    month: m.month,
    income: m.income,
    expense: m.expense,
  }));

  const donutChartData = categoryData.map((c) => ({
    name: c.category || "Other",
    value: c.total,
  }));

  const profitChartData = dailyData.map((d) => ({
    date: d.date,
    profit: d.income - d.expense,
  }));

  const totalPages = meta ? meta.totalPages : 1;
  const totalRecords = meta ? meta.total : records.length;

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
            {t("title")}
          </h1>
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => setShowCategories(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background"
            >
              <Tags className="h-4 w-4" />
              {tc("manage")}
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background"
            >
              <Download className="h-4 w-4" />
              {t("export")}
            </button>
          </div>
        </div>

        {/* Period selector */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                period === p
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary border border-border hover:bg-background",
              )}
            >
              {t(p)}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-text-muted">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {loadingCharts ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : summary ? (
            <>
              {([
                { label: t("totalIncome"), value: summary.total_income, color: "text-success" },
                { label: t("totalExpenses"), value: summary.total_expense, color: "text-danger" },
                { label: t("netProfit"), value: summary.net, color: Number(summary.net) >= 0 ? "text-success" : "text-danger" },
              ] as const).map((card) => (
                <div key={card.label} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <p className="text-sm text-text-secondary">{card.label}</p>
                  <p className={cn("mt-1 text-2xl font-bold", card.color)}>
                    R$ {(parseFloat(String(card.value)) || 0).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
            </>
          ) : null}
        </div>

        {/* Charts row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {([
            { title: t("revenueTrend"), el: <RevenueExpensesChart data={revenueChartData} incomeLabel={t("income")} expenseLabel={t("expense")} /> },
            { title: t("expenseByCategory"), el: <CategoryDonutChart data={donutChartData} /> },
            { title: t("dailyProfit"), el: <ProfitBarChart data={profitChartData} /> },
          ]).map((chart) => (
            <div key={chart.title} className="overflow-x-auto rounded-xl border border-border bg-surface p-5 shadow-sm">
              {loadingCharts ? <ChartSkeleton /> : (
                <><h2 className="mb-4 text-base font-semibold text-text-primary">{chart.title}</h2>{chart.el}</>
              )}
            </div>
          ))}
        </div>

        {/* Transactions section */}
        <div className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("transactions")}
          </h2>

          {/* Filters */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | FinancialRecordType)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("allTypes")}</option>
              <option value="income">{t("income")}</option>
              <option value="expense">{t("expense")}</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="px-3 py-3 font-medium">{t("date")}</th>
                  <th className="px-3 py-3 font-medium">{t("type")}</th>
                  <th className="px-3 py-3 font-medium">{t("description")}</th>
                  <th className="px-3 py-3 font-medium">{t("category")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("amount")}</th>
                </tr>
              </thead>
              <tbody>
                {loadingTable
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))
                  : records.map((rec) => (
                      <tr
                        key={rec.id}
                        className="border-b border-border transition-colors hover:bg-background"
                      >
                        <td className="px-3 py-3 text-text-primary">
                          {rec.record_date}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                              rec.type === "income"
                                ? "bg-success/10 text-success"
                                : "bg-danger/10 text-danger",
                            )}
                          >
                            {t(rec.type)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-text-primary">
                          {rec.description ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-text-secondary">
                          {rec.category ?? "-"}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3 text-right font-semibold",
                            rec.type === "income" ? "text-success" : "text-danger",
                          )}
                        >
                          {rec.type === "income" ? "+" : "-"}R${" "}
                          {(parseFloat(String(rec.amount)) || 0).toFixed(2).replace(".", ",")}
                        </td>
                      </tr>
                    ))}
                {!loadingTable && records.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-text-muted"
                    >
                      {t("noTransactions")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="mt-4 space-y-3 md:hidden">
            {loadingTable
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))
              : records.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          rec.type === "income"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger",
                        )}
                      >
                        {t(rec.type)}
                      </span>
                      <span className="text-xs text-text-muted">
                        {rec.record_date}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {rec.description ?? "-"}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-text-secondary">
                        {rec.category ?? "-"}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          rec.type === "income" ? "text-success" : "text-danger",
                        )}
                      >
                        {rec.type === "income" ? "+" : "-"}R${" "}
                        {(parseFloat(String(rec.amount)) || 0).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                ))}
            {!loadingTable && records.length === 0 && (
              <p className="py-8 text-center text-text-muted">
                {t("noTransactions")}
              </p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-text-muted">
                {t("showing")} {(page - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(page * ITEMS_PER_PAGE, totalRecords)} {t("of")}{" "}
                {totalRecords}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-background disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-text-primary">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-background disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCategories && (
        <CategoriesPanel onClose={() => setShowCategories(false)} />
      )}
    </>
  );
}
