# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start the frontend dev server (proxies /api to localhost:8787)
npm run dev

# Start the signing proxy (requires .env with credentials)
node --env-file=.env server/index.js
# or, if the env vars are already exported
npm run server

# Build for production (output: dist/)
npm run build

# Preview the production build locally
npm run preview
```

Both dev processes must be running for live data. With only Vite running, `/api/current` fails and the UI silently falls back to bundled sample data.

There is no test runner and no lint script. `npm test` does not exist — do not add it to a workflow or suggest it as a verification step. Verify changes by building (`npm run build`) and by loading the page.

## Environment setup

Copy `.env.example` to `.env` and fill in `API_KEY`, `API_SECRET`, and `STATION_ID` from WeatherLink v2. `.env` is gitignored; never commit real credentials. For the Netlify deploy, the same three variables are set in the Netlify site's environment instead.

## Architecture

Vite + React 18 single-page app showing current conditions from one WeatherLink v2 weather station. Mobile-first: the layout is capped at 440px wide and designed for a phone viewport.

**Data flow:** browser → `GET /api/current` → signing proxy → WeatherLink v2 `GET /current/{station-id}`

The API secret never reaches the browser. The proxy computes the WeatherLink v2 HMAC: take every request parameter (including `api-key` and the unix timestamp `t`), sort by key, concatenate as `key+value` with no separators, then HMAC-SHA256 with `API_SECRET`. Note that `station-id` is part of the URL path but must still be included in the signed message.

### Signing proxy — two implementations, one behavior

- `server/index.js` — zero-dependency Node HTTP server for local dev, port 8787 (override with `PORT`). Responds only to `GET /api/current`; 500 if env vars are missing, 502 on upstream failure.
- `netlify/functions/current.mjs` — Netlify Function (v2 API) with the same signing logic, routed to `/api/current` via its exported `config.path`.

**Keep these two in sync.** Any change to signing, error shape, or headers must land in both, or dev and production diverge.

### Frontend (`src/`)

- `main.jsx` — entrypoint; mounts `App` in `React.StrictMode`.
- `weather.js` — pure, side-effect-free extraction from the WeatherLink response. Keep it free of React and formatting concerns.
  - Outdoor ISS sensor: `data_structure_type === 23`, falling back to `sensor_type === 37`.
  - Barometer sensor: `data_structure_type === 19`.
  - `extractMetrics()` returns `{ temperature, heatIndex, humidity, wind{speed,direction,compass}, gust{speed,direction,compass}, barometer{trend,value,label}, observedAt }`, or `null` when no ISS record is present. `observedAt` is a `Date` built from the record's unix `ts`.
  - `degreesToCompass()` maps degrees to a 16-point compass string.
  - `describeBarTrend()` labels the 3-hour pressure change (inHg): `Rising` at ≥ 0.06, `Falling` at ≤ -0.06, otherwise `Steady`.
- `sampleResponse.js` — a trimmed real WeatherLink payload used as the first-load and fallback data source. When `weather.js` starts reading a new field, add it here too or the sample render will show `--`.
- `App.jsx` — polling, formatting, and all three theme screens.
- `App.css` — the `.app-shell` centering frame only. Screens carry their own backgrounds.
- `index.css` — global reset, body defaults, and the shared `@keyframes` (`twinkle`, `drift`, `spin`, `float`, `streak`, `sunpulse`, `blink`) that the inline-styled screens reference by name.
- `index.html` — loads Fredoka, Nunito, Oswald, and Playfair Display from Google Fonts. The screens assume these families are available.

### App.jsx structure

1. **Polling** — `App` fetches `/api/current` on mount and every 60s (`REFRESH_MS`). On any failure it keeps the last good metrics rather than showing an error; `source` state tracks `'live'` vs `'sample'` and surfaces as a small label.
2. **`computeValues(metrics, source)`** — the single formatting layer. It turns raw metrics into every display string a screen needs (split temperature whole/fraction, condition word, wind phrasings, greeting, pressure trend text, compass needle angle). Screens receive one `v` prop and render strings only — **no formatting logic belongs inside a screen component**. Adding a new displayed value means adding a field here, not computing it in the JSX.
   - Condition word thresholds (°F): `<33` Freezing, `<50` Chilly, `<66` Mild, `<80` Warm, else Hot. Wind under 3 mph counts as calm.
   - Missing/NaN values render as `--` via the `num()` helper.
3. **Three theme screens** — `Nightfall` (dark, starfield), `Brass` (light, brass-and-glass instrument panel), `Sunny` (playful pastel). All three show the same metrics in different visual languages.
4. **`Switcher`** — fixed bottom pill that switches themes; the list lives in the `THEMES` constant.

**Styling convention:** the screens use inline `style` objects, not CSS classes — this is deliberate, ported from the Parkview Weather design. Follow it when editing a screen. Only genuinely shared things (reset, keyframes, shell) live in the CSS files. A new theme means adding to `THEMES`, adding a label in `Switcher`, writing a component, and rendering it in `App`.

## Deployment

- **Netlify** — the full stack: static build plus the Function for live data. `netlify.toml` sets the build command, `dist` publish dir, and the functions directory.
- **GitHub Pages** — static build only, so it always shows sample data (there is no serverless proxy). `.github/workflows/deploy.yml` builds on push to `main` with `VITE_BASE=/wthr/`, which `vite.config.js` reads for the asset base path.
- `.github/workflows/npm-publish-github-packages.yml` is unused boilerplate. It only triggers on release creation and would fail — it calls `npm test` (no such script) and `npm publish` on a package marked `"private": true`. Ignore it unless asked to fix or remove it.
