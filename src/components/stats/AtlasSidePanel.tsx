"use client";

import Link from "next/link";
import type { RunActivity } from "@/lib/types";
import type { JourneyAnalytics } from "@/lib/analytics";
import { compactStatItems } from "@/lib/analytics";
import { formatDistance } from "@/lib/format";
import { StatBlock } from "@/components/stats/StatBlock";
import { PlacesPieChart } from "@/components/charts/PlacesPieChart";

type Props = {
  analytics: JourneyAnalytics;
  recent: RunActivity[];
  loading?: boolean;
  filtered?: boolean;
  onSelectRun: (activity: RunActivity) => void;
};

export function AtlasSidePanel({
  analytics,
  recent,
  loading,
  filtered,
  onSelectRun,
}: Props) {
  const items = compactStatItems(analytics).slice(0, 6);

  if (loading) {
    return (
      <>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 lg:h-[72px]" />
          ))}
        </div>
        <div className="skeleton hidden h-40 lg:block" />
      </>
    );
  }

  return (
    <>
      {/* Mobile: compact 3-col grid. Desktop: stacked tiles. */}
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-2.5">
        {items.map((item, index) => (
          <StatBlock
            key={item.key}
            label={item.label}
            value={item.value}
            accent={index === 0}
            compact
            hint={filtered ? "filtered" : undefined}
          />
        ))}
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="mono-label">places</p>
          <Link
            href="/stats"
            className="link-accent font-mono text-[11px] lowercase"
          >
            all stats →
          </Link>
        </div>
        <PlacesPieChart
          places={analytics.topCities.length ? analytics.topCities : analytics.topCountries}
          height={160}
          emptyLabel="no city/country tags yet"
        />
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-3">
        <p className="mono-label mb-2">recent</p>
        {recent.length === 0 ? (
          <p className="font-mono text-[11px] text-[var(--muted)]">no runs match</p>
        ) : (
          <ul className="space-y-1">
            {recent.map((activity, index) => (
              <li key={activity.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectRun(activity)}
                  className="pressable flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-[var(--radius)] px-1.5 py-1.5 text-left"
                >
                  <span className="w-4 shrink-0 font-mono text-[11px] tabular-nums text-[var(--faint)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--ink)]">
                    {activity.name}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">
                    {formatDistance(activity.distance)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
