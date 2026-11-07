import * as THREE from 'three';
import { seededRandom } from './random';

export function planetTexture(name: string, radiusKm: number) {
  const random = seededRandom(`surface:${name}`);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create planet texture');
  const giant = radiusKm > 4 * 6371;
  const hue = random() * 360;
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 256; x += 2) {
      const bands = giant ? Math.sin(y * 0.35 + Math.sin(x * Math.PI / 128) * 0.4) * 12 : 0;
      const variation = (random() - 0.5) * (giant ? 5 : 22);
      context.fillStyle = `hsl(${hue + bands} 30% ${42 + bands + variation}%)`;
      context.fillRect(x, y, 2, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

