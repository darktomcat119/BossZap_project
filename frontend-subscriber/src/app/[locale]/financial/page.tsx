"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { RevenueExpensesChart } from "@/components/charts/revenue-expenses-chart";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { ProfitBarChart } from "@/components/charts/profit-bar-chart";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock data ──────────────────────────────────────────────
const mockRevenueTrend = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 3800 },
  { month: "Mar", revenue: 5100 },
  { month: "Apr", revenue: 4600 },
  { month: "May", revenue: 5800 },
  { month: "Jun", revenue: 6200 },
];

const mockCategoryData = [
  { name: "Services", value: 8500 },
  { name: "Products", value: 3200 },
  { name: "Consulting", value: 2100 },
  { name: "Maintenance", value: 1800 },
  { name: "Other", value: 900 },
];

const mockProfitData = [
  { date: "Mon", profit: 320 },
  { date: "Tue", profit: -80 },
  { date: "Wed", profit: 450 },
  { date: "Thu", profit: 200 },
  { date: "Fri", profit: -120 },
  { date: "Sat", profit: 180 },
  { date: "Sun", profit: 50 },
];

type Transaction = {
  id: number;
  date: string;
  type: "income" | "expense";
  description: string;
  category: string;
  amount: number;
};

const mockTransactions: Transaction[] = [
  { id: 1, date: "2026-03-24", type: "income", description: "Web design - Silva Corp", category: "Services", amount: 2500 },
  { id: 2, date: "2026-03-23", type: "expense", description: "Cloud hosting", category: "Technology", amount: 89.90 },
  { id: 3, date: "2026-03-22", type: "income", description: "Logo design - Bakery", category: "Services", amount: 800 },
  { id: 4, date: "2026-03-21", type: "expense", description: "Software license", category: "Technology", amount: 49.90 },
  { id: 5, date: "2026-03-20", type: "income", description: "Social media - Gym", category: "Services", amount: 1200 },
  { id: 6, date: "2026-03-19", type: "expense", description: "Office supplies", category: "Supplies", amount: 125.00 },
  { id: 7, date: "2026-03-18", type: "income", description: "Consultation - Tech Co", category: "Consulting", amount: 450 },
  { id: 8, date: "2026-03-17", type: "expense", description: "Internet bill", category: "Utilities", amount: 119.90 },
  { id: 9, date: "2026-03-16", type: "income", description: "Maintenance contract", category: "Maintenance", amount: 1800 },
  { id: 10, date: "2026-03-15", type: "expense", description: "Transport", category: "Transport", amount: 65.00 },
  { id: 11, date: "2026-03-14", type: "income", description: "E-commerce setup", category: "Services", amount: 3200 },
  { id: 12, date: "2026-03-13", type: "expense", description: "Marketing ads", category: "Marketing", amount: 250.00 },
];

const ITEMS_PER_PAGE = 5;

const periods = ["thisWeek", "thisMonth", "thisYear", "custom"] as const;
type Period = (typeof periods)[number];

const categories = ["all", "Services", "Technology", "Consulting", "Maintenance", "Supplies", "Utilities", "Transport", "Marketing"];

export default function FinancialPage() {
  const t = useTranslations("financial");
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockTransactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, typeFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
            {t("title")}
          </h1>
          <button className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background">
            <Download className="h-4 w-4" />
            {t("export")}
          </button>
        </div>

        {/* Period selector */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                period === p
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary border border-border hover:bg-background"
              )}
            >
              {t(p)}
            </button>
          ))}
        </div>

        {/* Charts row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue trend */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              {t("revenueTrend")}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockRevenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE6E9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#B2BEC3" />
                <YAxis tick={{ fontSize: 12 }} stroke="#B2BEC3" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #DFE6E9",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00D4AA"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#00D4AA" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense by category */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              {t("expenseByCategory")}
            </h2>
            <CategoryDonutChart data={mockCategoryData} />
          </div>

          {/* Daily profit */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              {t("dailyProfit")}
            </h2>
            <ProfitBarChart data={mockProfitData} />
          </div>
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as "all" | "income" | "expense");
                setPage(1);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("allTypes")}</option>
              <option value="income">{t("income")}</option>
              <option value="expense">{t("expense")}</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? t("allCategories") : cat}
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
                {paginated.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border transition-colors hover:bg-background"
                  >
                    <td className="px-3 py-3 text-text-primary">{tx.date}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          tx.type === "income"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        )}
                      >
                        {t(tx.type)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-primary">{tx.description}</td>
                    <td className="px-3 py-3 text-text-secondary">{tx.category}</td>
                    <td
                      className={cn(
                        "px-3 py-3 text-right font-semibold",
                        tx.type === "income" ? "text-success" : "text-danger"
                      )}
                    >
                      {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toFixed(2).replace(".", ",")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="mt-4 space-y-3 md:hidden">
            {paginated.map((tx) => (
              <div
                key={tx.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      tx.type === "income"
                        ? "bg-success/10 text-success"
                        : "bg-danger/10 text-danger"
                    )}
                  >
                    {t(tx.type)}
                  </span>
                  <span className="text-xs text-text-muted">{tx.date}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-text-primary">
                  {tx.description}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{tx.category}</span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      tx.type === "income" ? "text-success" : "text-danger"
                    )}
                  >
                    {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-text-muted">
                {t("showing")} {(page - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} {t("of")}{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:bg-background disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-text-primary">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:bg-background disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
