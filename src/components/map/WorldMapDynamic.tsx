"use client";

import dynamic from "next/dynamic";
import type { MapMode, RunActivity } from "@/lib/types";

const WorldMapInner = dynamic(
  () => import("@/components/map/WorldMap").then((mod) => mod.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="neu-convex flex w-full items-center justify-center rounded-[32px] text-[var(--neu-muted)]"
        style={{ height: "min(70vh, 640px)", minHeight: 480 }}
      >
        Loading map…
      </div>
    ),
  },
);

type Props = {
  activities: RunActivity[];
  mode: MapMode;
  selectedId?: number | null;
  onSelect: (activity: RunActivity | null) => void;
};

export function WorldMapDynamic(props: Props) {
  return <WorldMapInner {...props} />;
}
