import { Suspense } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { isStravaConfigured } from "@/lib/strava/client";

function LandingFallback() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-36" />
        <div className="skeleton h-4 w-14" />
      </div>
      <div className="mt-14 sm:mt-20">
        <div className="skeleton mb-3 h-4 w-40" />
        <div className="skeleton mb-3 h-12 w-full max-w-md" />
        <div className="skeleton mb-2 h-12 w-full max-w-sm" />
        <div className="skeleton mt-5 h-5 w-full max-w-lg" />
        <div className="skeleton mt-2 h-5 w-2/3 max-w-md" />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="skeleton h-12 w-full sm:w-40" />
          <div className="skeleton h-12 w-full sm:w-36" />
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingPage stravaConfigured={isStravaConfigured()} />
    </Suspense>
  );
}
