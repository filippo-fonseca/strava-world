import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { appPath, getStravaRedirectUri } from "@/lib/app-url";
import { getSessionOptions, type AppSession } from "@/lib/session";
import { exchangeCode } from "@/lib/strava/client";

function oauthErrorRedirect(
  request: NextRequest,
  code: string,
  detail?: string,
) {
  const params = new URLSearchParams({ error: code });
  if (detail) params.set("detail", detail.slice(0, 220));
  return NextResponse.redirect(appPath(`/?${params.toString()}`, request));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");

  if (error) {
    // Strava sends users here when they deny access (still our callback host).
    return oauthErrorRedirect(request, error);
  }

  if (!code) {
    return oauthErrorRedirect(request, "missing_code");
  }

  // Must match the redirect_uri used in /api/auth/strava (canonical host).
  const redirectUri = getStravaRedirectUri(request);

  try {
    const athlete = await exchangeCode(code, redirectUri);

    // Attach Set-Cookie to the same redirect response (App Router cookie store
    // + redirect can drop the session cookie otherwise).
    const response = NextResponse.redirect(appPath("/map", request));
    const session = await getIronSession<AppSession>(
      request,
      response,
      getSessionOptions(),
    );
    session.athlete = athlete;
    session.isDemo = false;
    await session.save();
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error("Strava OAuth exchange failed", {
      redirectUri,
      message,
    });

    const hint = message.toLowerCase().includes("redirect")
      ? `callback_mismatch:${redirectUri}`
      : `exchange_failed:${redirectUri}`;

    return oauthErrorRedirect(request, "oauth_failed", hint);
  }
}
