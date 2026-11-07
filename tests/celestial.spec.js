import { test, expect } from '@playwright/test';

async function fixture(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/tests/visuals.html');
  await page.waitForFunction(() => window.visuals);
  return errors;
}

test('every stellar navigation target has a sphere at its modeled radius', async ({ page }) => {
  const errors = await fixture(page);
  const result = await page.evaluate(() => {
    const { bodies } = window.visuals;
    return bodies.stars.map(star => ({
      mesh: star.isMesh,
      radius: star.geometry.parameters.radius,
      navigationRadius: bodies.navigationTargets.find(t => t.object === star).radiusKm,
      scale: star.scale.toArray(),
      corona: !!star.getObjectByName('stellar-corona')
    }));
  });
  expect(result).toHaveLength(12);
  for (const star of result) {
    expect(star.mesh).toBe(true);
    expect(star.radius).toBe(star.navigationRadius);
    expect(star.scale).toEqual([1, 1, 1]);
    expect(star.corona).toBe(true);
  }
  await page.evaluate(() => window.visuals.viewStar('Sun'));
  await page.screenshot({ path: test.info().outputPath('sun.png') });
  await page.evaluate(() => window.visuals.viewStar("Barnard's Star"));
  await page.screenshot({ path: test.info().outputPath('red-dwarf.png') });
  expect(errors).toEqual([]);
});

test('unresolved stars keep a visible corona without resizing their surface', async ({ page }) => {
  const errors = await fixture(page);
  const result = await page.evaluate(() => {
    const { bodies, camera, updateStarGlows } = window.visuals;
    camera.position.set(0, 0, 8000);
    updateStarGlows(bodies.stars, camera, 400);
    const star = bodies.stars.find(s => s === bodies.alphaCentauri);
    const corona = star.getObjectByName('stellar-corona');
    const pixels = corona.scale.x / (camera.position.distanceTo(star.position)
      * 2 * Math.tan(camera.fov * Math.PI / 360)) * 400;
    return { pixels, surfaceScale: star.scale.x };
  });
  expect(result.pixels).toBeCloseTo(14);
  expect(result.surfaceScale).toBe(1);
  expect(errors).toEqual([]);
});

test('orbit guides render their bright core and wider glow', async ({ page }) => {
  const errors = await fixture(page);
  const result = await page.evaluate(() => {
    const { scene, viewOrbits, renderer } = window.visuals;
    viewOrbits();
    const gl = renderer.getContext();
    const pixels = new Uint8Array(400 * 400 * 4);
    gl.readPixels(0, 0, 400, 400, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let mintPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 1] > 60 && pixels[i + 1] > pixels[i] * 1.3) mintPixels++;
    }
    return {
      guides: scene.children.filter(o => o.name === 'orbit-guide').map(o =>
        o.children.map(line => ({ width: line.material.linewidth, opacity: line.material.opacity }))),
      mintPixels
    };
  });
  expect(result.guides).toHaveLength(9);
  expect(result.guides.every(strokes => strokes[0].width > strokes[1].width && strokes[1].opacity > 0.8)).toBe(true);
  expect(result.mintPixels).toBeGreaterThan(500);
  await page.screenshot({ path: test.info().outputPath('orbits.png') });
  expect(errors).toEqual([]);
});

test('labels remain visible beyond the old interstellar clipping distance', async ({ page }) => {
  await fixture(page);
  const visible = await page.evaluate(async () => {
    const { createLabelManager } = await import('/src/labels.ts');
    const { camera, bodies } = window.visuals;
    const overlay = document.createElement('div');
    const labels = createLabelManager(overlay, camera);
    camera.position.set(0, 0, 8000);
    camera.lookAt(bodies.stars.at(-1).position);
    labels.add('Betelgeuse', bodies.stars.at(-1));
    labels.update();
    return overlay.firstElementChild.style.display === 'block';
  });
  expect(visible).toBe(true);
});

test('a distant corona renders as a round point rather than a clipped triangle', async ({ page }) => {
  const errors = await fixture(page);
  const result = await page.evaluate(() => {
    const { bodies, scene, camera, renderer, updateStarGlows } = window.visuals;
    const star = bodies.navigationTargets.find(t => t.name === 'Sirius').object;
    for (const object of scene.children) object.visible = object === star;
    camera.position.set(0, 0, 8000);
    camera.lookAt(star.position);
    camera.updateMatrixWorld();
    updateStarGlows(bodies.stars, camera, 400);
    renderer.render(scene, camera);
    const gl = renderer.getContext();
    const pixels = new Uint8Array(400 * 400 * 4);
    gl.readPixels(0, 0, 400, 400, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const quadrants = [0, 0, 0, 0];
    for (let y = 190; y < 210; y++) for (let x = 190; x < 210; x++) {
      const i = (y * 400 + x) * 4;
      quadrants[Number(x >= 200) + Number(y >= 200) * 2] += pixels[i] + pixels[i + 1] + pixels[i + 2];
    }
    return { min: Math.min(...quadrants), max: Math.max(...quadrants) };
  });
  expect(result.min).toBeGreaterThan(100);
  expect(result.max / result.min).toBeLessThan(1.1);
  expect(errors).toEqual([]);
});
