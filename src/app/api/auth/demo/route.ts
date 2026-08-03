import { NextResponse } from "next/server";
import { getDemoAthlete } from "@/lib/demo-data";
import { getSession, SESSION_TTL_SECONDS } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  const athlete = getDemoAthlete();

  session.isDemo = true;
  session.athlete = {
    ...athlete,
    accessToken: "demo",
    refreshToken: "demo",
    // Match persistent session cookie lifetime.
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  await session.save();

  return NextResponse.json({ ok: true, persisted: true });
}
