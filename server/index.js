// Minimal zero-dependency signing proxy for the WeatherLink v2 API.
// Keeps the API secret server-side and exposes GET /api/current to the browser.
//
// Run: API_KEY=... API_SECRET=... STATION_ID=... node server/index.js
import { createServer } from 'node:http'
import { createHmac } from 'node:crypto'

const PORT = process.env.PORT || 8787
const API_KEY = process.env.API_KEY
const API_SECRET = process.env.API_SECRET
const STATION_ID = process.env.STATION_ID
const API_BASE = 'https://api.weatherlink.com/v2'

function signedUrl(path, params) {
  // WeatherLink v2 HMAC: concatenate every parameter (sorted by key) as
  // key+value with no separators, then HMAC-SHA256 with the API secret.
  const all = { ...params, 'api-key': API_KEY, t: String(Math.floor(Date.now() / 1000)) }
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
  return `${API_BASE}${path}?${query}`
}

async function getCurrent() {
  // station-id is part of the path but must still be signed.
  const url = signedUrl(`/current/${STATION_ID}`, { 'station-id': STATION_ID })
  const res = await fetch(url)
  const body = await res.text()
  return { status: res.status, body }
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' || !req.url.startsWith('/api/current')) {
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
    return
  }

  if (!API_KEY || !API_SECRET || !STATION_ID) {
    res.writeHead(500, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'Missing API_KEY, API_SECRET, or STATION_ID env vars' }))
    return
  }

  try {
    const { status, body } = await getCurrent()
    res.writeHead(status, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    })
    res.end(body)
  } catch (err) {
    res.writeHead(502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'upstream request failed', detail: String(err) }))
  }
})

server.listen(PORT, () => {
  console.log(`wthr signing proxy listening on http://localhost:${PORT}`)
})
