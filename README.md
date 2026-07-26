# Strava World

A soft, neumorphic atlas of your running life.

Connect Strava (or explore the demo) and see where you’ve run on a world map — **heatmap**, **routes**, and **photo memories**, with gentle dashed markers when a run has no photos.

<p align="center">
  <img alt="Strava World" src="public/og-preview.svg" width="720" />
</p>

## Features

- **Strava OAuth** with secure encrypted sessions (`iron-session`)
- **Global MapLibre map** (OpenFreeMap tiles — no Mapbox token required)
- **Heatmap / Routes / Photos** viewing modes
- **Run photos** pulled from Strava, pinned on the map
- **No-photo indicators** so every run still has a place in the atlas
- **Demo mode** with worldwide sample runs so you can try it instantly
- **Away-inspired neumorphic UI** — soft clay surfaces, warm paper tones, quiet motion

## Quick start

```bash
git clone https://github.com/filippo-fonseca/strava-world.git
cd strava-world
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Explore demo world**.

## Strava API setup

1. Create an app at [Strava API settings](https://www.strava.com/settings/api)
2. Set **Authorization Callback Domain** to the host only (no `https://`, no path):
   - Local: `localhost`
   - Production: `strava-world-six.vercel.app`
3. Copy values into `.env.local` (or Vercel Project → Settings → Environment Variables):

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
SESSION_SECRET=paste-a-long-random-string-here
```

Optional (auto-detected from the request on Vercel, but recommended in prod):

```env
NEXT_PUBLIC_APP_URL=https://strava-world-six.vercel.app
STRAVA_REDIRECT_URI=https://strava-world-six.vercel.app/api/auth/callback
```

Generate a session secret:

```bash
openssl rand -base64 48
```

Requested scopes: `read`, `activity:read_all`, `profile:read_all`.

### Vercel checklist

In Vercel env vars, set at least the 3 required keys above for **Production**.  
If you previously set `STRAVA_REDIRECT_URI` / `NEXT_PUBLIC_APP_URL` to `localhost`, change them to:

`https://strava-world-six.vercel.app` (and the `/api/auth/callback` path for the redirect URI), then **redeploy**.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start local dev server   |
| `npm run build`| Production build         |
| `npm run start`| Serve production build   |
| `npm run lint` | Run ESLint               |

## Project structure

```
src/
  app/                 # Next.js App Router pages + API routes
  components/
    landing/           # Brand home
    map/               # Atlas explorer + MapLibre layers
    ui/                # Neumorphic primitives
  lib/
    strava/            # OAuth + API client
    demo-data.ts       # Offline worldwide demo runs
```

## Deploy

Works on Vercel / any Node host:

1. Set the env vars above
2. Point Strava callback to `https://your-domain/api/auth/callback`
3. Set `NEXT_PUBLIC_APP_URL` and `STRAVA_REDIRECT_URI` to that domain

## Contributing

Issues and PRs welcome. Keep changes focused, and prefer small atomic commits.

## License

MIT © Filippo Fonseca

---

Built as an open-source love letter to long runs and soft interfaces.
Not affiliated with Strava.
