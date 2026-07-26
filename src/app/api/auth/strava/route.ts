import { NextResponse } from "next/server";
import { getAuthorizeUrl, isStravaConfigured } from "@/lib/strava/client";

export async function GET() {
  if (!isStravaConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/?error=strava_not_configured",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      ),
    );
  }

  return NextResponse.redirect(getAuthorizeUrl());
}
