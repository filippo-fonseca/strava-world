import { NextRequest, NextResponse } from "next/server";
import { getDemoActivity } from "@/lib/demo-data";
import { ensureAccessToken } from "@/lib/strava/ensure-token";
import { fetchActivityDetail } from "@/lib/strava/client";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const activityId = Number(id);
  if (!Number.isFinite(activityId)) {
    return NextResponse.json({ error: "Invalid activity id" }, { status: 400 });
  }

  const auth = await ensureAccessToken();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (auth.isDemo) {
    const activity = getDemoActivity(activityId);
    if (!activity) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ activity, isDemo: true });
  }

  try {
    const activity = await fetchActivityDetail(
      auth.athlete.accessToken,
      activityId,
    );
    return NextResponse.json({ activity, isDemo: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 502 },
    );
  }
}
