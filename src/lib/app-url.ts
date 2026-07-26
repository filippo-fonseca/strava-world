import type { NextRequest } from "next/server";

/**
 * Resolve the public app origin for OAuth redirects.
 * Prefers the incoming request host so Vercel previews/prod just work,
 * then falls back to env / localhost for local scripts.
 */
export function getAppOrigin(request?: NextRequest | Request) {
  if (request) {
    const url = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedHost) {
      const proto = forwardedProto || (url.protocol.replace(":", "") || "https");
      return `${proto}://${forwardedHost.split(",")[0].trim()}`;
    }
    // On Vercel, request.url usually already has the deployment host.
    if (url.host && url.host !== "localhost:3000") {
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

export function getStravaRedirectUri(request?: NextRequest | Request) {
  const configured = process.env.STRAVA_REDIRECT_URI?.replace(/\/$/, "");
  // If someone left the localhost default on Vercel, ignore it and use the request host.
  if (
    configured &&
    !configured.includes("localhost") &&
    !configured.includes("127.0.0.1")
  ) {
    return configured;
  }

  return `${getAppOrigin(request)}/api/auth/callback`;
}

export function appPath(path: string, request?: NextRequest | Request) {
  return new URL(path, `${getAppOrigin(request)}/`);
}
