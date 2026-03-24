"use client";

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

export function RevenueExpensesChart({
  data,
  incomeLabel = "Income",
  expenseLabel = "Expenses",
}: RevenueExpensesChartProps) {
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
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#B2BEC3" />
        <YAxis tick={{ fontSize: 12 }} stroke="#B2BEC3" />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #DFE6E9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
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
