import { unstable_cache } from "next/cache";
import { getDemoActivities } from "@/lib/demo-data";
import { fetchRunActivities } from "@/lib/strava/client";
import type { RunActivity } from "@/lib/types";

export type RunsPayload = {
  activities: RunActivity[];
  syncedAt: string;
  source: "server-cache" | "network" | "demo";
  mode: "full" | "incremental";
};

/** Server cache TTL for full snapshots. */
export const RUNS_SERVER_REVALIDATE_SECONDS = 60 * 60 * 6;

export async function getFullRunActivities(options: {
  athleteId: number;
  accessToken: string;
  cacheEpoch: number;
}): Promise<RunsPayload> {
  const { athleteId, accessToken, cacheEpoch } = options;

  const readCache = unstable_cache(
    async () => {
      const activities = await fetchRunActivities(accessToken);
      return {
        activities,
        syncedAt: new Date().toISOString(),
      };
    },
    ["strava-runs-v2", String(athleteId), String(cacheEpoch)],
    {
      revalidate: RUNS_SERVER_REVALIDATE_SECONDS,
      tags: [`strava-runs-${athleteId}`],
    },
  );

  const cached = await readCache();
  return { ...cached, source: "server-cache", mode: "full" };
}

export async function getIncrementalRunActivities(options: {
  accessToken: string;
  after: number;
}): Promise<RunsPayload> {
  const activities = await fetchRunActivities(options.accessToken, {
    after: options.after,
    maxPages: 5,
    maxRuns: 400,
    maxPhotoFetches: 80,
  });

  return {
    activities,
    syncedAt: new Date().toISOString(),
    source: "network",
    mode: "incremental",
  };
}

export function getDemoRunsPayload(): RunsPayload {
  return {
    activities: getDemoActivities(),
    syncedAt: new Date().toISOString(),
    source: "demo",
    mode: "full",
  };
}
