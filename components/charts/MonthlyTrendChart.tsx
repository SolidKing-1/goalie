// components/charts/MonthlyTrendChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { month: string; amount: number }[];
  limit?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-ink font-medium">{payload[0].payload.month}</p>
        <p className="text-accent">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export function MonthlyTrendChart({ data, limit }: Props) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-muted text-sm">
        No spending history yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-accent)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-accent)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke="var(--color-muted)"
          style={{ fontSize: "12px" }}
        />
        <YAxis stroke="var(--color-muted)" style={{ fontSize: "12px" }} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={{ fill: "var(--color-accent)", r: 4 }}
          activeDot={{ r: 6 }}
          fill="url(#lineGradient)"
        />
        {limit && (
          <Line
            type="monotone"
            dataKey={() => limit}
            stroke="var(--color-warning)"
            strokeDasharray="5 5"
            strokeWidth={1}
            dot={false}
            name="Budget Limit"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
