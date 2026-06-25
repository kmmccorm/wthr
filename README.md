# wthr

WeatherLink connectivity — a small TypeScript client and CLI for the Davis
[WeatherLink v2 API](https://weatherlink.github.io/v2-api/).

## Install

```sh
npm install
npm run build
```

## Configure

Create API credentials in your WeatherLink account (Account → API) and set them
in the environment (see [`.env.example`](./.env.example)):

```sh
export WEATHERLINK_API_KEY=your-api-key
export WEATHERLINK_API_SECRET=your-api-secret
# optional, used as the default station for `current`
export WEATHERLINK_STATION_ID=12345
```

## CLI

```sh
# list the stations your account can see
npm run dev -- stations

# current conditions for a station (or the default WEATHERLINK_STATION_ID)
npm run dev -- current 12345
```

After `npm run build` the binary is available as `wthr` (`dist/cli.js`):

```sh
wthr stations
wthr current 12345
```

## Library

```ts
import { WeatherLinkClient } from "wthr";

const client = new WeatherLinkClient({
  apiKey: process.env.WEATHERLINK_API_KEY!,
  apiSecret: process.env.WEATHERLINK_API_SECRET!,
});

const stations = await client.getStations();
const current = await client.getCurrent(stations[0].station_id);
console.log(current.sensors);
```

The client uses the WeatherLink v2 "simplified" auth scheme: the API key is sent
as the `api-key` query parameter and the API secret as the `X-Api-Secret` header.
Non-2xx responses throw a `WeatherLinkError` carrying the `status` and `body`.

## Develop

```sh
npm test         # runs the unit tests (Node's built-in test runner)
npm run typecheck
npm run build
```

The tests run against a fake `fetch`, so no network or credentials are required.
