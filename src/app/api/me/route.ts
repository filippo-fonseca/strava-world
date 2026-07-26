import { NextResponse } from "next/server";
import { getDemoAthlete } from "@/lib/demo-data";
import { getSession } from "@/lib/session";
import { isStravaConfigured } from "@/lib/strava/client";

export async function GET() {
  const session = await getSession();

  if (session.isDemo) {
    return NextResponse.json({
      authenticated: true,
      isDemo: true,
      athlete: getDemoAthlete(),
      stravaConfigured: isStravaConfigured(),
    });
  }

  if (!session.athlete) {
    return NextResponse.json({
      authenticated: false,
      isDemo: false,
      athlete: null,
      stravaConfigured: isStravaConfigured(),
    });
  }

  const { accessToken: _a, refreshToken: _r, expiresAt: _e, ...athlete } =
    session.athlete;

  return NextResponse.json({
    authenticated: true,
    isDemo: false,
    athlete,
    stravaConfigured: isStravaConfigured(),
  });
}
