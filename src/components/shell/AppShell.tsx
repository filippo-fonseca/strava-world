"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StravaPoweredBy } from "@/components/brand/StravaPoweredBy";

type Props = {
  athleteLabel: string;
  meta?: string | null;
  actions?: ReactNode;
  children: ReactNode;
};

const nav = [
  { href: "/map", label: "map" },
  { href: "/stats", label: "stats" },
];

export function AppShell({ athleteLabel, meta, actions, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-[max(0.75rem,var(--safe-left))] py-2.5 pr-[max(0.75rem,var(--safe-right))] sm:px-5">
          <Link
            href="/map"
            className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-[var(--ink-display)] lowercase"
          >
            strava world
          </Link>

          <nav className="flex items-center gap-3 font-mono text-[12px] lowercase">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "inline-flex min-h-11 items-center px-0.5",
                    active
                      ? "text-[var(--ink-display)] link-accent"
                      : "text-[var(--muted)] hover:text-[var(--ink-display)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="min-w-0 flex-1 font-mono text-[11px] text-[var(--muted)]">
            <span className="truncate">
              {athleteLabel}
              {meta ? ` · ${meta}` : ""}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-[max(0.75rem,var(--safe-left))] pb-[calc(1rem+var(--safe-bottom))] pt-3 pr-[max(0.75rem,var(--safe-right))] sm:px-5 sm:pt-4">
        {children}
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-[max(0.75rem,var(--safe-left))] py-3 pr-[max(0.75rem,var(--safe-right))] sm:px-5">
          <p className="font-mono text-[10px] text-[var(--faint)]">
            open source · not affiliated with strava
          </p>
          <StravaPoweredBy variant="orange" />
        </div>
      </footer>
    </div>
  );
}
