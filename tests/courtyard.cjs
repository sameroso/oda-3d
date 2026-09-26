const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()) + '\nwindow.__courtyardTest = { player, camera, orbit, exhibits, constrainPosition, nearestExhibit };' });
    });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/');
    await page.locator('#loading').waitFor({ state: 'hidden' });
    for (let index = 0; index < 6; index++) {
      await page.evaluate(index => {
        const { player, exhibits } = window.__courtyardTest;
        player.position.copy(exhibits[index].position);
        player.position.z += index < 3 ? 2.5 : -2.5;
      }, index);
      await page.waitForFunction(index => document.querySelector('#profile-name').textContent === `Character 0${index+1}`, index);
      assert.equal(await page.locator('#profile').isVisible(), true);
      await page.keyboard.press('e');
      await page.locator('#inspection').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#inspection-name').innerText(), `Character 0${index+1}`);
      await page.waitForFunction(() => { const img = document.querySelector('#inspection-art'); return img.complete && img.naturalWidth > 0; });
      const before = await page.evaluate(() => { const t = window.__courtyardTest; return [t.player.position.toArray(), t.camera.position.toArray()]; });
      await page.keyboard.down('w');
      await page.waitForTimeout(200);
      await page.keyboard.up('w');
      const after = await page.evaluate(() => { const t = window.__courtyardTest; return [t.player.position.toArray(), t.camera.position.toArray()]; });
      assert.deepEqual(after, before);
      if (index % 2) await page.locator('#close-inspection').click();
      else await page.keyboard.press('Escape');
      await page.locator('#inspection').waitFor({ state: 'hidden' });
    }
    console.log('PASS all six profiles, artwork loading, keyboard/tap inspection, movement/camera freeze, Escape/Close');
    await page.evaluate(() => window.__courtyardTest.player.position.set(0, 0, 0));
    await page.locator('#profile').waitFor({ state: 'hidden' });
    const checks = await page.evaluate(() => {
      const { player, exhibits, constrainPosition, nearestExhibit } = window.__courtyardTest;
      const p = player.position.clone();
      const collision = exhibits.every(e => { p.copy(e.position); constrainPosition(p); return Math.abs(p.z-e.position.z) >= 1.05 - 1e-8 || Math.abs(p.x-e.position.x) >= 2.15 - 1e-8; });
      p.set(100, 0, 100); constrainPosition(p);
      const bounds = p.x <= 11.3 && p.z <= 11.2;
      p.copy(exhibits[0].position); p.z -= 2;
      return { collision, bounds, back: nearestExhibit(p) === -1 };
    });
    assert.deepEqual(checks, { collision: true, bounds: true, back: true });
    console.log('PASS walk-away dismissal, exhibit collision, courtyard bounds, no activation behind displays');
    await page.screenshot({ path: 'courtyard-preview.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.__courtyardTest.player.position.set(0, 0, -5.5));
    await page.locator('#profile').waitFor({ state: 'visible' });
    await page.locator('#inspect').click();
    await page.locator('#inspection').waitFor({ state: 'visible' });
    const rect = await page.locator('#inspection').boundingBox();
    assert(rect.x >= 0 && rect.x + rect.width <= 390);
    await page.locator('#close-inspection').click();
    assert.deepEqual(errors, []);
    console.log('PASS narrow-screen inspection and no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });


