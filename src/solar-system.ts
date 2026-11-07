import * as THREE from 'three';
import { createStellarSphere } from './stars';
import { createOrbitLine } from './orbits';
import type { LabelManager } from './labels';
import type { NavigationTarget } from './types';

const textureBaseUrl = `${import.meta.env.BASE_URL}textures/`;

type PlanetData = {
  name: string;
  radiusKm: number;
  distanceFromSunKm: number;
  orbitAngle: number;
  color: number;
  texturePath: string;
};

function createPlanet(
  scene: THREE.Scene,
  labels: LabelManager,
  sun: THREE.Object3D,
  textureLoader: THREE.TextureLoader,
  data: PlanetData
) {
  const geometry = new THREE.SphereGeometry(data.radiusKm, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: data.color,
    map: textureLoader.load(data.texturePath)
  });
  const planet = new THREE.Mesh(geometry, material);
  const orbitLine = createOrbitLine(data.distanceFromSunKm);

  planet.position.set(
    sun.position.x + Math.cos(data.orbitAngle) * data.distanceFromSunKm,
    0,
    Math.sin(data.orbitAngle) * data.distanceFromSunKm
  );

  labels.add(data.name, planet, sun);
  orbitLine.position.copy(sun.position);
  scene.add(orbitLine);
  scene.add(planet);

  return planet;
}

export function createSolarSystem(scene: THREE.Scene, labels: LabelManager) {
  const textureLoader = new THREE.TextureLoader();
  const earthRadiusKm = 6371;
  const navigationTargets: NavigationTarget[] = [];
  const rotatingBodies: THREE.Object3D[] = [];

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  const sun = createStellarSphere(696340, 0xffe5a8);
  sun.position.set(149597870, 0, 0);
  scene.add(sun);
  labels.add('Sun', sun);
  navigationTargets.push({ name: 'Sun', object: sun, radiusKm: 696340 });

  const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
  sunLight.position.copy(sun.position);
  scene.add(sunLight);

  const earthGeometry = new THREE.SphereGeometry(earthRadiusKm, 64, 64);
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: textureLoader.load(`${textureBaseUrl}planets/earth_atmos_2048.jpg`)
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  const earthOrbitLine = createOrbitLine(149597870);
  earthOrbitLine.position.copy(sun.position);
  scene.add(earthOrbitLine);
  scene.add(earth);
  labels.add('Earth', earth, sun);
  navigationTargets.push({ name: 'Earth', object: earth, radiusKm: earthRadiusKm });
  rotatingBodies.push(earth);

  const moonGeometry = new THREE.SphereGeometry(1737, 32, 32);
  const moonMaterial = new THREE.MeshStandardMaterial({
    map: textureLoader.load(`${textureBaseUrl}planets/moon_1024.jpg`)
  });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(0, 0, -384400);
  const moonOrbitLine = createOrbitLine(384400, 0x8fd7ff);
  moonOrbitLine.position.copy(earth.position);
  scene.add(moonOrbitLine);
  scene.add(moon);
  labels.add('Moon', moon, earth);
  navigationTargets.push({ name: 'Moon', object: moon, radiusKm: 1737 });
  rotatingBodies.push(moon);

  const planetData: PlanetData[] = [
    {
      name: 'Mercury',
      radiusKm: 2440,
      distanceFromSunKm: 57909227,
      orbitAngle: 2.35,
      color: 0xffffff,
      texturePath: `${textureBaseUrl}planets/mercury_2k.jpg`
    },
    {
      name: 'Venus',
      radiusKm: 6052,
      distanceFromSunKm: 108209475,
      orbitAngle: -2.65,
      color: 0xffffff,
      texturePath: `${textureBaseUrl}planets/venus_surface_2k.jpg`
    },
    {
      name: 'Mars',
      radiusKm: 3390,
      distanceFromSunKm: 227943824,
      orbitAngle: 3.6,
      color: 0xffffff,
      texturePath: `${textureBaseUrl}planets/mars_2k.jpg`
    },
    {
      name: 'Jupiter',
      radiusKm: 69911,
      distanceFromSunKm: 778340821,
      orbitAngle: 0.7,
      color: 0xffffff,
      texturePath: `${textureBaseUrl}planets/jupiter_2k.jpg`
    },
    {
      name: 'Saturn',
      radiusKm: 58232,
      distanceFromSunKm: 1426666422,
      orbitAngle: -0.45,
      color: 0xffffff,
      texturePath: `${textureBaseUrl}planets/saturn_2k.jpg`
    },
    {
      name: 'Uranus',
      radiusKm: 25362,
      distanceFromSunKm: 2870658186,
      orbitAngle: 2.05,
      color: 0xffffff,
      texturePath: `${textureBaseUrl}planets/uranus_2k.jpg`
    },
    {
      name: 'Neptune',
      radiusKm: 24622,
      distanceFromSunKm: 4498396441,
      orbitAngle: -2.2,
      color: 0xffffff,
      texturePath: `${textureBaseUrl}planets/neptune_2k.jpg`
    }
  ];

  for (const data of planetData) {
    const planet = createPlanet(scene, labels, sun, textureLoader, data);
    navigationTargets.push({ name: data.name, object: planet, radiusKm: data.radiusKm });
    rotatingBodies.push(planet);
  }

  const solarObjects = scene.children.filter(object => object !== sun && object !== ambientLight);
  const solarTargets = navigationTargets.filter(target => target.object !== sun);
  return { sun, earth, earthRadiusKm, moon, solarObjects, solarTargets, navigationTargets, rotatingBodies };
}
