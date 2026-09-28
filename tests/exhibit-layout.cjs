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
      await route.fulfill({ response, body: await response.text() + '\nwindow.__layout = { THREE, scene, camera, orbit, player, exhibits, constrainPosition, nearestExhibit, renderer };' });
    });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/');
    await page.locator('#loading').waitFor({ state: 'hidden', timeout: 120000 });
    await page.evaluate(() => {
      const { THREE: T, scene, player } = window.__layout;
      const ray = new T.Raycaster(new T.Vector3(player.position.x, 1, player.position.z), new T.Vector3(0, -1, 0));
      const ground = ray.intersectObject(scene.getObjectByName('Overgrown Japanese location'), true)[0].point.y;
      const feet = new T.Box3().setFromObject(player, true).min.y;
      if (feet < ground || feet - ground > 0.03) throw new Error(`Feet are not on the paving: feet=${feet}, ground=${ground}`);
      for (const object of scene.children.filter(object => object.name.startsWith('Character display:'))) {
        const bounds = new T.Box3().setFromObject(object);
        if (bounds.max.y - bounds.min.y < 3) throw new Error('Display is too short compared to the character');
        if (Math.abs(bounds.min.y - ground) > 0.03) throw new Error('Display base is not on the paving');
      }
    });
    for (let index = 0; index < 6; index++) {
      const name = await page.evaluate(index => {
        const { player, exhibits, constrainPosition, nearestExhibit } = window.__layout;
        const e = exhibits[index];
        const sine = Math.sin(e.rotation), cosine = Math.cos(e.rotation);
        const p = e.position.clone();
        constrainPosition(p);
        const dx = p.x - e.position.x, dz = p.z - e.position.z;
        if (Math.abs(cosine * dx - sine * dz) < 1.79 - 1e-6 && Math.abs(sine * dx + cosine * dz) < 0.83 - 1e-6) throw new Error('Display collision failed');
        p.copy(e.position); p.x -= sine; p.z -= cosine;
        if (nearestExhibit(p) === index) throw new Error('Display activates from behind');
        player.position.copy(e.position);
        player.position.x += sine * 1.5;
        player.position.z += cosine * 1.5;
        if (nearestExhibit(player.position) !== index) throw new Error('Display is not reachable from its front');
        return e.name;
      }, index);
      await page.waitForFunction(name => document.querySelector('#profile-name').textContent === name, name);
      await page.keyboard.press('e');
      await page.locator('#inspection').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#inspection-name').innerText(), name);
      await page.keyboard.press('Escape');
    }
    await page.evaluate(() => {
      const { player, constrainPosition } = window.__layout;
      // The east entrance, northwest stairs, and southwest shrine approach stay clear.
      for (const [x, z] of [[5.5, 0], [-4.3, -4.3], [-4, 4], [0, 0], [0, 3]]) {
        const p = player.position.clone().set(x, 0, z);
        constrainPosition(p);
        if (p.x !== x || p.z !== z) throw new Error('An entrance or central route is blocked');
      }
    });
    await page.locator('#reset').click();
    await page.locator('#profile').waitFor({ state: 'hidden' });
    await page.screenshot({ path: 'exhibit-layout-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'exhibit-layout-mobile.png' });
    await page.setViewportSize({ width: 1100, height: 1000 });
    await page.evaluate(() => {
      const { camera, orbit } = window.__layout;
      orbit.maxDistance = 100;
      orbit.target.set(0, 0, 0);
      camera.position.set(0, 38, 0.01);
      orbit.update();
    });
    await page.screenshot({ path: 'exhibit-layout-overhead.png' });
    assert.deepEqual(errors, []);
    console.log('PASS six rotated displays: front inspection, rear rejection, collisions, clear entrances, desktop/mobile rendering');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
