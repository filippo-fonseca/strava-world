"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { PhotoMarker } from "@/components/map/PhotoMarker";

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
};

export function WorldMap({
  activities,
  layers,
  selectedId,
  onSelect,
  fillContainer = false,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fittedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(1.5);
  const [error, setError] = useState<string | null>(null);

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
  }, [mapReady, selectedId]);

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
    if (selectedId != null) return; // selection focus wins
    fittedRef.current = false;
    const id = window.setTimeout(() => resizeAndFit(true), 60);
    return () => window.clearTimeout(id);
  }, [mapReady, activityKey, selectedId, resizeAndFit]);

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
