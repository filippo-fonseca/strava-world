import { unstable_cache } from "next/cache";
import { getDemoActivities } from "@/lib/demo-data";
import { fetchRunActivities } from "@/lib/strava/client";
import type { RunActivity } from "@/lib/types";

export type RunsPayload = {
  activities: RunActivity[];
  syncedAt: string;
  source: "server-cache" | "demo";
};

/** Server cache TTL — client IndexedDB also uses 6 hours. */
export const RUNS_SERVER_REVALIDATE_SECONDS = 60 * 60 * 6;

export async function getCachedRunActivities(options: {
  athleteId: number;
  accessToken: string;
  cacheEpoch: number;
}): Promise<RunsPayload> {
  const { athleteId, accessToken, cacheEpoch } = options;

  // cacheEpoch rotates on manual Sync so the next read is a cold miss.
  const readCache = unstable_cache(
    async () => {
      const activities = await fetchRunActivities(accessToken);
      return {
        activities,
        syncedAt: new Date().toISOString(),
      };
    },
    ["strava-runs-v1", String(athleteId), String(cacheEpoch)],
    {
      revalidate: RUNS_SERVER_REVALIDATE_SECONDS,
      tags: [`strava-runs-${athleteId}`],
    },
  );

  const cached = await readCache();
  return { ...cached, source: "server-cache" };
}

export function getDemoRunsPayload(): RunsPayload {
  return {
    activities: getDemoActivities(),
    syncedAt: new Date().toISOString(),
    source: "demo",
  };
}
