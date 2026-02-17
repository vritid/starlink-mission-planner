import * as satellite from "satellite.js";

export type TleSat = { name: string; line1: string; line2: string };

export type LatLng = { lat: number; lon: number };
export type LatLonAlt = { lat: number; lon: number; altKm: number };

/**
 * Propagate a satellite at a given time and return lat/lon/altitude (km).
 * Returns null if propagation fails.
 */
export function propagateLatLonAlt(tle: TleSat, date: Date): LatLonAlt | null {
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const pv = satellite.propagate(satrec, date);
  if (!pv.position) return null;

  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(pv.position, gmst);

  const lat = satellite.degreesLat(geo.latitude);
  const lon = satellite.degreesLong(geo.longitude);
  const altKm = geo.height;

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(altKm)) return null;
  return { lat, lon, altKm };
}

/**
 * Convenience: propagate and return only lat/lon.
 */
export function propagateLatLon(tle: TleSat, date: Date): LatLng | null {
  const llh = propagateLatLonAlt(tle, date);
  if (!llh) return null;
  return { lat: llh.lat, lon: llh.lon };
}

/**
 * Sample a ground track between start and end times.
 * stepSeconds default 60.
 */
export function sampleGroundTrack(
  tle: TleSat,
  start: Date,
  end: Date,
  stepSeconds = 60
): LatLng[] {
  const pts: LatLng[] = [];
  const startMs = start.getTime();
  const endMs = end.getTime();
  const stepMs = stepSeconds * 1000;

  for (let t = startMs; t <= endMs; t += stepMs) {
    const ll = propagateLatLon(tle, new Date(t));
    if (ll) pts.push(ll);
  }
  return pts;
}

/**
 * Leaflet expects [lat, lon] tuples.
 */
export function toLeafletLatLngs(points: LatLng[]): [number, number][] {
  return points.map((p) => [p.lat, p.lon]);
}
