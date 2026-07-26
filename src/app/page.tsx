import { Suspense } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { isStravaConfigured } from "@/lib/strava/client";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LandingPage stravaConfigured={isStravaConfigured()} />
    </Suspense>
  );
}
