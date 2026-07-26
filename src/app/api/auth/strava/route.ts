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
  return NextResponse.redirect(getAuthorizeUrl({ redirectUri }));
}
