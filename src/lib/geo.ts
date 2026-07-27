import polyline from "@mapbox/polyline";
import type { LatLng, RunActivity } from "@/lib/types";
import type { FeatureCollection, LineString, Point } from "geojson";

/** Ensure we always have a coordinate stream when a polyline or start point exists. */
export function ensureLatLngStream(activity: RunActivity): LatLng[] {
  if (activity.latlngStream && activity.latlngStream.length > 1) {
    return activity.latlngStream;
  }

  if (activity.summaryPolyline) {
    try {
      const decoded = polyline.decode(activity.summaryPolyline) as LatLng[];
      if (decoded.length > 1) return decoded;
    } catch {
      // fall through
    }
  }

  if (activity.startLatlng) return [activity.startLatlng];
  if (activity.endLatlng) return [activity.endLatlng];
  return activity.latlngStream || [];
}

export function hydrateActivityGeometry(activity: RunActivity): RunActivity {
  const stream = ensureLatLngStream(activity);
  if (
    stream.length > 0 &&
    (!activity.latlngStream || activity.latlngStream.length !== stream.length)
  ) {
    return { ...activity, latlngStream: stream };
  }
  return activity;
}

export function hydrateActivities(activities: RunActivity[]): RunActivity[] {
  return activities.map(hydrateActivityGeometry);
}

export function activitiesToRouteCollection(
  activities: RunActivity[],
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: activities
      .map((activity) => {
        const stream = ensureLatLngStream(activity);
        if (stream.length < 2) return null;
        return {
          type: "Feature" as const,
          properties: {
            id: activity.id,
            name: activity.name,
            hasPhotos: activity.totalPhotoCount > 0,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: stream.map(([lat, lng]) => [lng, lat]),
          },
        };
      })
      .filter(Boolean) as FeatureCollection<LineString>["features"],
  };
}

export function activitiesToHeatCollection(
  activities: RunActivity[],
): FeatureCollection<Point> {
  const features = activities.flatMap((activity) => {
    const stream = ensureLatLngStream(activity);
    if (!stream.length) return [];

    // Point-only activities still contribute to the heatmap.
    if (stream.length === 1) {
      const [lat, lng] = stream[0];
      return [
        {
          type: "Feature" as const,
          properties: { id: activity.id },
          geometry: {
            type: "Point" as const,
            coordinates: [lng, lat],
          },
        },
      ];
    }

    const step = Math.max(1, Math.floor(stream.length / 120));
    return stream
      .filter((_, index) => index % step === 0)
      .map(([lat, lng]) => ({
        type: "Feature" as const,
        properties: { id: activity.id },
        geometry: {
          type: "Point" as const,
          coordinates: [lng, lat],
        },
      }));
  });

  return { type: "FeatureCollection", features };
}

export function activityCenter(activity: RunActivity): LatLng | null {
  if (activity.startLatlng) return activity.startLatlng;
  const stream = ensureLatLngStream(activity);
  if (stream[0]) return stream[0];
  return null;
}

export function boundsFromActivities(activities: RunActivity[]) {
  const coords: LatLng[] = [];

  for (const activity of activities) {
    const stream = ensureLatLngStream(activity);
    if (stream.length) coords.push(...stream);
  }

  if (!coords.length) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lat, lng] of coords) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    // Guard against swapped / bogus points that send the camera into the ocean.
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return null;

  // Avoid zero-size bounds (single point) which can confuse fitBounds.
  if (minLng === maxLng) {
    minLng -= 0.05;
    maxLng += 0.05;
  }
  if (minLat === maxLat) {
    minLat -= 0.05;
    maxLat += 0.05;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ] as [[number, number], [number, number]];
}

export function countMappableActivities(activities: RunActivity[]) {
  return activities.filter((activity) => ensureLatLngStream(activity).length > 0)
    .length;
}
