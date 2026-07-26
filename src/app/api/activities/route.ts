import { NextResponse } from "next/server";
import { getDemoActivities } from "@/lib/demo-data";
import { ensureAccessToken } from "@/lib/strava/ensure-token";
import { fetchRunActivities } from "@/lib/strava/client";

export async function GET() {
  const auth = await ensureAccessToken();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (auth.isDemo) {
    return NextResponse.json({ activities: getDemoActivities(), isDemo: true });
  }

  try {
    const activities = await fetchRunActivities(auth.athlete.accessToken);
    return NextResponse.json({ activities, isDemo: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 502 },
    );
  }
}
