"use client";

import clsx from "clsx";
import { useState } from "react";
import { formatDate, formatDistance } from "@/lib/format";
import type { RunActivity } from "@/lib/types";
import { Panel } from "@/components/ui/Panel";

const PAGE_SIZE = 10;

type Props = {
  activities: RunActivity[];
  selectedId?: number | null;
  onSelect: (activity: RunActivity) => void;
};

export function ActivityList({ activities, selectedId, onSelect }: Props) {
  const [page, setPage] = useState(0);
  /** How many rows to reveal from the current page start (grows via “show more”). */
  const [reveal, setReveal] = useState(PAGE_SIZE);

  const total = activities.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const end = Math.min(start + reveal, total);
  const visible = activities.slice(start, end);
  const hiddenFromHere = Math.max(0, total - end);
  const nextChunk = Math.min(PAGE_SIZE, hiddenFromHere);

  const rangeLabel =
    total === 0 ? "0" : `${start + 1}–${end} of ${total}`;

  function goToPage(next: number) {
    setPage(next);
    setReveal(PAGE_SIZE);
  }

  return (
    <Panel
      title="history"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden !p-3"
      action={
        <span className="font-mono text-[11px] tabular-nums text-[var(--muted)]">
          {rangeLabel}
        </span>
      }
    >
      <div className="min-h-0 min-w-0 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[var(--radius)]">
        {total === 0 ? (
          <p className="px-2 py-6 text-center font-mono text-[12px] text-[var(--muted)]">
            no runs match these filters
          </p>
        ) : (
          visible.map((activity, i) => {
            const active = selectedId === activity.id;
            const hasPhotos = activity.totalPhotoCount > 0;
            const index = start + i + 1;
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => onSelect(activity)}
                className={clsx(
                  "pressable flex min-h-14 w-full min-w-0 max-w-full items-center gap-2.5 overflow-hidden rounded-[var(--radius-md)] px-2 py-2.5 text-left",
                  active
                    ? "bg-[var(--accent-soft)]"
                    : "hover:bg-[rgba(255,255,255,0.04)]",
                )}
              >
                <span className="w-5 shrink-0 text-right font-mono text-[10px] tabular-nums text-[var(--faint)]">
                  {index}
                </span>

                <span
                  className={clsx(
                    "relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border",
                    hasPhotos
                      ? "border-[var(--line)]"
                      : "border-dashed border-[var(--line-strong)] bg-[var(--sunken)]",
                  )}
                  style={
                    hasPhotos && activity.photos[0]
                      ? {
                          backgroundImage: `url(${activity.photos[0].url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  {!hasPhotos && (
                    <span className="h-2 w-2 rounded-full bg-[var(--muted)]" />
                  )}
                </span>

                <span className="min-w-0 flex-1 overflow-hidden">
                  <span className="block truncate text-sm font-medium tracking-tight text-[var(--ink-display)]">
                    {activity.name}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-[var(--muted)]">
                    {formatDistance(activity.distance)} ·{" "}
                    {formatDate(activity.startDate)}
                    {activity.locationCity ? ` · ${activity.locationCity}` : ""}
                    {activity.locationCountry
                      ? `, ${activity.locationCountry}`
                      : ""}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      {total > PAGE_SIZE ? (
        <div className="mt-2 flex min-w-0 flex-col gap-2 border-t border-[var(--line)] pt-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => goToPage(safePage - 1)}
              className="pressable min-h-9 rounded-[var(--radius)] border border-[var(--line)] px-2.5 font-mono text-[11px] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              ← prev
            </button>
            <span className="min-w-0 truncate font-mono text-[10px] tabular-nums text-[var(--faint)]">
              page {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => goToPage(safePage + 1)}
              className="pressable min-h-9 rounded-[var(--radius)] border border-[var(--line)] px-2.5 font-mono text-[11px] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              next →
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {nextChunk > 0 ? (
              <button
                type="button"
                onClick={() => setReveal((n) => n + PAGE_SIZE)}
                className="link-accent font-mono text-[11px] lowercase"
              >
                show {nextChunk} more
              </button>
            ) : null}
            {reveal > PAGE_SIZE ? (
              <button
                type="button"
                onClick={() => setReveal(PAGE_SIZE)}
                className="font-mono text-[11px] lowercase text-[var(--muted)] hover:text-[var(--ink)]"
              >
                show less
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
