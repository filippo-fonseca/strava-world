import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { SessionAthlete } from "@/lib/types";

export type AppSession = {
  athlete?: SessionAthlete;
  isDemo?: boolean;
  /** Bumped on manual Sync so server cache keys rotate. */
  runsCacheEpoch?: number;
};

/** Keep athletes signed in across browser restarts (90 days). */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90;

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
    // Persistent login: iron-session sets cookie maxAge to ttl - 60s.
    // Do NOT pass cookieOptions.maxAge: undefined — that makes a session cookie
    // that dies when the browser closes.
    ttl: SESSION_TTL_SECONDS,
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
