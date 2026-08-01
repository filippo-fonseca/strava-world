"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
  children: ReactNode;
};

export function IconButton({
  label,
  active,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        "pressable grid h-11 w-11 place-items-center rounded-[10px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
        active && "border-[var(--accent)] text-[var(--accent)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
