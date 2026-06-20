import { LIGHT_YEAR_KM } from './constants';

export function formatDistanceKm(distanceKm: number) {
  if (distanceKm >= LIGHT_YEAR_KM * 0.01) {
    return `${(distanceKm / LIGHT_YEAR_KM).toFixed(3)} ly`;
  }

  if (distanceKm >= 1_000_000_000) {
    return `${(distanceKm / 1_000_000_000).toFixed(2)}B km`;
  }

  if (distanceKm >= 1_000_000) {
    return `${(distanceKm / 1_000_000).toFixed(2)}M km`;
  }

  return `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
}
