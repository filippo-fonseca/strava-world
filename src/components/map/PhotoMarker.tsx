"use client";

import { Marker } from "react-map-gl/maplibre";
import type { RunActivity } from "@/lib/types";
import { activityCenter } from "@/lib/geo";

type Props = {
  activity: RunActivity;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  /** When false, always render a pin (hide photo preview). */
  showPhoto?: boolean;
  onSelect: (activity: RunActivity) => void;
};

const sizes = {
  sm: { photo: 28, pin: 12 },
  md: { photo: 40, pin: 14 },
  lg: { photo: 52, pin: 16 },
};

export function PhotoMarker({
  activity,
  selected,
  size = "md",
  showPhoto = true,
  onSelect,
}: Props) {
  const center = activityCenter(activity);
  if (!center) return null;

  const [lat, lng] = center;
  const hasPhotos = showPhoto && activity.totalPhotoCount > 0;
  const cover = activity.photos[0]?.url;
  const dim = sizes[size];

  return (
    <Marker latitude={lat} longitude={lng} anchor="center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(activity);
        }}
        className={[
          "relative grid place-items-center transition-transform duration-150",
          selected ? "scale-110" : "hover:scale-105",
        ].join(" ")}
        aria-label={
          hasPhotos
            ? `${activity.name} photos`
            : `${activity.name} has no photos`
        }
      >
        {hasPhotos && cover ? (
          <span
            className={[
              "relative overflow-hidden rounded-full border-2 bg-[var(--surface)] shadow-sm",
              selected ? "border-[var(--accent)]" : "border-white",
            ].join(" ")}
            style={{
              width: dim.photo,
              height: dim.photo,
              backgroundImage: `url(${cover})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <span
            className={[
              "relative block rounded-full border-2 bg-[var(--surface)]",
              selected
                ? "border-[var(--accent)]"
                : "border-[var(--line-strong)]",
            ].join(" ")}
            style={{ width: dim.pin, height: dim.pin }}
          >
            <span
              className={[
                "absolute inset-[3px] rounded-full",
                selected ? "bg-[var(--accent)]" : "bg-[var(--muted)]",
              ].join(" ")}
            />
          </span>
        )}
        {hasPhotos && activity.totalPhotoCount > 1 && size !== "sm" && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-semibold text-white">
            {activity.totalPhotoCount}
          </span>
        )}
      </button>
    </Marker>
  );
}
