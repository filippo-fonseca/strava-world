import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { getSession } from "@/lib/session";
import { isStravaConfigured } from "@/lib/strava/client";

function LandingFallback() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 pt-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_240px]">
        <div className="space-y-3">
          <div className="skeleton h-7 w-36" />
          <div className="skeleton h-5 w-24" />
          <div className="skeleton mt-6 h-20 w-full" />
          <div className="skeleton h-12 w-40" />
        </div>
        <div className="skeleton min-h-[50dvh] w-full lg:min-h-[70vh]" />
        <div className="flex gap-2 overflow-hidden lg:flex-col">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 min-w-[9rem] flex-1" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default async function Home() {
  const session = await getSession();
  // Returning visitors with a valid session cookie skip the landing page.
  if (session.athlete) {
    redirect("/map");
  }

  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingPage stravaConfigured={isStravaConfigured()} />
    </Suspense>
  );
}
