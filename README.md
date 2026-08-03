# strava world

Your Strava journey on one map — heat, routes, photos, pins — with a dark, barebones instrument shell and a dedicated stats page.

Connect Strava (or explore the demo). The landing page centers a **live demo atlas** the way a field instrument frames its map: copy on the left, map in the middle, journey numbers on the right.

<p align="center">
  <img alt="Strava World" src="public/og-preview.svg" width="720" />
</p>

## Features

- **StreetLens-style central map hero** on landing and `/map`
- **Strava OAuth** with official **Connect with Strava** button + **Powered by Strava** attribution
- **Unified MapLibre atlas** (Carto Voyager — no Mapbox token)
- **Zoom-aware layers** — heat, routes, and photos together
- **Journey stats (`/stats`)** — countries, cities, streaks, records, monthly distance, weekday rhythm
- **Smart caching / sync** — IndexedDB + server cache; incremental Sync, full rebuild on demand
- **Demo mode** with worldwide sample runs
- **Mobile-first** — large map hero, snap-scroll stats, bottom activity sheet

## Quick start

```bash
git clone https://github.com/filippo-fonseca/strava-world.git
cd strava-world
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **explore demo**.

## Strava API setup

1. Create an app at [Strava API settings](https://www.strava.com/settings/api)
2. Set **Authorization Callback Domain** to the host only (no `https://`, no path).
   Strava only allows **one** domain — use the exact host users open:
   - Local: `localhost`
   - Custom domain: `stravaworld.hyperpolymath.com` ← **not** `hyperpolymath.com`
   - Or Vercel default: `strava-world-six.vercel.app`
3. Copy values into `.env.local` (or Vercel Project → Settings → Environment Variables):

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
SESSION_SECRET=paste-a-long-random-string-here
NEXT_PUBLIC_APP_URL=https://stravaworld.hyperpolymath.com
```

Generate a session secret:

```bash
openssl rand -base64 48
```

Requested scopes: `read`, `activity:read_all`, `profile:read_all`.

Brand assets under `public/brand/strava/` come from the [Strava API Brand Guidelines](https://developers.strava.com/guidelines/). Do not modify them.

### Vercel + custom domain checklist

1. Domains → add `stravaworld.hyperpolymath.com`
2. Env (Production):
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_APP_URL=https://stravaworld.hyperpolymath.com`
3. Strava → Authorization Callback Domain = `stravaworld.hyperpolymath.com`
4. Redeploy

Do **not** leave `STRAVA_REDIRECT_URI` pointed at `*.vercel.app` if you sign in on the custom domain.

## Scripts

| Command         | Description            |
| --------------- | ---------------------- |
| `npm run dev`   | Start local dev server |
| `npm run build` | Production build       |
| `npm run start` | Serve production build |
| `npm run lint`  | Run ESLint             |

## Project structure

```
src/
  app/
    (app)/map          # authenticated atlas
    (app)/stats        # journey analytics
    page.tsx           # public central-map hero
  components/
    brand/             # official Strava buttons / logos
    landing/           # hero landing
    map/               # MapLibre atlas
    shell/             # AppShell + HeroMapLayout
    stats/             # stats page UI
    ui/                # primitives
  hooks/useRunsAtlas.ts
  lib/
    analytics.ts       # journey metrics
    stats.ts           # core totals
    strava/            # OAuth + API
```

## Deploy

Works on Vercel / any Node host:

1. Set the env vars above
2. Point Strava callback to `https://your-domain/api/auth/callback`
3. Set `NEXT_PUBLIC_APP_URL` (and avoid stale `STRAVA_REDIRECT_URI`)

## Contributing

Issues and PRs welcome. Keep changes focused, and prefer small atomic commits.

## License

MIT © Filippo Fonseca

---

Open source. Not affiliated with Strava.
