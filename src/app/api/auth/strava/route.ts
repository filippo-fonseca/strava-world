import { NextRequest, NextResponse } from "next/server";
import { appPath, getStravaRedirectUri } from "@/lib/app-url";
import { getAuthorizeUrl, isStravaConfigured } from "@/lib/strava/client";

export async function GET(request: NextRequest) {
  if (!isStravaConfigured()) {
    return NextResponse.redirect(
      appPath("/?error=strava_not_configured", request),
    );
  }

  const redirectUri = getStravaRedirectUri(request);

  // ?debug=1 → inspect the redirect_uri without starting OAuth
  if (request.nextUrl.searchParams.get("debug") === "1") {
    return NextResponse.json({
      redirectUri,
      authorizeUrl: getAuthorizeUrl({ redirectUri }),
      hint: "Strava Authorization Callback Domain must equal the host of redirectUri (no https://, no path).",
    });
  }

  return NextResponse.redirect(getAuthorizeUrl({ redirectUri }));
}
