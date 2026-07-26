import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ensureAccessToken } from "@/lib/strava/ensure-token";
import {
  getCachedRunActivities,
  getDemoRunsPayload,
} from "@/lib/strava/runs-server-cache";

export async function GET(request: NextRequest) {
  const auth = await ensureAccessToken();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refresh =
    request.nextUrl.searchParams.get("refresh") === "1" ||
    request.nextUrl.searchParams.get("refresh") === "true";

  if (auth.isDemo) {
    const payload = getDemoRunsPayload();
    return NextResponse.json(
      {
        activities: payload.activities,
        syncedAt: payload.syncedAt,
        source: payload.source,
        isDemo: true,
        cached: true,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=3600",
        },
      },
    );
  }

  try {
    const session = await getSession();
    let cacheEpoch = session.runsCacheEpoch ?? 0;

    if (refresh) {
      cacheEpoch += 1;
      session.runsCacheEpoch = cacheEpoch;
      await session.save();
    }

    const payload = await getCachedRunActivities({
      athleteId: auth.athlete.id,
      accessToken: auth.athlete.accessToken,
      cacheEpoch,
    });

    return NextResponse.json(
      {
        activities: payload.activities,
        syncedAt: payload.syncedAt,
        source: refresh ? "network" : payload.source,
        isDemo: false,
        cached: !refresh,
      },
      {
        headers: {
          "Cache-Control": refresh
            ? "no-store"
            : "private, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 502 },
    );
  }
}
