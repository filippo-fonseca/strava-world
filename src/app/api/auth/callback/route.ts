import { NextRequest, NextResponse } from "next/server";
import { appPath, getStravaRedirectUri } from "@/lib/app-url";
import { getSession } from "@/lib/session";
import { exchangeCode } from "@/lib/strava/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");

  if (error) {
    return NextResponse.redirect(
      appPath(`/?error=${encodeURIComponent(error)}`, request),
    );
  }

  if (!code) {
    return NextResponse.redirect(appPath("/?error=missing_code", request));
  }

  try {
    const redirectUri = getStravaRedirectUri(request);
    const athlete = await exchangeCode(code, redirectUri);
    const session = await getSession();
    session.athlete = athlete;
    session.isDemo = false;
    await session.save();
    return NextResponse.redirect(appPath("/map", request));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(appPath("/?error=oauth_failed", request));
  }
}
