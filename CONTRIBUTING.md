# Contributing to Strava World

Thanks for helping make this atlas better.

## Development

1. Fork and clone the repo
2. `npm install`
3. `cp .env.example .env.local`
4. `npm run dev`

Demo mode works without Strava credentials. For live data, add your Strava API keys.

## Guidelines

- Prefer small, atomic commits with clear messages
- Keep the visual language plain and quiet (warm paper, hairline borders, typography-led hierarchy — no neumorphism or decorative chrome)
- Design for mobile widths (~375px) as well as desktop
- Don’t commit secrets — use `.env.local`
- Run `npm run lint` and `npm run build` before opening a PR

## Ideas welcome

- GPX export
- Year filters / animated time scrubbing
- Shareable public atlas links
- Optional dark theme
