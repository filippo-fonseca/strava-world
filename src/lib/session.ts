import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { SessionAthlete } from "@/lib/types";

export type AppSession = {
  athlete?: SessionAthlete;
  isDemo?: boolean;
  /** Bumped on manual Sync so server cache keys rotate. */
  runsCacheEpoch?: number;
};

function getSessionPassword() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // Dev fallback so local demo mode still works without secrets configured.
    return "strava-world-dev-session-secret-change-me!!";
  }
  return secret;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: "strava_world_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<AppSession>(await cookies(), getSessionOptions());
}
