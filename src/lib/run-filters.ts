import type { RunActivity } from "@/lib/types";

export type RunFilters = {
  query: string;
  country: string | null;
  city: string | null;
  year: number | null;
  photos: "any" | "with" | "without";
};

export const EMPTY_RUN_FILTERS: RunFilters = {
  query: "",
  country: null,
  city: null,
  year: null,
  photos: "any",
};

export type RunFilterIndex = {
  countries: string[];
  cities: string[];
  years: number[];
};

function norm(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

/** Build facet lists for filter controls (sorted, unique). */
export function buildRunFilterIndex(activities: RunActivity[]): RunFilterIndex {
  const countries = new Set<string>();
  const cities = new Set<string>();
  const years = new Set<number>();

  for (const activity of activities) {
    const country = activity.locationCountry?.trim();
    if (country) countries.add(country);
    const city = activity.locationCity?.trim();
    if (city) cities.add(city);
    const ts = Date.parse(activity.startDate);
    if (Number.isFinite(ts)) years.add(new Date(ts).getUTCFullYear());
  }

  return {
    countries: [...countries].sort((a, b) => a.localeCompare(b)),
    cities: [...cities].sort((a, b) => a.localeCompare(b)),
    years: [...years].sort((a, b) => b - a),
  };
}

export function runSearchBlob(activity: RunActivity) {
  return [
    activity.name,
    activity.locationCity,
    activity.locationCountry,
    activity.sportType,
    activity.type,
    formatSearchDate(activity.startDate),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function formatSearchDate(iso: string) {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "";
  const d = new Date(ts);
  return `${d.getUTCFullYear()} ${d.toLocaleString("en", { month: "short", timeZone: "UTC" })}`;
}

export function activityMatchesFilters(
  activity: RunActivity,
  filters: RunFilters,
): boolean {
  if (filters.country) {
    if (norm(activity.locationCountry) !== norm(filters.country)) return false;
  }
  if (filters.city) {
    if (norm(activity.locationCity) !== norm(filters.city)) return false;
  }
  if (filters.year != null) {
    const ts = Date.parse(activity.startDate);
    if (!Number.isFinite(ts)) return false;
    if (new Date(ts).getUTCFullYear() !== filters.year) return false;
  }
  if (filters.photos === "with" && activity.totalPhotoCount <= 0) return false;
  if (filters.photos === "without" && activity.totalPhotoCount > 0) return false;

  const q = filters.query.trim().toLowerCase();
  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean);
    const blob = runSearchBlob(activity);
    if (!tokens.every((token) => blob.includes(token))) return false;
  }

  return true;
}

export function filterActivities(
  activities: RunActivity[],
  filters: RunFilters,
): RunActivity[] {
  const matched = activities.filter((activity) =>
    activityMatchesFilters(activity, filters),
  );
  return matched.sort(
    (a, b) => Date.parse(b.startDate) - Date.parse(a.startDate),
  );
}

export function filtersAreActive(filters: RunFilters) {
  return (
    Boolean(filters.query.trim()) ||
    Boolean(filters.country) ||
    Boolean(filters.city) ||
    filters.year != null ||
    filters.photos !== "any"
  );
}

/** Cities scoped to the selected country (when set). */
export function citiesForCountry(
  activities: RunActivity[],
  country: string | null,
): string[] {
  const set = new Set<string>();
  for (const activity of activities) {
    if (country && norm(activity.locationCountry) !== norm(country)) continue;
    const city = activity.locationCity?.trim();
    if (city) set.add(city);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
