"use client";

import { useEffect, useMemo, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import type { AthleteSummary, MapLayers, RunActivity } from "@/lib/types";
import { DEFAULT_MAP_LAYERS } from "@/lib/types";
import { formatSyncedAt } from "@/lib/runs-cache";
import { computeJourneyAnalytics } from "@/lib/analytics";
import {
  EMPTY_RUN_FILTERS,
  filterActivities,
  type RunFilters,
} from "@/lib/run-filters";
import { useRunsAtlas } from "@/hooks/useRunsAtlas";
import { WorldMapDynamic as WorldMap, MapSkeleton } from "@/components/map/WorldMapDynamic";
import { ModeToggle } from "@/components/map/ModeToggle";
import { ActivityList } from "@/components/map/ActivityList";
import { ActivityDrawer } from "@/components/map/ActivityDrawer";
import { RunFiltersBar } from "@/components/map/RunFiltersBar";
import { TourControls } from "@/components/map/TourControls";
import { AppShell } from "@/components/shell/AppShell";
import { HeroMapLayout } from "@/components/shell/HeroMapLayout";
import { AtlasSidePanel } from "@/components/stats/AtlasSidePanel";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import {
  buildTourStops,
  IDLE_TOUR_STATE,
  type TourState,
} from "@/lib/tour";

type Props = {
  initialAthlete: AthleteSummary | null;
  isDemo: boolean;
};

export function MapExplorer({ initialAthlete, isDemo }: Props) {
  const atlas = useRunsAtlas({
    athleteId: initialAthlete?.id,
    isDemo,
  });
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_MAP_LAYERS);
  const [selected, setSelected] = useState<RunActivity | null>(null);
  const [filters, setFilters] = useState<RunFilters>(EMPTY_RUN_FILTERS);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [tourPaused, setTourPaused] = useState(false);
  const [tourSkipNonce, setTourSkipNonce] = useState(0);
  const [tour, setTour] = useState<TourState>(IDLE_TOUR_STATE);

  const registerSelectedReconcile = atlas.registerSelectedReconcile;

  useEffect(() => {
    registerSelectedReconcile((next) => {
      setSelected((current) => {
        if (!current) return null;
        return next.find((item) => item.id === current.id) ?? null;
      });
    });
    return () => registerSelectedReconcile(null);
  }, [registerSelectedReconcile]);

  const filtered = useMemo(
    () => filterActivities(atlas.activities, filters),
    [atlas.activities, filters],
  );

  // Selection only counts when it still matches the active filters.
  const activeSelection = useMemo(() => {
    if (!selected) return null;
    return filtered.find((item) => item.id === selected.id) ?? null;
  }, [filtered, selected]);

  const analytics = useMemo(
    () => computeJourneyAnalytics(filtered),
    [filtered],
  );

  const showInitialLoading = atlas.loading && atlas.activities.length === 0;
  const showMap = atlas.activities.length > 0;

  const athleteLabel = initialAthlete
    ? `${initialAthlete.firstname} ${initialAthlete.lastname}`.toLowerCase()
    : "explorer";
  const meta = [
    isDemo ? "demo" : "strava",
    atlas.syncing ? "updating…" : formatSyncedAt(atlas.syncedAt).toLowerCase(),
    atlas.statusNote,
  ]
    .filter(Boolean)
    .join(" · ");

  const rankedPreview = useMemo(() => filtered.slice(0, 6), [filtered]);

  function focusRun(activity: RunActivity) {
    if (tourPlaying) {
      setTourPlaying(false);
      setTourPaused(false);
    }
    setSelected(activity);
  }

  const tourStopCount = useMemo(
    () => buildTourStops(filtered).length,
    [filtered],
  );

  function handleTourChange(next: TourState) {
    setTour(next);
    if (next.phase === "done" || (next.status === "idle" && tourPlaying)) {
      setTourPlaying(false);
      setTourPaused(false);
    }
  }

  return (
    <AppShell
      athleteLabel={athleteLabel}
      meta={meta}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <RefreshCw
                size={14}
                className={atlas.syncing ? "animate-spin" : undefined}
              />
            }
            onClick={() => atlas.sync(false)}
            onContextMenu={(e) => {
              e.preventDefault();
              void atlas.sync(true);
            }}
            disabled={atlas.syncing}
            title="Sync new runs. Right-click for a full rebuild."
          >
            {atlas.syncing ? "syncing…" : "sync"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<LogOut size={14} />}
            onClick={atlas.logout}
          >
            sign out
          </Button>
        </>
      }
    >
      <HeroMapLayout
        mapFirstOnMobile
        left={
          <>
            <RunFiltersBar
              activities={atlas.activities}
              filters={filters}
              onChange={setFilters}
              resultCount={filtered.length}
              totalCount={atlas.activities.length}
            />
            {showInitialLoading ? (
              <Panel className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden !p-3">
                <div className="skeleton h-3 w-16" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex min-w-0 items-center gap-3 py-1">
                    <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="skeleton mb-1.5 h-3.5 w-[75%]" />
                      <div className="skeleton h-3 w-[50%]" />
                    </div>
                  </div>
                ))}
              </Panel>
            ) : atlas.error && atlas.activities.length === 0 ? (
              <Panel className="flex flex-1 flex-col items-start justify-center gap-3 text-[var(--accent)]">
                <p className="text-sm">{atlas.error}</p>
                <Button variant="secondary" onClick={() => atlas.sync(true)}>
                  try again
                </Button>
              </Panel>
            ) : (
              <div className="min-h-[240px] min-w-0 flex-1 overflow-hidden lg:min-h-0">
                <ActivityList
                  key={`${filtered.length}:${filtered[0]?.id ?? ""}:${filtered[filtered.length - 1]?.id ?? ""}`}
                  activities={filtered}
                  selectedId={activeSelection?.id}
                  onSelect={focusRun}
                />
              </div>
            )}
          </>
        }
        map={
          <>
            {showMap ? (
              <WorldMap
                activities={filtered}
                layers={layers}
                selectedId={activeSelection?.id}
                onSelect={setSelected}
                fillContainer
                tourPlaying={tourPlaying}
                tourPaused={tourPaused}
                tourSkipNonce={tourSkipNonce}
                onTourChange={handleTourChange}
              />
            ) : showInitialLoading ? (
              <MapSkeleton />
            ) : (
              <div className="grid h-full place-items-center px-4 text-center font-mono text-[12px] text-[var(--muted)]">
                {atlas.error || "no runs to show yet"}
              </div>
            )}
            <ActivityDrawer
              activity={activeSelection}
              onClose={() => setSelected(null)}
            />
          </>
        }
        mapCaption={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ModeToggle value={layers} onChange={setLayers} />
              <TourControls
                tour={tour}
                disabled={tourStopCount === 0 || showInitialLoading}
                onPlay={() => {
                  // Tour is city-by-city camera only — clear any selected run/drawer.
                  setSelected(null);
                  setTourPaused(false);
                  setTourPlaying(true);
                }}
                onPause={() => setTourPaused(true)}
                onResume={() => setTourPaused(false)}
                onStop={() => {
                  setTourPlaying(false);
                  setTourPaused(false);
                  setTour(IDLE_TOUR_STATE);
                }}
                onSkip={() => setTourSkipNonce((n) => n + 1)}
              />
            </div>
            <span className="font-mono text-[11px] text-[var(--muted)]">
              {tourPlaying
                ? tour.detail || "touring your atlas"
                : filtered.length !== atlas.activities.length
                  ? `showing ${filtered.length} filtered · click a run to fly there`
                  : "click a run to fly there · or start a cinematic tour"}
            </span>
          </div>
        }
        right={
          <AtlasSidePanel
            analytics={analytics}
            recent={rankedPreview}
            loading={showInitialLoading}
            filtered={filtered.length !== atlas.activities.length}
            onSelectRun={focusRun}
          />
        }
      />
    </AppShell>
  );
}
