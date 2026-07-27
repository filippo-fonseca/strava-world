"use client";

import {
  mergeRunActivities,
  newestActivityStart,
} from "@/lib/merge-runs";
import { hydrateActivities } from "@/lib/geo";
import {
  RUNS_CACHE_SCHEMA_VERSION,
  RUNS_FULL_REBUILD_MAX_AGE_MS,
  isCacheFresh,
  writeRunsCache,
  type CachedRuns,
} from "@/lib/runs-cache";
import type { RunActivity } from "@/lib/types";

export type SyncMode = "incremental" | "full";

export type ActivitiesResponse = {
  activities: RunActivity[];
  syncedAt?: string;
  source?: string;
  mode?: SyncMode;
  isDemo?: boolean;
  error?: string;
};

export type SyncResult = {
  activities: RunActivity[];
  syncedAt: string;
  mode: SyncMode;
  added: number;
  updated: number;
};

function athleteCacheId(
  athleteId: number | null | undefined,
  isDemo: boolean,
): number | "demo" {
  if (isDemo) return "demo";
  return athleteId ?? "demo";
}

export function shouldFullRebuild(syncedAt: string | null | undefined) {
  if (!syncedAt) return true;
  return !isCacheFresh(syncedAt, RUNS_FULL_REBUILD_MAX_AGE_MS);
}

export async function fetchActivitiesFromApi(options: {
  mode: SyncMode;
  since?: string | null;
  /** Bust server snapshot cache (manual rebuild). */
  forceRefresh?: boolean;
}): Promise<ActivitiesResponse> {
  const params = new URLSearchParams();

  if (options.mode === "incremental" && options.since) {
    params.set("mode", "incremental");
    params.set("since", options.since);
  } else {
    params.set("mode", "full");
    if (options.forceRefresh) params.set("refresh", "1");
  }

  const res = await fetch(`/api/activities?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      options.mode === "full"
        ? "Could not rebuild activities"
        : "Could not sync activities",
    );
  }
  return (await res.json()) as ActivitiesResponse;
}

export async function applySyncResponse(options: {
  existing: RunActivity[];
  response: ActivitiesResponse;
  athleteId: number | null | undefined;
  isDemo: boolean;
}): Promise<SyncResult> {
  const mode: SyncMode =
    options.response.mode === "incremental" ? "incremental" : "full";
  const syncedAt = options.response.syncedAt ?? new Date().toISOString();

  const merged =
    mode === "incremental"
      ? mergeRunActivities(options.existing, options.response.activities)
      : {
          activities: options.response.activities,
          added: options.response.activities.length,
          updated: 0,
        };

  const activities = hydrateActivities(merged.activities);

  const payload: CachedRuns = {
    athleteId: athleteCacheId(options.athleteId, options.isDemo),
    isDemo: options.isDemo,
    syncedAt,
    newestStartDate: newestActivityStart(activities),
    schemaVersion: RUNS_CACHE_SCHEMA_VERSION,
    activities,
  };

  await writeRunsCache(payload);

  return {
    activities,
    syncedAt,
    mode,
    added: merged.added,
    updated: merged.updated,
  };
}

export function syncCursorFromCache(cache: CachedRuns | null) {
  if (!cache) return null;
  return cache.newestStartDate || cache.syncedAt || null;
}
