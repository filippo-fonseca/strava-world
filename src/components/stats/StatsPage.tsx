"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, RefreshCw } from "lucide-react";
import type { AthleteSummary } from "@/lib/types";
import { formatSyncedAt } from "@/lib/runs-cache";
import {
  compactStatItems,
  computeJourneyAnalytics,
  journeySummaryText,
} from "@/lib/analytics";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatElevation,
} from "@/lib/format";
import { formatAtlasSpan } from "@/lib/stats";
import { useRunsAtlas } from "@/hooks/useRunsAtlas";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { StatBlock } from "@/components/stats/StatBlock";
import { MonthlyDistanceChart } from "@/components/charts/MonthlyDistanceChart";
import { WeekdayChart } from "@/components/charts/WeekdayChart";
import { PlacesPieChart } from "@/components/charts/PlacesPieChart";
import { PhotoDonut } from "@/components/charts/PhotoDonut";

type Props = {
  initialAthlete: AthleteSummary | null;
  isDemo: boolean;
};

export function StatsPage({ initialAthlete, isDemo }: Props) {
  const atlas = useRunsAtlas({
    athleteId: initialAthlete?.id,
    isDemo,
  });
  const [copied, setCopied] = useState(false);

  const analytics = useMemo(
    () => computeJourneyAnalytics(atlas.activities),
    [atlas.activities],
  );

  const runsWithPhotos = useMemo(() => {
    let n = 0;
    for (const a of atlas.activities) {
      if (a.totalPhotoCount > 0) n += 1;
    }
    return n;
  }, [atlas.activities]);

  const showLoading = atlas.loading && atlas.activities.length === 0;
  const athleteLabel = initialAthlete
    ? `${initialAthlete.firstname} ${initialAthlete.lastname}`.toLowerCase()
    : "explorer";
  const meta = [
    isDemo ? "demo" : "strava",
    atlas.syncing ? "updating…" : formatSyncedAt(atlas.syncedAt)?.toLowerCase(),
    atlas.statusNote,
  ]
    .filter(Boolean)
    .join(" · ");

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(journeySummaryText(analytics));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="mono-label">journey</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink-display)] lowercase sm:text-3xl">
            stats
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            the numbers behind the miles — charts for places, rhythm, and
            distance over time.
          </p>
          {formatAtlasSpan(analytics.overview) && (
            <p className="mt-2 font-mono text-[11px] text-[var(--faint)]">
              {formatAtlasSpan(analytics.overview)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={copySummary}>
            {copied ? "copied" : "copy summary"}
          </Button>
          <Link
            href="/map"
            className="link-accent font-mono text-[12px] lowercase"
          >
            open map →
          </Link>
        </div>
      </div>

      {atlas.error && atlas.activities.length === 0 ? (
        <div className="surface p-6 text-[var(--accent)]">
          <p>{atlas.error}</p>
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => atlas.sync(true)}
          >
            try again
          </Button>
        </div>
      ) : showLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-8 pb-6">
          <section>
            <p className="mono-label mb-3">overview</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
              {compactStatItems(analytics).map((item, i) => (
                <StatBlock
                  key={item.key}
                  label={item.label}
                  value={item.value}
                  compact
                  accent={i === 0}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="surface p-3 sm:p-4">
              <p className="mono-label mb-3">monthly distance</p>
              <MonthlyDistanceChart data={analytics.monthlyDistance} />
            </div>
            <div className="surface p-3 sm:p-4">
              <p className="mono-label mb-3">weekday rhythm</p>
              <WeekdayChart data={analytics.weekdayRuns} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="surface p-3 sm:p-4">
              <p className="mono-label mb-3">countries</p>
              <PlacesPieChart
                places={analytics.topCountries}
                emptyLabel="no country tags on these runs"
              />
            </div>
            <div className="surface p-3 sm:p-4">
              <p className="mono-label mb-3">cities</p>
              <PlacesPieChart
                places={analytics.topCities}
                emptyLabel="no city tags on these runs"
              />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="surface p-3 sm:p-4">
              <p className="mono-label mb-3">photo coverage</p>
              <PhotoDonut
                withPhotos={runsWithPhotos}
                withoutPhotos={Math.max(
                  0,
                  analytics.overview.runs - runsWithPhotos,
                )}
              />
            </div>
            <div className="surface p-3 sm:p-4">
              <p className="mono-label mb-3">averages & consistency</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatBlock
                  compact
                  label="avg distance"
                  value={formatDistance(analytics.avgDistanceMeters)}
                />
                <StatBlock
                  compact
                  label="avg moving"
                  value={formatDuration(analytics.avgMovingTimeSeconds)}
                />
                <StatBlock
                  compact
                  label="avg pace"
                  value={analytics.avgPaceLabel}
                />
                <StatBlock
                  compact
                  label="current streak"
                  value={`${analytics.currentStreakDays}d`}
                  accent={analytics.currentStreakDays > 0}
                />
                <StatBlock
                  compact
                  label="longest streak"
                  value={`${analytics.longestStreakDays}d`}
                />
                <StatBlock
                  compact
                  label="this week / month"
                  value={`${analytics.runsThisWeek} / ${analytics.runsThisMonth}`}
                />
                <StatBlock
                  compact
                  label="elevation"
                  value={formatElevation(analytics.overview.elevationMeters)}
                />
                <StatBlock
                  compact
                  label="photos"
                  value={String(analytics.overview.photos)}
                />
              </div>
            </div>
          </section>

          <section>
            <p className="mono-label mb-3">records</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                analytics.longestRun && {
                  key: "longest",
                  label: "longest run",
                  value: analytics.longestRun.valueLabel,
                  hint: `${analytics.longestRun.activity.name} · ${formatDate(analytics.longestRun.activity.startDate)}`,
                },
                analytics.mostElevation && {
                  key: "elev",
                  label: "most elevation",
                  value: analytics.mostElevation.valueLabel,
                  hint: analytics.mostElevation.activity.name,
                },
                analytics.fastestPace && {
                  key: "pace",
                  label: "fastest pace",
                  value: analytics.fastestPace.valueLabel,
                  hint: analytics.fastestPace.activity.name,
                },
                analytics.mostPhotos && {
                  key: "photos",
                  label: "most photos",
                  value: analytics.mostPhotos.valueLabel,
                  hint: analytics.mostPhotos.activity.name,
                },
              ]
                .filter(Boolean)
                .map((item) => (
                  <StatBlock
                    key={item!.key}
                    compact
                    label={item!.label}
                    value={item!.value}
                    hint={item!.hint}
                  />
                ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
