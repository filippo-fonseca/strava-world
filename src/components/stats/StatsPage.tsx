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
import { BarList } from "@/components/stats/BarList";

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

  const maxMonth = Math.max(
    ...analytics.monthlyDistance.map((m) => m.distanceMeters),
    1,
  );

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
          <Button variant="ghost" size="sm" leftIcon={<LogOut size={14} />} onClick={atlas.logout}>
            sign out
          </Button>
        </>
      }
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label">journey</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink-display)] lowercase sm:text-3xl">
            stats
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            the numbers behind the miles — countries, streaks, records, and where
            you keep coming back.
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
          <Link href="/map" className="link-accent font-mono text-[12px] lowercase">
            open map →
          </Link>
        </div>
      </div>

      {atlas.error && atlas.activities.length === 0 ? (
        <div className="surface p-6 text-[var(--accent)]">
          <p>{atlas.error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => atlas.sync(true)}>
            try again
          </Button>
        </div>
      ) : showLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <p className="mono-label mb-3">overview</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {compactStatItems(analytics).map((item) => (
                <StatBlock key={item.key} label={item.label} value={item.value} />
              ))}
            </div>
          </section>

          <section>
            <p className="mono-label mb-3">averages & consistency</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <StatBlock
                label="avg distance"
                value={formatDistance(analytics.avgDistanceMeters)}
              />
              <StatBlock
                label="avg moving"
                value={formatDuration(analytics.avgMovingTimeSeconds)}
              />
              <StatBlock label="avg pace" value={analytics.avgPaceLabel} />
              <StatBlock
                label="current streak"
                value={`${analytics.currentStreakDays}d`}
                accent={analytics.currentStreakDays > 0}
              />
              <StatBlock
                label="longest streak"
                value={`${analytics.longestStreakDays}d`}
              />
              <StatBlock
                label="this week / month"
                value={`${analytics.runsThisWeek} / ${analytics.runsThisMonth}`}
                hint="runs"
              />
            </div>
          </section>

          <section>
            <p className="mono-label mb-3">records</p>
            <div className="grid gap-2 sm:grid-cols-2">
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
                    label={item!.label}
                    value={item!.value}
                    hint={item!.hint}
                  />
                ))}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mono-label mb-3">top countries</p>
              <BarList
                items={analytics.topCountries.map((c) => ({
                  key: c.name,
                  label: c.name,
                  value: c.runs,
                  display: `${c.runs} · ${formatDistance(c.distanceMeters)}`,
                }))}
              />
            </div>
            <div>
              <p className="mono-label mb-3">top cities</p>
              <BarList
                items={analytics.topCities.map((c) => ({
                  key: c.name,
                  label: c.name,
                  value: c.runs,
                  display: `${c.runs} · ${formatDistance(c.distanceMeters)}`,
                }))}
              />
            </div>
          </section>

          <section>
            <p className="mono-label mb-3">monthly distance</p>
            <div className="flex h-36 items-end gap-1.5 border-b border-[var(--line)] pb-1">
              {analytics.monthlyDistance.map((month) => (
                <div
                  key={month.key}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  title={`${month.label}: ${formatDistance(month.distanceMeters)}`}
                >
                  <div
                    className="w-full max-w-[28px] rounded-[1px] bg-[var(--accent)]"
                    style={{
                      height: `${Math.max(
                        month.distanceMeters > 0 ? 6 : 2,
                        (month.distanceMeters / maxMonth) * 100,
                      )}%`,
                      opacity: month.distanceMeters > 0 ? 1 : 0.25,
                    }}
                  />
                  <span className="truncate font-mono text-[9px] text-[var(--faint)]">
                    {month.label.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mono-label mb-3">weekday rhythm</p>
              <BarList
                items={analytics.weekdayRuns.map((d) => ({
                  key: d.label,
                  label: d.label,
                  value: d.runs,
                  display: String(d.runs),
                }))}
              />
            </div>
            <div>
              <p className="mono-label mb-3">photos</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <StatBlock
                  label="photos"
                  value={String(analytics.overview.photos)}
                />
                <StatBlock
                  label="runs with photos"
                  value={`${analytics.photoCoveragePct}%`}
                />
                <StatBlock
                  label="elevation"
                  value={formatElevation(analytics.overview.elevationMeters)}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
