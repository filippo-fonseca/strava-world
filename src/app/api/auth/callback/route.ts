import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeCode } from "@/lib/strava/client";

function appUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");

  if (error) {
    return NextResponse.redirect(appUrl(`/?error=${encodeURIComponent(error)}`));
  }

  if (!code) {
    return NextResponse.redirect(appUrl("/?error=missing_code"));
  }

  try {
    const athlete = await exchangeCode(code);
    const session = await getSession();
    session.athlete = athlete;
    session.isDemo = false;
    await session.save();
    return NextResponse.redirect(appUrl("/map"));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(appUrl("/?error=oauth_failed"));
  }
}
