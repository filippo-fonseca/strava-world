"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { LogOut, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AthleteSummary, MapMode, RunActivity } from "@/lib/types";
import {
  clearRunsCache,
  formatSyncedAt,
  isCacheFresh,
  readRunsCache,
  RUNS_CACHE_MAX_AGE_MS,
  writeRunsCache,
} from "@/lib/runs-cache";
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

type ActivitiesResponse = {
  activities: RunActivity[];
  syncedAt?: string;
  source?: string;
  isDemo?: boolean;
  error?: string;
};

export function MapExplorer({ initialAthlete, isDemo }: Props) {
  const router = useRouter();
  const [activities, setActivities] = useState<RunActivity[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<MapMode>("heatmap");
  const [selected, setSelected] = useState<RunActivity | null>(null);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function persist(
      data: ActivitiesResponse,
    ) {
      const nextSyncedAt = data.syncedAt ?? new Date().toISOString();
      startTransition(() => {
        setActivities(data.activities);
        setSyncedAt(nextSyncedAt);
      });
      await writeRunsCache({
        athleteId: isDemo ? "demo" : (initialAthlete?.id ?? "demo"),
        isDemo,
        syncedAt: nextSyncedAt,
        activities: data.activities,
      });
    }

    async function syncFromNetwork(refresh: boolean, background: boolean) {
      if (!background) setLoading(true);
      setSyncing(true);
      setError(null);

      try {
        const url = refresh ? "/api/activities?refresh=1" : "/api/activities";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Could not load activities");
        const data = (await res.json()) as ActivitiesResponse;
        if (cancelled) return;
        await persist(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSyncing(false);
        }
      }
    }

    async function bootstrap() {
      setError(null);

      const cached = await readRunsCache(initialAthlete?.id, isDemo);
      if (cancelled) return;

      if (cached?.activities?.length) {
        setActivities(cached.activities);
        setSyncedAt(cached.syncedAt);
        setLoading(false);

        if (isCacheFresh(cached.syncedAt, RUNS_CACHE_MAX_AGE_MS)) {
          return;
        }

        void syncFromNetwork(false, true);
        return;
      }

      await syncFromNetwork(false, false);
    }

    void bootstrap();
    return () => {
      cancelled = true;
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

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/activities?refresh=1", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not sync activities");
      const data = (await res.json()) as ActivitiesResponse;
      const nextSyncedAt = data.syncedAt ?? new Date().toISOString();
      setActivities(data.activities);
      setSyncedAt(nextSyncedAt);
      await writeRunsCache({
        athleteId: isDemo ? "demo" : (initialAthlete?.id ?? "demo"),
        isDemo,
        syncedAt: nextSyncedAt,
        activities: data.activities,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading(false);
      setSyncing(false);
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
            onClick={handleSync}
            disabled={syncing}
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
