"use client";

import clsx from "clsx";
import type { TourState } from "@/lib/tour";

type Props = {
  tour: TourState;
  disabled?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: () => void;
};

export function TourControls({
  tour,
  disabled,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSkip,
}: Props) {
  const active = tour.status === "playing" || tour.status === "paused";

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {!active ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onPlay}
          className="pressable inline-flex min-h-9 items-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent-soft)] px-2.5 font-mono text-[11px] lowercase text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ▶ cinematic tour
        </button>
      ) : (
        <>
          {tour.status === "playing" ? (
            <button
              type="button"
              onClick={onPause}
              className="pressable inline-flex min-h-9 items-center rounded-[var(--radius)] border border-[var(--line)] px-2.5 font-mono text-[11px] lowercase"
            >
              ⏸ pause
            </button>
          ) : (
            <button
              type="button"
              onClick={onResume}
              className="pressable inline-flex min-h-9 items-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent-soft)] px-2.5 font-mono text-[11px] lowercase text-[var(--accent)]"
            >
              ▶ resume
            </button>
          )}
          <button
            type="button"
            onClick={onSkip}
            className="pressable inline-flex min-h-9 items-center rounded-[var(--radius)] border border-[var(--line)] px-2.5 font-mono text-[11px] lowercase"
          >
            skip →
          </button>
          <button
            type="button"
            onClick={onStop}
            className="pressable inline-flex min-h-9 items-center rounded-[var(--radius)] border border-[var(--line)] px-2.5 font-mono text-[11px] lowercase text-[var(--muted)]"
          >
            stop
          </button>
        </>
      )}

      {active ? (
        <span
          className={clsx(
            "min-w-0 truncate font-mono text-[11px]",
            tour.status === "paused"
              ? "text-[var(--faint)]"
              : "text-[var(--ink)]",
          )}
        >
          {tour.phase === "overview"
            ? `tour · overview · ${tour.index}/${tour.total}`
            : `tour · ${tour.label} · ${tour.index}/${tour.total}`}
        </span>
      ) : null}
    </div>
  );
}
