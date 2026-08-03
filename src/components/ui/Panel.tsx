import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  inset?: boolean;
  title?: string;
  action?: ReactNode;
};

export function Panel({
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
        "p-3 md:p-4",
        inset ? "surface-inset" : "surface",
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-[var(--ink-display)] lowercase">
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
