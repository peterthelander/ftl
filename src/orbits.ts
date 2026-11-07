import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export function createOrbitLine(radiusKm: number, color = 0x68ffc9) {
  const positions: number[] = [];
  const segments = 512;
  // Repeat the first point to close the wide polyline without a visible gap.
  for (let index = 0; index <= segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    positions.push(Math.cos(angle) * radiusKm, 0, Math.sin(angle) * radiusKm);
  }
  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  const orbit = new THREE.Group();
  orbit.name = 'orbit-guide';
  for (const [linewidth, opacity] of [[6, 0.12], [2, 0.85]]) {
    const material = new LineMaterial({
      color, linewidth, opacity,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false
    });
    orbit.add(new Line2(geometry, material));
  }
  return orbit;
}
