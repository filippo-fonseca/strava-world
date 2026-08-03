"use client";

import dynamic from "next/dynamic";
import type { MapLayers, RunActivity } from "@/lib/types";

function MapSkeleton({ fillContainer = true }: { fillContainer?: boolean }) {
  return (
    <div
      className={
        fillContainer
          ? "flex h-full min-h-[50dvh] w-full flex-col lg:min-h-0"
          : "surface flex w-full flex-col p-2"
      }
      style={fillContainer ? undefined : { height: "min(58vh, 680px)", minHeight: 320 }}
      aria-busy="true"
      aria-label="Loading map"
    >
      <div className="skeleton h-full min-h-[260px] w-full rounded-[var(--radius)]" />
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
  fillContainer?: boolean;
};

export function WorldMapDynamic({ fillContainer = true, ...props }: Props) {
  return <WorldMapInner {...props} fillContainer={fillContainer} />;
}

export { MapSkeleton };
