import * as THREE from 'three';

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

export type FlightInput = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
};

export type FlightState = {
  velocityKmPerSecond: THREE.Vector3;
};

const accelerationToSpeedLimitRatio = 1.5;
const automaticDampingPerSecond = 1.4;
const movementDirection = new THREE.Vector3();

export function createFlightState(): FlightState {
  return { velocityKmPerSecond: new THREE.Vector3() };
}

export function updateFlight(
  state: FlightState,
  camera: THREE.Camera,
  input: FlightInput,
  speedLimitKmPerSecond: number,
  dt: number
) {
  movementDirection.set(Number(input.d) - Number(input.a), 0, Number(input.s) - Number(input.w));

  if (movementDirection.lengthSq() > 0) {
    movementDirection.normalize().applyQuaternion(camera.quaternion);
    state.velocityKmPerSecond.addScaledVector(
      movementDirection,
      speedLimitKmPerSecond * accelerationToSpeedLimitRatio * dt
    );
  } else {
    state.velocityKmPerSecond.multiplyScalar(Math.exp(-automaticDampingPerSecond * dt));
  }

  if (state.velocityKmPerSecond.length() > speedLimitKmPerSecond) {
    state.velocityKmPerSecond.setLength(speedLimitKmPerSecond);
  }

  camera.position.addScaledVector(state.velocityKmPerSecond, dt);
}

export function getFlightSpeed(state: FlightState) {
  return state.velocityKmPerSecond.length();
}

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
