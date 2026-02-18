import type { Pass } from "../components/PassTable";

export type PassFeatures = {
  durationSec: number;
  maxElevationDeg: number;
};

export function extractPassFeatures(p: Pass): PassFeatures {
  const start = new Date(p.start).getTime();
  const end = new Date(p.end).getTime();
  const durationSec = Math.max(0, Math.round((end - start) / 1000));

  return {
    durationSec,
    maxElevationDeg: p.maxElevationDeg,
  };
}

/**
  Simple, sane 0–100 score.
  rewards higher max elevation (biggest factor)
  rewards longer duration (diminishing returns)
 */
export function scorePassHeuristic(f: PassFeatures): number {
  // Elevation: 20 -> low, 90 -> high
  const elev = clamp01((f.maxElevationDeg - 10) / 80); // starts helping around 10°
  const elevScore = 75 * Math.pow(elev, 0.8); // smooth nonlinearity

  // Duration: 0..900s typical for good passes; cap at 1200s
  const dur = clamp01(f.durationSec / 1200);
  const durScore = 25 * Math.sqrt(dur);

  return Math.round(clamp01((elevScore + durScore) / 100) * 100);
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
