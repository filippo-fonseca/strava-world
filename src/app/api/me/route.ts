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

  const athlete = {
    id: session.athlete.id,
    firstname: session.athlete.firstname,
    lastname: session.athlete.lastname,
    profile: session.athlete.profile,
    city: session.athlete.city,
    country: session.athlete.country,
  };

  return NextResponse.json({
    authenticated: true,
    isDemo: false,
    athlete,
    stravaConfigured: isStravaConfigured(),
  });
}
