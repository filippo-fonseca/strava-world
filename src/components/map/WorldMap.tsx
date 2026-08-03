"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import maplibregl, {
  type MapLayerMouseEvent,
  type StyleSpecification,
} from "maplibre-gl";
import type { MapLayers, RunActivity } from "@/lib/types";
import {
  activitiesToHeatCollection,
  activitiesToRouteCollection,
  boundsFromActivities,
  countMappableActivities,
  selectMarkersForZoom,
} from "@/lib/geo";
import {
  buildTourStops,
  IDLE_TOUR_STATE,
  TOUR_DWELL_MS,
  TOUR_FLY_MS,
  TOUR_OVERVIEW_MS,
  type TourState,
  type TourStop,
} from "@/lib/tour";
import { PhotoMarker } from "@/components/map/PhotoMarker";

export type { TourState };

/**
 * Raster basemap — avoids the classic "blue water only" failure mode of
 * vector styles when tiles/glyphs are blocked.
 */
const RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-voyager",
      type: "raster",
      source: "carto",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

type Props = {
  activities: RunActivity[];
  layers: MapLayers;
  selectedId?: number | null;
  onSelect: (activity: RunActivity | null) => void;
  /** Fill parent plate (hero / instrument layout) instead of fixed viewport height. */
  fillContainer?: boolean;
  /** Cinematic walkthrough control */
  tourPlaying?: boolean;
  tourPaused?: boolean;
  tourSkipNonce?: number;
  onTourChange?: (state: TourState) => void;
};

export function WorldMap({
  activities,
  layers,
  selectedId,
  onSelect,
  fillContainer = false,
  tourPlaying = false,
  tourPaused = false,
  tourSkipNonce = 0,
  onTourChange,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fittedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(1.5);
  const [error, setError] = useState<string | null>(null);
  const tourStopsRef = useRef<TourStop[]>([]);
  const tourIndexRef = useRef(-1); // -1 overview before first stop
  const tourTimerRef = useRef<number | null>(null);
  const tourGenRef = useRef(0);
  const tourPausedRef = useRef(tourPaused);
  const onTourChangeRef = useRef(onTourChange);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    tourPausedRef.current = tourPaused;
  }, [tourPaused]);

  useEffect(() => {
    onTourChangeRef.current = onTourChange;
  }, [onTourChange]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const emitTour = useCallback((state: TourState) => {
    onTourChangeRef.current?.(state);
  }, []);

  const clearTourTimer = useCallback(() => {
    if (tourTimerRef.current != null) {
      window.clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
  }, []);

  const fitTourBounds = useCallback(
    (
      bounds: [[number, number], [number, number]],
      duration: number,
      maxZoom: number,
    ) => {
      const map = mapRef.current?.getMap();
      if (!map) return Promise.resolve();

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      return new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          map.off("moveend", finish);
          window.clearTimeout(timer);
          resolve();
        };
        const timer = window.setTimeout(
          finish,
          (reduced ? 0 : duration) + 300,
        );
        map.on("moveend", finish);
        try {
          map.fitBounds(bounds, {
            padding: 80,
            duration: reduced ? 0 : duration,
            maxZoom,
            essential: true,
          });
        } catch {
          finish();
        }
      });
    },
    [],
  );

  const routes = useMemo(
    () => activitiesToRouteCollection(activities),
    [activities],
  );
  const heat = useMemo(
    () => activitiesToHeatCollection(activities),
    [activities],
  );
  const mappableCount = useMemo(
    () => countMappableActivities(activities),
    [activities],
  );

  const markerActivities = useMemo(
    () => selectMarkersForZoom(activities, zoom),
    [activities, zoom],
  );

  const markerSize = zoom >= 9 ? "lg" : zoom >= 5 ? "md" : "sm";

  const resizeAndFit = useCallback(
    (force = false) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      map.resize();

      if (fittedRef.current && !force) return;

      const bounds = boundsFromActivities(activities);
      if (!bounds) return;

      try {
        map.fitBounds(bounds, {
          padding: 56,
          duration: force || !fittedRef.current ? 800 : 0,
          maxZoom: 12,
          essential: true,
        });
        fittedRef.current = true;
      } catch (err) {
        console.warn("fitBounds failed", err);
      }
    },
    [activities],
  );

  useEffect(() => {
    if (!mapReady) return;
    const id = window.setTimeout(() => resizeAndFit(false), 80);
    return () => window.clearTimeout(id);
  }, [mapReady, resizeAndFit, activities.length]);

  useEffect(() => {
    fittedRef.current = false;
  }, [activities.length]);

  // Clicking a run in the history list (or marker) flies the map to that instance.
  const selectedActivity = useMemo(
    () =>
      selectedId == null
        ? null
        : (activities.find((item) => item.id === selectedId) ?? null),
    [activities, selectedId],
  );

  useEffect(() => {
    if (!mapReady || !selectedActivity) return;
    if (tourPlaying) return; // cinematic tour owns the camera
    const map = mapRef.current?.getMap();
    if (!map) return;

    const bounds = boundsFromActivities([selectedActivity]);
    if (!bounds) return;

    try {
      map.fitBounds(bounds, {
        padding: 72,
        duration: 700,
        maxZoom: 14,
        essential: true,
      });
    } catch (err) {
      console.warn("focus fitBounds failed", err);
    }
    // Only re-fly when the selected run id changes (not on every activities refresh).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, selectedId, tourPlaying]);

  // When the filtered set changes (search/filters), reframe to matching runs.
  const activityKey = useMemo(
    () =>
      activities
        .map((a) => a.id)
        .sort((a, b) => a - b)
        .join(","),
    [activities],
  );

  useEffect(() => {
    if (!mapReady) return;
    if (tourPlaying) return;
    if (selectedId != null) return; // selection focus wins
    fittedRef.current = false;
    const id = window.setTimeout(() => resizeAndFit(true), 60);
    return () => window.clearTimeout(id);
  }, [mapReady, activityKey, selectedId, resizeAndFit, tourPlaying]);

  // --- Cinematic tour ----------------------------------------------------
  const activitiesRef = useRef(activities);
  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  const runTourStepRef = useRef<(gen: number) => Promise<void>>(async () => {});

  useEffect(() => {
    runTourStepRef.current = async (gen: number) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const stops = tourStopsRef.current;
      const idx = tourIndexRef.current;
      const currentActivities = activitiesRef.current;

      const wait = (ms: number) =>
        new Promise<void>((resolve) => {
          clearTourTimer();
          tourTimerRef.current = window.setTimeout(() => {
            tourTimerRef.current = null;
            resolve();
          }, ms);
        });

      const waitWhilePaused = async () => {
        while (tourPausedRef.current && tourGenRef.current === gen) {
          await wait(120);
        }
      };

      // Overview first (idx === -1)
      if (idx < 0) {
        emitTour({
          status: "playing",
          phase: "overview",
          index: 0,
          total: stops.length,
          label: "overview",
          detail: "your whole atlas",
        });
        const allBounds = boundsFromActivities(currentActivities);
        if (allBounds) {
          await fitTourBounds(allBounds, TOUR_FLY_MS, 5);
        }
        if (tourGenRef.current !== gen) return;
        await waitWhilePaused();
        if (tourGenRef.current !== gen) return;
        await wait(TOUR_OVERVIEW_MS);
        if (tourGenRef.current !== gen) return;
        tourIndexRef.current = 0;
        void runTourStepRef.current(gen);
        return;
      }

      if (idx >= stops.length) {
        emitTour({
          status: "playing",
          phase: "overview",
          index: stops.length,
          total: stops.length,
          label: "finale",
          detail: "back to the world",
        });
        const allBounds = boundsFromActivities(currentActivities);
        if (allBounds) {
          await fitTourBounds(allBounds, TOUR_FLY_MS, 5);
        }
        if (tourGenRef.current !== gen) return;
        await wait(TOUR_OVERVIEW_MS);
        if (tourGenRef.current !== gen) return;
        tourGenRef.current += 1;
        clearTourTimer();
        onSelectRef.current(null);
        emitTour({ ...IDLE_TOUR_STATE, total: stops.length, phase: "done" });
        return;
      }

      const stop = stops[idx];
      emitTour({
        status: tourPausedRef.current ? "paused" : "playing",
        phase: "stop",
        index: idx + 1,
        total: stops.length,
        label: stop.label,
        detail: stop.detail,
      });

      const highlightId = stop.activityIds[0];
      const highlight =
        currentActivities.find((a) => a.id === highlightId) ?? null;
      if (highlight) onSelectRef.current(highlight);

      await fitTourBounds(stop.bounds, TOUR_FLY_MS, 13);
      if (tourGenRef.current !== gen) return;
      await waitWhilePaused();
      if (tourGenRef.current !== gen) return;
      await wait(TOUR_DWELL_MS);
      if (tourGenRef.current !== gen) return;

      tourIndexRef.current = idx + 1;
      void runTourStepRef.current(gen);
    };
  }, [clearTourTimer, emitTour, fitTourBounds]);

  // Start / stop tour from parent controls.
  useEffect(() => {
    if (!mapReady) return;

    if (!tourPlaying) {
      tourGenRef.current += 1;
      clearTourTimer();
      if (tourStopsRef.current.length) {
        emitTour({
          ...IDLE_TOUR_STATE,
          total: tourStopsRef.current.length,
        });
      } else {
        emitTour(IDLE_TOUR_STATE);
      }
      return;
    }

    const stops = buildTourStops(activities);
    tourStopsRef.current = stops;
    if (!stops.length) {
      emitTour(IDLE_TOUR_STATE);
      return;
    }

    tourIndexRef.current = -1;
    const gen = ++tourGenRef.current;
    emitTour({
      status: "playing",
      phase: "overview",
      index: 0,
      total: stops.length,
      label: "overview",
      detail: "your whole atlas",
    });
    void runTourStepRef.current(gen);

    return () => {
      tourGenRef.current += 1;
      clearTourTimer();
    };
    // Only react to play toggling / activity set for a new tour session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, tourPlaying, activityKey]);

  // Pause / resume status surfacing
  useEffect(() => {
    if (!tourPlaying) return;
    const stops = tourStopsRef.current;
    const idx = tourIndexRef.current;
    if (idx < 0) {
      emitTour({
        status: tourPaused ? "paused" : "playing",
        phase: "overview",
        index: 0,
        total: stops.length,
        label: "overview",
        detail: "your whole atlas",
      });
      return;
    }
    if (idx >= stops.length) return;
    const stop = stops[idx];
    emitTour({
      status: tourPaused ? "paused" : "playing",
      phase: "stop",
      index: idx + 1,
      total: stops.length,
      label: stop.label,
      detail: stop.detail,
    });
  }, [tourPaused, tourPlaying, emitTour]);

  // Skip to next stop
  useEffect(() => {
    if (!tourPlaying || !tourSkipNonce) return;
    clearTourTimer();
    const gen = ++tourGenRef.current;
    if (tourIndexRef.current < 0) {
      tourIndexRef.current = 0;
    } else {
      tourIndexRef.current += 1;
    }
    void runTourStepRef.current(gen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourSkipNonce]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.getMap()?.resize();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    const id = feature?.properties?.id;
    if (!id) {
      onSelect(null);
      return;
    }
    const activity = activities.find((item) => item.id === Number(id));
    onSelect(activity || null);
  };

  return (
    <div
      className={
        fillContainer
          ? "relative h-full min-h-[50dvh] w-full overflow-hidden lg:min-h-0"
          : "surface relative w-full overflow-hidden p-1.5 sm:p-2"
      }
    >
      <div
        ref={containerRef}
        className={
          fillContainer
            ? "relative h-full w-full overflow-hidden rounded-[var(--radius)] bg-[#d7e4ec]"
            : "relative w-full overflow-hidden rounded-[var(--radius)] bg-[#d7e4ec]"
        }
        style={
          fillContainer
            ? { height: "100%", minHeight: "100%" }
            : { height: "min(58vh, 680px)", minHeight: 320 }
        }
      >
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{ longitude: -40, latitude: 20, zoom: 1.5 }}
          mapStyle={RASTER_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{ compact: true }}
          interactiveLayerIds={
            layers.routes ? ["run-routes-hit", "run-routes-line"] : []
          }
          onClick={handleClick}
          cursor={layers.routes ? "pointer" : "grab"}
          onLoad={() => {
            setMapReady(true);
            setError(null);
            const map = mapRef.current?.getMap();
            if (map) setZoom(map.getZoom());
            requestAnimationFrame(() => resizeAndFit(true));
          }}
          onMoveEnd={(e) => setZoom(e.viewState.zoom)}
          onZoomEnd={(e) => setZoom(e.viewState.zoom)}
          onError={(e) => {
            const message =
              (e.error && "message" in e.error
                ? String((e.error as { message?: string }).message)
                : "") || String(e.error ?? "");
            // Single tile failures / aborts are common; only banner style-level failures.
            if (
              /abort|cancel|Failed to fetch|AJAXError|tile/i.test(message)
            ) {
              console.warn("MapLibre tile warning", message);
              return;
            }
            console.error("MapLibre error", e);
            setError("Map failed to load basemap");
          }}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          <Source id="run-heat" type="geojson" data={heat}>
            <Layer
              id="run-heat-layer"
              type="heatmap"
              layout={{
                visibility: layers.heat ? "visible" : "none",
              }}
              paint={{
                "heatmap-weight": ["coalesce", ["get", "weight"], 1],
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  0.7,
                  4,
                  1.1,
                  8,
                  1.5,
                  12,
                  1.8,
                ],
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  8,
                  4,
                  16,
                  8,
                  28,
                  12,
                  40,
                ],
                "heatmap-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  0.95,
                  5,
                  0.85,
                  9,
                  0.55,
                  13,
                  0.25,
                ],
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(194,65,12,0)",
                  0.2,
                  "rgba(251,146,60,0.55)",
                  0.45,
                  "rgba(234,88,12,0.8)",
                  0.75,
                  "rgba(194,65,12,0.92)",
                  1,
                  "rgba(124,45,18,1)",
                ],
              }}
            />
          </Source>

          <Source id="run-routes" type="geojson" data={routes}>
            <Layer
              id="run-routes-casing"
              type="line"
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility: layers.routes ? "visible" : "none",
              }}
              paint={{
                "line-color": "#ffffff",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  1.5,
                  8,
                  4,
                  14,
                  7,
                ],
                "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  0.15,
                  6,
                  0.45,
                  11,
                  0.75,
                ],
              }}
            />
            <Layer
              id="run-routes-line"
              type="line"
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility: layers.routes ? "visible" : "none",
              }}
              paint={{
                "line-color": [
                  "case",
                  ["==", ["get", "id"], selectedId ?? -1],
                  "#7c2d12",
                  "#c2410c",
                ],
                // Zoom must be the outer expression — nesting interpolate inside case fails.
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  [
                    "case",
                    ["==", ["get", "id"], selectedId ?? -1],
                    1.5,
                    0.8,
                  ],
                  8,
                  [
                    "case",
                    ["==", ["get", "id"], selectedId ?? -1],
                    3.5,
                    2.2,
                  ],
                  14,
                  [
                    "case",
                    ["==", ["get", "id"], selectedId ?? -1],
                    5.5,
                    3.5,
                  ],
                ],
                "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  0.25,
                  5,
                  0.55,
                  9,
                  0.9,
                  14,
                  0.95,
                ],
              }}
            />
            <Layer
              id="run-routes-hit"
              type="line"
              layout={{
                visibility: layers.routes ? "visible" : "none",
              }}
              paint={{
                "line-color": "#000000",
                "line-opacity": 0,
                "line-width": 18,
              }}
            />
          </Source>

          {markerActivities.map((activity) => (
            <PhotoMarker
              key={activity.id}
              activity={activity}
              selected={selectedId === activity.id}
              size={markerSize}
              showPhoto={layers.photos}
              onSelect={onSelect}
            />
          ))}
        </Map>

        {tourPlaying && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex max-w-[min(100%-1.5rem,20rem)] items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(10,10,10,0.78)] px-3 py-1.5">
            <span
              className={clsx(
                "h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]",
                !tourPaused && "animate-pulse",
              )}
            />
            <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ink)]">
              {tourPaused ? "tour paused" : "cinematic tour"}
            </span>
          </div>
        )}

        {mappableCount === 0 && activities.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] sm:inset-x-4">
            Runs loaded, but none include GPS. Right-click{" "}
            <strong>Sync</strong> to rebuild from Strava.
          </div>
        )}

        {error && (
          <div className="absolute inset-x-3 top-3 z-10 rounded-[10px] border border-[var(--accent)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--accent)] sm:inset-x-4">
            {error}. Allow basemaps.cartocdn.com if you use an ad blocker.
          </div>
        )}
      </div>
    </div>
  );
}

