import * as THREE from 'three';

import { ROLL_SPEED } from './constants';
import type { FlightState } from './flight';
import { trimSpeed } from './flight';

type KeyState = {
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
  moveCamera: (camera: THREE.Camera, currentSpeed: number, dt: number) => void;
};

export function createControls(
  canvas: HTMLCanvasElement,
  controlsHelp: HTMLDivElement,
  flightState: FlightState,
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

  window.addEventListener('wheel', (event) => {
    trimSpeed(flightState, event.deltaY);
  });

  return {
    keys,
    updateCameraRotation(camera: THREE.Camera, dt: number) {
      if (keys.q) camera.rotateZ(ROLL_SPEED * dt);
      if (keys.e) camera.rotateZ(-ROLL_SPEED * dt);
    },
    moveCamera(camera: THREE.Camera, currentSpeed: number, dt: number) {
      let moveX = 0;
      let moveZ = 0;

      if (keys.w) moveZ -= 1;
      if (keys.s) moveZ += 1;
      if (keys.a) moveX -= 1;
      if (keys.d) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= length;
        moveZ /= length;
      }

      camera.translateX(moveX * currentSpeed * dt);
      camera.translateZ(moveZ * currentSpeed * dt);
    }
  };
}
