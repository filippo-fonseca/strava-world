import { NextResponse } from "next/server";
import { getDemoAthlete } from "@/lib/demo-data";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  const athlete = getDemoAthlete();

  session.isDemo = true;
  session.athlete = {
    ...athlete,
    accessToken: "demo",
    refreshToken: "demo",
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };
  await session.save();

  return NextResponse.json({ ok: true });
}
