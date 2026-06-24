// Extracts the displayed data points from a WeatherLink v2 /current response.
// The outdoor readings live on the ISS sensor (sensor_type 37 / data_structure_type 23);
// the barometer reading lives on the barometer sensor (data_structure_type 19).

const DEGREE = '°'

const COMPASS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
]

export function degreesToCompass(deg) {
  if (deg == null || Number.isNaN(deg)) return null
  return COMPASS[Math.round(deg / 22.5) % 16]
}

function findIssRecord(response) {
  const sensors = response?.sensors ?? []
  const iss =
    sensors.find((s) => s.data_structure_type === 23) ??
    sensors.find((s) => s.sensor_type === 37)
  return iss?.data?.[0] ?? null
}

function findBarRecord(response) {
  const sensors = response?.sensors ?? []
  const bar = sensors.find((s) => s.data_structure_type === 19)
  return bar?.data?.[0] ?? null
}

// Describes a 3-hour barometric pressure change (inHg) as a trend label.
export function describeBarTrend(trend) {
  if (trend == null || Number.isNaN(trend)) return null
  if (trend >= 0.06) return 'Rising'
  if (trend <= -0.06) return 'Falling'
  return 'Steady'
}

export function extractMetrics(response) {
  const r = findIssRecord(response)
  if (!r) return null

  const bar = findBarRecord(response)
  const barTrend = bar?.bar_trend ?? null

  return {
    temperature: r.temp,
    heatIndex: r.heat_index,
    humidity: r.hum,
    wind: {
      speed: r.wind_speed_last,
      direction: r.wind_dir_last,
      compass: degreesToCompass(r.wind_dir_last),
    },
    gust: {
      speed: r.wind_speed_hi_last_2_min,
      direction: r.wind_dir_at_hi_speed_last_2_min,
      compass: degreesToCompass(r.wind_dir_at_hi_speed_last_2_min),
    },
    barometer: {
      trend: barTrend,
      label: describeBarTrend(barTrend),
    },
    observedAt: r.ts ? new Date(r.ts * 1000) : null,
  }
}

export { DEGREE }
