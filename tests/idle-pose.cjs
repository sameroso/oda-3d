const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
 const bytes = fs.readFileSync('public/Meshy_AI_samurai_mecha_rigged_biped_Animation_Walking_withSkin.glb');
 const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
 const expected = gltf.nodes.filter(n => n.name?.startsWith('mixamorig:'));
 const browser = await chromium.launch({channel:'chrome', headless:true, args:['--enable-unsafe-swiftshader']});
 try {
 const page = await browser.newPage();
 await page.route('**/src/main.ts*', async route => {const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__idleTest = { player };'});});
 await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/');
 await page.locator('#loading').waitFor({state:'hidden'});
 async function checkPose(label) {
 const mismatches = await page.evaluate(nodes => nodes.filter(n => {
 const bone = window.__idleTest.player.getObjectByName(n.name.replace(/:/g,''));
 if (!bone) return true;
 const position=n.translation||[0,0,0]; const rotation=n.rotation||[0,0,0,1];
 return bone.position.toArray().some((v,i)=>Math.abs(v-position[i])>1e-4) || Math.abs(bone.quaternion.toArray().reduce((sum,v,i)=>sum+v*rotation[i],0))<0.99999;
 }).map(n=>n.name), expected);
 if(mismatches.length) throw new Error(label+': '+mismatches.length+' bones differ from authored idle: '+mismatches.join(', '));
 console.log('PASS '+label+' matches all '+expected.length+' authored bone transforms');
 }
 await checkPose('Initial idle');
 for(const run of [false,true,false,true]) {
 await page.keyboard.down('w');if(run) await page.keyboard.down('Shift');await page.waitForTimeout(700);
 const state=await page.locator('#state').innerText();if(state!==(run?'Running':'Walking')) throw new Error('Wrong movement state: '+state);
 await page.keyboard.up('w');await page.keyboard.up('Shift');await page.waitForTimeout(1200);await checkPose(run?'Run to idle':'Walk to idle');
 }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1});


