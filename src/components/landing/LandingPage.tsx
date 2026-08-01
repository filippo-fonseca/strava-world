"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  stravaConfigured: boolean;
};

export function LandingPage({ stravaConfigured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [demoLoading, setDemoLoading] = useState(false);

  async function startDemo() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) throw new Error("Demo session failed");
      router.push("/map");
      router.refresh();
    } catch {
      setDemoLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-[calc(3rem+var(--safe-bottom))] pt-6 sm:px-6 sm:pt-10">
      <header className="flex items-center justify-between gap-4">
        <span className="font-[family-name:var(--font-display)] text-xl tracking-tight sm:text-2xl">
          Strava World
        </span>
        <a
          href="https://github.com/filippo-fonseca/strava-world"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
        >
          GitHub
        </a>
      </header>

      <section className="mt-14 sm:mt-20">
        <p className="text-sm text-[var(--muted)]">A plain atlas of your runs</p>
        <h1 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          Every place you&apos;ve run, on one map.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Heat for the paths you return to, routes when you zoom in, photo
          previews across the world, and quiet stats for countries, cities,
          distance, and time.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {stravaConfigured ? (
            <a href="/api/auth/strava" className="w-full sm:w-auto">
              <Button variant="accent" size="lg" className="w-full sm:w-auto">
                Connect Strava
              </Button>
            </a>
          ) : (
            <Button variant="accent" size="lg" disabled className="w-full sm:w-auto">
              Add Strava env to connect
            </Button>
          )}
          <Button
            size="lg"
            variant="secondary"
            onClick={startDemo}
            disabled={demoLoading}
            className="w-full sm:w-auto"
          >
            {demoLoading ? "Opening…" : "Explore demo"}
          </Button>
        </div>

        {error && (
          <div className="mt-5 max-w-lg space-y-1 text-sm text-[var(--accent)]">
            <p>
              Sign-in issue: {error.replaceAll("_", " ")}. You can still explore
              the demo.
            </p>
            {searchParams.get("detail") && (
              <p className="break-all text-xs text-[var(--muted)]">
                {searchParams.get("detail")}
              </p>
            )}
            {error === "oauth_failed" && (
              <p className="text-xs text-[var(--muted)]">
                Strava Authorization Callback Domain must match this site&apos;s
                exact host. Also set{" "}
                <code className="text-[var(--ink)]">NEXT_PUBLIC_APP_URL</code>{" "}
                to that same URL.
              </p>
            )}
          </div>
        )}

        {!stravaConfigured && (
          <p className="mt-5 max-w-md text-sm text-[var(--muted)]">
            Set <code className="text-[var(--ink)]">STRAVA_CLIENT_ID</code> and{" "}
            <code className="text-[var(--ink)]">STRAVA_CLIENT_SECRET</code> in{" "}
            <code className="text-[var(--ink)]">.env.local</code> for live data.
          </p>
        )}
      </section>

      <section className="mt-16 border-t border-[var(--line)] pt-10 sm:mt-20">
        <ul className="space-y-8">
          {[
            {
              title: "One map",
              copy: "Zoom from world to street. Heat, routes, and photos live together — no mode switching required.",
            },
            {
              title: "Common paths",
              copy: "Overlapping miles glow hotter so the segments you run most are obvious at a glance.",
            },
            {
              title: "Pins & photos",
              copy: "Photo previews when you have them. Simple pins when you don’t. Every run still has a place.",
            },
            {
              title: "Quiet stats",
              copy: "Runs, countries, cities, distance, time, elevation, photos — plain numbers, nothing louder than the map.",
            },
          ].map((item) => (
            <li key={item.title}>
              <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                {item.title}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {item.copy}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto pt-16 text-xs text-[var(--muted)]">
        Open source. Not affiliated with Strava.
      </footer>
    </main>
  );
}
