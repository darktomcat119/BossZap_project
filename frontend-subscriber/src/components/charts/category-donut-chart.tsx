"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";

type DataPoint = {
  name: string;
  value: number;
};

type CategoryDonutChartProps = {
  data: DataPoint[];
};

const COLORS = ["#00D4AA", "#6C5CE7", "#0984E3", "#FDCB6E", "#E17055"];

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const t = useTranslations("charts");
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
          <PieChartIcon className="h-6 w-6 text-text-muted" />
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
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          nameKey="name"
          strokeWidth={0}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #DFE6E9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
