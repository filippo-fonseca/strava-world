"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RunActivity } from "@/lib/types";
import {
  clearRunsCache,
  isCacheFresh,
  readRunsCache,
  RUNS_CACHE_MAX_AGE_MS,
} from "@/lib/runs-cache";
import { hydrateActivities } from "@/lib/geo";
import {
  applySyncResponse,
  fetchActivitiesFromApi,
  shouldFullRebuild,
  syncCursorFromCache,
  type SyncMode,
} from "@/lib/sync-runs";

type Options = {
  athleteId?: number;
  isDemo: boolean;
};

function newestCursor(activities: RunActivity[]) {
  if (!activities.length) return null;
  let newest = activities[0].startDate;
  let newestTs = Date.parse(newest);
  for (const activity of activities) {
    const ts = Date.parse(activity.startDate);
    if (Number.isFinite(ts) && ts > newestTs) {
      newestTs = ts;
      newest = activity.startDate;
    }
  }
  return newest;
}

export function useRunsAtlas({ athleteId, isDemo }: Options) {
  const router = useRouter();
  const [activities, setActivities] = useState<RunActivity[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const activitiesRef = useRef<RunActivity[]>([]);
  const syncedAtRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const selectedReconcileRef = useRef<
    ((next: RunActivity[]) => void) | null
  >(null);

  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  useEffect(() => {
    syncedAtRef.current = syncedAt;
  }, [syncedAt]);

  useEffect(() => {
    let cancelled = false;

    function commitResult(
      nextActivities: RunActivity[],
      nextSyncedAt: string,
      note: string | null,
    ) {
      startTransition(() => {
        setActivities(nextActivities);
        setSyncedAt(nextSyncedAt);
        selectedReconcileRef.current?.(nextActivities);
        setStatusNote(note);
      });
      activitiesRef.current = nextActivities;
      syncedAtRef.current = nextSyncedAt;
    }

    async function runSync(options: {
      mode: SyncMode;
      forceRefresh?: boolean;
      background?: boolean;
      since?: string | null;
    }) {
      if (syncingRef.current) return;
      syncingRef.current = true;
      if (!options.background) setLoading(true);
      setSyncing(true);
      if (!options.background) setError(null);

      try {
        const response = await fetchActivitiesFromApi({
          mode: options.mode,
          since: options.since,
          forceRefresh: options.forceRefresh,
        });
        if (cancelled) return;

        const result = await applySyncResponse({
          existing: activitiesRef.current,
          response,
          athleteId,
          isDemo,
        });

        let note: string | null = null;
        if (result.mode === "incremental") {
          if (result.added > 0 || result.updated > 0) {
            const parts = [];
            if (result.added > 0) {
              parts.push(
                `${result.added} new run${result.added === 1 ? "" : "s"}`,
              );
            }
            if (result.updated > 0) {
              parts.push(`${result.updated} updated`);
            }
            note = parts.join(" · ");
          } else {
            note = "up to date";
          }
        } else {
          note = `${result.activities.length} runs`;
        }

        commitResult(result.activities, result.syncedAt, note);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          if (activitiesRef.current.length === 0) {
            setError(err instanceof Error ? err.message : "Failed to load");
          } else {
            setStatusNote("sync failed — showing cached runs");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSyncing(false);
        }
        syncingRef.current = false;
      }
    }

    async function bootstrap() {
      setError(null);
      const cached = await readRunsCache(athleteId, isDemo);
      if (cancelled) return;

      if (cached?.activities?.length) {
        const hydrated = hydrateActivities(cached.activities);
        commitResult(hydrated, cached.syncedAt, null);
        setLoading(false);

        if (shouldFullRebuild(cached.syncedAt)) {
          void runSync({ mode: "full", forceRefresh: true, background: true });
          return;
        }

        if (!isCacheFresh(cached.syncedAt, RUNS_CACHE_MAX_AGE_MS)) {
          void runSync({
            mode: "incremental",
            since: syncCursorFromCache(cached),
            background: true,
          });
        }
        return;
      }

      await runSync({ mode: "full", background: false });
    }

    void bootstrap();

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (syncingRef.current) return;
      const cursor = syncedAtRef.current;
      if (!cursor) return;
      if (isCacheFresh(cursor, RUNS_CACHE_MAX_AGE_MS)) return;

      if (shouldFullRebuild(cursor)) {
        void runSync({ mode: "full", forceRefresh: true, background: true });
      } else {
        void runSync({
          mode: "incremental",
          since: newestCursor(activitiesRef.current) || cursor,
          background: true,
        });
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [athleteId, isDemo]);

  const sync = useCallback(
    async (forceFull = false) => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      setSyncing(true);
      setError(null);
      setStatusNote(null);

      try {
        const useFull =
          forceFull ||
          activitiesRef.current.length === 0 ||
          shouldFullRebuild(syncedAtRef.current);

        const response = await fetchActivitiesFromApi({
          mode: useFull ? "full" : "incremental",
          since: useFull
            ? null
            : newestCursor(activitiesRef.current) || syncedAtRef.current,
          forceRefresh: useFull,
        });

        const result = await applySyncResponse({
          existing: activitiesRef.current,
          response,
          athleteId,
          isDemo,
        });

        startTransition(() => {
          setActivities(result.activities);
          setSyncedAt(result.syncedAt);
          selectedReconcileRef.current?.(result.activities);
          if (result.mode === "incremental") {
            if (result.added || result.updated) {
              setStatusNote(
                [
                  result.added
                    ? `${result.added} new run${result.added === 1 ? "" : "s"}`
                    : null,
                  result.updated ? `${result.updated} updated` : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
              );
            } else {
              setStatusNote("up to date");
            }
          } else {
            setStatusNote(`rebuilt ${result.activities.length} runs`);
          }
        });
        activitiesRef.current = result.activities;
        syncedAtRef.current = result.syncedAt;
      } catch (err) {
        if (activitiesRef.current.length === 0) {
          setError(err instanceof Error ? err.message : "Sync failed");
        } else {
          setStatusNote("sync failed — showing cached runs");
        }
      } finally {
        setLoading(false);
        setSyncing(false);
        syncingRef.current = false;
      }
    },
    [athleteId, isDemo],
  );

  const logout = useCallback(async () => {
    await clearRunsCache(athleteId, isDemo);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }, [athleteId, isDemo, router]);

  const registerSelectedReconcile = useCallback(
    (fn: ((next: RunActivity[]) => void) | null) => {
      selectedReconcileRef.current = fn;
    },
    [],
  );

  return {
    activities,
    syncedAt,
    loading,
    syncing,
    error,
    statusNote,
    sync,
    logout,
    registerSelectedReconcile,
  };
}
