import * as THREE from 'three';

import { ROLL_SPEED } from './constants';
import type { FlightInput } from './flight';

export type KeyState = FlightInput & {
  q: boolean;
  e: boolean;
};

export type Controls = {
  keys: KeyState;
  braking: boolean;
  updateCameraRotation: (camera: THREE.Camera, dt: number) => void;
};

export function createControls(
  canvas: HTMLCanvasElement,
  controlsHelp: HTMLDivElement,
  camera: THREE.Camera,
  joystick: HTMLDivElement,
  joystickThumb: HTMLDivElement,
  brakeButton: HTMLButtonElement
): Controls {
  const keys: KeyState = {
    w: false, a: false, s: false, d: false, q: false, e: false,
    touchX: 0, touchY: 0
  };
  const controls: Controls = {
    keys,
    braking: false,
    updateCameraRotation(camera, dt) {
      if (keys.q) camera.rotateZ(ROLL_SPEED * dt);
      if (keys.e) camera.rotateZ(-ROLL_SPEED * dt);
    }
  };
  let lookPointer: number | null = null;
  let movePointer: number | null = null;
  let brakePointer: number | null = null;
  let lastLookX = 0;
  let lastLookY = 0;

  function enableTouch() {
    document.body.classList.add('touch-controls');
  }

  function rotateLook(dx: number, dy: number, sensitivity: number) {
    camera.rotateY(-dx * sensitivity);
    camera.rotateX(-dy * sensitivity);
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') {
      if (event.button === 0 && canvas.requestPointerLock) {
        void canvas.requestPointerLock()?.catch(() => {});
      }
      return;
    }
    if (lookPointer !== null) return;
    enableTouch();
    event.preventDefault();
    lookPointer = event.pointerId;
    lastLookX = event.clientX;
    lastLookY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== lookPointer) return;
    // Use CSS pixels so sensitivity is independent of the phone's pixel density.
    rotateLook(event.clientX - lastLookX, event.clientY - lastLookY, 0.005);
    lastLookX = event.clientX;
    lastLookY = event.clientY;
  });

  function endLook(event: PointerEvent) {
    if (event.pointerId === lookPointer) lookPointer = null;
  }
  canvas.addEventListener('pointerup', endLook);
  canvas.addEventListener('pointercancel', endLook);
  canvas.addEventListener('lostpointercapture', endLook);

  document.addEventListener('pointerlockchange', () => {
    controlsHelp.classList.toggle('locked', document.pointerLockElement === canvas);
  });
  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas) {
      rotateLook(event.movementX, event.movementY, 0.002);
    }
  });

  function updateJoystick(event: PointerEvent) {
    const bounds = joystick.getBoundingClientRect();
    const radius = (bounds.width - joystickThumb.offsetWidth) / 2;
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(dx, dy);
    const travel = Math.min(distance, radius);
    const x = distance ? dx / distance : 0;
    const y = distance ? dy / distance : 0;
    // A small dead zone makes it easy to rest a thumb without drifting.
    const strength = Math.max(0, (travel / radius - 0.12) / 0.88);
    keys.touchX = x * strength;
    keys.touchY = y * strength;
    joystickThumb.style.transform = `translate(${x * travel}px, ${y * travel}px)`;
  }

  joystick.addEventListener('pointerdown', (event) => {
    if (movePointer !== null || event.button !== 0) return;
    enableTouch();
    event.preventDefault();
    movePointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    joystick.classList.add('active');
    updateJoystick(event);
  });
  joystick.addEventListener('pointermove', (event) => {
    if (event.pointerId === movePointer) updateJoystick(event);
  });

  function resetJoystick() {
    movePointer = null;
    keys.touchX = 0;
    keys.touchY = 0;
    joystickThumb.style.transform = '';
    joystick.classList.remove('active');
  }
  function endMove(event: PointerEvent) {
    if (event.pointerId === movePointer) resetJoystick();
  }
  joystick.addEventListener('pointerup', endMove);
  joystick.addEventListener('pointercancel', endMove);
  joystick.addEventListener('lostpointercapture', endMove);

  brakeButton.addEventListener('pointerdown', (event) => {
    if (brakePointer !== null || event.button !== 0) return;
    event.preventDefault();
    brakePointer = event.pointerId;
    controls.braking = true;
    brakeButton.setPointerCapture(event.pointerId);
    brakeButton.classList.add('active');
  });
  function endBrake(event: PointerEvent) {
    if (event.pointerId !== brakePointer) return;
    brakePointer = null;
    controls.braking = false;
    brakeButton.classList.remove('active');
  }
  brakeButton.addEventListener('pointerup', endBrake);
  brakeButton.addEventListener('pointercancel', endBrake);
  brakeButton.addEventListener('lostpointercapture', endBrake);
  brakeButton.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') controls.braking = true;
  });
  brakeButton.addEventListener('keyup', () => { controls.braking = false; });
  brakeButton.addEventListener('blur', () => { controls.braking = false; });

  const keyboardKeys = ['w', 'a', 's', 'd', 'q', 'e'] as const;
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    for (const knownKey of keyboardKeys) {
      if (key === knownKey) keys[knownKey] = true;
    }
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    for (const knownKey of keyboardKeys) {
      if (key === knownKey) keys[knownKey] = false;
    }
  });

  function resetInputs() {
    for (const key of keyboardKeys) keys[key] = false;
    resetJoystick();
    lookPointer = null;
    brakePointer = null;
    controls.braking = false;
    brakeButton.classList.remove('active');
  }
  window.addEventListener('blur', resetInputs);
  window.addEventListener('resize', resetInputs);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetInputs();
  });

  return controls;
}
