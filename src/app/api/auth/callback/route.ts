import { NextRequest, NextResponse } from "next/server";
import { appPath, getStravaRedirectUri } from "@/lib/app-url";
import { getSession } from "@/lib/session";
import { exchangeCode } from "@/lib/strava/client";

function oauthErrorRedirect(
  request: NextRequest,
  code: string,
  detail?: string,
) {
  const params = new URLSearchParams({ error: code });
  if (detail) params.set("detail", detail.slice(0, 180));
  return NextResponse.redirect(appPath(`/?${params.toString()}`, request));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");

  if (error) {
    return oauthErrorRedirect(request, error);
  }

  if (!code) {
    return oauthErrorRedirect(request, "missing_code");
  }

  const redirectUri = getStravaRedirectUri(request);

  try {
    const athlete = await exchangeCode(code, redirectUri);
    const session = await getSession();
    session.athlete = athlete;
    session.isDemo = false;
    await session.save();
    return NextResponse.redirect(appPath("/map", request));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error("Strava OAuth exchange failed", {
      redirectUri,
      message,
    });

    // Help diagnose callback-domain mismatches without leaking secrets.
    const hint = message.toLowerCase().includes("redirect")
      ? `callback_mismatch:${redirectUri}`
      : `exchange_failed:${redirectUri}`;

    return oauthErrorRedirect(request, "oauth_failed", hint);
  }
}
