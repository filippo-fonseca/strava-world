import polyline from "@mapbox/polyline";
import type { AthleteSummary, LatLng, RunActivity } from "@/lib/types";

function ring(center: LatLng, radiusKm: number, points = 48, wobble = 0.18): LatLng[] {
  const [lat, lng] = center;
  const coords: LatLng[] = [];
  for (let i = 0; i <= points; i += 1) {
    const t = (i / points) * Math.PI * 2;
    const r = radiusKm * (1 + Math.sin(t * 3) * wobble);
    const dLat = (r / 111) * Math.cos(t);
    const dLng = (r / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(t);
    coords.push([lat + dLat, lng + dLng]);
  }
  return coords;
}

function path(points: LatLng[]): { polyline: string; stream: LatLng[] } {
  return {
    polyline: polyline.encode(points),
    stream: points,
  };
}

function photo(id: string, seed: string, location: LatLng | null = null) {
  return {
    id,
    url: `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=900&q=80`,
    caption: null,
    location,
  };
}

const demoAthlete: AthleteSummary = {
  id: 1,
  firstname: "Demo",
  lastname: "Runner",
  profile: "https://images.unsplash.com/photo-1476480862126-209990f84ea3?auto=format&fit=crop&w=200&q=80",
  city: "Lisbon",
  country: "Portugal",
};

type Seed = {
  id: number;
  name: string;
  city: string;
  country: string;
  start: string;
  distance: number;
  movingTime: number;
  elevation: number;
  center: LatLng;
  radiusKm: number;
  photos?: Array<ReturnType<typeof photo>>;
};

const seeds: Seed[] = [
  {
    id: 101,
    name: "Alfama Sunrise Loop",
    city: "Lisbon",
    country: "Portugal",
    start: "2026-07-31T06:42:00Z",
    distance: 10420,
    movingTime: 3120,
    elevation: 186,
    center: [38.7139, -9.1394],
    radiusKm: 1.4,
    photos: [
      photo("p1", "photo-1505761671935-60b3a7483660", [38.7139, -9.1394]),
      photo("p2", "photo-1555881400-74d7acaacd8b", [38.7112, -9.1331]),
    ],
  },
  {
    id: 102,
    name: "Central Park Tempo",
    city: "New York",
    country: "USA",
    start: "2026-07-30T13:10:00Z",
    distance: 12880,
    movingTime: 3480,
    elevation: 74,
    center: [40.7829, -73.9654],
    radiusKm: 1.8,
    photos: [photo("p3", "photo-1496442226666-8d4d0e62e6e9", [40.7829, -73.9654])],
  },
  {
    id: 103,
    name: "Hyde Park Easy",
    city: "London",
    country: "UK",
    start: "2026-07-29T08:05:00Z",
    distance: 8420,
    movingTime: 2700,
    elevation: 42,
    center: [51.5073, -0.1657],
    radiusKm: 1.2,
  },
  {
    id: 104,
    name: "Seine Night Miles",
    city: "Paris",
    country: "France",
    start: "2026-07-28T19:40:00Z",
    distance: 11210,
    movingTime: 3360,
    elevation: 58,
    center: [48.8584, 2.2945],
    radiusKm: 1.6,
    photos: [photo("p4", "photo-1502602898657-3e91760cbb34", [48.8584, 2.2945])],
  },
  {
    id: 105,
    name: "Yoyogi Park Shakeout",
    city: "Tokyo",
    country: "Japan",
    start: "2026-02-11T23:20:00Z",
    distance: 9650,
    movingTime: 2940,
    elevation: 91,
    center: [35.6717, 139.695],
    radiusKm: 1.3,
  },
  {
    id: 106,
    name: "Bondi Coastal Push",
    city: "Sydney",
    country: "Australia",
    start: "2026-01-28T05:55:00Z",
    distance: 14120,
    movingTime: 3900,
    elevation: 212,
    center: [-33.8915, 151.2767],
    radiusKm: 1.7,
    photos: [
      photo("p5", "photo-1506973035872-a4ec16b8e8d4", [-33.8915, 151.2767]),
      photo("p6", "photo-1526481280695-3c4694936278", [-33.8891, 151.2742]),
    ],
  },
  {
    id: 107,
    name: "Ibirapuera Long Run",
    city: "São Paulo",
    country: "Brazil",
    start: "2025-12-14T09:30:00Z",
    distance: 18340,
    movingTime: 5220,
    elevation: 168,
    center: [-23.5874, -46.6576],
    radiusKm: 2.1,
  },
  {
    id: 108,
    name: "Table Mountain Trails",
    city: "Cape Town",
    country: "South Africa",
    start: "2025-11-02T06:15:00Z",
    distance: 15660,
    movingTime: 6180,
    elevation: 640,
    center: [-33.9628, 18.4092],
    radiusKm: 1.9,
    photos: [photo("p7", "photo-1580060839134-75a5edca2e99", [-33.9628, 18.4092])],
  },
  {
    id: 109,
    name: "Stanley Park Seawall",
    city: "Vancouver",
    country: "Canada",
    start: "2025-10-09T15:00:00Z",
    distance: 12100,
    movingTime: 3600,
    elevation: 96,
    center: [49.3043, -123.1443],
    radiusKm: 1.5,
  },
  {
    id: 110,
    name: "Corniche Golden Hour",
    city: "Dubai",
    country: "UAE",
    start: "2025-09-21T15:45:00Z",
    distance: 10040,
    movingTime: 3060,
    elevation: 28,
    center: [25.2285, 55.2867],
    radiusKm: 1.4,
    photos: [photo("p8", "photo-1512453979798-5ea7193d9d18", [25.2285, 55.2867])],
  },
  {
    id: 111,
    name: "Prater Alleys",
    city: "Vienna",
    country: "Austria",
    start: "2025-08-17T07:20:00Z",
    distance: 8740,
    movingTime: 2820,
    elevation: 35,
    center: [48.2167, 16.3981],
    radiusKm: 1.1,
  },
  {
    id: 112,
    name: "Chapultepec Hills",
    city: "Mexico City",
    country: "Mexico",
    start: "2025-07-05T13:05:00Z",
    distance: 13320,
    movingTime: 4200,
    elevation: 248,
    center: [19.4205, -99.191],
    radiusKm: 1.6,
    photos: [photo("p9", "photo-1518659526054-1943ca5fbf62", [19.4205, -99.191])],
  },
];

export function getDemoAthlete() {
  return demoAthlete;
}

export function getDemoActivities(): RunActivity[] {
  return seeds.map((seed) => {
    const { polyline: summaryPolyline, stream } = path(
      ring(seed.center, seed.radiusKm),
    );
    const photos = seed.photos || [];

    return {
      id: seed.id,
      name: seed.name,
      type: "Run",
      sportType: "Run",
      distance: seed.distance,
      movingTime: seed.movingTime,
      elapsedTime: seed.movingTime + 120,
      totalElevationGain: seed.elevation,
      startDate: seed.start,
      startLatlng: seed.center,
      endLatlng: seed.center,
      summaryPolyline,
      averageSpeed: seed.distance / seed.movingTime,
      maxSpeed: (seed.distance / seed.movingTime) * 1.25,
      calories: Math.round(seed.distance * 0.07),
      locationCity: seed.city,
      locationCountry: seed.country,
      totalPhotoCount: photos.length,
      hasHeartrate: true,
      averageHeartrate: 148 + (seed.id % 17),
      photos,
      latlngStream: stream,
    };
  });
}

export function getDemoActivity(id: number) {
  return getDemoActivities().find((activity) => activity.id === id) || null;
}
