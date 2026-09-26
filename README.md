# Ronin — Character Courtyard

An explorable Japanese courtyard using the supplied Meshy samurai GLBs, with six manga character displays.

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
- Return to center: return the character and camera to the center.
- Touch screens show direction and run buttons; hold Run together with a direction.

The courtyard has rectangular movement bounds and solid display bases. Movement uses delta time, normalized diagonal input, smooth turning, and acceleration. Input clears when the window loses focus.

Both files share a skeleton. The walking model renders the character; walking and running clips blend on its AnimationMixer. Horizontal hip translation is held fixed so keyboard movement controls world position. Idle uses the rig's authored resting bone transforms, captured before animation playback, with smooth blending back from walking and running.

Animation reference: https://threejsresources.com/guides/animation

Idle-pose regression: with the dev server running and Chrome installed, run `npm run test:idle`. It compares all 22 animated bones against the GLB's stored pose on load and after repeated walking/running transitions. Set `TEST_URL` to test another server URL.

## Character displays

Walk up to the front of a display to see its name and short neutral description. Press E or tap Inspect artwork to enlarge it. Inspection pauses movement and camera updates; Esc or Close returns to the courtyard. Moving away dismisses the short description.

The six exhibits currently use explicitly labeled placeholders. Replace the SVG files in `public/exhibits/` with manga artwork, and edit the image paths, names, and descriptions in `src/courtyard.ts`. Image paths use Vite's base URL for deployment below a subdirectory.

With the dev server running and Chrome installed, run `npm run test:courtyard` to check all six displays, proximity dismissal, collision boundaries, inspection freeze, both close controls, artwork loading, and narrow-screen inspection.
