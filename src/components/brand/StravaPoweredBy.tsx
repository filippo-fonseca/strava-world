import clsx from "clsx";

type Props = {
  className?: string;
  variant?: "orange" | "white";
};

/** Official Powered by Strava logo — do not modify. */
export function StravaPoweredBy({ className, variant = "orange" }: Props) {
  const src =
    variant === "white"
      ? "/brand/strava/api_logo_pwrdBy_strava_horiz_white.svg"
      : "/brand/strava/api_logo_pwrdBy_strava_horiz_orange.svg";

  return (
    <a
      href="https://www.strava.com"
      target="_blank"
      rel="noreferrer"
      className={clsx(
        "inline-flex opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Powered by Strava"
        width={162}
        height={30}
        className="h-6 w-auto sm:h-7"
      />
    </a>
  );
}
