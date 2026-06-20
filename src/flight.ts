import type * as THREE from 'three';

import {
  MIN_PROXIMITY_SPEED_KM_PER_SECOND,
  PROXIMITY_SPEED_RATIO,
  SPEED_OF_LIGHT_KM_PER_SECOND
} from './constants';

export type ProximityTarget = {
  name: string;
  object: THREE.Object3D;
  radiusKm: number;
};

export function getProximitySpeed(position: THREE.Vector3, targets: ProximityTarget[]) {
  const nearestTarget = getNearestSurfaceTarget(position, targets);
  if (!nearestTarget) return MIN_PROXIMITY_SPEED_KM_PER_SECOND;

  return Math.max(
    MIN_PROXIMITY_SPEED_KM_PER_SECOND,
    nearestTarget.distanceKm * PROXIMITY_SPEED_RATIO
  );
}

export function getNearestSurfaceTarget(position: THREE.Vector3, targets: ProximityTarget[]) {
  if (targets.length === 0) return null;

  return targets.reduce<{ target: ProximityTarget; distanceKm: number } | null>((nearest, target) => {
    const distanceKm = Math.max(0, position.distanceTo(target.object.position) - target.radiusKm);

    if (!nearest || distanceKm < nearest.distanceKm) {
      return { target, distanceKm };
    }

    return nearest;
  }, null);
}

export function getSpeedRatio(speedKmPerSecond: number) {
  return speedKmPerSecond / SPEED_OF_LIGHT_KM_PER_SECOND;
}

export function getTravelMode(speedRatio: number) {
  if (speedRatio < 0.01) return 'Sublight';
  if (speedRatio < 1) return 'Relativistic';
  if (speedRatio < 100) return 'FTL';
  if (speedRatio < 10000) return 'Interstellar';
  return 'Deep FTL';
}
