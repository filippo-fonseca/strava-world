import type { CSSProperties } from "react";

/** Shared chart palette for the dark atlas UI. */
export const CHART = {
  accent: "#fc4c02",
  ink: "#f2f2f2",
  muted: "#a3a3a3",
  faint: "#666666",
  line: "#262626",
  surface: "#141414",
  grid: "rgba(255,255,255,0.06)",
  tooltipBg: "#0a0a0a",
  series: [
    "#fc4c02",
    "#f97316",
    "#fb923c",
    "#fdba74",
    "#a3a3a3",
    "#78716c",
    "#57534e",
    "#3f7d5a",
    "#5b8def",
    "#c084fc",
  ],
} as const;

export const chartTooltipStyle: CSSProperties = {
  background: CHART.tooltipBg,
  border: `1px solid ${CHART.line}`,
  borderRadius: 4,
  fontSize: 11,
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  color: CHART.ink,
};

export const chartAxisTick = {
  fill: CHART.faint,
  fontSize: 10,
  fontFamily: "var(--font-mono), ui-monospace, monospace",
};
