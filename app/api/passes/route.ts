import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { TleSat } from "../../../lib/orbit";
import { computePasses } from "../../../lib/passes";

type ApiTleResponse = {
  data: { stations: TleSat[]; starlink: TleSat[] };
};

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  const satName = req.nextUrl.searchParams.get("sat") ?? "ISS";
  const lat = Number(req.nextUrl.searchParams.get("lat") ?? "43.6532");
  const lon = Number(req.nextUrl.searchParams.get("lon") ?? "-79.3832");
  const hours = Number(req.nextUrl.searchParams.get("hours") ?? "24");
  const minEl = Number(req.nextUrl.searchParams.get("minEl") ?? "20");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
  }

  const start = new Date();
  const end = new Date(Date.now() + hours * 60 * 60 * 1000);

  const res = await fetch(`${origin}/api/tle`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Failed to load TLEs" }, { status: 500 });

  const json = (await res.json()) as ApiTleResponse;
  const all = [...json.data.stations, ...json.data.starlink];

  const target =
    all.find((s) => s.name === satName) ??
    all.find((s) => s.name.toUpperCase().includes(satName.toUpperCase()));

  if (!target) {
    return NextResponse.json({ error: `Satellite not found: ${satName}` }, { status: 404 });
  }

  const passes = computePasses(target, { lat, lon }, start, end, 10, minEl);

  return NextResponse.json({
    observer: { lat, lon },
    window: { start: start.toISOString(), end: end.toISOString() },
    satellite: { name: target.name },
    params: { hours, minEl },
    passes,
  });
}
