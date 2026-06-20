import * as THREE from 'three';

import { updateAtmosphere } from './atmosphere';
import { createCelestialBodies, createSkybox } from './celestial';
import { createControls } from './controls';
import { getDomElements } from './dom';
import { createFlightState, getFlightSpeed, getProximitySpeed, updateFlight } from './flight';
import { updateHud } from './hud';
import { createLabelManager } from './labels';
import { recenterWorld } from './world';

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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const labels = createLabelManager(dom.labelsOverlay, camera);
const bodies = createCelestialBodies(scene, labels);
const skybox = createSkybox(scene);

const flightState = createFlightState();
const controls = createControls(dom.canvas, dom.controlsHelp, camera);
const clock = new THREE.Clock();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);

  controls.updateCameraRotation(camera, dt);

  const speedLimit = getProximitySpeed(camera.position, bodies.navigationTargets);
  updateFlight(flightState, camera, controls.keys, speedLimit, dt);
  recenterWorld(scene, camera);
  const currentSpeed = getFlightSpeed(flightState);

  for (const body of bodies.rotatingBodies) {
    body.rotation.y += 0.0001;
  }

  updateHud(dom, currentSpeed, camera.position, bodies.navigationTargets);
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
  labels.update();
  renderer.render(scene, camera);
}

animate();
