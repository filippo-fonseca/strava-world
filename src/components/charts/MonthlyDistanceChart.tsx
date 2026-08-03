"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthBucket } from "@/lib/analytics";
import { formatDistance } from "@/lib/format";
import { CHART, chartAxisTick, chartTooltipStyle } from "@/components/charts/theme";

type Props = {
  data: MonthBucket[];
  height?: number;
};

export function MonthlyDistanceChart({ data, height = 220 }: Props) {
  const rows = data.map((m) => ({
    name: m.label.split(" ")[0],
    full: m.label,
    km: Math.round((m.distanceMeters / 1000) * 10) / 10,
    meters: m.distanceMeters,
  }));

  if (!rows.some((r) => r.meters > 0)) {
    return (
      <p className="py-10 text-center font-mono text-[11px] text-[var(--muted)]">
        no distance in this window
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={chartAxisTick}
            axisLine={{ stroke: CHART.line }}
            tickLine={false}
          />
          <YAxis
            tick={chartAxisTick}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            cursor={{ fill: "rgba(252,76,2,0.08)" }}
            contentStyle={chartTooltipStyle}
            formatter={(value) => [
              formatDistance(Number(value) * 1000),
              "distance",
            ]}
            labelFormatter={(label) => String(label)}
          />
          <Bar
            dataKey="km"
            fill={CHART.accent}
            radius={[2, 2, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
