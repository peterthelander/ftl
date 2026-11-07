import * as THREE from 'three';

import { LIGHT_YEAR_KM } from './constants';
import { createStellarSphere } from './stars';
import { createSystemManager, type SystemManager } from './systems';
import { catalogHosts, catalogStarData, getCatalogHost } from './systems-data';
import type { LabelManager } from './labels';
import { createSolarSystem } from './solar-system';
import { landmarkStars, type StarData } from './landmarks';
import type { NavigationTarget } from './types';

export type CelestialBodies = {
  sun: THREE.Mesh;
  systems: SystemManager;
  stars: THREE.Mesh[];
  earth: THREE.Mesh;
  earthRadiusKm: number;
  moon: THREE.Mesh;
  alphaCentauri: THREE.Mesh;
  distantStars: THREE.Object3D[];
  navigationTargets: NavigationTarget[];
  rotatingBodies: THREE.Object3D[];
};

function getDirectionFromEquatorial(raHours: number, decDegrees: number) {
  const ra = (raHours / 24) * Math.PI * 2;
  const dec = THREE.MathUtils.degToRad(decDegrees);

  return new THREE.Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra));
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
  const { sun, earth, earthRadiusKm, moon, solarObjects, solarTargets, navigationTargets, rotatingBodies } = createSolarSystem(scene, labels);
  const stars: THREE.Mesh[] = [sun];
  const distantStars: THREE.Object3D[] = [];
  const alphaCentauri = createStellarSphere(850000, 0xffe1a3);
  stars.push(alphaCentauri);
  alphaCentauri.position.set(0, 0, -41340000000000);
  scene.add(alphaCentauri);
  labels.add('Alpha Centauri', alphaCentauri);
  navigationTargets.push({ name: 'Alpha Centauri', object: alphaCentauri, radiusKm: 850000 });
  distantStars.push(alphaCentauri);

  const representedHosts = new Set<string>();
  const expandedStarData = landmarkStars.map(data => {
    const host = getCatalogHost(data.name);
    if (!host) return data;
    representedHosts.add(host.name);
    return { ...catalogStarData(host), name: data.name };
  });
  for (const host of catalogHosts) {
    if (!representedHosts.has(host.name)) expandedStarData.push(catalogStarData(host));
  }
  for (const data of expandedStarData) {
    const star = createStar(scene, labels, data);
    navigationTargets.push({ name: data.name, object: star, radiusKm: data.radiusKm });
    distantStars.push(star);
    stars.push(star);
  }

  for (const target of navigationTargets) {
    target.object.name = target.name;
    target.object.userData.radiusKm = target.radiusKm;
  }
  const systems = createSystemManager(scene, labels, stars, solarObjects, solarTargets, navigationTargets);
  return {
    sun,
    systems,
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
