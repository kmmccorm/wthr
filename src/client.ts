import type {
  CurrentConditions,
  Station,
  StationsResponse,
} from "./types.js";

export interface WeatherLinkClientOptions {
  apiKey: string;
  apiSecret: string;
  /** Override the API base URL (mainly for testing). */
  baseUrl?: string;
  /** Custom fetch implementation (defaults to the global `fetch`). */
  fetch?: typeof fetch;
}

const DEFAULT_BASE_URL = "https://api.weatherlink.com/v2";

/** Raised when the WeatherLink API responds with a non-2xx status. */
export class WeatherLinkError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`WeatherLink API request failed with status ${status}: ${body}`);
    this.name = "WeatherLinkError";
    this.status = status;
    this.body = body;
  }
}

/**
 * A thin client for the Davis WeatherLink v2 cloud API.
 *
 * Authentication follows the v2 "simplified" scheme: the API key is passed as
 * an `api-key` query parameter and the API secret is sent in the
 * `X-Api-Secret` header.
 */
export class WeatherLinkClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: WeatherLinkClientOptions) {
    if (!options.apiKey) throw new Error("apiKey is required");
    if (!options.apiSecret) throw new Error("apiSecret is required");

    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch;

    if (typeof this.fetchImpl !== "function") {
      throw new Error(
        "No fetch implementation available. Use Node >= 18 or pass `fetch`.",
      );
    }
  }

  /** List the stations available to these credentials. */
  async getStations(): Promise<Station[]> {
    const body = await this.request<StationsResponse>("/stations");
    return body.stations ?? [];
  }

  /** Fetch the most recent conditions for a single station. */
  async getCurrent(stationId: number | string): Promise<CurrentConditions> {
    return this.request<CurrentConditions>(`/current/${stationId}`);
  }

  private async request<T>(path: string): Promise<T> {
    const url = new URL(this.baseUrl + path);
    url.searchParams.set("api-key", this.apiKey);

    const response = await this.fetchImpl(url, {
      headers: {
        "X-Api-Secret": this.apiSecret,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new WeatherLinkError(response.status, text);
    }

    return (await response.json()) as T;
  }
}
