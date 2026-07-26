import { NextRequest, NextResponse } from "next/server";
import { sinceToAfterEpoch } from "@/lib/merge-runs";
import { getSession } from "@/lib/session";
import { ensureAccessToken } from "@/lib/strava/ensure-token";
import {
  getDemoRunsPayload,
  getFullRunActivities,
  getIncrementalRunActivities,
} from "@/lib/strava/runs-server-cache";

export async function GET(request: NextRequest) {
  const auth = await ensureAccessToken();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refresh =
    request.nextUrl.searchParams.get("refresh") === "1" ||
    request.nextUrl.searchParams.get("refresh") === "true";
  const modeParam = request.nextUrl.searchParams.get("mode");
  const since = request.nextUrl.searchParams.get("since");
  const wantIncremental =
    !refresh &&
    modeParam !== "full" &&
    (modeParam === "incremental" || Boolean(since));

  if (auth.isDemo) {
    const payload = getDemoRunsPayload();
    return NextResponse.json(
      {
        activities: payload.activities,
        syncedAt: payload.syncedAt,
        source: payload.source,
        mode: "full",
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
    if (wantIncremental && since) {
      const after = sinceToAfterEpoch(since);
      if (typeof after !== "number") {
        return NextResponse.json(
          { error: "Invalid since timestamp" },
          { status: 400 },
        );
      }

      const payload = await getIncrementalRunActivities({
        accessToken: auth.athlete.accessToken,
        after,
      });

      return NextResponse.json(
        {
          activities: payload.activities,
          syncedAt: payload.syncedAt,
          source: payload.source,
          mode: "incremental",
          isDemo: false,
          cached: false,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const session = await getSession();
    let cacheEpoch = session.runsCacheEpoch ?? 0;

    if (refresh) {
      cacheEpoch += 1;
      session.runsCacheEpoch = cacheEpoch;
      await session.save();
    }

    // New epoch on refresh ⇒ cache miss ⇒ one Strava crawl, then stored.
    const payload = await getFullRunActivities({
      athleteId: auth.athlete.id,
      accessToken: auth.athlete.accessToken,
      cacheEpoch,
    });

    return NextResponse.json(
      {
        activities: payload.activities,
        syncedAt: payload.syncedAt,
        source: refresh ? "network" : payload.source,
        mode: "full",
        isDemo: false,
        cached: !refresh && payload.source === "server-cache",
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
