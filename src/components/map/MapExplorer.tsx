"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, RefreshCw } from "lucide-react";
import type { AthleteSummary, MapLayers, RunActivity } from "@/lib/types";
import { DEFAULT_MAP_LAYERS } from "@/lib/types";
import { formatSyncedAt } from "@/lib/runs-cache";
import { formatDistance } from "@/lib/format";
import { compactStatItems, computeJourneyAnalytics } from "@/lib/analytics";
import { useRunsAtlas } from "@/hooks/useRunsAtlas";
import { WorldMapDynamic as WorldMap, MapSkeleton } from "@/components/map/WorldMapDynamic";
import { ModeToggle } from "@/components/map/ModeToggle";
import { ActivityList } from "@/components/map/ActivityList";
import { ActivityDrawer } from "@/components/map/ActivityDrawer";
import { AppShell } from "@/components/shell/AppShell";
import { HeroMapLayout } from "@/components/shell/HeroMapLayout";
import { StatBlock } from "@/components/stats/StatBlock";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

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
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return atlas.activities;
    return atlas.activities.filter((activity) =>
      [activity.name, activity.locationCity, activity.locationCountry]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [atlas.activities, query]);

  const analytics = useMemo(
    () => computeJourneyAnalytics(atlas.activities),
    [atlas.activities],
  );
  const compactStats = useMemo(
    () => compactStatItems(analytics).slice(0, 6),
    [analytics],
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

  const rankedPreview = useMemo(() => {
    return [...filtered]
      .sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate))
      .slice(0, 8);
  }, [filtered]);

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
        left={
          <>
            <Panel inset className="!p-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search city, country, run…"
                className="w-full bg-transparent px-2 py-2 font-mono text-[12px] outline-none placeholder:text-[var(--faint)]"
                aria-label="Search runs"
              />
            </Panel>
            {showInitialLoading ? (
              <Panel className="flex flex-1 flex-col gap-2 !p-3">
                <div className="skeleton h-3 w-16" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1">
                    <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
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
              <div className="min-h-[240px] flex-1 lg:min-h-0">
                <ActivityList
                  activities={filtered}
                  selectedId={selected?.id}
                  onSelect={setSelected}
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
                selectedId={selected?.id}
                onSelect={setSelected}
                fillContainer
              />
            ) : showInitialLoading ? (
              <MapSkeleton />
            ) : (
              <div className="grid h-full place-items-center px-4 text-center font-mono text-[12px] text-[var(--muted)]">
                {atlas.error || "no runs to show yet"}
              </div>
            )}
            <ActivityDrawer activity={selected} onClose={() => setSelected(null)} />
          </>
        }
        mapCaption={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ModeToggle value={layers} onChange={setLayers} />
            <span>
              drag to pan · scroll to zoom · tap a run for details
            </span>
          </div>
        }
        right={
          <>
            {showInitialLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton h-[88px] min-w-[9.5rem] shrink-0 snap-start lg:min-w-0"
                  />
                ))
              : compactStats.map((item, index) => (
                  <StatBlock
                    key={item.key}
                    label={item.label}
                    value={item.value}
                    accent={index === 0}
                  />
                ))}

            <div className="min-w-[14rem] shrink-0 snap-start rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-3 lg:min-w-0 lg:flex-1">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="mono-label">recent</p>
                <Link
                  href="/stats"
                  className="link-accent font-mono text-[11px] lowercase"
                >
                  all stats →
                </Link>
              </div>
              {showInitialLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-8 w-full" />
                  ))}
                </div>
              ) : rankedPreview.length === 0 ? (
                <p className="font-mono text-[11px] text-[var(--muted)]">
                  no runs yet
                </p>
              ) : (
                <ul className="space-y-1">
                  {rankedPreview.map((activity, index) => (
                    <li key={activity.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(activity)}
                        className="pressable flex min-h-10 w-full items-center gap-2 rounded-[var(--radius)] px-1.5 py-1.5 text-left"
                      >
                        <span className="w-4 shrink-0 font-mono text-[11px] tabular-nums text-[var(--faint)]">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--ink)]">
                          {activity.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">
                          {formatDistance(activity.distance)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        }
      />
    </AppShell>
  );
}
