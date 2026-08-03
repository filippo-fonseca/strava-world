"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART, chartTooltipStyle } from "@/components/charts/theme";

type Props = {
  withPhotos: number;
  withoutPhotos: number;
  height?: number;
};

export function PhotoDonut({
  withPhotos,
  withoutPhotos,
  height = 180,
}: Props) {
  const rows = [
    { name: "with photos", value: withPhotos, color: CHART.accent },
    { name: "no photos", value: withoutPhotos, color: CHART.faint },
  ].filter((r) => r.value > 0);

  if (!rows.length) {
    return (
      <p className="py-8 text-center font-mono text-[11px] text-[var(--muted)]">
        no runs yet
      </p>
    );
  }

  const total = withPhotos + withoutPhotos;
  const pct = total ? Math.round((withPhotos / total) * 100) : 0;

  return (
    <div className="relative mx-auto w-full max-w-[200px]" style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="90%"
            paddingAngle={3}
            stroke={CHART.surface}
            strokeWidth={2}
          >
            {rows.map((row) => (
              <Cell key={row.name} fill={row.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [`${value} runs`, "count"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-mono text-2xl font-medium tabular-nums text-[var(--ink-display)]">
            {pct}%
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            with photos
          </p>
        </div>
      </div>
    </div>
  );
}
