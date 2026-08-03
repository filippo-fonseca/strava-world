import clsx from "clsx";

type Props = {
  href?: string;
  className?: string;
  disabled?: boolean;
};

/** Official Connect with Strava button — do not restyle the artwork. */
export function StravaConnectButton({
  href = "/api/auth/strava",
  className,
  disabled,
}: Props) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/strava/btn_strava_connect_with_orange.svg"
      alt="Connect with Strava"
      width={193}
      height={48}
      className="h-12 w-auto"
    />
  );

  if (disabled) {
    return (
      <span
        className={clsx(
          "inline-flex cursor-not-allowed opacity-45",
          className,
        )}
        aria-disabled="true"
        title="Add Strava env to connect"
      >
        {img}
      </span>
    );
  }

  return (
    <a
      href={href}
      className={clsx(
        "inline-flex transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        className,
      )}
    >
      {img}
    </a>
  );
}
