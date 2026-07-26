import polyline from "@mapbox/polyline";
import type {
  ActivityPhoto,
  AthleteSummary,
  LatLng,
  RunActivity,
  SessionAthlete,
} from "@/lib/types";

const STRAVA_API = "https://www.strava.com/api/v3";
const STRAVA_OAUTH = "https://www.strava.com/oauth";

export function getStravaConfig(redirectUri?: string) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const resolvedRedirectUri =
    redirectUri ||
    process.env.STRAVA_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`;

  return { clientId, clientSecret, redirectUri: resolvedRedirectUri };
}

export function isStravaConfigured() {
  const { clientId, clientSecret } = getStravaConfig();
  return Boolean(clientId && clientSecret);
}

export function getAuthorizeUrl(
  options: { state?: string; redirectUri: string } | string = "strava-world",
) {
  const state =
    typeof options === "string" ? options : (options.state ?? "strava-world");
  const redirectUri =
    typeof options === "string"
      ? getStravaConfig().redirectUri
      : options.redirectUri;

  const { clientId } = getStravaConfig(redirectUri);
  if (!clientId) throw new Error("STRAVA_CLIENT_ID is not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all,profile:read_all",
    state,
  });

  return `${STRAVA_OAUTH}/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
    city?: string | null;
    country?: string | null;
  };
};

export async function exchangeCode(
  code: string,
  redirectUri?: string,
): Promise<SessionAthlete> {
  const { clientId, clientSecret, redirectUri: resolvedRedirectUri } =
    getStravaConfig(redirectUri);
  if (!clientId || !clientSecret) {
    throw new Error("Strava credentials are not configured");
  }

  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Number(clientId),
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      // Must match the redirect_uri used in the authorize step.
      redirect_uri: resolvedRedirectUri,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token exchange failed: ${text}`);
  }

  const data = (await res.json()) as TokenResponse;
  return {
    id: data.athlete.id,
    firstname: data.athlete.firstname,
    lastname: data.athlete.lastname,
    profile: data.athlete.profile,
    city: data.athlete.city,
    country: data.athlete.country,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  };
}

export async function refreshAccessToken(
  athlete: SessionAthlete,
): Promise<SessionAthlete> {
  const { clientId, clientSecret } = getStravaConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Strava credentials are not configured");
  }

  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Number(clientId),
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: athlete.refreshToken,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token refresh failed: ${text}`);
  }

  const data = (await res.json()) as Omit<TokenResponse, "athlete">;
  return {
    ...athlete,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  };
}

async function stravaFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${STRAVA_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava API ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_latlng?: number[] | null;
  end_latlng?: number[] | null;
  map?: { summary_polyline?: string | null } | null;
  average_speed: number;
  max_speed: number;
  calories?: number | null;
  location_city?: string | null;
  location_country?: string | null;
  total_photo_count?: number;
  has_heartrate?: boolean;
  average_heartrate?: number | null;
};

type StravaPhoto = {
  unique_id?: string;
  id?: number;
  caption?: string | null;
  location?: number[] | null;
  urls?: Record<string, string>;
  sourced_from_strava?: boolean;
};

function toLatLng(value?: number[] | null): LatLng | null {
  if (!value || value.length < 2) return null;
  return [value[0], value[1]];
}

function mapActivity(raw: StravaActivity, photos: ActivityPhoto[] = []): RunActivity {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    sportType: raw.sport_type,
    distance: raw.distance,
    movingTime: raw.moving_time,
    elapsedTime: raw.elapsed_time,
    totalElevationGain: raw.total_elevation_gain,
    startDate: raw.start_date,
    startLatlng: toLatLng(raw.start_latlng),
    endLatlng: toLatLng(raw.end_latlng),
    summaryPolyline: raw.map?.summary_polyline || null,
    averageSpeed: raw.average_speed,
    maxSpeed: raw.max_speed,
    calories: raw.calories,
    locationCity: raw.location_city,
    locationCountry: raw.location_country,
    totalPhotoCount: raw.total_photo_count || photos.length || 0,
    hasHeartrate: Boolean(raw.has_heartrate),
    averageHeartrate: raw.average_heartrate,
    photos,
    latlngStream: raw.map?.summary_polyline
      ? (polyline.decode(raw.map.summary_polyline) as LatLng[])
      : undefined,
  };
}

export async function fetchAthlete(accessToken: string): Promise<AthleteSummary> {
  const athlete = await stravaFetch<{
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
    city?: string | null;
    country?: string | null;
  }>("/athlete", accessToken);

  return {
    id: athlete.id,
    firstname: athlete.firstname,
    lastname: athlete.lastname,
    profile: athlete.profile,
    city: athlete.city,
    country: athlete.country,
  };
}

const RUN_SPORTS = new Set(["Run", "TrailRun", "VirtualRun"]);

function isRunActivity(activity: StravaActivity) {
  return RUN_SPORTS.has(activity.sport_type) || activity.type === "Run";
}

export async function fetchRunActivities(
  accessToken: string,
  options?: {
    /** Max activity pages to scan (200 activities/page). Default covers ~4000 activities. */
    maxPages?: number;
    perPage?: number;
    /** Max runs to return after filtering. */
    maxRuns?: number;
    /** Max photo detail fetches (keeps us under Strava rate limits). */
    maxPhotoFetches?: number;
    /** Unix seconds — only activities after this time (Strava `after`). */
    after?: number;
  },
): Promise<RunActivity[]> {
  const perPage = Math.min(options?.perPage ?? 200, 200);
  const isIncremental = typeof options?.after === "number";
  const maxPages = options?.maxPages ?? (isIncremental ? 5 : 20);
  const maxRuns = options?.maxRuns ?? (isIncremental ? 400 : 2000);
  const maxPhotoFetches =
    options?.maxPhotoFetches ?? (isIncremental ? 80 : 60);

  const runSummaries: StravaActivity[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (typeof options?.after === "number") {
      params.set("after", String(options.after));
    }

    const batch = await stravaFetch<StravaActivity[]>(
      `/athlete/activities?${params.toString()}`,
      accessToken,
    );

    if (!batch.length) break;

    for (const activity of batch) {
      if (!isRunActivity(activity)) continue;
      runSummaries.push(activity);
      if (runSummaries.length >= maxRuns) break;
    }

    if (runSummaries.length >= maxRuns) break;
    // Last page is short → no more history.
    if (batch.length < perPage) break;
  }

  // Enrich a bounded set that actually has photos; map the rest from summary polyline.
  const photoIds = new Set(
    runSummaries
      .filter((activity) => (activity.total_photo_count || 0) > 0)
      .slice(0, maxPhotoFetches)
      .map((activity) => activity.id),
  );

  const mapped = await Promise.all(
    runSummaries.map(async (activity) => {
      if (!photoIds.has(activity.id)) return mapActivity(activity);
      try {
        const photos = await fetchActivityPhotos(accessToken, activity.id);
        return mapActivity(activity, photos);
      } catch {
        return mapActivity(activity);
      }
    }),
  );

  return mapped;
}

export async function fetchActivityPhotos(
  accessToken: string,
  activityId: number,
): Promise<ActivityPhoto[]> {
  try {
    const photos = await stravaFetch<StravaPhoto[]>(
      `/activities/${activityId}/photos?size=1000&photo_sources=true`,
      accessToken,
    );

    return photos
      .map((photo, index) => {
        const url =
          photo.urls?.["1000"] ||
          photo.urls?.["600"] ||
          photo.urls?.["300"] ||
          Object.values(photo.urls || {})[0];

        if (!url) return null;

        return {
          id: photo.unique_id || photo.id || `${activityId}-${index}`,
          url,
          caption: photo.caption,
          location: toLatLng(photo.location),
        } satisfies ActivityPhoto;
      })
      .filter(Boolean) as ActivityPhoto[];
  } catch {
    return [];
  }
}

export async function fetchActivityDetail(
  accessToken: string,
  activityId: number,
): Promise<RunActivity> {
  const [activity, photos, streams] = await Promise.all([
    stravaFetch<StravaActivity>(`/activities/${activityId}`, accessToken),
    fetchActivityPhotos(accessToken, activityId),
    stravaFetch<{ latlng?: { data: LatLng[] } }>(
      `/activities/${activityId}/streams?keys=latlng&key_by_type=true`,
      accessToken,
    ).catch(() => null),
  ]);

  const mapped = mapActivity(activity, photos);
  if (streams?.latlng?.data?.length) {
    mapped.latlngStream = streams.latlng.data;
  }
  return mapped;
}
