import type { NextRequest } from "next/server";

/**
 * Resolve the public app origin for OAuth redirects.
 * Always prefer the incoming request host so custom domains
 * (e.g. stravaworld.hyperpolymath.com) win over stale Vercel env values.
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
    if (url.host && !url.host.startsWith("localhost")) {
      return url.origin;
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv && !fromEnv.includes("localhost")) return fromEnv;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }

  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}

export function getStravaRedirectUri(request?: NextRequest | Request) {
  // Prefer the live request host so custom domains aren't overridden by an
  // old STRAVA_REDIRECT_URI pointing at *.vercel.app.
  if (request) {
    return `${getAppOrigin(request)}/api/auth/callback`;
  }

  const configured = process.env.STRAVA_REDIRECT_URI?.replace(/\/$/, "");
  if (
    configured &&
    !configured.includes("localhost") &&
    !configured.includes("127.0.0.1")
  ) {
    return configured;
  }

  return `${getAppOrigin()}/api/auth/callback`;
}

export function appPath(path: string, request?: NextRequest | Request) {
  return new URL(path, `${getAppOrigin(request)}/`);
}
