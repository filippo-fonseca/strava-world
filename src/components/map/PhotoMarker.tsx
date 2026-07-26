"use client";

import { ImageOff } from "lucide-react";
import { Marker } from "react-map-gl/maplibre";
import type { RunActivity } from "@/lib/types";
import { activityCenter } from "@/lib/geo";

type Props = {
  activity: RunActivity;
  selected?: boolean;
  onSelect: (activity: RunActivity) => void;
};

export function PhotoMarker({ activity, selected, onSelect }: Props) {
  const center = activityCenter(activity);
  if (!center) return null;

  const [lat, lng] = center;
  const hasPhotos = activity.totalPhotoCount > 0;
  const cover = activity.photos[0]?.url;

  return (
    <Marker latitude={lat} longitude={lng} anchor="center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(activity);
        }}
        className={[
          "relative grid place-items-center transition-transform duration-200",
          selected ? "scale-110" : "hover:scale-105",
          hasPhotos ? "photo-pulse" : "",
        ].join(" ")}
        aria-label={
          hasPhotos
            ? `${activity.name} photos`
            : `${activity.name} has no photos`
        }
      >
        <span className="neu-convex absolute inset-[-4px] rounded-full opacity-90" />
        {hasPhotos && cover ? (
          <span
            className={[
              "relative h-12 w-12 overflow-hidden rounded-full border-[3px]",
              selected ? "border-[var(--neu-accent)]" : "border-white/80",
            ].join(" ")}
            style={{
              backgroundImage: `url(${cover})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <span
            className={[
              "relative grid h-11 w-11 place-items-center rounded-full border-2 border-dashed",
              selected
                ? "border-[var(--neu-accent)] bg-[#f4ebe2] text-[var(--neu-accent)]"
                : "border-[rgba(84,72,56,0.35)] bg-[#ebe4d8] text-[var(--neu-muted)]",
            ].join(" ")}
          >
            <ImageOff size={16} strokeWidth={2.2} />
          </span>
        )}
        {hasPhotos && (
          <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--neu-accent)] px-1 text-[10px] font-semibold text-white shadow">
            {activity.totalPhotoCount}
          </span>
        )}
      </button>
    </Marker>
  );
}
