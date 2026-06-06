// components/charts/SpendingChart.tsx
"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: { name: string; value: number; fill: string }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-ink font-medium">{payload[0].name}</p>
        <p className="text-accent">${payload[0].value.toFixed(2)}/mo</p>
      </div>
    );
  }
  return null;
};

export function SpendingChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-muted text-sm">
        No subscriptions yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} opacity={0.9} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-muted">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
