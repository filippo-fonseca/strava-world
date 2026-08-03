import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getDemoAthlete } from "@/lib/demo-data";
import { getSessionOptions, SESSION_TTL_SECONDS, type AppSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true, persisted: true });
  const session = await getIronSession<AppSession>(
    request,
    response,
    getSessionOptions(),
  );
  const athlete = getDemoAthlete();

  session.isDemo = true;
  session.athlete = {
    ...athlete,
    accessToken: "demo",
    refreshToken: "demo",
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  await session.save();

  return response;
}
