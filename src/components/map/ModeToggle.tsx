"use client";

import clsx from "clsx";
import type { MapLayers } from "@/lib/types";

const layers: Array<{ id: keyof MapLayers; label: string }> = [
  { id: "heat", label: "Heat" },
  { id: "routes", label: "Routes" },
  { id: "photos", label: "Photos" },
];

type Props = {
  value: MapLayers;
  onChange: (next: MapLayers) => void;
};

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div
      className="inline-flex max-w-full flex-wrap gap-1 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-1"
      role="group"
      aria-label="Map layers"
    >
      {layers.map(({ id, label }) => {
        const active = value[id];
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ ...value, [id]: !active })}
            className={clsx(
              "pressable min-h-9 rounded-[8px] px-3 py-1.5 text-sm font-medium",
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
