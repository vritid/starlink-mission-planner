// lib/passes.ts
import type { TleSat } from "./orbit";
import { propagateLatLonAlt } from "./orbit";
import { approxElevationDeg, type Observer } from "./geo";

export type Pass = {
  start: string; // ISO
  peak: string;  // ISO
  end: string;   // ISO
  maxElevationDeg: number;
};

export function computePasses(
  tle: TleSat,
  observer: Observer,
  start: Date,
  end: Date,
  stepSeconds = 10,
  minElevationDeg = 20
): Pass[] {
  const passes: Pass[] = [];
  const stepMs = stepSeconds * 1000;

  let inPass = false;
  let passStart: Date | null = null;
  let peakTime: Date | null = null;
  let maxEl = -999;

  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    const dt = new Date(t);
    const llh = propagateLatLonAlt(tle, dt);
    if (!llh) continue;

    const el = approxElevationDeg(observer, llh.lat, llh.lon, llh.altKm);

    if (el >= minElevationDeg) {
      if (!inPass) {
        inPass = true;
        passStart = dt;
        peakTime = dt;
        maxEl = el;
      } else {
        if (el > maxEl) {
          maxEl = el;
          peakTime = dt;
        }
      }
    } else {
      if (inPass && passStart && peakTime) {
        // end pass
        const passEnd = dt;
        passes.push({
          start: passStart.toISOString(),
          peak: peakTime.toISOString(),
          end: passEnd.toISOString(),
          maxElevationDeg: Math.round(maxEl * 10) / 10,
        });
      }
      inPass = false;
      passStart = null;
      peakTime = null;
      maxEl = -999;
    }
  }

  return passes;
}
