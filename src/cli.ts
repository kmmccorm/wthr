#!/usr/bin/env node
import { WeatherLinkClient, WeatherLinkError } from "./client.js";

const USAGE = `wthr — WeatherLink v2 CLI

Usage:
  wthr stations              List stations available to your account
  wthr current [stationId]   Show current conditions for a station
                             (falls back to WEATHERLINK_STATION_ID)

Environment:
  WEATHERLINK_API_KEY        API key   (required)
  WEATHERLINK_API_SECRET     API secret (required)
  WEATHERLINK_STATION_ID     Default station id for \`current\`
`;

function makeClient(): WeatherLinkClient {
  const apiKey = process.env.WEATHERLINK_API_KEY;
  const apiSecret = process.env.WEATHERLINK_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      "WEATHERLINK_API_KEY and WEATHERLINK_API_SECRET must be set. " +
        "See .env.example.",
    );
  }
  return new WeatherLinkClient({ apiKey, apiSecret });
}

async function cmdStations(): Promise<void> {
  const stations = await makeClient().getStations();
  if (stations.length === 0) {
    console.log("No stations found for these credentials.");
    return;
  }
  for (const s of stations) {
    console.log(`${s.station_id}\t${s.station_name}`);
  }
}

async function cmdCurrent(stationArg: string | undefined): Promise<void> {
  const stationId = stationArg ?? process.env.WEATHERLINK_STATION_ID;
  if (!stationId) {
    throw new Error(
      "No station id given. Pass one as an argument or set " +
        "WEATHERLINK_STATION_ID.",
    );
  }
  const current = await makeClient().getCurrent(stationId);
  console.log(JSON.stringify(current, null, 2));
}

async function main(argv: string[]): Promise<number> {
  const [command, arg] = argv;

  switch (command) {
    case "stations":
      await cmdStations();
      return 0;
    case "current":
      await cmdCurrent(arg);
      return 0;
    case undefined:
    case "-h":
    case "--help":
    case "help":
      console.log(USAGE);
      return command === undefined ? 1 : 0;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.error(USAGE);
      return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    if (err instanceof WeatherLinkError) {
      console.error(`API error (${err.status}): ${err.body || err.message}`);
    } else if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error("Unknown error:", err);
    }
    process.exitCode = 1;
  });
