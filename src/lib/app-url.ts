import type { NextRequest } from "next/server";

/**
 * Resolve the public app origin for post-login redirects (where the browser goes).
 * Prefer the incoming request host so users stay on the domain they started from.
 */
export function getAppOrigin(request?: NextRequest | Request) {
  if (request) {
    const url = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedHost) {
      const host = forwardedHost.split(",")[0].trim();
      const proto =
        (forwardedProto || url.protocol.replace(":", "") || "https").split(
          ",",
        )[0].trim();
      return `${proto}://${host}`;
    }
    if (url.host) {
      return url.origin;
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}

/**
 * Canonical origin registered with Strava (Authorization Callback Domain).
 * Strava only allows ONE callback domain — always use this for OAuth redirect_uri
 * so authorize + token exchange match, regardless of which host the user opened.
 */
export function getCanonicalAppOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const configured = process.env.STRAVA_REDIRECT_URI?.replace(/\/$/, "");
  if (configured) {
    try {
      return new URL(
        configured.includes("://") ? configured : `https://${configured}`,
      ).origin;
    } catch {
      // fall through
    }
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}

/**
 * redirect_uri sent to Strava authorize + token endpoints.
 * Must use the canonical host that matches Strava's Authorization Callback Domain.
 */
export function getStravaRedirectUri(request?: NextRequest | Request) {
  void request; // signature kept for call-site compatibility
  const explicit = process.env.STRAVA_REDIRECT_URI?.replace(/\/$/, "");
  if (explicit) {
    if (explicit.endsWith("/api/auth/callback")) return explicit;
    return `${explicit}/api/auth/callback`;
  }

  return `${getCanonicalAppOrigin()}/api/auth/callback`;
}

export function appPath(path: string, request?: NextRequest | Request) {
  // After OAuth, prefer canonical origin so the session cookie is set on the
  // same host as redirect_uri / future API calls.
  const origin = getCanonicalAppOrigin() || getAppOrigin(request);
  return new URL(path, `${origin}/`);
}
