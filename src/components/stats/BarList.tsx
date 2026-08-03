type Item = {
  key: string;
  label: string;
  value: number;
  display: string;
};

type Props = {
  items: Item[];
  empty?: string;
};

export function BarList({ items, empty = "no data yet" }: Props) {
  const max = Math.max(...items.map((i) => i.value), 1);

  if (!items.length) {
    return (
      <p className="font-mono text-[11px] text-[var(--muted)]">{empty}</p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-2 font-mono text-[11px]">
            <span className="truncate text-[var(--ink)]">{item.label}</span>
            <span className="shrink-0 tabular-nums text-[var(--muted)]">
              {item.display}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-[1px] bg-[var(--sunken)]">
            <div
              className="h-full bg-[var(--accent)]"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
