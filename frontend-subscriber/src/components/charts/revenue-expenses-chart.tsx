"use client";

import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";

type DataPoint = {
  month: string;
  income: number;
  expense: number;
};

type RevenueExpensesChartProps = {
  data: DataPoint[];
  incomeLabel?: string;
  expenseLabel?: string;
};

const BR_MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// "2026-04" → "Abr/2026". Falls back to the raw value when unparseable.
function formatMonth(value: string): string {
  if (!value) return value;
  const m = value.match(/^(\d{4})-(\d{2})/);
  if (!m) return value;
  const monthIdx = parseInt(m[2], 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return value;
  return `${BR_MONTHS[monthIdx]}/${m[1]}`;
}

export function RevenueExpensesChart({
  data,
  incomeLabel = "Income",
  expenseLabel = "Expenses",
}: RevenueExpensesChartProps) {
  const t = useTranslations("charts");
  const hasData =
    data.length > 0 && data.some((d) => d.income !== 0 || d.expense !== 0);

  if (!hasData) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
          <TrendingUp className="h-6 w-6 text-text-muted" />
        </div>
        <p className="mt-3 text-sm font-medium text-text-secondary">
          {t("emptyTitle")}
        </p>
        <p className="mt-1 text-xs text-text-muted">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E17055" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#E17055" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#DFE6E9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          stroke="#B2BEC3"
          tickFormatter={formatMonth}
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#B2BEC3" />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #DFE6E9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
          labelFormatter={formatMonth}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="income"
          name={incomeLabel}
          stroke="#00D4AA"
          fillOpacity={1}
          fill="url(#colorIncome)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name={expenseLabel}
          stroke="#E17055"
          fillOpacity={1}
          fill="url(#colorExpense)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
