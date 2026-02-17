import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { TleSat } from "../../../lib/orbit";
import { computePasses } from "../../../lib/passes";

type ApiTleResponse = {
  data: { stations: TleSat[]; starlink: TleSat[] };
};

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin; // e.g. http://localhost:3000

  // Default observer: Toronto
  const observer = { lat: 43.6532, lon: -79.3832 };

  // Look ahead 24 hours
  const start = new Date();
  const end = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Fetch TLEs from our own endpoint using an absolute URL
  const res = await fetch(`${origin}/api/tle`, { cache: "no-store" });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to load TLEs" }, { status: 500 });
  }

  const json = (await res.json()) as ApiTleResponse;
  const iss = json.data.stations.find((s) => s.name.toUpperCase().includes("ISS"));

  if (!iss) {
    return NextResponse.json({ error: "ISS not found in stations TLE list" }, { status: 404 });
  }

  const passes = computePasses(iss, observer, start, end, 10, 20);

  return NextResponse.json({
    observer,
    window: { start: start.toISOString(), end: end.toISOString() },
    satellite: { name: iss.name },
    passes,
  });
}
