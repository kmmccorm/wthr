/**
 * Minimal type definitions for the parts of the WeatherLink v2 API this
 * client touches. The API returns many more fields than are modelled here;
 * unmodelled fields are preserved via the index signatures.
 *
 * Reference: https://weatherlink.github.io/v2-api/
 */

export interface Station {
  station_id: number;
  station_name: string;
  /** Gateway/station hardware type. */
  product_number?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  time_zone?: string;
  [key: string]: unknown;
}

export interface StationsResponse {
  stations: Station[];
  generated_at?: number;
}

/** A single sensor's data record within a current-conditions response. */
export interface SensorData {
  lsid: number;
  /** Sensor data structure type — see the WeatherLink sensor catalog. */
  data_structure_type: number;
  sensor_type: number;
  data: Array<Record<string, unknown>>;
}

export interface CurrentConditions {
  station_id: number;
  station_id_uuid?: string;
  generated_at: number;
  sensors: SensorData[];
  [key: string]: unknown;
}
