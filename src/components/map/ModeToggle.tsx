"use client";

import clsx from "clsx";
import type { MapLayers } from "@/lib/types";

const layers: Array<{ id: keyof MapLayers; label: string }> = [
  { id: "heat", label: "heat" },
  { id: "routes", label: "routes" },
  { id: "photos", label: "photos" },
];

type Props = {
  value: MapLayers;
  onChange: (next: MapLayers) => void;
};

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div
      className="inline-flex max-w-full flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-0.5"
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
              "pressable min-h-9 rounded-[var(--radius)] px-2.5 py-1 font-mono text-[11px] font-medium lowercase tracking-wide",
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--ink-display)]",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
