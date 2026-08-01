"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
} from "@/lib/format";
import type { RunActivity } from "@/lib/types";
import { IconButton } from "@/components/ui/IconButton";
import { Panel } from "@/components/ui/Panel";

type Props = {
  activity: RunActivity | null;
  onClose: () => void;
};

export function ActivityDrawer({ activity, onClose }: Props) {
  return (
    <AnimatePresence>
      {activity && (
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-auto absolute inset-x-2 bottom-[calc(0.5rem+var(--safe-bottom))] z-20 max-h-[70vh] overflow-y-auto md:inset-x-auto md:bottom-4 md:right-4 md:w-[360px]"
        >
          <Panel className="relative !p-4 shadow-sm">
            <div className="absolute right-2 top-2">
              <IconButton label="Close activity" onClick={onClose}>
                <X size={16} />
              </IconButton>
            </div>

            <p className="pr-12 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
              {activity.locationCity || "Somewhere"}
              {activity.locationCountry ? `, ${activity.locationCountry}` : ""}
            </p>
            <h2 className="mt-1 max-w-[90%] font-[family-name:var(--font-display)] text-2xl leading-tight tracking-tight">
              {activity.name}
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="Distance" value={formatDistance(activity.distance)} />
              <Stat label="Date" value={formatDate(activity.startDate)} />
              <Stat
                label="Moving"
                value={formatDuration(activity.movingTime)}
              />
              <Stat
                label="Elev"
                value={formatElevation(activity.totalElevationGain)}
              />
            </div>

            <p className="mt-3 text-sm text-[var(--muted)]">
              Pace {formatPace(activity.distance, activity.movingTime)}
            </p>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">
                {activity.totalPhotoCount > 0
                  ? `${activity.totalPhotoCount} photo${activity.totalPhotoCount === 1 ? "" : "s"}`
                  : "No photos — pin still marks this run"}
              </p>

              {activity.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {activity.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="surface-inset group relative aspect-[4/3] overflow-hidden !rounded-[10px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption || activity.name}
                        className="h-full w-full object-cover transition duration-200 group-hover:brightness-95"
                      />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </Panel>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="surface-inset px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold tracking-tight">{value}</div>
    </div>
  );
}
