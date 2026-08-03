import clsx from "clsx";

type Props = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  accent?: boolean;
  /** Compact tile for mobile grids / dense strips. */
  compact?: boolean;
};

export function StatBlock({
  label,
  value,
  hint,
  className,
  accent,
  compact = false,
}: Props) {
  return (
    <div
      className={clsx(
        "min-w-0 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]",
        compact ? "px-2.5 py-2" : "p-3.5 lg:p-3.5",
        !compact && "lg:min-w-0",
        className,
      )}
    >
      <p className={clsx("mono-label", compact && "!text-[9px] !tracking-[0.1em]")}>
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 font-mono font-medium leading-none tracking-tight tabular-nums",
          compact ? "text-lg sm:text-xl" : "text-[1.85rem]",
          accent ? "text-[var(--accent)]" : "text-[var(--ink-display)]",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p
          className={clsx(
            "mt-1 font-mono leading-snug text-[var(--faint)]",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
