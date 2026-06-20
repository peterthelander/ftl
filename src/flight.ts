import type * as THREE from 'three';

import {
  BASE_SPEED_KM_PER_SECOND,
  MAX_ACCELERATION_TIMER,
  MIN_PROXIMITY_SPEED_KM_PER_SECOND,
  PROXIMITY_SPEED_RATIO,
  SPEED_OF_LIGHT_KM_PER_SECOND
} from './constants';

export type ProximityTarget = {
  object: THREE.Object3D;
  radiusKm: number;
};

export type FlightState = {
  speedMultiplier: number;
  accelerationTimer: number;
};

export function createFlightState(): FlightState {
  return {
    speedMultiplier: 1.0,
    accelerationTimer: 0
  };
}

export function trimSpeed(state: FlightState, deltaY: number) {
  if (deltaY < 0) {
    state.speedMultiplier *= 1.2;
  } else {
    state.speedMultiplier /= 1.2;
  }

  state.speedMultiplier = Math.max(0.01, Math.min(state.speedMultiplier, 100000));
}

export function updateAcceleration(state: FlightState, isThrusting: boolean, dt: number) {
  if (isThrusting) {
    state.accelerationTimer = Math.min(MAX_ACCELERATION_TIMER, state.accelerationTimer + dt);
    return;
  }

  state.accelerationTimer = Math.max(0, state.accelerationTimer - dt * 5);
}

export function getCurrentSpeed(state: FlightState) {
  const acceleratedScale = Math.pow(2, state.accelerationTimer * 2);
  return BASE_SPEED_KM_PER_SECOND * state.speedMultiplier * acceleratedScale;
}

export function getProximityLimitedSpeed(rawSpeedKmPerSecond: number, position: THREE.Vector3, targets: ProximityTarget[]) {
  if (targets.length === 0) return rawSpeedKmPerSecond;

  const nearestSurfaceDistance = targets.reduce((nearestDistance, target) => {
    const centerDistance = position.distanceTo(target.object.position);
    const surfaceDistance = Math.max(0, centerDistance - target.radiusKm);

    return Math.min(nearestDistance, surfaceDistance);
  }, Number.POSITIVE_INFINITY);

  const proximityLimit = Math.max(
    MIN_PROXIMITY_SPEED_KM_PER_SECOND,
    nearestSurfaceDistance * PROXIMITY_SPEED_RATIO
  );

  return Math.min(rawSpeedKmPerSecond, proximityLimit);
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
