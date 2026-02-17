export type Observer = { lat: number; lon: number; heightKm?: number };

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function toRad(d: number) {
  return d * DEG2RAD;
}
function toDeg(r: number) {
  return r * RAD2DEG;
}

/**
 approx elevation angle using spherical earth + satellite subpoint??????
  Inputs (subject to chnage based on data):
 * observer lat/lon (deg)
 * satellite lat/lon (deg)
 * satellite altitude (km)
 *
 * hopefully a solid mvp?
 */
export function approxElevationDeg(
  observer: Observer,
  satLatDeg: number,
  satLonDeg: number,
  satAltKm: number
): number {
  const Re = 6371.0; // km
  const phiO = toRad(observer.lat);
  const lamO = toRad(observer.lon);
  const phiS = toRad(satLatDeg);
  const lamS = toRad(satLonDeg);

  // central angle between observer and sub-satellite point (double check this math idk if this formula is right)
  const cosC =
    Math.sin(phiO) * Math.sin(phiS) +
    Math.cos(phiO) * Math.cos(phiS) * Math.cos(lamS - lamO);
  const c = Math.acos(Math.min(1, Math.max(-1, cosC)));

  // geometry for elevation: tan(e) = (cos(c) - Re/(Re+h)) / sin(c) (referenced from some articles i read)
  const h = satAltKm;
  const k = Re / (Re + h);
  const sinC = Math.sin(c);

  // handle near-zero sinC (satellite almost overhead)
  if (sinC < 1e-9) return 90;

  const tanE = (Math.cos(c) - k) / sinC;
  const e = Math.atan(tanE);
  return toDeg(e);
}
