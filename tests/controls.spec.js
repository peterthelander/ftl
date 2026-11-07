import { test, expect } from '@playwright/test';

const earth = (page) => page.locator('.spaceLabel').filter({ has: page.getByText('Earth', { exact: true }) });
const speed = async (page) => Number((await page.locator('#speedDisplay').innerText()).replaceAll(',', ''));

async function start(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(earth(page)).toBeVisible();
  return errors;
}

test.describe('phone flight', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('two thumbs can move and look together; cancel releases thrust and brake stops', async ({ page }) => {
    const errors = await start(page);
    await expect(page.locator('#joystick')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('phone.png') });
    const client = await page.context().newCDPSession(page);
    const box = await page.locator('#joystick').boundingBox();
    const movement = { id: 1, x: box.x + box.width / 2, y: box.y + 18 };
    const look = { id: 2, x: 290, y: 380 };
    const oldLeft = await earth(page).evaluate((el) => el.style.left);
    const oldAltitude = await page.locator('#altitudeDisplay').innerText();
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [movement] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [movement, look] });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [movement, { ...look, x: 310, y: 390 }]
    });
    await expect.poll(() => speed(page)).toBeGreaterThan(20);
    await expect.poll(() => earth(page).evaluate((el) => el.style.left), { timeout: 15000 }).not.toBe(oldLeft);
    await expect.poll(() => page.locator('#altitudeDisplay').innerText()).not.toBe(oldAltitude);
    expect(await page.evaluate(() => document.pointerLockElement === null)).toBe(true);
    const speedBeforeCancel = await speed(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(page.locator('#joystick')).not.toHaveClass(/active/);
    await expect.poll(() => speed(page), { timeout: 15000 }).toBeLessThan(speedBeforeCancel * 0.8);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [movement] });
    await expect.poll(() => speed(page)).toBeGreaterThan(20);
    const brake = await page.locator('#brakeButton').boundingBox();
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [movement, { id: 3, x: brake.x + 40, y: brake.y + 25 }]
    });
    await expect.poll(() => speed(page)).toBe(0);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('#brakeButton')).not.toHaveClass(/active/);
    expect(errors).toEqual([]);
  });

  test('landscape keeps controls visible, and blur releases a held stick', async ({ page }) => {
    const errors = await start(page);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('#joystick')).toBeInViewport();
    await expect(page.locator('#brakeButton')).toBeInViewport();
    const client = await page.context().newCDPSession(page);
    const box = await page.locator('#joystick').boundingBox();
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [{ id: 1, x: box.x + 110, y: box.y + 62 }]
    });
    await expect.poll(() => speed(page)).toBeGreaterThan(20);
    const speedBeforeBlur = await speed(page);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(page.locator('#joystick')).not.toHaveClass(/active/);
    await expect.poll(() => speed(page), { timeout: 15000 }).toBeLessThan(speedBeforeBlur * 0.8);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
});

test('desktop mouse lock and keyboard flight still work', async ({ page }) => {
  // Exercise input with a real pointer lock, independently of software WebGL's
  // slow frame delivery in headless environments. Phone tests cover the live loop.
  await page.goto('/tests/desktop.html');
  await page.waitForFunction(() => window.desktop);
  await page.locator('canvas').click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('canvas');
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mousemove', {
    movementX: 20, movementY: 10
  })));
  expect(await page.evaluate(() => window.desktop.camera.rotation.y)).not.toBe(0);
  await page.keyboard.down('w');
  const moved = await page.evaluate(() => {
    const d = window.desktop;
    d.updateFlight(d.flight, d.camera, d.controls.keys, 100, 0.1);
    return d.getFlightSpeed(d.flight) > 0 && d.camera.position.length() > 0;
  });
  expect(moved).toBe(true);
  await page.keyboard.up('w');
  expect(await page.evaluate(() => window.desktop.controls.keys.w)).toBe(false);
  await page.evaluate(() => document.exitPointerLock());
});


test('typing in a form does not thrust, and reset clears held inputs', async ({ page }) => {
  await page.goto('/tests/desktop.html');
  await page.waitForFunction(() => window.desktop);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'search';
    document.body.append(input);
    input.focus();
  });
  await page.keyboard.type('wasdqe');
  expect(await page.evaluate(() => ['w', 'a', 's', 'd', 'q', 'e'].some(key => window.desktop.controls.keys[key]))).toBe(false);
  await page.locator('canvas').click();
  await page.keyboard.down('w');
  expect(await page.evaluate(() => window.desktop.controls.keys.w)).toBe(true);
  await page.evaluate(() => window.desktop.controls.reset());
  expect(await page.evaluate(() => window.desktop.controls.keys.w)).toBe(false);
  await page.keyboard.up('w');
});
