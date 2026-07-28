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
import type { MapMode, RunActivity } from "@/lib/types";
import {
  activitiesToHeatCollection,
  activitiesToRouteCollection,
  boundsFromActivities,
  countMappableActivities,
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
  mode: MapMode;
  selectedId?: number | null;
  onSelect: (activity: RunActivity | null) => void;
};

export function WorldMap({ activities, mode, selectedId, onSelect }: Props) {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });
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

  const markerActivities = useMemo(() => {
    if (mode === "photos") return activities.slice(0, 120);
    if (mode === "routes") return activities.slice(0, 60);
    // Heat: a light sprinkling of markers so the map never looks empty.
    return activities.filter((a) => a.totalPhotoCount > 0).slice(0, 40);
  }, [activities, mode]);

  const resizeAndFit = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.resize();

    const bounds = boundsFromActivities(activities);
    if (!bounds) return;

    try {
      map.fitBounds(bounds, {
        padding: 64,
        duration: 800,
        maxZoom: 13,
        essential: true,
      });
    } catch (err) {
      console.warn("fitBounds failed", err);
    }
  }, [activities]);

  useEffect(() => {
    if (!mapReady) return;
    const id = window.setTimeout(() => resizeAndFit(), 80);
    return () => window.clearTimeout(id);
  }, [mapReady, resizeAndFit, activities.length, mode]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setMapSize({ w: Math.round(width), h: Math.round(height) });
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
    <div className="neu-convex relative w-full overflow-hidden rounded-[32px] p-2 md:p-3">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[26px] bg-[#cfe0ea]"
        style={{ height: "min(70vh, 640px)", minHeight: 480 }}
      >
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{ longitude: -40, latitude: 20, zoom: 1.5 }}
          mapStyle={RASTER_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{ compact: true }}
          interactiveLayerIds={
            mode === "routes" ? ["run-routes-hit", "run-routes-line"] : []
          }
          onClick={handleClick}
          cursor={mode === "routes" ? "pointer" : "grab"}
          onLoad={() => {
            setMapReady(true);
            setError(null);
            requestAnimationFrame(() => resizeAndFit());
          }}
          onError={(e) => {
            console.error("MapLibre error", e);
            setError("Map failed to load basemap tiles");
          }}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          <Source id="run-heat" type="geojson" data={heat}>
            <Layer
              id="run-heat-layer"
              type="heatmap"
              layout={{
                visibility: mode === "heatmap" ? "visible" : "none",
              }}
              paint={{
                "heatmap-weight": 1,
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  0.8,
                  5,
                  1.3,
                  10,
                  1.8,
                ],
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  10,
                  5,
                  22,
                  10,
                  36,
                ],
                "heatmap-opacity": 0.85,
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(228,87,46,0)",
                  0.2,
                  "rgba(243,181,154,0.7)",
                  0.5,
                  "rgba(228,87,46,0.85)",
                  0.8,
                  "rgba(176,48,16,0.95)",
                  1,
                  "rgba(90,24,8,1)",
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
                visibility:
                  mode === "routes" || mode === "heatmap" ? "visible" : "none",
              }}
              paint={{
                "line-color": "#ffffff",
                "line-width": mode === "heatmap" ? 4 : 7,
                "line-opacity": mode === "heatmap" ? 0.4 : 0.75,
              }}
            />
            <Layer
              id="run-routes-line"
              type="line"
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility:
                  mode === "heatmap" || mode === "routes" ? "visible" : "none",
              }}
              paint={{
                "line-color": [
                  "case",
                  ["==", ["get", "id"], selectedId ?? -1],
                  "#b03010",
                  "#e4572e",
                ],
                "line-width": [
                  "case",
                  ["==", ["get", "id"], selectedId ?? -1],
                  mode === "heatmap" ? 3.5 : 5,
                  mode === "heatmap" ? 2.25 : 3.5,
                ],
                "line-opacity": mode === "heatmap" ? 0.8 : 0.95,
              }}
            />
            <Layer
              id="run-routes-hit"
              type="line"
              layout={{
                visibility: mode === "routes" ? "visible" : "none",
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
              onSelect={onSelect}
            />
          ))}
        </Map>

        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-[rgba(44,41,36,0.75)] px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
          {mappableCount}/{activities.length} GPS · {routes.features.length}{" "}
          routes · {heat.features.length} heat pts
          {mapSize.w ? ` · ${mapSize.w}×${mapSize.h}` : ""}
        </div>

        {mappableCount === 0 && activities.length > 0 && (
          <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl bg-[rgba(44,41,36,0.85)] px-4 py-3 text-sm text-white">
            Runs loaded, but none include GPS polylines. Right-click{" "}
            <strong>Sync</strong> to rebuild from Strava.
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 top-12 z-10 rounded-2xl bg-[rgba(176,48,16,0.92)] px-4 py-3 text-sm text-white">
            {error}. Allow basemaps.cartocdn.com if you use an ad blocker.
          </div>
        )}
      </div>
    </div>
  );
}
