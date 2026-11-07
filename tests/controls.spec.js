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
  const errors = await start(page);
  await expect(page.locator('#joystick')).toBeHidden();
  await page.locator('canvas').click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('simCanvas');
  const oldLeft = await earth(page).evaluate((el) => el.style.left);
  // Headless Chromium can report zero deltas for mouse.move after pointer lock.
  // Supply relative mouse input while still verifying the real lock and listener.
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mousemove', {
    movementX: 20, movementY: 10
  })));
  await expect.poll(() => earth(page).evaluate((el) => el.style.left), { timeout: 15000 }).not.toBe(oldLeft);
  await page.keyboard.down('w');
  await expect.poll(() => speed(page)).toBeGreaterThan(20);
  const speedBeforeRelease = await speed(page);
  await page.keyboard.up('w');
  await expect.poll(() => speed(page), { timeout: 15000 }).toBeLessThan(speedBeforeRelease * 0.8);
  await page.evaluate(() => document.exitPointerLock());
  expect(errors).toEqual([]);
});
