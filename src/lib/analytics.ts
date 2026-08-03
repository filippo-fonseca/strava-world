import type { RunActivity } from "@/lib/types";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
} from "@/lib/format";
import { computeAtlasStats, type AtlasStats } from "@/lib/stats";

export type RankedPlace = {
  name: string;
  runs: number;
  distanceMeters: number;
};

export type RecordRun = {
  activity: RunActivity;
  valueLabel: string;
};

export type MonthBucket = {
  key: string;
  label: string;
  distanceMeters: number;
};

export type WeekdayBucket = {
  key: number;
  label: string;
  runs: number;
};

export type JourneyAnalytics = {
  overview: AtlasStats;
  avgDistanceMeters: number;
  avgMovingTimeSeconds: number;
  avgPaceLabel: string;
  longestRun: RecordRun | null;
  mostElevation: RecordRun | null;
  fastestPace: RecordRun | null;
  mostPhotos: RecordRun | null;
  currentStreakDays: number;
  longestStreakDays: number;
  runsThisWeek: number;
  runsThisMonth: number;
  topCountries: RankedPlace[];
  topCities: RankedPlace[];
  monthlyDistance: MonthBucket[];
  weekdayRuns: WeekdayBucket[];
  photoCoveragePct: number;
};

const WEEKDAY_LABELS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function dayKey(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function computeStreaks(activities: RunActivity[]) {
  const days = new Set<string>();
  for (const activity of activities) {
    const key = dayKey(activity.startDate);
    if (key) days.add(key);
  }
  if (days.size === 0) {
    return { currentStreakDays: 0, longestStreakDays: 0 };
  }

  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00Z`).getTime();
    const cur = new Date(`${sorted[i]}T00:00:00Z`).getTime();
    const diffDays = Math.round((cur - prev) / 86_400_000);
    if (diffDays === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = new Date();
  const todayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, "0")}-${String(yesterday.getUTCDate()).padStart(2, "0")}`;

  let current = 0;
  if (days.has(todayKey) || days.has(yesterdayKey)) {
    const cursor = days.has(todayKey)
      ? new Date(`${todayKey}T00:00:00Z`)
      : new Date(`${yesterdayKey}T00:00:00Z`);
    while (true) {
      const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
      if (!days.has(key)) break;
      current += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  return { currentStreakDays: current, longestStreakDays: longest };
}

function rankPlaces(
  activities: RunActivity[],
  pick: (a: RunActivity) => string | null | undefined,
  limit = 5,
): RankedPlace[] {
  const map = new Map<string, RankedPlace>();
  for (const activity of activities) {
    const raw = pick(activity)?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.runs += 1;
      existing.distanceMeters += activity.distance || 0;
    } else {
      map.set(key, {
        name: raw,
        runs: 1,
        distanceMeters: activity.distance || 0,
      });
    }
  }
  return [...map.values()]
    .sort((a, b) => b.runs - a.runs || b.distanceMeters - a.distanceMeters)
    .slice(0, limit);
}

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildMonthly(activities: RunActivity[], months = 12): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  const index = new Map<string, MonthBucket>();

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = monthKey(d);
    const label = new Intl.DateTimeFormat("en", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(d);
    const bucket = { key, label, distanceMeters: 0 };
    buckets.push(bucket);
    index.set(key, bucket);
  }

  for (const activity of activities) {
    const d = new Date(activity.startDate);
    if (!Number.isFinite(d.getTime())) continue;
    const key = monthKey(d);
    const bucket = index.get(key);
    if (bucket) bucket.distanceMeters += activity.distance || 0;
  }

  return buckets;
}

function buildWeekdays(activities: RunActivity[]): WeekdayBucket[] {
  const counts = Array.from({ length: 7 }, (_, key) => ({
    key,
    label: WEEKDAY_LABELS[key],
    runs: 0,
  }));
  for (const activity of activities) {
    const d = new Date(activity.startDate);
    if (!Number.isFinite(d.getTime())) continue;
    counts[d.getUTCDay()].runs += 1;
  }
  return counts;
}

export function computeJourneyAnalytics(
  activities: RunActivity[],
): JourneyAnalytics {
  const overview = computeAtlasStats(activities);
  const n = activities.length || 1;

  let longestRun: RecordRun | null = null;
  let mostElevation: RecordRun | null = null;
  let fastestPace: RecordRun | null = null;
  let mostPhotos: RecordRun | null = null;
  let bestPaceSec = Infinity;

  for (const activity of activities) {
    if (
      !longestRun ||
      activity.distance > longestRun.activity.distance
    ) {
      longestRun = {
        activity,
        valueLabel: formatDistance(activity.distance),
      };
    }
    if (
      !mostElevation ||
      activity.totalElevationGain > mostElevation.activity.totalElevationGain
    ) {
      mostElevation = {
        activity,
        valueLabel: formatElevation(activity.totalElevationGain),
      };
    }
    if (
      !mostPhotos ||
      activity.totalPhotoCount > mostPhotos.activity.totalPhotoCount
    ) {
      mostPhotos = {
        activity,
        valueLabel: String(activity.totalPhotoCount),
      };
    }
    if (activity.distance >= 1000 && activity.movingTime > 0) {
      const paceSec = activity.movingTime / (activity.distance / 1000);
      if (paceSec < bestPaceSec) {
        bestPaceSec = paceSec;
        fastestPace = {
          activity,
          valueLabel: formatPace(activity.distance, activity.movingTime),
        };
      }
    }
  }

  const now = new Date();
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  let runsThisWeek = 0;
  let runsThisMonth = 0;
  let withPhotos = 0;

  for (const activity of activities) {
    const ts = Date.parse(activity.startDate);
    if (Number.isFinite(ts)) {
      if (ts >= weekAgo) runsThisWeek += 1;
      if (ts >= monthStart) runsThisMonth += 1;
    }
    if (activity.totalPhotoCount > 0) withPhotos += 1;
  }

  const { currentStreakDays, longestStreakDays } = computeStreaks(activities);

  const avgDistanceMeters = overview.distanceMeters / n;
  const avgMovingTimeSeconds = overview.movingTimeSeconds / n;

  return {
    overview,
    avgDistanceMeters: activities.length ? avgDistanceMeters : 0,
    avgMovingTimeSeconds: activities.length ? avgMovingTimeSeconds : 0,
    avgPaceLabel: activities.length
      ? formatPace(overview.distanceMeters, overview.movingTimeSeconds)
      : "—",
    longestRun,
    mostElevation,
    fastestPace,
    mostPhotos:
      mostPhotos && mostPhotos.activity.totalPhotoCount > 0 ? mostPhotos : null,
    currentStreakDays,
    longestStreakDays,
    runsThisWeek,
    runsThisMonth,
    topCountries: rankPlaces(activities, (a) => a.locationCountry),
    topCities: rankPlaces(activities, (a) => a.locationCity),
    monthlyDistance: buildMonthly(activities),
    weekdayRuns: buildWeekdays(activities),
    photoCoveragePct: activities.length
      ? Math.round((withPhotos / activities.length) * 100)
      : 0,
  };
}

export function journeySummaryText(analytics: JourneyAnalytics): string {
  const { overview } = analytics;
  const span =
    overview.earliestDate && overview.latestDate
      ? `${formatDate(overview.earliestDate)} – ${formatDate(overview.latestDate)}`
      : "—";
  return [
    `strava world — journey summary`,
    `${overview.runs} runs · ${formatDistance(overview.distanceMeters)} · ${formatDuration(overview.movingTimeSeconds)}`,
    `${overview.countries} countries · ${overview.cities} cities · ${formatElevation(overview.elevationMeters)} elev`,
    `${overview.photos} photos · ${analytics.photoCoveragePct}% of runs with photos`,
    `span ${span}`,
  ].join("\n");
}

export function compactStatItems(analytics: JourneyAnalytics) {
  const { overview } = analytics;
  return [
    { key: "runs", label: "runs", value: String(overview.runs) },
    {
      key: "distance",
      label: "distance",
      value: formatDistance(overview.distanceMeters),
    },
    {
      key: "countries",
      label: "countries",
      value: String(overview.countries),
    },
    { key: "cities", label: "cities", value: String(overview.cities) },
    {
      key: "time",
      label: "time",
      value: formatDuration(overview.movingTimeSeconds),
    },
    {
      key: "photos",
      label: "photos",
      value: String(overview.photos),
    },
  ];
}
