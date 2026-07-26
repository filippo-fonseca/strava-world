import { Camera, Globe2, Route } from "lucide-react";
import { formatDistance } from "@/lib/format";
import type { RunActivity } from "@/lib/types";

type Props = {
  activities: RunActivity[];
};

export function StatsBar({ activities }: Props) {
  const distance = activities.reduce((sum, a) => sum + a.distance, 0);
  const photos = activities.reduce((sum, a) => sum + a.totalPhotoCount, 0);
  const countries = new Set(
    activities.map((a) => a.locationCountry).filter(Boolean),
  ).size;

  const items = [
    {
      icon: Route,
      label: "Distance",
      value: formatDistance(distance),
    },
    {
      icon: Globe2,
      label: "Countries",
      value: String(countries),
    },
    {
      icon: Camera,
      label: "Photos",
      value: String(photos),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="neu-convex rounded-2xl px-3 py-3 md:px-4">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--neu-muted)]">
            <Icon size={13} />
            {label}
          </div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight md:text-2xl">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
