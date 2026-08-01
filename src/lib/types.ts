export type LatLng = [number, number];

export type ActivityPhoto = {
  id: number | string;
  url: string;
  caption?: string | null;
  location?: LatLng | null;
};

export type RunActivity = {
  id: number;
  name: string;
  type: string;
  sportType: string;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  startDate: string;
  startLatlng: LatLng | null;
  endLatlng: LatLng | null;
  summaryPolyline: string | null;
  averageSpeed: number;
  maxSpeed: number;
  calories?: number | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  totalPhotoCount: number;
  hasHeartrate: boolean;
  averageHeartrate?: number | null;
  photos: ActivityPhoto[];
  latlngStream?: LatLng[];
};

export type AthleteSummary = {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  city?: string | null;
  country?: string | null;
};

/** Optional layer visibility overrides — default is all on. */
export type MapLayers = {
  heat: boolean;
  routes: boolean;
  photos: boolean;
};

export const DEFAULT_MAP_LAYERS: MapLayers = {
  heat: true,
  routes: true,
  photos: true,
};

/** @deprecated Prefer MapLayers — kept for transitional imports. */
export type MapMode = "heatmap" | "routes" | "photos";

export type SessionAthlete = AthleteSummary & {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};
