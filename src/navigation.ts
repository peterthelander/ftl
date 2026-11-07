import * as THREE from 'three';
import type { Controls } from './controls';
import type { FlightState } from './flight';
import type { SystemManager, SystemEntry } from './systems';
import { catalogMetadata } from './systems-data';
import { recenterWorld } from './world';
import { getRequiredElement } from './dom';

export function createNavigation(
  systems: SystemManager, scene: THREE.Scene, camera: THREE.PerspectiveCamera,
  controls: Controls, flight: FlightState
) {
  const dialog = getRequiredElement<HTMLDialogElement>('systemDialog');
  const openButton = getRequiredElement<HTMLButtonElement>('exploreSystems');
  const closeButton = getRequiredElement<HTMLButtonElement>('closeSystems');
  const search = getRequiredElement<HTMLInputElement>('systemSearch');
  const systemSelect = getRequiredElement<HTMLSelectElement>('systemSelect');
  const planetSelect = getRequiredElement<HTMLSelectElement>('planetSelect');
  const visitButton = getRequiredElement<HTMLButtonElement>('visitSystem');
  const description = getRequiredElement<HTMLParagraphElement>('systemDescription');
  const snapshot = getRequiredElement<HTMLSpanElement>('catalogSnapshot');
  snapshot.textContent = `${catalogMetadata.planetCount} catalog planets · snapshot ${catalogMetadata.retrievedAt.slice(0, 10)}`;
  let selected: SystemEntry | undefined;

  function updatePlanets() {
    selected = systems.entries.find(entry => entry.definition.name === systemSelect.value);
    planetSelect.replaceChildren(new Option('System overview', ''));
    visitButton.disabled = !selected;
    if (!selected) { description.textContent = 'No matching systems.'; return; }
    const definition = selected.definition;
    description.textContent = definition.source === 'catalog'
      ? `${selected.planetCount} NASA catalog planets. Mint orbit guides. Estimated sizes/orbits are marked below.`
      : definition.source === 'generated'
        ? `${selected.planetCount} generated worlds. No planets in the bundled catalog for this star. Amber orbit guides.`
        : 'Our Solar System: eight planets and the Moon.';
    if (definition.source === 'solar') {
      for (const name of ['Mercury', 'Venus', 'Earth', 'Moon', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) {
        planetSelect.add(new Option(name, name));
      }
    } else {
      for (const planet of definition.planets) {
        const suffix = planet.source === 'generated' ? ' · generated'
          : `${planet.radiusEstimated ? ' · size estimated' : ''}${planet.orbitEstimated ? ' · orbit estimated' : ''}`;
        planetSelect.add(new Option(planet.name + suffix, planet.name));
      }
    }
  }

  function filterSystems() {
    const previous = systemSelect.value;
    const query = search.value.trim().toLowerCase();
    systemSelect.replaceChildren();
    for (const entry of systems.entries) {
      const name = entry.definition.name;
      if (!`${name} ${entry.definition.archiveHost ?? ''}`.toLowerCase().includes(query)) continue;
      const badge = entry.definition.source === 'catalog' ? 'NASA' : entry.definition.source === 'generated' ? 'Generated' : 'Solar';
      systemSelect.add(new Option(`${name} · ${badge} · ${entry.planetCount} planets`, name));
    }
    if ([...systemSelect.options].some(option => option.value === previous)) systemSelect.value = previous;
    updatePlanets();
  }

  openButton.addEventListener('click', () => {
    controls.reset();
    flight.velocityKmPerSecond.set(0, 0, 0);
    if (document.pointerLockElement) document.exitPointerLock();
    filterSystems();
    dialog.showModal();
    search.focus();
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { controls.reset(); openButton.focus(); });
  search.addEventListener('input', filterSystems);
  systemSelect.addEventListener('change', updatePlanets);
  visitButton.addEventListener('click', () => {
    if (!selected) return;
    controls.reset();
    flight.velocityKmPerSecond.set(0, 0, 0);
    const radius = selected.definition.outerRadiusKm;
    camera.position.copy(selected.star.position).add(new THREE.Vector3(0, radius * 0.8, radius * 1.4));
    camera.lookAt(selected.star.position);
    recenterWorld(scene, camera);
    systems.update(camera.position);
    if (planetSelect.value) {
      const target = systems.findPlanet(selected, planetSelect.value);
      if (target) {
        const point = target.object.getWorldPosition(new THREE.Vector3());
        camera.position.copy(point).add(new THREE.Vector3(0, target.radiusKm * 0.6, target.radiusKm * 5));
        camera.lookAt(point);
        recenterWorld(scene, camera);
        systems.update(camera.position);
      }
    }
    dialog.close();
  });
  return { get isOpen() { return dialog.open; } };
}
