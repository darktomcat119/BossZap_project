"use client";

import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";

type DataPoint = {
  date: string;
  profit: number;
};

type ProfitBarChartProps = {
  data: DataPoint[];
};

// dd/MM in pt-BR — accepts ISO datetime strings (e.g. "2026-04-27T00:00:00.000Z")
// and bare ISO dates ("2026-04-27"). Falls back to the raw value if unparseable.
function formatDayMonth(value: string): string {
  if (!value) return value;
  const iso = value.length > 10 ? value : `${value}T00:00:00`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return value;
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}`;
}

export function ProfitBarChart({ data }: ProfitBarChartProps) {
  const t = useTranslations("charts");
  const hasData = data.length > 0 && data.some((d) => d.profit !== 0);

  if (!hasData) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
          <BarChart3 className="h-6 w-6 text-text-muted" />
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
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DFE6E9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          stroke="#B2BEC3"
          tickFormatter={formatDayMonth}
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#B2BEC3" />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #DFE6E9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
          labelFormatter={formatDayMonth}
        />
        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.profit >= 0 ? "#00D4AA" : "#E17055"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
