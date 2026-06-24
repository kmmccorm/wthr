import { useMemo } from 'react'
import { SAMPLE_RESPONSE } from './sampleResponse.js'
import { extractMetrics, DEGREE } from './weather.js'
import './App.css'

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
  // Swap SAMPLE_RESPONSE for a fetch to your signed backend in production.
  const metrics = useMemo(() => extractMetrics(SAMPLE_RESPONSE), [])

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
        {observed && <p className="observed">as of {observed}</p>}
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
          icon="🥵"
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
      </div>
    </main>
  )
}
