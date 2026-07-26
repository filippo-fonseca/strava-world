"use client";

import { Camera, ImageOff } from "lucide-react";
import clsx from "clsx";
import { formatDate, formatDistance } from "@/lib/format";
import type { RunActivity } from "@/lib/types";
import { NeuPanel } from "@/components/ui/NeuPanel";

type Props = {
  activities: RunActivity[];
  selectedId?: number | null;
  onSelect: (activity: RunActivity) => void;
};

export function ActivityList({ activities, selectedId, onSelect }: Props) {
  return (
    <NeuPanel
      title="Your runs"
      className="flex h-full min-h-0 flex-col"
      action={
        <span className="text-xs text-[var(--neu-muted)]">
          {activities.length} mapped
        </span>
      }
    >
      <div className="neu-concave min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl p-2">
        {activities.map((activity) => {
          const active = selectedId === activity.id;
          const hasPhotos = activity.totalPhotoCount > 0;
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => onSelect(activity)}
              className={clsx(
                "neu-pressable flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left",
                active ? "neu-convex" : "bg-transparent shadow-none",
              )}
            >
              <span
                className={clsx(
                  "relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full",
                  hasPhotos
                    ? "border-[3px] border-white/80"
                    : "border-2 border-dashed border-[rgba(84,72,56,0.35)] bg-[#ebe4d8] text-[var(--neu-muted)]",
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
                {!hasPhotos && <ImageOff size={16} />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold tracking-tight">
                  {activity.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-[var(--neu-muted)]">
                  {formatDistance(activity.distance)} · {formatDate(activity.startDate)}
                  {activity.locationCity ? ` · ${activity.locationCity}` : ""}
                </span>
              </span>

              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
                  hasPhotos
                    ? "bg-[rgba(228,87,46,0.12)] text-[var(--neu-accent)]"
                    : "bg-[rgba(84,72,56,0.08)] text-[var(--neu-muted)]",
                )}
              >
                {hasPhotos ? <Camera size={12} /> : <ImageOff size={12} />}
                {activity.totalPhotoCount}
              </span>
            </button>
          );
        })}
      </div>
    </NeuPanel>
  );
}
