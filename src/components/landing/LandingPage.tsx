"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MapLayers, RunActivity } from "@/lib/types";
import { DEFAULT_MAP_LAYERS } from "@/lib/types";
import { getDemoActivities } from "@/lib/demo-data";
import { compactStatItems, computeJourneyAnalytics } from "@/lib/analytics";
import { formatDistance } from "@/lib/format";
import { StravaConnectButton } from "@/components/brand/StravaConnectButton";
import { StravaPoweredBy } from "@/components/brand/StravaPoweredBy";
import { HeroMapLayout } from "@/components/shell/HeroMapLayout";
import { WorldMapDynamic as WorldMap } from "@/components/map/WorldMapDynamic";
import { ActivityDrawer } from "@/components/map/ActivityDrawer";
import { StatBlock } from "@/components/stats/StatBlock";
import { Button } from "@/components/ui/Button";

type Props = {
  stravaConfigured: boolean;
};

export function LandingPage({ stravaConfigured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [demoLoading, setDemoLoading] = useState(false);
  const [selected, setSelected] = useState<RunActivity | null>(null);
  const [layers] = useState<MapLayers>(DEFAULT_MAP_LAYERS);

  const activities = useMemo(() => getDemoActivities(), []);
  const analytics = useMemo(
    () => computeJourneyAnalytics(activities),
    [activities],
  );
  const stats = useMemo(() => compactStatItems(analytics).slice(0, 5), [analytics]);
  const recent = useMemo(
    () =>
      [...activities]
        .sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate))
        .slice(0, 7),
    [activities],
  );

  async function startDemo() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) throw new Error("Demo session failed");
      router.push("/map");
      router.refresh();
    } catch {
      setDemoLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[var(--line)] bg-[var(--sunken)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-5 gap-y-1 px-[max(1rem,var(--safe-left))] py-2 pr-[max(1rem,var(--safe-right))] font-mono text-[12px] text-[var(--muted)]">
          <span>your strava journey, on one map</span>
          <a
            href="https://github.com/filippo-fonseca/strava-world"
            target="_blank"
            rel="noreferrer"
            className="link-accent"
          >
            github
          </a>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-[max(clamp(0.75rem,2vw,2.5rem),var(--safe-left))] pb-[calc(2rem+var(--safe-bottom))] pt-5 pr-[max(clamp(0.75rem,2vw,2.5rem),var(--safe-right))] sm:pt-6">
        <HeroMapLayout
          left={
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--ink-display)] lowercase sm:text-2xl">
                strava world
              </p>
              <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                open-source atlas
              </p>

              <p className="mono-label mt-5 inline-flex rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-2 py-1 normal-case tracking-[0.1em]">
                demo atlas · live map
              </p>

              <h1 className="mt-3 max-w-[18ch] font-[family-name:var(--font-display)] text-[clamp(1.35rem,2vw,1.65rem)] font-bold leading-[1.12] tracking-[-0.02em] text-[var(--ink-display)]">
                every place you&apos;ve run, in one frame.
              </h1>
              <p className="mt-2 max-w-[36ch] text-[13px] leading-relaxed text-[var(--muted)]">
                heat for the paths you return to. routes when you zoom in.
                photos and pins across the world — plus the stats behind the
                miles.
              </p>

              <div className="mt-5 flex w-full flex-col items-center gap-3 lg:items-start">
                <StravaConnectButton disabled={!stravaConfigured} />
                <Button
                  variant="secondary"
                  onClick={startDemo}
                  disabled={demoLoading}
                  className="w-full lowercase sm:w-auto"
                >
                  {demoLoading ? "opening…" : "explore demo →"}
                </Button>
              </div>

              {error && (
                <div className="mt-4 max-w-sm space-y-1 text-left text-sm text-[var(--accent)]">
                  <p>sign-in issue: {error.replaceAll("_", " ")}</p>
                  {searchParams.get("detail") && (
                    <p className="break-all font-mono text-[11px] text-[var(--muted)]">
                      {searchParams.get("detail")}
                    </p>
                  )}
                  {error === "oauth_failed" && (
                    <p className="font-mono text-[11px] leading-relaxed text-[var(--muted)]">
                      in strava api settings, set authorization callback domain
                      to this site&apos;s host only (e.g.{" "}
                      <code className="text-[var(--ink)]">
                        stravaworld.hyperpolymath.com
                      </code>
                      ) — no https, no path. also set{" "}
                      <code className="text-[var(--ink)]">NEXT_PUBLIC_APP_URL</code>{" "}
                      to that same origin.
                    </p>
                  )}
                </div>
              )}

              {!stravaConfigured && (
                <p className="mt-4 max-w-sm text-left font-mono text-[11px] leading-relaxed text-[var(--faint)]">
                  set <code className="text-[var(--muted)]">STRAVA_CLIENT_ID</code>{" "}
                  +{" "}
                  <code className="text-[var(--muted)]">STRAVA_CLIENT_SECRET</code>{" "}
                  to connect live data.
                </p>
              )}
            </div>
          }
          map={
            <>
              <WorldMap
                activities={activities}
                layers={layers}
                selectedId={selected?.id}
                onSelect={setSelected}
                fillContainer
              />
              <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(10,10,10,0.72)] px-2.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ink)]">
                  live map
                </span>
              </div>
              <ActivityDrawer
                activity={selected}
                onClose={() => setSelected(null)}
              />
            </>
          }
          mapCaption={
            <>
              demo geometry · pan and zoom the atlas · connect strava for your
              own miles
            </>
          }
          right={
            <>
              {stats.map((item, index) => (
                <StatBlock
                  key={item.key}
                  label={item.label}
                  value={item.value}
                  accent={index === 0}
                />
              ))}

              <div className="min-w-[14rem] shrink-0 snap-start rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-3 lg:min-w-0">
                <p className="mono-label mb-2">sample runs</p>
                <ul className="space-y-1">
                  {recent.map((activity, index) => (
                    <li key={activity.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(activity)}
                        className="pressable flex min-h-10 w-full items-center gap-2 rounded-[var(--radius)] px-1.5 py-1.5 text-left"
                      >
                        <span className="w-4 shrink-0 font-mono text-[11px] tabular-nums text-[var(--faint)]">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px]">
                          {activity.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">
                          {formatDistance(activity.distance)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          }
        />

        <section className="mx-auto mt-14 max-w-3xl border-t border-[var(--line)] pt-10">
          <ul className="grid gap-8 sm:grid-cols-3">
            {[
              {
                label: "one map",
                copy: "heat, routes, photos, and pins — zoom the world without switching modes.",
              },
              {
                label: "journey stats",
                copy: "countries, cities, streaks, records — the quiet numbers behind the miles.",
              },
              {
                label: "your strava",
                copy: "connect once. sync when you want. open source, not affiliated.",
              },
            ].map((item) => (
              <li key={item.label}>
                <p className="mono-label">{item.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {item.copy}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-3 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <p className="font-mono text-[10px] text-[var(--faint)]">
            open source · not affiliated with strava
          </p>
          <StravaPoweredBy />
        </div>
      </footer>
    </div>
  );
}
