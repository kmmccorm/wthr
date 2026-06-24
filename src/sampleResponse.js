// Sample payload from the WeatherLink v2 GET /current/{station-id} endpoint.
// Used so the UI renders without exposing the API secret in the browser.
// Replace with a live fetch from your own signed backend in production.
export const SAMPLE_RESPONSE = {
  station_id_uuid: '397be7bd-37e6-4dbc-a03c-30615aba123c',
  sensors: [
    {
      lsid: 831620,
      sensor_type: 37,
      data_structure_type: 23,
      data: [
        {
          temp: 63.7,
          heat_index: 62.5,
          wind_speed_last: 1.44,
          wind_dir_last: 337,
          wind_speed_hi_last_2_min: 2.06,
          wind_dir_at_hi_speed_last_2_min: 337,
          ts: 1782275700,
        },
      ],
    },
  ],
  generated_at: 1782275993,
  station_id: 209154,
}
