import * as THREE from 'three';
import type { LabelManager } from './labels';
import { createOrbitLine } from './orbits';
import { makeSystemDefinition } from './systems-data';
import { AU_KM } from './constants';
import { seededRandom } from './random';
import { planetTexture } from './planet-surfaces';
import type { SystemDefinition } from './types';
import type { NavigationTarget } from './types';

export const MAX_ACTIVE_SYSTEMS = 2;
export type SystemEntry = {
  star: THREE.Mesh;
  definition: SystemDefinition;
  revealDistanceKm: number;
  planetCount: number;
};
type LoadedSystem = { group: THREE.Group; targets: NavigationTarget[] };

export function createSystemManager(
  scene: THREE.Scene, labels: LabelManager, stars: THREE.Mesh[],
  solarObjects: THREE.Object3D[], solarTargets: NavigationTarget[],
  navigationTargets: NavigationTarget[]
) {
  const starTargets = navigationTargets.filter(target => stars.includes(target.object as THREE.Mesh));
  const entries: SystemEntry[] = starTargets.map(target => {
    const definition: SystemDefinition = target.name === 'Sun'
      ? { name: 'Sun', source: 'solar', planets: [], outerRadiusKm: 4_498_396_441 }
      : makeSystemDefinition(target.name, target.radiusKm);
    return {
      star: target.object as THREE.Mesh, definition,
      revealDistanceKm: Math.max(definition.outerRadiusKm * 4, 20 * AU_KM, target.radiusKm * 20),
      planetCount: definition.source === 'solar' ? 8 : definition.planets.length
    };
  });
  const loaded = new Map<SystemEntry, LoadedSystem>();
  const active = new Set<SystemEntry>();

  function load(entry: SystemEntry) {
    const group = new THREE.Group();
    group.name = `planetary-system:${entry.definition.name}`;
    group.position.copy(entry.star.position);
    group.rotation.x = seededRandom(entry.definition.name)() * 0.35;
    const targets: NavigationTarget[] = [];
    for (const planet of entry.definition.planets) {
      const material = new THREE.MeshStandardMaterial({
        map: planetTexture(planet.name, planet.radiusKm), roughness: 0.85,
        emissive: 0x111111, emissiveIntensity: 0.35
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(planet.radiusKm, 32, 24), material);
      mesh.name = planet.name;
      mesh.userData.kind = 'planet';
      mesh.userData.radiusKm = planet.radiusKm;
      mesh.userData.source = planet.source;
      mesh.position.set(Math.cos(planet.phase) * planet.orbitKm, 0, Math.sin(planet.phase) * planet.orbitKm);
      const detail = planet.source === 'generated' ? 'Generated world'
        : `NASA catalog${planet.radiusEstimated ? ' · size estimated' : ''}${planet.orbitEstimated ? ' · orbit estimated' : ''}`;
      labels.add(planet.name, mesh, entry.star, detail);
      const orbit = createOrbitLine(planet.orbitKm, planet.source === 'catalog' ? 0x68ffc9 : 0xffc875);
      group.add(mesh, orbit);
      targets.push({ name: planet.name, object: mesh, radiusKm: planet.radiusKm });
    }
    group.add(new THREE.PointLight(0xffffff, 2.5, 0, 0));
    scene.add(group);
    loaded.set(entry, { group, targets });
  }

  function unload(entry: SystemEntry, system: LoadedSystem) {
    for (const target of system.targets) labels.remove(target.object);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    system.group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial) material.map?.dispose();
      material.dispose();
    }
    scene.remove(system.group);
    loaded.delete(entry);
  }

  function update(position: THREE.Vector3) {
    // Hysteresis avoids rebuilding a system repeatedly at the reveal boundary.
    const nearby = entries.map(entry => ({ entry, distance: position.distanceTo(entry.star.position) }))
      .filter(({ entry, distance }) => distance < entry.revealDistanceKm * (active.has(entry) ? 1.25 : 1))
      .sort((a, b) => a.distance - b.distance).slice(0, MAX_ACTIVE_SYSTEMS);
    active.clear();
    for (const { entry } of nearby) active.add(entry);
    const solar = entries.find(entry => entry.definition.source === 'solar')!;
    for (const object of solarObjects) object.visible = active.has(solar);
    for (const [entry, system] of loaded) if (!active.has(entry)) unload(entry, system);
    for (const entry of active) {
      if (entry.definition.source === 'solar') continue;
      if (!loaded.has(entry)) load(entry);
      loaded.get(entry)!.group.position.copy(entry.star.position);
    }
    navigationTargets.length = 0;
    navigationTargets.push(...starTargets);
    if (active.has(solar)) navigationTargets.push(...solarTargets);
    for (const system of loaded.values()) navigationTargets.push(...system.targets);
    return nearby[0]?.entry;
  }

  update(new THREE.Vector3(0, 0, 8000));
  function findPlanet(entry: SystemEntry, name: string) {
    return (entry.definition.source === 'solar' ? solarTargets : loaded.get(entry)?.targets)
      ?.find(target => target.name === name);
  }
  return { entries, update, active, loaded, findPlanet };
}
export type SystemManager = ReturnType<typeof createSystemManager>;
