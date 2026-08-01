"use client";

import dynamic from "next/dynamic";
import type { MapLayers, RunActivity } from "@/lib/types";

function MapSkeleton() {
  return (
    <div
      className="surface flex w-full flex-col justify-end p-2"
      style={{ height: "min(62vh, 680px)", minHeight: 280 }}
      aria-busy="true"
      aria-label="Loading map"
    >
      <div className="skeleton h-full min-h-[260px] w-full rounded-[10px]" />
    </div>
  );
}

const WorldMapInner = dynamic(
  () => import("@/components/map/WorldMap").then((mod) => mod.WorldMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

type Props = {
  activities: RunActivity[];
  layers: MapLayers;
  selectedId?: number | null;
  onSelect: (activity: RunActivity | null) => void;
};

export function WorldMapDynamic(props: Props) {
  return <WorldMapInner {...props} />;
}

export { MapSkeleton };
