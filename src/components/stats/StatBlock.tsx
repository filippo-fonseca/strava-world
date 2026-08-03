import clsx from "clsx";

type Props = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  accent?: boolean;
};

export function StatBlock({ label, value, hint, className, accent }: Props) {
  return (
    <div
      className={clsx(
        "min-w-[9.5rem] shrink-0 snap-start rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-3.5 lg:min-w-0 lg:shrink",
        className,
      )}
    >
      <p className="mono-label">{label}</p>
      <p
        className={clsx(
          "mt-1.5 font-mono text-[1.85rem] font-medium leading-none tracking-tight",
          accent ? "text-[var(--accent)]" : "text-[var(--ink-display)]",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 font-mono text-[10px] leading-snug text-[var(--faint)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
