"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "convex" | "concave" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function NeuButton({
  className,
  variant = "convex",
  size = "md",
  leftIcon,
  rightIcon,
  children,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        "neu-pressable inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-tight disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        variant === "convex" && "neu-convex text-[var(--neu-ink)]",
        variant === "concave" && "neu-concave text-[var(--neu-muted)]",
        variant === "accent" &&
          "bg-[linear-gradient(145deg,#ef6a40,#d2471f)] text-white shadow-[8px_8px_18px_rgba(163,149,130,0.45),-6px_-6px_14px_rgba(255,255,255,0.55)]",
        variant === "ghost" && "bg-transparent text-[var(--neu-muted)] shadow-none",
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
