"use client";

import clsx from "clsx";
import { formatDate, formatDistance } from "@/lib/format";
import type { RunActivity } from "@/lib/types";
import { Panel } from "@/components/ui/Panel";

type Props = {
  activities: RunActivity[];
  selectedId?: number | null;
  onSelect: (activity: RunActivity) => void;
};

export function ActivityList({ activities, selectedId, onSelect }: Props) {
  return (
    <Panel
      title="Runs"
      className="flex h-full min-h-0 flex-col !p-3 md:!p-4"
      action={
        <span className="text-xs text-[var(--muted)]">
          {activities.length}
        </span>
      }
    >
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain rounded-[10px]">
        {activities.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-[var(--muted)]">
            No runs match this search.
          </p>
        ) : (
          activities.map((activity) => {
            const active = selectedId === activity.id;
            const hasPhotos = activity.totalPhotoCount > 0;
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => onSelect(activity)}
                className={clsx(
                  "pressable flex min-h-14 w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left",
                  active
                    ? "bg-[var(--accent-soft)]"
                    : "hover:bg-[rgba(28,25,23,0.04)]",
                )}
              >
                <span
                  className={clsx(
                    "relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border",
                    hasPhotos
                      ? "border-[var(--line)]"
                      : "border-dashed border-[var(--line-strong)] bg-[rgba(28,25,23,0.03)]",
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

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium tracking-tight">
                    {activity.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                    {formatDistance(activity.distance)} ·{" "}
                    {formatDate(activity.startDate)}
                    {activity.locationCity ? ` · ${activity.locationCity}` : ""}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </Panel>
  );
}
