"use client";

import { Camera, Flame, Route } from "lucide-react";
import clsx from "clsx";
import type { MapMode } from "@/lib/types";

const modes: Array<{ id: MapMode; label: string; icon: typeof Flame }> = [
  { id: "heatmap", label: "Heat", icon: Flame },
  { id: "routes", label: "Routes", icon: Route },
  { id: "photos", label: "Photos", icon: Camera },
];

type Props = {
  value: MapMode;
  onChange: (mode: MapMode) => void;
};

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div className="neu-concave inline-flex gap-1 rounded-2xl p-1">
      {modes.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={clsx(
              "neu-pressable inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
              active
                ? "neu-convex text-[var(--neu-accent)]"
                : "text-[var(--neu-muted)] shadow-none",
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
