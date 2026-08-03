"use client";

import clsx from "clsx";
import type { RunActivity } from "@/lib/types";
import {
  buildRunFilterIndex,
  citiesForCountry,
  EMPTY_RUN_FILTERS,
  filtersAreActive,
  type RunFilters,
} from "@/lib/run-filters";
import { useMemo } from "react";

type Props = {
  activities: RunActivity[];
  filters: RunFilters;
  onChange: (next: RunFilters) => void;
  resultCount: number;
  totalCount: number;
};

const selectClass =
  "min-w-0 flex-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--sunken)] px-2 py-1.5 font-mono text-[11px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)]";

export function RunFiltersBar({
  activities,
  filters,
  onChange,
  resultCount,
  totalCount,
}: Props) {
  const index = useMemo(() => buildRunFilterIndex(activities), [activities]);
  const cities = useMemo(
    () => citiesForCountry(activities, filters.country),
    [activities, filters.country],
  );
  const active = filtersAreActive(filters);

  return (
    <div className="space-y-2">
      <div className="surface-inset !p-2">
        <label className="sr-only" htmlFor="run-search">
          Search runs
        </label>
        <input
          id="run-search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="search name, city, country, year…"
          className="w-full min-w-0 bg-transparent px-2 py-2 font-mono text-[12px] outline-none placeholder:text-[var(--faint)]"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <select
          aria-label="Filter by country"
          className={selectClass}
          value={filters.country ?? ""}
          onChange={(e) => {
            const country = e.target.value || null;
            const nextCity =
              country &&
              filters.city &&
              citiesForCountry(activities, country).includes(filters.city)
                ? filters.city
                : null;
            onChange({ ...filters, country, city: nextCity });
          }}
        >
          <option value="">all countries</option>
          {index.countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by city"
          className={selectClass}
          value={filters.city ?? ""}
          onChange={(e) =>
            onChange({ ...filters, city: e.target.value || null })
          }
        >
          <option value="">all cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by year"
          className={selectClass}
          value={filters.year ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              year: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">all years</option>
          {index.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by photos"
          className={selectClass}
          value={filters.photos}
          onChange={(e) =>
            onChange({
              ...filters,
              photos: e.target.value as RunFilters["photos"],
            })
          }
        >
          <option value="any">photos: any</option>
          <option value="with">with photos</option>
          <option value="without">no photos</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 px-0.5">
        <p
          className={clsx(
            "min-w-0 truncate font-mono text-[10px] tabular-nums",
            active ? "text-[var(--accent)]" : "text-[var(--faint)]",
          )}
        >
          {active
            ? `${resultCount} of ${totalCount} runs`
            : `${totalCount} runs`}
        </p>
        {active ? (
          <button
            type="button"
            onClick={() => onChange(EMPTY_RUN_FILTERS)}
            className="link-accent shrink-0 font-mono text-[10px] lowercase"
          >
            clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
