"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type DataPoint = {
  name: string;
  value: number;
};

type CategoryDonutChartProps = {
  data: DataPoint[];
};

const COLORS = ["#00D4AA", "#6C5CE7", "#0984E3", "#FDCB6E", "#E17055"];

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
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
