import assert from "node:assert/strict";
import { test } from "node:test";
import { WeatherLinkClient, WeatherLinkError } from "../src/client.ts";

/** Build a fake fetch that records the request and returns a canned response. */
function fakeFetch(
  status: number,
  body: unknown,
): { fetch: typeof fetch; calls: Array<{ url: URL; init?: RequestInit }> } {
  const calls: Array<{ url: URL; init?: RequestInit }> = [];
  const fetchImpl = (async (input: URL | RequestInfo, init?: RequestInit) => {
    calls.push({ url: new URL(String(input)), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { fetch: fetchImpl, calls };
}

test("constructor validates required credentials", () => {
  assert.throws(
    () => new WeatherLinkClient({ apiKey: "", apiSecret: "s" }),
    /apiKey is required/,
  );
  assert.throws(
    () => new WeatherLinkClient({ apiKey: "k", apiSecret: "" }),
    /apiSecret is required/,
  );
});

test("getStations sends auth and parses the response", async () => {
  const { fetch, calls } = fakeFetch(200, {
    stations: [{ station_id: 42, station_name: "Backyard" }],
  });
  const client = new WeatherLinkClient({
    apiKey: "my-key",
    apiSecret: "my-secret",
    fetch,
  });

  const stations = await client.getStations();

  assert.equal(stations.length, 1);
  assert.equal(stations[0]?.station_name, "Backyard");

  const call = calls[0];
  assert.ok(call);
  assert.equal(call.url.pathname, "/v2/stations");
  assert.equal(call.url.searchParams.get("api-key"), "my-key");
  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("X-Api-Secret"), "my-secret");
});

test("getCurrent targets the station path", async () => {
  const { fetch, calls } = fakeFetch(200, {
    station_id: 7,
    generated_at: 1700000000,
    sensors: [],
  });
  const client = new WeatherLinkClient({
    apiKey: "k",
    apiSecret: "s",
    fetch,
  });

  const current = await client.getCurrent(7);

  assert.equal(current.station_id, 7);
  assert.equal(calls[0]?.url.pathname, "/v2/current/7");
});

test("non-2xx responses raise WeatherLinkError", async () => {
  const { fetch } = fakeFetch(401, { message: "unauthorized" });
  const client = new WeatherLinkClient({ apiKey: "k", apiSecret: "s", fetch });

  await assert.rejects(client.getStations(), (err: unknown) => {
    assert.ok(err instanceof WeatherLinkError);
    assert.equal(err.status, 401);
    return true;
  });
});
