"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  leftIcon,
  rightIcon,
  children,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        "pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] font-medium tracking-tight disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "min-h-9 px-3 py-2 text-sm",
        size === "md" && "px-3.5 py-2.5 text-sm",
        size === "lg" && "min-h-12 px-5 py-3 text-base",
        variant === "primary" &&
          "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
        variant === "secondary" &&
          "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
        variant === "accent" &&
          "border border-transparent bg-[var(--accent)] text-white hover:brightness-95",
        variant === "ghost" &&
          "border border-transparent bg-transparent text-[var(--muted)] hover:bg-[rgba(28,25,23,0.04)] hover:text-[var(--ink)]",
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
