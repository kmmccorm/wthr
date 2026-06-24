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
# or
npm run server

# Build for production
npm run build
```

No test runner is configured. There are no lint scripts in package.json.

## Environment setup

Copy `.env.example` to `.env` and fill in `API_KEY`, `API_SECRET`, and `STATION_ID` from WeatherLink v2. Both dev processes must be running for live data to work.

## Architecture

This is a Vite + React single-page app that displays weather from a WeatherLink v2 station.

**Data flow:** Browser → `GET /api/current` → signing proxy → WeatherLink v2 API

The API secret never reaches the browser. The signing proxy computes a HMAC-SHA256 signature per the WeatherLink v2 spec (parameters sorted by key, concatenated as `key+value`, signed with `API_SECRET`).

**Two proxy implementations for two deployment targets:**
- `server/index.js` — zero-dependency Node HTTP server for local dev (port 8787)
- `netlify/functions/current.mjs` — Netlify Function (v2 API, same signing logic) served at `/api/current`

**Frontend (`src/`):**
- `weather.js` — pure data extraction from the WeatherLink response. The outdoor ISS sensor is found by `data_structure_type === 23` or `sensor_type === 37`. `extractMetrics()` pulls temperature, heat index, wind speed/direction, and 2-minute peak gust.
- `App.jsx` — polls `/api/current` every 60 seconds. On failure, silently keeps showing the last good data (or the bundled `sampleResponse.js` on first load). The `source` state tracks `'live'` vs `'sample'` and shows a label when showing sample data.

**Deployment targets:**
- **GitHub Pages** — static build only (no live data; falls back to sample). The workflow sets `VITE_BASE=/wthr/` for the asset base path.
- **Netlify** — full stack: static build + Netlify Function for live data. `netlify.toml` wires this up.
