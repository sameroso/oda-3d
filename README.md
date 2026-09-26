# Ronin — Movement Lab

A Three.js character playground using the supplied Meshy samurai GLBs.

## Run

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and creates the production build.

## Controls

- WASD or arrow keys: walk relative to the camera.
- Hold Shift while moving: run.
- Drag: orbit the camera. Scroll: zoom.
- Reset position: return the character and camera to the center.
- Touch screens show direction and run buttons; hold Run together with a direction.

The arena has a circular movement boundary. Movement uses delta time, normalized diagonal input, smooth turning, and acceleration. Input clears when the window loses focus.

Both files share a skeleton. The walking model renders the character; walking and running clips blend on its AnimationMixer. Horizontal hip translation is held fixed so keyboard movement controls world position. Idle uses the rig's authored resting bone transforms, captured before animation playback, with smooth blending back from walking and running.

Animation reference: https://threejsresources.com/guides/animation

Idle-pose regression: with the dev server running and Chrome installed, run `npm run test:idle`. It compares all 22 animated bones against the GLB's stored pose on load and after repeated walking/running transitions. Set `TEST_URL` to test another server URL.
