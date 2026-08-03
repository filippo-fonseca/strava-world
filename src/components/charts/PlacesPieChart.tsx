"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { RankedPlace } from "@/lib/analytics";
import { formatDistance } from "@/lib/format";
import { CHART, chartTooltipStyle } from "@/components/charts/theme";

type Props = {
  places: RankedPlace[];
  metric?: "runs" | "distance";
  height?: number;
  emptyLabel?: string;
};

export function PlacesPieChart({
  places,
  metric = "runs",
  height = 220,
  emptyLabel = "no place data yet",
}: Props) {
  const top = places.slice(0, 6);
  const rest = places.slice(6);
  const rows = top.map((p) => ({
    name: p.name,
    value: metric === "runs" ? p.runs : Math.round(p.distanceMeters / 1000),
    runs: p.runs,
    distanceMeters: p.distanceMeters,
  }));

  if (rest.length) {
    rows.push({
      name: "other",
      value:
        metric === "runs"
          ? rest.reduce((s, p) => s + p.runs, 0)
          : Math.round(
              rest.reduce((s, p) => s + p.distanceMeters, 0) / 1000,
            ),
      runs: rest.reduce((s, p) => s + p.runs, 0),
      distanceMeters: rest.reduce((s, p) => s + p.distanceMeters, 0),
    });
  }

  if (!rows.length || rows.every((r) => r.value <= 0)) {
    return (
      <p className="py-10 text-center font-mono text-[11px] text-[var(--muted)]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="mx-auto w-full max-w-[220px]" style={{ height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={2}
              stroke={CHART.surface}
              strokeWidth={2}
            >
              {rows.map((_, i) => (
                <Cell
                  key={rows[i].name}
                  fill={CHART.series[i % CHART.series.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value, _name, item) => {
                const payload = item?.payload as {
                  runs: number;
                  distanceMeters: number;
                };
                return [
                  metric === "runs"
                    ? `${value} runs`
                    : formatDistance(payload.distanceMeters),
                  "share",
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {rows.map((row, i) => (
          <li
            key={row.name}
            className="flex min-w-0 items-center gap-2 font-mono text-[11px]"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: CHART.series[i % CHART.series.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-[var(--ink)]">
              {row.name}
            </span>
            <span className="shrink-0 tabular-nums text-[var(--muted)]">
              {metric === "runs"
                ? row.runs
                : formatDistance(row.distanceMeters)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
