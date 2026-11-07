import type * as THREE from 'three';

import type { DomElements } from './dom';
import { getNearestSurfaceTarget, getSpeedRatio, getTravelMode, type ProximityTarget } from './flight';
import { formatDistanceKm } from './format';
import type { SystemEntry } from './systems';
import { MAX_STAR_LABELS } from './labels';

function setText(element: HTMLElement, value: string) {
  if (element.textContent !== value) element.textContent = value;
}

export function updateHud(
  dom: DomElements,
  currentSpeed: number,
  cameraPosition: THREE.Vector3,
  navigationTargets: ProximityTarget[],
  currentSystem?: SystemEntry
) {
  const speedRatio = getSpeedRatio(currentSpeed);

  setText(dom.speedDisplay, currentSpeed.toLocaleString(undefined, { maximumFractionDigits: 0 }));
  setText(dom.speedCDisplay, speedRatio.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  setText(dom.travelModeDisplay, getTravelMode(speedRatio));

  const source = currentSystem?.definition.source;
  const sourceLabel = source === 'catalog' ? 'NASA catalog' : source === 'generated' ? 'Generated system' : 'Solar system';
  setText(dom.systemStatus, currentSystem
    ? `${currentSystem.definition.name} · ${sourceLabel} · ${currentSystem.planetCount} planets`
    : `Interstellar · stars only · up to ${MAX_STAR_LABELS} star labels`);

  const nearestTarget = getNearestSurfaceTarget(cameraPosition, navigationTargets);
  if (nearestTarget) {
    setText(dom.altitudeDisplay, formatDistanceKm(nearestTarget.distanceKm));
    setText(dom.altitudeTargetDisplay, nearestTarget.target.name);
  }
}
