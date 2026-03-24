"use client";

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

type DataPoint = {
  date: string;
  profit: number;
};

type ProfitBarChartProps = {
  data: DataPoint[];
};

export function ProfitBarChart({ data }: ProfitBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DFE6E9" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#B2BEC3" />
        <YAxis tick={{ fontSize: 12 }} stroke="#B2BEC3" />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #DFE6E9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
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
