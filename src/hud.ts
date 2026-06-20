import type * as THREE from 'three';

import type { DomElements } from './dom';
import { getNearestSurfaceTarget, getSpeedRatio, getTravelMode, type ProximityTarget } from './flight';
import { formatDistanceKm } from './format';

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
    dom.altitudeDisplay.innerText = formatDistanceKm(nearestTarget.distanceKm);
    dom.altitudeTargetDisplay.innerText = nearestTarget.target.name;
  }
}
