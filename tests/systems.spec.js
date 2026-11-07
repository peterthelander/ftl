import { test, expect } from '@playwright/test';

async function models(page) {
  await page.goto('/tests/models.html');
  await page.waitForFunction(() => window.models);
}

test('catalog preserves confirmed identities, flags estimates, and does not invent extra planets', async ({ page }) => {
  await models(page);
  const result = await page.evaluate(() => {
    const { catalogHosts: hosts, catalogMetadata: meta, makeSystemDefinition: make } = window.models;
    const definitions = hosts.map(host => make(host.name, 696340));
    const planets = definitions.flatMap(system => system.planets);
    return {
      hosts: hosts.length, count: planets.length, meta,
      unique: new Set(planets.map(planet => planet.name)).size,
      preserved: definitions.every((system, index) => system.source === 'catalog'
        && system.planets.length === hosts[index].planets.length
        && system.planets.every(planet => hosts[index].planets.some(row => row.name === planet.name))),
      finite: planets.every(p => p.radiusKm > 0 && p.orbitKm > 0 && Number.isFinite(p.radiusKm + p.orbitKm)),
      estimates: planets.filter(p => p.radiusEstimated).length,
      trappist: make('TRAPPIST-1', 80000).planets.map(p => p.name),
      alias: make('Lalande 21185', 271000).archiveHost
    };
  });
  expect(result.hosts).toBeGreaterThan(100);
  expect(result.count).toBeGreaterThan(150);
  expect(result.count).toBe(result.meta.planetCount);
  expect(result.hosts).toBe(result.meta.hostCount);
  expect(result.unique).toBe(result.count);
  expect(result.preserved).toBe(true);
  expect(result.finite).toBe(true);
  expect(result.estimates).toBeGreaterThan(0);
  expect(result.trappist).toEqual(['b', 'c', 'd', 'e', 'f', 'g', 'h'].map(letter => `TRAPPIST-1 ${letter}`));
  expect(result.alias).toBe('GJ 411');
});

test('generated systems are repeatable, distinct, labeled, and outside the stellar surface', async ({ page }) => {
  await models(page);
  const result = await page.evaluate(() => {
    const make = window.models.makeSystemDefinition;
    const first = make('Sirius', 1180000);
    return {
      stable: JSON.stringify(first) === JSON.stringify(make('Sirius', 1180000)),
      distinct: JSON.stringify(first.planets) !== JSON.stringify(make('Wolf 359', 77000).planets),
      labeled: first.source === 'generated' && first.planets.every(p => p.source === 'generated'),
      safe: first.planets.every((p, index, array) => p.orbitKm > 1180000 + p.radiusKm
        && (!index || p.orbitKm - array[index - 1].orbitKm > p.radiusKm + array[index - 1].radiusKm))
    };
  });
  expect(result).toEqual({ stable: true, distinct: true, labeled: true, safe: true });
});

test('detail loading is bounded; leaving disposes geometry, materials, textures, labels and targets', async ({ page }) => {
  await models(page);
  const result = await page.evaluate(() => {
    const { THREE, makeScene, recenterWorld, getNearestSurfaceTarget } = window.models;
    const { scene, camera, overlay, bodies } = makeScene();
    const systems = bodies.systems;
    const entry = systems.entries.find(s => s.definition.name === 'TRAPPIST-1');
    const initialLoaded = systems.loaded.size;
    camera.position.copy(entry.star.position).add(new THREE.Vector3(0, 0, entry.definition.outerRadiusKm * 2));
    systems.update(camera.position);
    const loaded = systems.loaded.get(entry);
    const target = loaded.targets[0];
    const planetWorld = target.object.getWorldPosition(new THREE.Vector3());
    camera.position.copy(planetWorld).add(new THREE.Vector3(0, 0, target.radiusKm * 2));
    const before = getNearestSurfaceTarget(camera.position, [target]).distanceKm;
    recenterWorld(scene, camera);
    systems.update(camera.position);
    const after = getNearestSurfaceTarget(camera.position, [target]).distanceKm;
    const disposed = { geometry: 0, material: 0, texture: 0 };
    const seen = new Set();
    loaded.group.traverse(object => {
      if (!object.isMesh) return;
      if (!seen.has(object.geometry)) {
        seen.add(object.geometry);
        object.geometry.addEventListener('dispose', () => disposed.geometry++);
      }
      object.material.addEventListener('dispose', () => disposed.material++);
      object.material.map?.addEventListener('dispose', () => disposed.texture++);
    });
    const home = bodies.earth.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0, 8000));
    systems.update(home);
    const cleanup = { loaded: systems.loaded.size, detached: loaded.group.parent === null,
      noStaleTarget: !bodies.navigationTargets.includes(target),
      noStaleLabel: !overlay.textContent.includes('TRAPPIST-1 b') };
    let maxLoaded = 0;
    let maxLabels = 0;
    for (const next of systems.entries.slice(1, 16)) {
      systems.update(next.star.position);
      maxLoaded = Math.max(maxLoaded, systems.loaded.size);
      maxLabels = Math.max(maxLabels, overlay.childElementCount);
    }
    systems.update(new THREE.Vector3(1e16, 1e16, 1e16));
    return { initialLoaded, count: loaded.targets.length, before, after, disposed, cleanup,
      maxLoaded, maxLabels, starCount: bodies.stars.length, finalLoaded: systems.loaded.size };
  });
  expect(result.initialLoaded).toBe(0);
  expect(result.count).toBe(7);
  expect(Math.abs(result.before - result.after)).toBeLessThan(1);
  expect(result.disposed.geometry).toBeGreaterThan(0);
  expect(result.disposed.material).toBeGreaterThan(0);
  expect(result.disposed.texture).toBe(7);
  expect(result.cleanup).toEqual({ loaded: 0, detached: true, noStaleTarget: true, noStaleLabel: true });
  expect(result.maxLoaded).toBeLessThanOrEqual(2);
  expect(result.maxLabels).toBeLessThan(result.starCount + 40);
  expect(result.finalLoaded).toBe(0);
});

test('star labels select the nearest visible twelve and respect hidden parents', async ({ page }) => {
  await models(page);
  const result = await page.evaluate(() => {
    const { THREE, createLabelManager, MAX_STAR_LABELS } = window.models;
    const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1e5);
    const scene = new THREE.Scene();
    const overlay = document.createElement('div');
    const labels = createLabelManager(overlay, camera);
    const fovScale = Math.tan(75 * Math.PI / 360);
    for (let i = 0; i < 20; i++) {
      const star = new THREE.Object3D();
      star.userData.kind = 'star';
      const depth = 100 + i * 20;
      star.position.set((i % 5 - 2) * 0.4 * depth * fovScale * camera.aspect,
        (Math.floor(i / 5) - 1.5) * 0.52 * depth * fovScale, -depth);
      scene.add(star);
      labels.add(`Star ${i}`, star);
    }
    const parent = new THREE.Group();
    parent.visible = false;
    const planet = new THREE.Object3D();
    planet.position.z = -10;
    parent.add(planet);
    scene.add(parent);
    labels.add('Hidden planet', planet);
    labels.update();
    return { cap: MAX_STAR_LABELS, visible: [...overlay.children]
      .filter(el => el.style.display !== 'none').map(el => el.firstElementChild.textContent) };
  });
  expect(result.visible).toHaveLength(result.cap);
  expect(result.visible).not.toContain('Hidden planet');
  expect(result.visible).not.toContain('Star 19');
});

test.describe('touch navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('phone can visit a catalog planet, a generated system, and return to Earth', async ({ page }) => {
  test.setTimeout(150000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore systems', exact: true }).tap();
  await page.locator('#systemSearch').fill('TRAPPIST');
  await page.locator('#systemSelect').selectOption('TRAPPIST-1');
  await expect(page.locator('#systemDescription')).toContainText('7 NASA catalog planets');
  await page.locator('#planetSelect').selectOption('TRAPPIST-1 b');
  await page.getByRole('button', { name: 'Visit selected destination' }).tap();
  await expect(page.locator('#systemStatus')).toContainText('TRAPPIST-1 · NASA catalog');
  await expect(page.locator('#altitudeTargetDisplay')).toHaveText('TRAPPIST-1 b');
  await page.screenshot({ path: test.info().outputPath('catalog-planet.png') });
  await page.getByRole('button', { name: 'Explore systems', exact: true }).tap();
  await page.locator('#systemSearch').fill('Sirius');
  await page.locator('#systemSelect').selectOption('Sirius');
  await expect(page.locator('#systemDescription')).toContainText('generated worlds');
  await page.getByRole('button', { name: 'Visit selected destination' }).tap();
  await expect(page.locator('#systemStatus')).toContainText('Sirius · Generated system');
  await page.getByRole('button', { name: 'Explore systems', exact: true }).tap();
  await page.locator('#systemSearch').fill('Sun');
  await page.locator('#systemSelect').selectOption('Sun');
  await page.locator('#planetSelect').selectOption('Earth');
  await page.getByRole('button', { name: 'Visit selected destination' }).tap();
  await expect(page.locator('#altitudeTargetDisplay')).toHaveText('Earth');
  expect(errors).toEqual([]);
});

});

test('labels do not cover instruments or run off the screen', async ({ page }) => {
  await models(page);
  const result = await page.evaluate(() => {
    const { THREE, createLabelManager } = window.models;
    const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1e5);
    const obstacle = document.createElement('div');
    obstacle.style.cssText = 'position:absolute;left:300px;top:200px;width:200px;height:150px';
    document.body.append(obstacle);
    const overlay = document.createElement('div');
    const labels = createLabelManager(overlay, camera, [obstacle]);
    const scene = new THREE.Scene();
    const covered = new THREE.Object3D();
    covered.position.z = -100;
    scene.add(covered);
    labels.add('Behind HUD', covered);
    const edge = new THREE.Object3D();
    edge.position.set(-Math.tan(75 * Math.PI / 360) * camera.aspect * 99, 0, -100);
    scene.add(edge);
    labels.add('Clipped long star name', edge);
    labels.update();
    return [...overlay.children].map(element => element.style.display);
  });
  expect(result).toEqual(['none', 'none']);
});
