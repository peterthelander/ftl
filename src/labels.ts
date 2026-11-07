import * as THREE from 'three';
import { formatDistanceKm } from './format';

export const MAX_STAR_LABELS = 12;
export const MAX_PLANET_LABELS = 10;
export type LabelManager = {
  add: (name: string, object: THREE.Object3D, parent?: THREE.Object3D, detail?: string) => void;
  remove: (object: THREE.Object3D) => void;
  update: () => void;
};

export function createLabelManager(overlay: HTMLDivElement, camera: THREE.PerspectiveCamera, obstacles: HTMLElement[] = []): LabelManager {
  const targets: Array<{ distanceElement: HTMLDivElement; element: HTMLDivElement; object: THREE.Object3D; position: THREE.Vector3; distance: number; width: number; height: number }> = [];
  const labelParents = new Map<THREE.Object3D, THREE.Object3D | undefined>();
  const labelPosition = new THREE.Vector3();
  const minimumLabelSeparationPx = 90;

  function isAncestor(ancestor: THREE.Object3D, object: THREE.Object3D) {
    let parent = labelParents.get(object);
    while (parent) {
      if (parent === ancestor) return true;
      parent = labelParents.get(parent);
    }
    return false;
  }
  function visibleInHierarchy(object: THREE.Object3D) {
    for (let current: THREE.Object3D | null = object; current; current = current.parent) {
      if (!current.visible) return false;
    }
    return true;
  }

  return {
    add(name, object, parent, detail) {
      const label = document.createElement('div');
      const labelName = document.createElement('div');
      const labelDistance = document.createElement('div');
      label.className = 'spaceLabel';
      label.dataset.source = object.userData.source ?? '';
      labelName.className = 'spaceLabelName';
      labelDistance.className = 'spaceLabelDistance';
      labelName.textContent = name;
      label.append(labelName, labelDistance);
      if (detail) {
        const description = document.createElement('div');
        description.className = 'spaceLabelDetail';
        description.textContent = detail;
        label.append(description);
      }
      overlay.appendChild(label);
      labelParents.set(object, parent);
      targets.push({ distanceElement: labelDistance, element: label, object, position: new THREE.Vector3(), distance: 0,
        width: Math.max(name.length * 8, (detail?.length ?? 0) * 5.5) + 14, height: detail ? 48 : 35 });
    },
    remove(object) {
      const index = targets.findIndex(target => target.object === object);
      if (index >= 0) targets.splice(index, 1)[0].element.remove();
      labelParents.delete(object);
    },
    update() {
      camera.updateMatrixWorld();
      const occupied: Array<{ target: typeof targets[number]; x: number; y: number }> = [];
      const exclusionZones = obstacles.map(element => element.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0);
      let starLabels = 0;
      let planetLabels = 0;
      // Resolve nested system transforms before sorting; local planet offsets
      // cannot be compared directly with the camera's world coordinates.
      for (const target of targets) {
        target.element.style.display = 'none';
        target.object.getWorldPosition(target.position);
        target.distance = camera.position.distanceTo(target.position);
      }
      const sorted = [...targets].sort((a, b) => a.distance - b.distance);

      for (const target of sorted) {
        const { position, distance } = target;
        const isStar = target.object.userData.kind === 'star';
        if (isStar ? starLabels >= MAX_STAR_LABELS : planetLabels >= MAX_PLANET_LABELS) continue;
        if (!visibleInHierarchy(target.object)) continue;
        labelPosition.copy(position).applyMatrix4(camera.matrixWorldInverse);
        const viewDepth = -labelPosition.z;
        labelPosition.copy(position).project(camera);
        if (viewDepth <= camera.near || viewDepth >= camera.far || Math.abs(labelPosition.x) > 1 || Math.abs(labelPosition.y) > 1) continue;
        const x = (labelPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-labelPosition.y * 0.5 + 0.5) * window.innerHeight;
        // Conservative monospace bounds avoid measuring every label on every
        // frame. Skip clipped labels and keep instrument/control areas clear.
        const left = x - target.width / 2;
        const top = y - target.height * 1.4;
        const right = left + target.width;
        const bottom = top + target.height;
        if (left < 6 || right > window.innerWidth - 6 || top < 6 || bottom > window.innerHeight - 6) continue;
        if (exclusionZones.some(zone => left < zone.right + 6 && right > zone.left - 6
          && top < zone.bottom + 6 && bottom > zone.top - 6)) continue;
        const replaced: number[] = [];
        let show = true;
        for (let index = 0; index < occupied.length && show; index++) {
          const previous = occupied[index];
          const separationX = Math.max(minimumLabelSeparationPx, (target.width + previous.target.width) / 2 + 8);
          if (Math.abs(previous.x - x) >= separationX || Math.abs(previous.y - y) >= minimumLabelSeparationPx) continue;
          if (isAncestor(target.object, previous.target.object)) replaced.push(index);
          else show = false;
        }
        if (!show) continue;
        for (const index of replaced.reverse()) {
          const previous = occupied.splice(index, 1)[0].target;
          previous.element.style.display = 'none';
          if (previous.object.userData.kind === 'star') starLabels--;
          else planetLabels--;
        }
        target.element.style.display = 'block';
        target.element.style.left = `${x}px`;
        target.element.style.top = `${y}px`;
        target.distanceElement.textContent = formatDistanceKm(distance);
        occupied.push({ target, x, y });
        if (isStar) starLabels++;
        else planetLabels++;
      }
    }
  };
}
