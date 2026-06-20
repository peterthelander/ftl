import * as THREE from 'three';

import { updateAtmosphere } from './atmosphere';
import { createCelestialBodies, createSkybox } from './celestial';
import { createControls } from './controls';
import { getDomElements } from './dom';
import { createFlightState, getCurrentSpeed, getProximityLimitedSpeed, updateAcceleration } from './flight';
import { updateHud } from './hud';
import { createLabelManager } from './labels';

const dom = getDomElements();
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e14);
camera.rotation.order = 'YXZ';
camera.position.set(0, 0, 8000);

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  logarithmicDepthBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const labels = createLabelManager(dom.labelsOverlay, camera);
const bodies = createCelestialBodies(scene, labels);
createSkybox(scene);

const flightState = createFlightState();
const controls = createControls(dom.canvas, dom.controlsHelp, flightState, camera);
const clock = new THREE.Clock();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  updateAcceleration(flightState, controls.keys.w, dt);
  controls.updateCameraRotation(camera, dt);

  const currentSpeed = getProximityLimitedSpeed(getCurrentSpeed(flightState), camera.position, bodies.navigationTargets);
  controls.moveCamera(camera, currentSpeed, dt);

  for (const body of bodies.rotatingBodies) {
    body.rotation.y += 0.0001;
  }

  updateHud(dom, currentSpeed);
  updateAtmosphere({
    camera,
    earth: bodies.earth,
    earthRadiusKm: bodies.earthRadiusKm,
    overlay: dom.atmosphereOverlay,
    sun: bodies.sun
  });
  labels.update();
  renderer.render(scene, camera);
}

animate();
