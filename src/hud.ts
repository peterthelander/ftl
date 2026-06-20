import type * as THREE from 'three';

import type { DomElements } from './dom';
import { getNearestSurfaceTarget, getSpeedRatio, getTravelMode, type ProximityTarget } from './flight';

function formatAltitude(distanceKm: number) {
  if (distanceKm < 1_000_000) {
    return `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
  }

  return `${(distanceKm / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} M km`;
}

export function updateHud(
  dom: DomElements,
  currentSpeed: number,
  cameraPosition: THREE.Vector3,
  navigationTargets: ProximityTarget[]
) {
  const speedRatio = getSpeedRatio(currentSpeed);

  dom.speedDisplay.innerText = currentSpeed.toLocaleString(undefined, { maximumFractionDigits: 0 });
  dom.speedCDisplay.innerText = speedRatio.toLocaleString(undefined, { maximumFractionDigits: 2 });
  dom.travelModeDisplay.innerText = getTravelMode(speedRatio);

  const nearestTarget = getNearestSurfaceTarget(cameraPosition, navigationTargets);
  if (nearestTarget) {
    dom.altitudeDisplay.innerText = formatAltitude(nearestTarget.distanceKm);
    dom.altitudeTargetDisplay.innerText = nearestTarget.target.name;
  }
}
