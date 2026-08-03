import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  left: ReactNode;
  map: ReactNode;
  right: ReactNode;
  className?: string;
  /** Extra under the map plate (captions / layer chips). */
  mapCaption?: ReactNode;
  /** On small screens, show the map before the left rail (atlas page). */
  mapFirstOnMobile?: boolean;
};

/**
 * StreetLens-style instrument grid: left rail · central map hero · right stats.
 */
export function HeroMapLayout({
  left,
  map,
  right,
  className,
  mapCaption,
  mapFirstOnMobile = false,
}: Props) {
  return (
    <div
      className={clsx(
        "grid w-full grid-cols-1 gap-x-[clamp(1rem,2vw,2rem)] gap-y-4",
        "lg:h-[min(78vh,52rem)] lg:grid-cols-[clamp(240px,20vw,320px)_minmax(0,1fr)_clamp(200px,17vw,280px)] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-y-3",
        className,
      )}
    >
      <aside
        className={clsx(
          "flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-start-1 lg:row-span-2 lg:row-start-1",
          mapFirstOnMobile && "order-2 lg:order-none",
        )}
      >
        {left}
      </aside>

      <div
        className={clsx(
          "flex min-h-0 min-w-0 flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full",
          mapFirstOnMobile && "order-1 lg:order-none",
        )}
      >
        <div className="map-plate flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-[50dvh] flex-1 overflow-hidden rounded-[var(--radius)] bg-[var(--sunken)] lg:min-h-0">
            {map}
          </div>
        </div>
        {mapCaption ? (
          <div className="mt-2 px-0.5 font-mono text-[11px] leading-snug text-[var(--muted)]">
            {mapCaption}
          </div>
        ) : null}
      </div>

      <aside
        className={clsx(
          "flex min-h-0 flex-col gap-3 lg:col-start-3 lg:row-span-2 lg:row-start-1",
          mapFirstOnMobile && "order-3 lg:order-none",
        )}
      >
        <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:px-0 lg:pb-0 lg:[scrollbar-width:thin]">
          {right}
        </div>
      </aside>
    </div>
  );
}
