"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { MapMode, RunActivity } from "@/lib/types";
import {
  activitiesToHeatCollection,
  activitiesToRouteCollection,
  boundsFromActivities,
  countMappableActivities,
} from "@/lib/geo";
import { PhotoMarker } from "@/components/map/PhotoMarker";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  activities: RunActivity[];
  mode: MapMode;
  selectedId?: number | null;
  onSelect: (activity: RunActivity | null) => void;
};

export function WorldMap({ activities, mode, selectedId, onSelect }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);

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

  const fitToActivities = useCallback(() => {
    const map = mapRef.current;
    const bounds = boundsFromActivities(activities);
    if (!map || !bounds || activities.length === 0) return;
    try {
      map.fitBounds(bounds, {
        padding: 72,
        duration: 900,
        maxZoom: 12,
        essential: true,
      });
    } catch (error) {
      console.warn("fitBounds failed", error);
    }
  }, [activities]);

  useEffect(() => {
    if (!mapReady) return;
    fitToActivities();
  }, [mapReady, fitToActivities, activities.length]);

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
    <div className="neu-concave relative h-[min(72vh,760px)] min-h-[520px] w-full overflow-hidden rounded-[32px] p-2 md:h-full md:p-3">
      <div className="absolute inset-2 overflow-hidden rounded-[26px] bg-[var(--map-frame)] md:inset-3">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: 0, latitude: 20, zoom: 1.2 }}
          mapStyle={MAP_STYLE}
          style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
          attributionControl={{ compact: true }}
          interactiveLayerIds={
            mode === "routes" ? ["run-routes-hit", "run-routes-line"] : []
          }
          onClick={handleClick}
          cursor={mode === "routes" ? "pointer" : "grab"}
          onLoad={() => {
            setMapReady(true);
            setStyleError(null);
            // Defer one frame so the GL context & size are settled.
            requestAnimationFrame(() => fitToActivities());
          }}
          onError={(event) => {
            const message =
              "error" in event && event.error instanceof Error
                ? event.error.message
                : "Map failed to load";
            console.error("MapLibre error", event);
            setStyleError(message);
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
                  0.6,
                  4,
                  1.1,
                  9,
                  1.6,
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
                "heatmap-opacity": 0.9,
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(228,87,46,0)",
                  0.15,
                  "rgba(243,181,154,0.65)",
                  0.4,
                  "rgba(228,87,46,0.8)",
                  0.7,
                  "rgba(176,48,16,0.9)",
                  1,
                  "rgba(90,24,8,0.98)",
                ],
              }}
            />
          </Source>

          {/* Always draw faint routes under heatmap so the atlas isn't "empty blue". */}
          <Source id="run-routes" type="geojson" data={routes}>
            <Layer
              id="run-routes-casing"
              type="line"
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility: mode === "routes" ? "visible" : "none",
              }}
              paint={{
                "line-color": "#ffffff",
                "line-width": 7,
                "line-opacity": 0.7,
              }}
            />
            <Layer
              id="run-routes-line"
              type="line"
              layout={{
                "line-cap": "round",
                "line-join": "round",
                visibility: mode === "heatmap" || mode === "routes" ? "visible" : "none",
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
                  mode === "heatmap" ? 3 : 5,
                  mode === "heatmap" ? 1.75 : 3.5,
                ],
                "line-opacity": mode === "heatmap" ? 0.55 : 0.92,
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

          {(mode === "photos" || mode === "routes") &&
            activities.map((activity) => (
              <PhotoMarker
                key={activity.id}
                activity={activity}
                selected={selectedId === activity.id}
                onSelect={onSelect}
              />
            ))}
        </Map>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#e8e2d8]/70 to-transparent" />

        {mappableCount === 0 && activities.length > 0 && (
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-[rgba(44,41,36,0.78)] px-4 py-3 text-sm text-white backdrop-blur">
            {activities.length} runs loaded, but none include GPS maps yet.
            Open <span className="font-semibold">Sync</span> after Strava finishes
            processing, or check activity privacy.
          </div>
        )}

        {styleError && (
          <div className="absolute inset-x-4 top-4 rounded-2xl bg-[rgba(176,48,16,0.9)] px-4 py-3 text-sm text-white">
            Map tiles failed to load. Check your network / ad blocker, then refresh.
          </div>
        )}
      </div>
    </div>
  );
}
