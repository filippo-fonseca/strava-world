"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Camera,
  ImageOff,
  Mountain,
  Timer,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
} from "@/lib/format";
import type { RunActivity } from "@/lib/types";
import { NeuIconButton } from "@/components/ui/NeuIconButton";
import { NeuPanel } from "@/components/ui/NeuPanel";

type Props = {
  activity: RunActivity | null;
  onClose: () => void;
};

export function ActivityDrawer({ activity, onClose }: Props) {
  return (
    <AnimatePresence>
      {activity && (
        <motion.aside
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px]"
        >
          <NeuPanel className="relative overflow-hidden">
            <div className="absolute right-3 top-3">
              <NeuIconButton label="Close activity" onClick={onClose}>
                <X size={16} />
              </NeuIconButton>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--neu-muted)]">
              {activity.locationCity || "Somewhere"}
              {activity.locationCountry ? `, ${activity.locationCountry}` : ""}
            </p>
            <h2 className="mt-1 max-w-[85%] font-[family-name:var(--font-display)] text-2xl leading-tight tracking-tight">
              {activity.name}
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat
                icon={<Timer size={14} />}
                label="Distance"
                value={formatDistance(activity.distance)}
              />
              <Stat
                icon={<Calendar size={14} />}
                label="Date"
                value={formatDate(activity.startDate)}
              />
              <Stat
                icon={<Timer size={14} />}
                label="Moving"
                value={formatDuration(activity.movingTime)}
              />
              <Stat
                icon={<Mountain size={14} />}
                label="Elev"
                value={formatElevation(activity.totalElevationGain)}
              />
            </div>

            <p className="mt-3 text-sm text-[var(--neu-muted)]">
              Pace {formatPace(activity.distance, activity.movingTime)}
            </p>

            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                {activity.totalPhotoCount > 0 ? (
                  <>
                    <Camera size={15} className="text-[var(--neu-accent)]" />
                    {activity.totalPhotoCount} photo
                    {activity.totalPhotoCount === 1 ? "" : "s"} from this run
                  </>
                ) : (
                  <>
                    <ImageOff size={15} className="text-[var(--neu-muted)]" />
                    No photos on this run
                  </>
                )}
              </div>

              {activity.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {activity.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="neu-concave group relative aspect-[4/3] overflow-hidden rounded-2xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption || activity.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="neu-concave flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--neu-muted)]">
                  <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-[rgba(84,72,56,0.35)]">
                    <ImageOff size={16} />
                  </span>
                  A soft dashed marker on the map marks runs without photos —
                  still part of your world.
                </div>
              )}
            </div>
          </NeuPanel>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="neu-concave rounded-2xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--neu-muted)]">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-base font-semibold tracking-tight">{value}</div>
    </div>
  );
}
