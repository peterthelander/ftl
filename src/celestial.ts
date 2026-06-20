import * as THREE from 'three';

import { LIGHT_YEAR_KM } from './constants';
import type { LabelManager } from './labels';

export type CelestialBodies = {
  sun: THREE.Mesh;
  earth: THREE.Mesh;
  earthRadiusKm: number;
  moon: THREE.Mesh;
  alphaCentauri: THREE.Mesh;
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
  color: number;
  markerSize: number;
  radiusKm: number;
};

function addPointMarker(object: THREE.Object3D, color: number, size: number) {
  const markerGeometry = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3)
  );
  const markerMaterial = new THREE.PointsMaterial({ color, size, sizeAttenuation: false });
  object.add(new THREE.Points(markerGeometry, markerMaterial));
}

function getDirectionFromEquatorial(raHours: number, decDegrees: number) {
  const ra = (raHours / 24) * Math.PI * 2;
  const dec = THREE.MathUtils.degToRad(decDegrees);

  return new THREE.Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra));
}

function createOrbitLine(radiusKm: number, color = 0x4cffb5) {
  const segments = 256;
  const positions: number[] = [];

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radiusKm, 0, Math.sin(angle) * radiusKm);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  return new THREE.LineLoop(geometry, material);
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

  addPointMarker(planet, data.color, 9);
  labels.add(data.name, planet);
  orbitLine.position.copy(sun.position);
  scene.add(orbitLine);
  scene.add(planet);

  return planet;
}

function createStar(scene: THREE.Scene, labels: LabelManager, data: StarData) {
  const star = new THREE.Object3D();
  const direction = getDirectionFromEquatorial(data.raHours, data.decDegrees);

  star.position.copy(direction.multiplyScalar(data.distanceLy * LIGHT_YEAR_KM));
  addPointMarker(star, data.color, data.markerSize);
  labels.add(data.name, star);
  scene.add(star);

  return star;
}

export function createCelestialBodies(scene: THREE.Scene, labels: LabelManager): CelestialBodies {
  const textureLoader = new THREE.TextureLoader();
  const earthRadiusKm = 6371;
  const navigationTargets: NavigationTarget[] = [];
  const rotatingBodies: THREE.Object3D[] = [];

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  const sunGeometry = new THREE.SphereGeometry(696340, 64, 64);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff5e6 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(149597870, 0, 0);

  const haloGeometry = new THREE.SphereGeometry(720000, 32, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  sun.add(new THREE.Mesh(haloGeometry, haloMaterial));
  addPointMarker(sun, 0xffffff, 40);
  scene.add(sun);
  labels.add('Sun', sun);
  navigationTargets.push({ name: 'Sun', object: sun, radiusKm: 696340 });

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.copy(sun.position);
  scene.add(sunLight);

  const earthGeometry = new THREE.SphereGeometry(earthRadiusKm, 64, 64);
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/textures/planets/earth_atmos_2048.jpg')
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);
  labels.add('Earth', earth);
  navigationTargets.push({ name: 'Earth', object: earth, radiusKm: earthRadiusKm });
  rotatingBodies.push(earth);

  const moonGeometry = new THREE.SphereGeometry(1737, 32, 32);
  const moonMaterial = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/textures/planets/moon_1024.jpg')
  });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(0, 0, -384400);
  const moonOrbitLine = createOrbitLine(384400, 0x8fd7ff);
  moonOrbitLine.position.copy(earth.position);
  scene.add(moonOrbitLine);
  scene.add(moon);
  labels.add('Moon', moon);
  navigationTargets.push({ name: 'Moon', object: moon, radiusKm: 1737 });
  rotatingBodies.push(moon);

  const planetData: PlanetData[] = [
    {
      name: 'Mercury',
      radiusKm: 2440,
      distanceFromSunKm: 57909227,
      orbitAngle: 2.35,
      color: 0xffffff,
      texturePath: '/textures/planets/mercury_2k.jpg'
    },
    {
      name: 'Venus',
      radiusKm: 6052,
      distanceFromSunKm: 108209475,
      orbitAngle: -2.65,
      color: 0xffffff,
      texturePath: '/textures/planets/venus_surface_2k.jpg'
    },
    {
      name: 'Mars',
      radiusKm: 3390,
      distanceFromSunKm: 227943824,
      orbitAngle: 3.6,
      color: 0xffffff,
      texturePath: '/textures/planets/mars_2k.jpg'
    },
    {
      name: 'Jupiter',
      radiusKm: 69911,
      distanceFromSunKm: 778340821,
      orbitAngle: 0.7,
      color: 0xffffff,
      texturePath: '/textures/planets/jupiter_2k.jpg'
    },
    {
      name: 'Saturn',
      radiusKm: 58232,
      distanceFromSunKm: 1426666422,
      orbitAngle: -0.45,
      color: 0xffffff,
      texturePath: '/textures/planets/saturn_2k.jpg'
    },
    {
      name: 'Uranus',
      radiusKm: 25362,
      distanceFromSunKm: 2870658186,
      orbitAngle: 2.05,
      color: 0xffffff,
      texturePath: '/textures/planets/uranus_2k.jpg'
    },
    {
      name: 'Neptune',
      radiusKm: 24622,
      distanceFromSunKm: 4498396441,
      orbitAngle: -2.2,
      color: 0xffffff,
      texturePath: '/textures/planets/neptune_2k.jpg'
    }
  ];

  for (const data of planetData) {
    const planet = createPlanet(scene, labels, sun, textureLoader, data);
    navigationTargets.push({ name: data.name, object: planet, radiusKm: data.radiusKm });
    rotatingBodies.push(planet);
  }

  const acGeometry = new THREE.SphereGeometry(850000, 32, 32);
  const acMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const alphaCentauri = new THREE.Mesh(acGeometry, acMaterial);
  alphaCentauri.position.set(0, 0, -41340000000000);
  addPointMarker(alphaCentauri, 0xffaa00, 15);
  scene.add(alphaCentauri);
  labels.add('Alpha Centauri', alphaCentauri);
  navigationTargets.push({ name: 'Alpha Centauri', object: alphaCentauri, radiusKm: 850000 });

  const starData: StarData[] = [
    {
      name: "Barnard's Star",
      distanceLy: 5.96,
      raHours: 17.96,
      decDegrees: 4.7,
      color: 0xff7055,
      markerSize: 9,
      radiusKm: 136000
    },
    {
      name: 'Wolf 359',
      distanceLy: 7.86,
      raHours: 10.94,
      decDegrees: 7.0,
      color: 0xff5f4d,
      markerSize: 8,
      radiusKm: 77000
    },
    {
      name: 'Lalande 21185',
      distanceLy: 8.31,
      raHours: 11.05,
      decDegrees: 35.97,
      color: 0xff8566,
      markerSize: 8,
      radiusKm: 271000
    },
    {
      name: 'Sirius',
      distanceLy: 8.6,
      raHours: 6.75,
      decDegrees: -16.72,
      color: 0xbfdcff,
      markerSize: 16,
      radiusKm: 1180000
    },
    {
      name: 'Epsilon Eridani',
      distanceLy: 10.5,
      raHours: 3.55,
      decDegrees: -9.46,
      color: 0xffd38a,
      markerSize: 10,
      radiusKm: 514000
    },
    {
      name: 'Procyon',
      distanceLy: 11.5,
      raHours: 7.66,
      decDegrees: 5.22,
      color: 0xe8f2ff,
      markerSize: 13,
      radiusKm: 1420000
    },
    {
      name: 'Tau Ceti',
      distanceLy: 11.9,
      raHours: 1.73,
      decDegrees: -15.94,
      color: 0xffd6a0,
      markerSize: 10,
      radiusKm: 552000
    },
    {
      name: 'Vega',
      distanceLy: 25.0,
      raHours: 18.62,
      decDegrees: 38.78,
      color: 0xd7e8ff,
      markerSize: 15,
      radiusKm: 1680000
    },
    {
      name: 'Arcturus',
      distanceLy: 36.7,
      raHours: 14.26,
      decDegrees: 19.18,
      color: 0xffb15f,
      markerSize: 15,
      radiusKm: 17700000
    },
    {
      name: 'Betelgeuse',
      distanceLy: 550,
      raHours: 5.92,
      decDegrees: 7.41,
      color: 0xff5b2e,
      markerSize: 18,
      radiusKm: 500000000
    }
  ];

  for (const data of starData) {
    const star = createStar(scene, labels, data);
    navigationTargets.push({ name: data.name, object: star, radiusKm: data.radiusKm });
  }

  return {
    sun,
    earth,
    earthRadiusKm,
    moon,
    alphaCentauri,
    navigationTargets,
    rotatingBodies
  };
}

export function createSkybox(scene: THREE.Scene) {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const skyboxTexture = cubeTextureLoader.load([
    '/textures/skybox/milkyway/dark-s_px.jpg',
    '/textures/skybox/milkyway/dark-s_nx.jpg',
    '/textures/skybox/milkyway/dark-s_py.jpg',
    '/textures/skybox/milkyway/dark-s_ny.jpg',
    '/textures/skybox/milkyway/dark-s_pz.jpg',
    '/textures/skybox/milkyway/dark-s_nz.jpg'
  ]);

  skyboxTexture.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyboxTexture;
  scene.environment = skyboxTexture;
}
