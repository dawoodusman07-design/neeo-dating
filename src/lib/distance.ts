/**
 * Distance shown to other users is always rounded so exact location can't be
 * triangulated. (The server also rounds; this is defence in depth.)
 */
export function roundDistanceKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) return 0;
  if (km < 2) return 1; // never "0 km"/"0.3 km"
  if (km < 10) return Math.round(km);
  if (km < 50) return Math.round(km / 5) * 5;
  return Math.round(km / 10) * 10;
}
