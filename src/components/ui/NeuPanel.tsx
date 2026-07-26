import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  inset?: boolean;
  title?: string;
  action?: ReactNode;
};

export function NeuPanel({
  className,
  inset = false,
  title,
  action,
  children,
  ...props
}: Props) {
  return (
    <div
      className={clsx(
        "rounded-[28px] p-4 md:p-5",
        inset ? "neu-concave" : "neu-convex",
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h3 className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--neu-ink)]">
              {title}
            </h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
