// Extracts the four displayed data points from a WeatherLink v2 /current response.
// The outdoor readings live on the ISS sensor (sensor_type 37 / data_structure_type 23).

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

export function extractMetrics(response) {
  const r = findIssRecord(response)
  if (!r) return null

  return {
    temperature: r.temp,
    heatIndex: r.heat_index,
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
    observedAt: r.ts ? new Date(r.ts * 1000) : null,
  }
}

export { DEGREE }
