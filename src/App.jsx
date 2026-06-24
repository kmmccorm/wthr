import { useEffect, useState } from 'react'
import { SAMPLE_RESPONSE } from './sampleResponse.js'
import { extractMetrics, DEGREE } from './weather.js'
import './App.css'

const REFRESH_MS = 60_000

function MetricCard({ label, value, unit, sub, icon }) {
  return (
    <section className="card" aria-label={label}>
      <div className="card-head">
        <span className="card-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="card-label">{label}</span>
      </div>
      <div className="card-value">
        <span className="value-number">{value}</span>
        {unit && <span className="value-unit">{unit}</span>}
      </div>
      {sub && <div className="card-sub">{sub}</div>}
    </section>
  )
}

function fmt(n, digits = 0) {
  return n == null || Number.isNaN(n) ? '--' : n.toFixed(digits)
}

export default function App() {
  const [metrics, setMetrics] = useState(() => extractMetrics(SAMPLE_RESPONSE))
  const [source, setSource] = useState('sample')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/current')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const next = extractMetrics(data)
        if (next && !cancelled) {
          setMetrics(next)
          setSource('live')
        }
      } catch {
        // Keep showing the last good (or sample) data on failure.
        if (!cancelled) setSource((s) => (s === 'live' ? 'live' : 'sample'))
      }
    }

    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (!metrics) {
    return (
      <main className="app">
        <p className="empty">No station data available.</p>
      </main>
    )
  }

  const observed = metrics.observedAt
    ? metrics.observedAt.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <main className="app">
      <header className="app-header">
        <h1>Current Conditions</h1>
        {observed && (
          <p className="observed">
            as of {observed}
            {source === 'sample' && ' · sample data'}
          </p>
        )}
      </header>

      <div className="grid">
        <MetricCard
          label="Temperature"
          icon="🌡️"
          value={fmt(metrics.temperature, 1)}
          unit={`${DEGREE}F`}
        />
        <MetricCard
          label="Heat Index"
          icon={
            metrics.heatIndex != null && metrics.temperature != null
              ? metrics.heatIndex - metrics.temperature > 5
                ? '🥵'
                : '😎'
              : '🥵'
          }
          value={fmt(metrics.heatIndex, 1)}
          unit={`${DEGREE}F`}
        />
        <MetricCard
          label="Wind"
          icon="💨"
          value={fmt(metrics.wind.speed, 1)}
          unit="mph"
          sub={
            metrics.wind.compass
              ? `from ${metrics.wind.compass} (${fmt(metrics.wind.direction)}${DEGREE})`
              : null
          }
        />
        <MetricCard
          label="Wind Gust"
          icon="🌬️"
          value={fmt(metrics.gust.speed, 1)}
          unit="mph"
          sub={
            metrics.gust.compass
              ? `peak last 2 min · from ${metrics.gust.compass}`
              : 'peak last 2 min'
          }
        />
        <MetricCard
          label="Humidity"
          icon="💧"
          value={fmt(metrics.humidity)}
          unit="%"
        />
        <MetricCard
          label="Barometer Trend"
          icon="📈"
          value={metrics.barometer.label ?? '--'}
          sub={
            metrics.barometer.trend == null
              ? null
              : `${metrics.barometer.trend >= 0 ? '+' : ''}${fmt(
                  metrics.barometer.trend,
                  2
                )} inHg / 3h`
          }
        />
      </div>
    </main>
  )
}
