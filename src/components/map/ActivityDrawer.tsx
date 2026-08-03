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
          className="pointer-events-auto absolute inset-x-2 bottom-[calc(0.5rem+var(--safe-bottom))] z-20 max-h-[70vh] overflow-y-auto md:inset-x-auto md:bottom-4 md:right-4 md:w-[340px]"
        >
          <Panel className="relative !p-4">
            <div className="absolute right-2 top-2">
              <IconButton label="Close activity" onClick={onClose}>
                <X size={16} />
              </IconButton>
            </div>

            <p className="mono-label pr-12 normal-case tracking-[0.1em]">
              {activity.locationCity || "somewhere"}
              {activity.locationCountry ? `, ${activity.locationCountry}` : ""}
            </p>
            <h2 className="mt-1 max-w-[90%] font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--ink-display)] sm:text-2xl">
              {activity.name}
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="distance" value={formatDistance(activity.distance)} />
              <Stat label="date" value={formatDate(activity.startDate)} />
              <Stat
                label="moving"
                value={formatDuration(activity.movingTime)}
              />
              <Stat
                label="elev"
                value={formatElevation(activity.totalElevationGain)}
              />
            </div>

            <p className="mt-3 font-mono text-[12px] text-[var(--muted)]">
              pace {formatPace(activity.distance, activity.movingTime)}
            </p>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-[var(--ink)]">
                {activity.totalPhotoCount > 0
                  ? `${activity.totalPhotoCount} photo${activity.totalPhotoCount === 1 ? "" : "s"}`
                  : "no photos — pin still marks this run"}
              </p>

              {activity.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {activity.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="surface-inset group relative aspect-[4/3] overflow-hidden !rounded-[var(--radius-md)]"
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
      <div className="mono-label">{label}</div>
      <div className="mt-1 font-mono text-base font-medium tracking-tight text-[var(--ink-display)]">
        {value}
      </div>
    </div>
  );
}
