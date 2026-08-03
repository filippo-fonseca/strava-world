import type { RunActivity } from "@/lib/types";
import { activityCenter, boundsFromActivities } from "@/lib/geo";

export type TourStop = {
  id: string;
  label: string;
  detail: string;
  activityIds: number[];
  /** MapLibre fitBounds corners: [[minLng, minLat], [maxLng, maxLat]] */
  bounds: [[number, number], [number, number]];
  /** [lng, lat] */
  center: [number, number];
};

type Bucket = {
  id: string;
  label: string;
  detail: string;
  activities: RunActivity[];
};

function bucketKey(activity: RunActivity): { id: string; label: string; detail: string } {
  const city = activity.locationCity?.trim();
  const country = activity.locationCountry?.trim();
  if (city && country) {
    return {
      id: `city:${city.toLowerCase()}|${country.toLowerCase()}`,
      label: city,
      detail: `${country} · ${city}`,
    };
  }
  if (country) {
    return {
      id: `country:${country.toLowerCase()}`,
      label: country,
      detail: country,
    };
  }
  const center = activityCenter(activity);
  if (center) {
    const [lat, lng] = center;
    const glat = Math.round(lat / 4) * 4;
    const glng = Math.round(lng / 4) * 4;
    return {
      id: `grid:${glat}:${glng}`,
      label: "open water / unnamed",
      detail: `${glat.toFixed(0)}°, ${glng.toFixed(0)}°`,
    };
  }
  return { id: "unknown", label: "unknown", detail: "no gps" };
}

/**
 * Build cinematic tour stops: one per city/region, ordered west → east
 * for a sweeping walkthrough of the athlete's atlas.
 */
export function buildTourStops(activities: RunActivity[]): TourStop[] {
  const map = new Map<string, Bucket>();

  for (const activity of activities) {
    if (!activityCenter(activity)) continue;
    const meta = bucketKey(activity);
    const existing = map.get(meta.id);
    if (existing) {
      existing.activities.push(activity);
    } else {
      map.set(meta.id, {
        id: meta.id,
        label: meta.label,
        detail: meta.detail,
        activities: [activity],
      });
    }
  }

  const stops: TourStop[] = [];

  for (const bucket of map.values()) {
    const bounds = boundsFromActivities(bucket.activities);
    if (!bounds) continue;

    const [[minLng, minLat], [maxLng, maxLat]] = bounds;
    const center: [number, number] = [
      (minLng + maxLng) / 2,
      (minLat + maxLat) / 2,
    ];

    stops.push({
      id: bucket.id,
      label: bucket.label,
      detail: bucket.detail,
      activityIds: bucket.activities.map((a) => a.id),
      bounds,
      center,
    });
  }

  // West → east around the world; tie-break north → south.
  stops.sort((a, b) => a.center[0] - b.center[0] || b.center[1] - a.center[1]);

  return stops;
}

export const TOUR_OVERVIEW_MS = 2200;
export const TOUR_FLY_MS = 2800;
export const TOUR_DWELL_MS = 2400;

export type TourState = {
  status: "idle" | "playing" | "paused";
  phase: "overview" | "stop" | "done";
  index: number;
  total: number;
  label: string;
  detail: string;
};

export const IDLE_TOUR_STATE: TourState = {
  status: "idle",
  phase: "overview",
  index: 0,
  total: 0,
  label: "",
  detail: "",
};
