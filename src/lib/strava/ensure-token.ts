import { getSession } from "@/lib/session";
import { refreshAccessToken } from "@/lib/strava/client";
import type { SessionAthlete } from "@/lib/types";

export async function ensureAccessToken(): Promise<{
  athlete: SessionAthlete;
  isDemo: boolean;
} | null> {
  const session = await getSession();
  if (!session.athlete) return null;

  if (session.isDemo) {
    return { athlete: session.athlete, isDemo: true };
  }

  const expiresSoon =
    session.athlete.expiresAt <= Math.floor(Date.now() / 1000) + 60;

  if (expiresSoon) {
    const refreshed = await refreshAccessToken(session.athlete);
    session.athlete = refreshed;
    await session.save();
    return { athlete: refreshed, isDemo: false };
  }

  return { athlete: session.athlete, isDemo: false };
}
