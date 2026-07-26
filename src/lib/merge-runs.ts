import type { RunActivity } from "@/lib/types";

function activityTimestamp(activity: RunActivity) {
  const ts = Date.parse(activity.startDate);
  return Number.isFinite(ts) ? ts : 0;
}

/** Prefer the richer of two copies of the same run (photos, streams, etc.). */
export function preferRicherActivity(
  current: RunActivity,
  incoming: RunActivity,
): RunActivity {
  const currentPhotos = current.photos?.length ?? 0;
  const incomingPhotos = incoming.photos?.length ?? 0;
  const currentStream = current.latlngStream?.length ?? 0;
  const incomingStream = incoming.latlngStream?.length ?? 0;

  return {
    ...current,
    ...incoming,
    photos:
      incomingPhotos >= currentPhotos ? incoming.photos : current.photos,
    totalPhotoCount: Math.max(
      incoming.totalPhotoCount || 0,
      current.totalPhotoCount || 0,
      incomingPhotos,
      currentPhotos,
    ),
    latlngStream:
      incomingStream >= currentStream
        ? incoming.latlngStream
        : current.latlngStream,
    summaryPolyline:
      incoming.summaryPolyline || current.summaryPolyline || null,
  };
}

/**
 * Upsert incoming runs into the existing atlas.
 * - New ids are added
 * - Existing ids are updated with the richer record
 * - Result is sorted newest-first
 */
export function mergeRunActivities(
  existing: RunActivity[],
  incoming: RunActivity[],
): { activities: RunActivity[]; added: number; updated: number } {
  const byId = new Map<number, RunActivity>();
  for (const activity of existing) byId.set(activity.id, activity);

  let added = 0;
  let updated = 0;

  for (const activity of incoming) {
    const prev = byId.get(activity.id);
    if (!prev) {
      byId.set(activity.id, activity);
      added += 1;
      continue;
    }
    const merged = preferRicherActivity(prev, activity);
    byId.set(activity.id, merged);
    if (
      prev.name !== merged.name ||
      prev.distance !== merged.distance ||
      prev.totalPhotoCount !== merged.totalPhotoCount ||
      prev.summaryPolyline !== merged.summaryPolyline ||
      (prev.photos?.length ?? 0) !== (merged.photos?.length ?? 0)
    ) {
      updated += 1;
    }
  }

  const activities = [...byId.values()].sort(
    (a, b) => activityTimestamp(b) - activityTimestamp(a),
  );

  return { activities, added, updated };
}

export function newestActivityStart(activities: RunActivity[]): string | null {
  if (!activities.length) return null;
  let newest = activities[0].startDate;
  let newestTs = activityTimestamp(activities[0]);
  for (const activity of activities) {
    const ts = activityTimestamp(activity);
    if (ts > newestTs) {
      newestTs = ts;
      newest = activity.startDate;
    }
  }
  return newest;
}

/** Overlap window so late uploads / edits near the cursor aren't missed. */
export const INCREMENTAL_OVERLAP_SECONDS = 60 * 60 * 48;

export function sinceToAfterEpoch(sinceIso: string, overlapSeconds = INCREMENTAL_OVERLAP_SECONDS) {
  const ts = Date.parse(sinceIso);
  if (!Number.isFinite(ts)) return undefined;
  return Math.max(0, Math.floor(ts / 1000) - overlapSeconds);
}
