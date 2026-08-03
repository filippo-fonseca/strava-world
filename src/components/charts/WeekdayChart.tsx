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
import type { WeekdayBucket } from "@/lib/analytics";
import { CHART, chartAxisTick, chartTooltipStyle } from "@/components/charts/theme";

type Props = {
  data: WeekdayBucket[];
  height?: number;
};

export function WeekdayChart({ data, height = 200 }: Props) {
  const rows = data.map((d) => ({
    name: d.label,
    runs: d.runs,
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={chartAxisTick}
            axisLine={{ stroke: CHART.line }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={chartAxisTick}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: "rgba(252,76,2,0.08)" }}
            contentStyle={chartTooltipStyle}
            formatter={(value) => [`${value} runs`, "count"]}
          />
          <Bar
            dataKey="runs"
            fill={CHART.series[1]}
            radius={[2, 2, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
