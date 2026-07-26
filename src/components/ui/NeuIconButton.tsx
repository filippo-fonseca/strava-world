"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
  children: ReactNode;
};

export function NeuIconButton({
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
        "neu-pressable grid h-11 w-11 place-items-center rounded-2xl",
        active ? "neu-concave text-[var(--neu-accent)]" : "neu-convex text-[var(--neu-ink)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
