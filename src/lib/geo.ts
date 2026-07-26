import type { LatLng, RunActivity } from "@/lib/types";
import type { FeatureCollection, LineString, Point } from "geojson";

export function activitiesToRouteCollection(
  activities: RunActivity[],
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: activities
      .filter((a) => (a.latlngStream?.length || 0) > 1)
      .map((activity) => ({
        type: "Feature",
        properties: {
          id: activity.id,
          name: activity.name,
          hasPhotos: activity.totalPhotoCount > 0,
        },
        geometry: {
          type: "LineString",
          coordinates: (activity.latlngStream || []).map(([lat, lng]) => [
            lng,
            lat,
          ]),
        },
      })),
  };
}

export function activitiesToHeatCollection(
  activities: RunActivity[],
): FeatureCollection<Point> {
  const features = activities.flatMap((activity) => {
    const stream = activity.latlngStream || [];
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
  if (activity.latlngStream?.[0]) return activity.latlngStream[0];
  return null;
}

export function boundsFromActivities(activities: RunActivity[]) {
  const coords: LatLng[] = [];

  for (const activity of activities) {
    if (activity.latlngStream?.length) {
      coords.push(...activity.latlngStream);
    } else if (activity.startLatlng) {
      coords.push(activity.startLatlng);
    }
  }

  if (!coords.length) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lat, lng] of coords) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ] as [[number, number], [number, number]];
}
