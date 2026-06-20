import * as THREE from 'three';

import { ROLL_SPEED } from './constants';

export type KeyState = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  q: boolean;
  e: boolean;
};

export type Controls = {
  keys: KeyState;
  updateCameraRotation: (camera: THREE.Camera, dt: number) => void;
};

export function createControls(
  canvas: HTMLCanvasElement,
  controlsHelp: HTMLDivElement,
  camera: THREE.Camera
): Controls {
  const keys: KeyState = { w: false, a: false, s: false, d: false, q: false, e: false };

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    controlsHelp.classList.toggle('locked', document.pointerLockElement === canvas);
  });

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement !== canvas) return;

    const sensitivity = 0.002;

    camera.rotateY(-event.movementX * sensitivity);
    camera.rotateX(-event.movementY * sensitivity);
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (key in keys) {
      keys[key as keyof KeyState] = true;
    }
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();

    if (key in keys) {
      keys[key as keyof KeyState] = false;
    }
  });

  return {
    keys,
    updateCameraRotation(camera: THREE.Camera, dt: number) {
      if (keys.q) camera.rotateZ(ROLL_SPEED * dt);
      if (keys.e) camera.rotateZ(-ROLL_SPEED * dt);
    }
  };
}
