# wthr

Mobile-optimized page showing current conditions from a WeatherLink v2 station:
temperature, heat index, wind, and most recent wind gust.

## Architecture

- **`src/`** — Vite + React page. Fetches `GET /api/current`, refreshes every
  60s, and falls back to bundled sample data if the API is unavailable.
- **`server/index.js`** — zero-dependency Node signing proxy. Holds the API
  secret server-side, builds the WeatherLink HMAC-SHA256 signature, and exposes
  `GET /api/current` to the browser. The secret never reaches the client.

## Run locally

```bash
cp .env.example .env   # fill in API_KEY / API_SECRET / STATION_ID

# terminal 1 — signing proxy (loads .env automatically with Node 20.6+)
node --env-file=.env server/index.js

# terminal 2 — frontend (Vite proxies /api -> localhost:8787)
npm install
npm run dev
```

Open the printed Vite URL on your phone (same network) or in a mobile viewport.
