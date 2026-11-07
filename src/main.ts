import * as THREE from 'three';

import { updateAtmosphere } from './atmosphere';
import { createCelestialBodies } from './celestial';
import { createSkybox } from './skybox';
import { createControls } from './controls';
import { getDomElements, getRequiredElement } from './dom';
import { createFlightState, getFlightSpeed, getProximitySpeed, updateFlight } from './flight';
import { updateHud } from './hud';
import { createLabelManager } from './labels';
import { recenterWorld } from './world';
import { updateStarGlows } from './stars';
import { createNavigation } from './navigation';

const dom = getDomElements();
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e17);
camera.rotation.order = 'YXZ';
camera.position.set(0, 0, 8000);

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  logarithmicDepthBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const labels = createLabelManager(dom.labelsOverlay, camera, [
  getRequiredElement('hud'), getRequiredElement('exploreSystems'), dom.joystick, dom.brakeButton
]);
const bodies = createCelestialBodies(scene, labels);
const skybox = createSkybox(scene);

const flightState = createFlightState();
const controls = createControls(dom.canvas, dom.controlsHelp, camera, dom.joystick, dom.joystickThumb, dom.brakeButton);
const navigation = createNavigation(bodies.systems, scene, camera, controls, flightState);
let lastFrameTime = performance.now();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;

  if (!navigation.isOpen) controls.updateCameraRotation(camera, dt);

  const currentSystem = bodies.systems.update(camera.position);
  const speedLimit = getProximitySpeed(camera.position, bodies.navigationTargets);
  if (controls.braking || navigation.isOpen) {
    flightState.velocityKmPerSecond.set(0, 0, 0);
  } else {
    updateFlight(flightState, camera, controls.keys, speedLimit, dt);
  }
  recenterWorld(scene, camera);
  const currentSpeed = getFlightSpeed(flightState);

  for (const body of bodies.rotatingBodies) {
    body.rotation.y += 0.0001;
  }

  updateHud(dom, currentSpeed, camera.position, bodies.navigationTargets, currentSystem);
  updateAtmosphere({
    camera,
    earth: bodies.earth,
    earthRadiusKm: bodies.earthRadiusKm,
    overlay: dom.atmosphereOverlay,
    sun: bodies.sun,
    scene,
    skybox,
    distantStars: bodies.distantStars
  });
  updateStarGlows(bodies.stars, camera, window.innerHeight);
  labels.update();
  renderer.render(scene, camera);
}

animate();
