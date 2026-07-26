"use client";

import { useEffect, useMemo, useRef } from "react";
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

  const routes = useMemo(
    () => activitiesToRouteCollection(activities),
    [activities],
  );
  const heat = useMemo(
    () => activitiesToHeatCollection(activities),
    [activities],
  );

  useEffect(() => {
    const map = mapRef.current;
    const bounds = boundsFromActivities(activities);
    if (!map || !bounds) return;
    map.fitBounds(bounds, { padding: 80, duration: 1200, maxZoom: 11 });
  }, [activities]);

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
    <div className="neu-concave relative h-full min-h-[520px] overflow-hidden rounded-[32px] p-2 md:p-3">
      <div className="relative h-full overflow-hidden rounded-[26px] bg-[var(--map-frame)]">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: 10, latitude: 25, zoom: 1.5 }}
          mapStyle={MAP_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl
          interactiveLayerIds={mode === "routes" ? ["run-routes-hit"] : []}
          onClick={handleClick}
          cursor={mode === "routes" ? "pointer" : "grab"}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          {(mode === "heatmap" || mode === "routes") && (
            <Source id="run-heat" type="geojson" data={heat}>
              <Layer
                id="run-heat-layer"
                type="heatmap"
                layout={{
                  visibility: mode === "heatmap" ? "visible" : "none",
                }}
                paint={{
                  "heatmap-weight": 0.7,
                  "heatmap-intensity": 1.15,
                  "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    1,
                    6,
                    6,
                    18,
                    12,
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
                    "rgba(243,181,154,0.55)",
                    0.45,
                    "rgba(228,87,46,0.7)",
                    0.75,
                    "rgba(176,48,16,0.85)",
                    1,
                    "rgba(90,24,8,0.95)",
                  ],
                }}
              />
            </Source>
          )}

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
                visibility: mode === "routes" ? "visible" : "none",
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
                  5,
                  3.5,
                ],
                "line-opacity": 0.92,
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
      </div>
    </div>
  );
}
