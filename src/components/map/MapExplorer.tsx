"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { LogOut, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AthleteSummary, MapMode, RunActivity } from "@/lib/types";
import {
  clearRunsCache,
  formatSyncedAt,
  isCacheFresh,
  readRunsCache,
  RUNS_CACHE_MAX_AGE_MS,
} from "@/lib/runs-cache";
import {
  applySyncResponse,
  fetchActivitiesFromApi,
  shouldFullRebuild,
  syncCursorFromCache,
  type SyncMode,
} from "@/lib/sync-runs";
import { WorldMap } from "@/components/map/WorldMap";
import { ModeToggle } from "@/components/map/ModeToggle";
import { ActivityList } from "@/components/map/ActivityList";
import { ActivityDrawer } from "@/components/map/ActivityDrawer";
import { StatsBar } from "@/components/map/StatsBar";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuPanel } from "@/components/ui/NeuPanel";

type Props = {
  initialAthlete: AthleteSummary | null;
  isDemo: boolean;
};

export function MapExplorer({ initialAthlete, isDemo }: Props) {
  const router = useRouter();
  const [activities, setActivities] = useState<RunActivity[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [mode, setMode] = useState<MapMode>("heatmap");
  const [selected, setSelected] = useState<RunActivity | null>(null);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const activitiesRef = useRef<RunActivity[]>([]);
  const syncedAtRef = useRef<string | null>(null);
  const syncingRef = useRef(false);

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
        setSelected((current) => {
          if (!current) return null;
          return nextActivities.find((item) => item.id === current.id) ?? null;
        });
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
          athleteId: initialAthlete?.id,
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
              parts.push(
                `${result.updated} updated`,
              );
            }
            note = parts.join(" · ");
          } else {
            note = "Already up to date";
          }
        } else {
          note = `Loaded ${result.activities.length} runs`;
        }

        commitResult(result.activities, result.syncedAt, note);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          // Keep showing cached atlas if we have one.
          if (activitiesRef.current.length === 0) {
            setError(err instanceof Error ? err.message : "Failed to load");
          } else {
            setStatusNote("Sync failed — showing cached runs");
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
      const cached = await readRunsCache(initialAthlete?.id, isDemo);
      if (cancelled) return;

      if (cached?.activities?.length) {
        commitResult(cached.activities, cached.syncedAt, null);
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
          since:
            newestCursor(activitiesRef.current) || cursor,
          background: true,
        });
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initialAthlete?.id, isDemo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activities;
    return activities.filter((activity) =>
      [activity.name, activity.locationCity, activity.locationCountry]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [activities, query]);

  async function handleSync(forceFull = false) {
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
        athleteId: initialAthlete?.id,
        isDemo,
      });

      startTransition(() => {
        setActivities(result.activities);
        setSyncedAt(result.syncedAt);
        setSelected((current) => {
          if (!current) return null;
          return result.activities.find((item) => item.id === current.id) ?? null;
        });
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
            setStatusNote("Already up to date");
          }
        } else {
          setStatusNote(`Rebuilt ${result.activities.length} runs`);
        }
      });
      activitiesRef.current = result.activities;
      syncedAtRef.current = result.syncedAt;
    } catch (err) {
      if (activitiesRef.current.length === 0) {
        setError(err instanceof Error ? err.message : "Sync failed");
      } else {
        setStatusNote("Sync failed — showing cached runs");
      }
    } finally {
      setLoading(false);
      setSyncing(false);
      syncingRef.current = false;
    }
  }

  async function logout() {
    await clearRunsCache(initialAthlete?.id, isDemo);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const showInitialLoading = loading && activities.length === 0;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
      <header className="neu-convex flex flex-wrap items-center justify-between gap-3 rounded-[28px] px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <div className="neu-concave grid h-12 w-12 place-items-center rounded-2xl">
            <Sparkles className="text-[var(--neu-accent)]" size={20} />
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
              Strava World
            </p>
            <p className="text-sm text-[var(--neu-muted)]">
              {initialAthlete
                ? `${initialAthlete.firstname} ${initialAthlete.lastname}`
                : "Explorer"}
              {isDemo ? " · Demo atlas" : " · Live Strava"}
              {" · "}
              {formatSyncedAt(syncedAt)}
              {statusNote ? ` · ${statusNote}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ModeToggle value={mode} onChange={setMode} />
          <NeuButton
            variant="concave"
            leftIcon={
              <RefreshCw
                size={15}
                className={syncing ? "animate-spin" : undefined}
              />
            }
            onClick={() => handleSync(false)}
            onContextMenu={(e) => {
              e.preventDefault();
              void handleSync(true);
            }}
            disabled={syncing}
            title="Sync new runs. Right-click for a full rebuild."
          >
            {syncing ? "Syncing…" : "Sync"}
          </NeuButton>
          <NeuButton
            variant="ghost"
            leftIcon={<LogOut size={15} />}
            onClick={logout}
          >
            Sign out
          </NeuButton>
        </div>
      </header>

      <StatsBar activities={activities} />

      <div className="grid min-h-[70vh] flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="order-2 flex min-h-[360px] flex-col gap-3 lg:order-1">
          <NeuPanel inset className="!p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, country, run…"
              className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--neu-muted)]"
            />
          </NeuPanel>
          {showInitialLoading ? (
            <NeuPanel className="flex flex-1 items-center justify-center text-[var(--neu-muted)]">
              Fetching your run history from Strava…
            </NeuPanel>
          ) : error && activities.length === 0 ? (
            <NeuPanel className="flex flex-1 items-center justify-center text-[var(--neu-accent)]">
              {error}
            </NeuPanel>
          ) : (
            <ActivityList
              activities={filtered}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          )}
        </div>

        <div className="relative order-1 min-h-[520px] lg:order-2 lg:min-h-0 lg:h-full">
          {showInitialLoading || (error && activities.length === 0) ? (
            <div className="neu-concave flex h-[min(72vh,760px)] min-h-[520px] items-center justify-center rounded-[32px] text-[var(--neu-muted)] md:h-full">
              {error || "Plotting your world…"}
            </div>
          ) : (
            <WorldMap
              activities={filtered}
              mode={mode}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          )}
          <ActivityDrawer activity={selected} onClose={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}

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
