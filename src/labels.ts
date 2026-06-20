import * as THREE from 'three';

import { formatDistanceKm } from './format';

export type LabelManager = {
  add: (name: string, object: THREE.Object3D, parent?: THREE.Object3D) => void;
  update: () => void;
};

export function createLabelManager(overlay: HTMLDivElement, camera: THREE.Camera): LabelManager {
  const targets: Array<{ distanceElement: HTMLDivElement; element: HTMLDivElement; object: THREE.Object3D }> = [];
  const labelParents = new Map<THREE.Object3D, THREE.Object3D | undefined>();
  const labelPosition = new THREE.Vector3();
  const occupiedLabelPositions: Array<{
    target: (typeof targets)[number];
    x: number;
    y: number;
  }> = [];
  const minimumLabelSeparationPx = 90;

  function isAncestor(ancestor: THREE.Object3D, object: THREE.Object3D) {
    let parent = labelParents.get(object);

    while (parent) {
      if (parent === ancestor) return true;
      parent = labelParents.get(parent);
    }

    return false;
  }

  return {
    add(name: string, object: THREE.Object3D, parent?: THREE.Object3D) {
      const label = document.createElement('div');
      const labelName = document.createElement('div');
      const labelDistance = document.createElement('div');

      label.className = 'spaceLabel';
      labelName.className = 'spaceLabelName';
      labelDistance.className = 'spaceLabelDistance';
      labelName.innerText = name;

      label.append(labelName, labelDistance);
      overlay.appendChild(label);
      labelParents.set(object, parent);
      targets.push({ distanceElement: labelDistance, element: label, object });
    },
    update() {
      occupiedLabelPositions.length = 0;

      const sortedTargets = [...targets].sort(
        (a, b) => camera.position.distanceTo(a.object.position) - camera.position.distanceTo(b.object.position)
      );

      for (const target of sortedTargets) {
        labelPosition.copy(target.object.position).project(camera);

        const isVisible =
          target.object.visible &&
          labelPosition.z < 1 &&
          labelPosition.x >= -1 &&
          labelPosition.x <= 1 &&
          labelPosition.y >= -1 &&
          labelPosition.y <= 1;

        const screenX = (labelPosition.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-labelPosition.y * 0.5 + 0.5) * window.innerHeight;
        const replacedLabels: number[] = [];
        let shouldShow = isVisible;

        for (let index = 0; index < occupiedLabelPositions.length && shouldShow; index += 1) {
          const position = occupiedLabelPositions[index];
          const overlaps =
            Math.abs(position.x - screenX) < minimumLabelSeparationPx &&
            Math.abs(position.y - screenY) < minimumLabelSeparationPx;

          if (!overlaps) continue;

          if (isAncestor(target.object, position.target.object)) {
            replacedLabels.push(index);
          } else {
            shouldShow = false;
          }
        }

        if (shouldShow) {
          for (const index of replacedLabels.reverse()) {
            occupiedLabelPositions[index].target.element.style.display = 'none';
            occupiedLabelPositions.splice(index, 1);
          }
        }

        target.element.style.display = shouldShow ? 'block' : 'none';

        if (shouldShow) {
          const distanceKm = camera.position.distanceTo(target.object.position);

          target.element.style.left = `${screenX}px`;
          target.element.style.top = `${screenY}px`;
          target.distanceElement.innerText = formatDistanceKm(distanceKm);
          occupiedLabelPositions.push({ target, x: screenX, y: screenY });
        }
      }
    }
  };
}
