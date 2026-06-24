// Netlify Function (v2): signing proxy for the WeatherLink v2 API.
// Mirrors server/index.js but runs on Netlify's serverless Node runtime so the
// hosted site can fetch live data while keeping the API secret server-side.
//
// Set API_KEY, API_SECRET, STATION_ID in the Netlify site's environment.
import { createHmac } from 'node:crypto'

const API_BASE = 'https://api.weatherlink.com/v2'

export default async () => {
  const API_KEY = process.env.API_KEY
  const API_SECRET = process.env.API_SECRET
  const STATION_ID = process.env.STATION_ID

  if (!API_KEY || !API_SECRET || !STATION_ID) {
    return Response.json(
      { error: 'Missing API_KEY, API_SECRET, or STATION_ID env vars' },
      { status: 500 },
    )
  }

  // WeatherLink v2 HMAC: concatenate every parameter (sorted by key) as
  // key+value with no separators, then HMAC-SHA256 with the API secret.
  const all = {
    'station-id': STATION_ID,
    'api-key': API_KEY,
    t: String(Math.floor(Date.now() / 1000)),
  }
  const message = Object.keys(all)
    .sort()
    .map((k) => k + all[k])
    .join('')
  const signature = createHmac('sha256', API_SECRET).update(message).digest('hex')

  const query = new URLSearchParams({
    'api-key': API_KEY,
    t: all.t,
    'api-signature': signature,
  })
  const url = `${API_BASE}/current/${STATION_ID}?${query}`

  try {
    const res = await fetch(url)
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  } catch (err) {
    return Response.json(
      { error: 'upstream request failed', detail: String(err) },
      { status: 502 },
    )
  }
}

// Serve the function at the same path the browser already calls.
export const config = { path: '/api/current' }
