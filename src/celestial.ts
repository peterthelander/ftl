import * as THREE from 'three';

import { LIGHT_YEAR_KM } from './constants';
import { createOrbitLine } from './orbits';
import { createStellarSphere } from './stars';
import type { LabelManager } from './labels';

const textureBaseUrl = `${import.meta.env.BASE_URL}textures/`;

export type CelestialBodies = {
  sun: THREE.Mesh;
  stars: THREE.Mesh[];
  earth: THREE.Mesh;
  earthRadiusKm: number;
  moon: THREE.Mesh;
  alphaCentauri: THREE.Mesh;
  distantStars: THREE.Object3D[];
  navigationTargets: NavigationTarget[];
  rotatingBodies: THREE.Object3D[];
};

export type NavigationTarget = {
  name: string;
  object: THREE.Object3D;
  radiusKm: number;
};

type PlanetData = {
  name: string;
  radiusKm: number;
  distanceFromSunKm: number;
  orbitAngle: number;
  color: number;
  texturePath: string;
};

type StarData = {
  name: string;
  distanceLy: number;
  raHours: number;
  decDegrees: number;
  radiusKm: number;
  color: number;
};

function getDirectionFromEquatorial(raHours: number, decDegrees: number) {
  const ra = (raHours / 24) * Math.PI * 2;
  const dec = THREE.MathUtils.degToRad(decDegrees);

  return new THREE.Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra));
}

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

function createStar(scene: THREE.Scene, labels: LabelManager, data: StarData) {
  const star = createStellarSphere(data.radiusKm, data.color);
  const direction = getDirectionFromEquatorial(data.raHours, data.decDegrees);

  star.position.copy(direction.multiplyScalar(data.distanceLy * LIGHT_YEAR_KM));
  labels.add(data.name, star);
  scene.add(star);

  return star;
}

export function createCelestialBodies(scene: THREE.Scene, labels: LabelManager): CelestialBodies {
  const textureLoader = new THREE.TextureLoader();
  const earthRadiusKm = 6371;
  const navigationTargets: NavigationTarget[] = [];
  const rotatingBodies: THREE.Object3D[] = [];
  const distantStars: THREE.Object3D[] = [];

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  const sun = createStellarSphere(696340, 0xffe5a8);
  const stars: THREE.Mesh[] = [sun];
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

  const alphaCentauri = createStellarSphere(850000, 0xffe1a3);
  stars.push(alphaCentauri);
  alphaCentauri.position.set(0, 0, -41340000000000);
  scene.add(alphaCentauri);
  labels.add('Alpha Centauri', alphaCentauri);
  navigationTargets.push({ name: 'Alpha Centauri', object: alphaCentauri, radiusKm: 850000 });
  distantStars.push(alphaCentauri);

  const starData: StarData[] = [
    {
      name: "Barnard's Star",
      distanceLy: 5.96,
      raHours: 17.96,
      decDegrees: 4.7,
      radiusKm: 136000,
      color: 0xff9970
    },
    {
      name: 'Wolf 359',
      distanceLy: 7.86,
      raHours: 10.94,
      decDegrees: 7.0,
      radiusKm: 77000,
      color: 0xff7850
    },
    {
      name: 'Lalande 21185',
      distanceLy: 8.31,
      raHours: 11.05,
      decDegrees: 35.97,
      radiusKm: 271000,
      color: 0xffad7a
    },
    {
      name: 'Sirius',
      distanceLy: 8.6,
      raHours: 6.75,
      decDegrees: -16.72,
      radiusKm: 1180000,
      color: 0xd4e7ff
    },
    {
      name: 'Epsilon Eridani',
      distanceLy: 10.5,
      raHours: 3.55,
      decDegrees: -9.46,
      radiusKm: 514000,
      color: 0xffd099
    },
    {
      name: 'Procyon',
      distanceLy: 11.5,
      raHours: 7.66,
      decDegrees: 5.22,
      radiusKm: 1420000,
      color: 0xfff1ce
    },
    {
      name: 'Tau Ceti',
      distanceLy: 11.9,
      raHours: 1.73,
      decDegrees: -15.94,
      radiusKm: 552000,
      color: 0xffe4ac
    },
    {
      name: 'Vega',
      distanceLy: 25.0,
      raHours: 18.62,
      decDegrees: 38.78,
      radiusKm: 1680000,
      color: 0xccddff
    },
    {
      name: 'Arcturus',
      distanceLy: 36.7,
      raHours: 14.26,
      decDegrees: 19.18,
      radiusKm: 17700000,
      color: 0xffbb78
    },
    {
      name: 'Betelgeuse',
      distanceLy: 550,
      raHours: 5.92,
      decDegrees: 7.41,
      radiusKm: 500000000,
      color: 0xff9860
    }
  ];

  for (const data of starData) {
    const star = createStar(scene, labels, data);
    navigationTargets.push({ name: data.name, object: star, radiusKm: data.radiusKm });
    distantStars.push(star);
    stars.push(star);
  }

  return {
    sun,
    stars,
    earth,
    earthRadiusKm,
    moon,
    alphaCentauri,
    distantStars,
    navigationTargets,
    rotatingBodies
  };
}

export function createSkybox(scene: THREE.Scene) {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const skyboxTexture = cubeTextureLoader.load([
    `${textureBaseUrl}skybox/milkyway/dark-s_px.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_nx.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_py.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_ny.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_pz.jpg`,
    `${textureBaseUrl}skybox/milkyway/dark-s_nz.jpg`
  ]);

  skyboxTexture.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyboxTexture;
  scene.environment = skyboxTexture;

  return skyboxTexture;
}
