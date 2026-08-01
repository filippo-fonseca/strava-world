"use client";

import { useMemo } from "react";
import type { RunActivity } from "@/lib/types";
import {
  atlasStatItems,
  computeAtlasStats,
  formatAtlasSpan,
} from "@/lib/stats";

type Props = {
  activities: RunActivity[];
  loading?: boolean;
};

export function StatsBar({ activities, loading }: Props) {
  const stats = useMemo(() => computeAtlasStats(activities), [activities]);
  const items = useMemo(() => atlasStatItems(stats), [stats]);
  const span = useMemo(() => formatAtlasSpan(stats), [stats]);

  if (loading && activities.length === 0) {
    return (
      <div className="surface overflow-hidden">
        <div className="-mx-0 flex gap-px overflow-x-auto bg-[var(--line)] sm:grid sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[7.5rem] flex-1 bg-[var(--surface)] px-3 py-3 sm:min-w-0 md:px-4"
            >
              <div className="skeleton mb-2 h-3 w-12" />
              <div className="skeleton h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <div className="-mx-0 flex gap-px overflow-x-auto overscroll-x-contain bg-[var(--line)] sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-7">
        {items.map((item) => (
          <div
            key={item.key}
            className="min-w-[7.5rem] flex-1 bg-[var(--surface)] px-3 py-3 sm:min-w-0 md:px-4"
          >
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              {item.label}
            </div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight md:text-2xl">
              {item.value}
            </div>
          </div>
        ))}
      </div>
      {span && (
        <div className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)] md:px-4">
          {span}
        </div>
      )}
    </div>
  );
}
