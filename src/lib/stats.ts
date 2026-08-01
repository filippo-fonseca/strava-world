import type { RunActivity } from "@/lib/types";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatElevation,
} from "@/lib/format";

export type AtlasStats = {
  runs: number;
  countries: number;
  cities: number;
  distanceMeters: number;
  movingTimeSeconds: number;
  elevationMeters: number;
  photos: number;
  earliestDate: string | null;
  latestDate: string | null;
};

export function computeAtlasStats(activities: RunActivity[]): AtlasStats {
  const countries = new Set<string>();
  const cities = new Set<string>();
  let distanceMeters = 0;
  let movingTimeSeconds = 0;
  let elevationMeters = 0;
  let photos = 0;
  let earliestTs = Infinity;
  let latestTs = -Infinity;
  let earliestDate: string | null = null;
  let latestDate: string | null = null;

  for (const activity of activities) {
    distanceMeters += activity.distance || 0;
    movingTimeSeconds += activity.movingTime || 0;
    elevationMeters += activity.totalElevationGain || 0;
    photos += activity.totalPhotoCount || 0;

    const country = activity.locationCountry?.trim();
    if (country) countries.add(country.toLowerCase());

    const city = activity.locationCity?.trim();
    if (city) cities.add(city.toLowerCase());

    const ts = Date.parse(activity.startDate);
    if (Number.isFinite(ts)) {
      if (ts < earliestTs) {
        earliestTs = ts;
        earliestDate = activity.startDate;
      }
      if (ts > latestTs) {
        latestTs = ts;
        latestDate = activity.startDate;
      }
    }
  }

  return {
    runs: activities.length,
    countries: countries.size,
    cities: cities.size,
    distanceMeters,
    movingTimeSeconds,
    elevationMeters,
    photos,
    earliestDate,
    latestDate,
  };
}

export type StatItem = {
  key: string;
  label: string;
  value: string;
};

export function atlasStatItems(stats: AtlasStats): StatItem[] {
  return [
    { key: "runs", label: "Runs", value: String(stats.runs) },
    { key: "countries", label: "Countries", value: String(stats.countries) },
    { key: "cities", label: "Cities", value: String(stats.cities) },
    {
      key: "distance",
      label: "Distance",
      value: formatDistance(stats.distanceMeters),
    },
    {
      key: "time",
      label: "Time",
      value: formatDuration(stats.movingTimeSeconds),
    },
    {
      key: "elevation",
      label: "Elevation",
      value: formatElevation(stats.elevationMeters),
    },
    { key: "photos", label: "Photos", value: String(stats.photos) },
  ];
}

export function formatAtlasSpan(stats: AtlasStats): string | null {
  if (!stats.earliestDate || !stats.latestDate) return null;
  if (stats.earliestDate === stats.latestDate) {
    return formatDate(stats.earliestDate);
  }
  return `${formatDate(stats.earliestDate)} – ${formatDate(stats.latestDate)}`;
}
