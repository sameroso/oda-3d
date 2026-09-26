import './style.css'
import * as THREE from 'three'
import { createCourtyard, constrainPosition, nearestExhibit, exhibits } from './courtyard'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <div class="viewport" aria-label="Explorable manga courtyard"></div>
  <header><div class="brand"><span class="mark">侍</span><div>RONIN<span class="subtitle">CHARACTER COURTYARD</span></div></div><span class="badge"><i></i> SIX CHARACTER STUDIES</span></header>
  <section class="intro"><span class="eyebrow">THE MANGA COLLECTION</span><h1>Every path, a story.</h1><p>Walk up to a drawing to meet its character.</p></section>
  <aside class="telemetry" hidden><span class="eyebrow">LOCOMOTION</span><strong id="state">Loading</strong><div class="meter"><i id="meter"></i></div><span id="speed">0.0 m/s</span></aside>
  <footer><div class="controls"><span><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> Move</span><span><kbd>SHIFT</kbd> Run</span><span>Drag to orbit · Scroll to zoom</span></div><button id="reset">Return to center ↗</button></footer>
  <div class="touch"><button data-key="KeyW" aria-label="Move forward">↑</button><div><button data-key="KeyA" aria-label="Move left">←</button><button data-key="KeyS" aria-label="Move back">↓</button><button data-key="KeyD" aria-label="Move right">→</button><button data-key="ShiftLeft">RUN</button></div></div>
  <section id="profile" hidden aria-live="polite"><span class="eyebrow">CHARACTER STUDY · PLACEHOLDER</span><h2 id="profile-name"></h2><p id="profile-description"></p><button id="inspect">Inspect artwork <kbd>E</kbd></button></section>
  <dialog id="inspection" aria-labelledby="inspection-name"><button id="close-inspection" aria-label="Close artwork inspection">Close ✕</button><img id="inspection-art" alt=""><div><span class="eyebrow">MANGA COLLECTION · PLACEHOLDER</span><h2 id="inspection-name"></h2><p id="inspection-description"></p><small>Press Esc or Close to return to the courtyard.</small></div></dialog>
  <div id="loading" role="status"><span class="spinner"></span><strong>Preparing your mecha</strong><span>Loading walking & running animations…</span></div>`
const stateLabel = document.querySelector<HTMLElement>('#state')!
const speedLabel = document.querySelector<HTMLElement>('#speed')!
const meter = document.querySelector<HTMLElement>('#meter')!
const loading = document.querySelector<HTMLElement>('#loading')!
const scene = new THREE.Scene()
scene.background = new THREE.Color('#e7e5d9')
scene.fog = new THREE.Fog('#e7e5d9', 28, 75)
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 120)
camera.position.set(6, 4.5, 8)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
app.querySelector('.viewport')!.appendChild(renderer.domElement)
const orbit = new OrbitControls(camera, renderer.domElement)
orbit.target.set(0, 1.2, 0)
orbit.enableDamping = true
orbit.enablePan = false
orbit.minDistance = 4
orbit.maxDistance = 16
orbit.maxPolarAngle = Math.PI / 2 - 0.08
scene.add(new THREE.HemisphereLight(0xf5ffff, 0x5b6961, 2.5))
const sun = new THREE.DirectionalLight(0xfff0d8, 3.5)
sun.position.set(8, 14, 6)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, far: 60 })
sun.shadow.normalBias = 0.035
scene.add(sun)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x9ba58c, roughness: 0.95 }))
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)
createCourtyard(scene)
const player = new THREE.Group()
scene.add(player)
const keys = new Set<string>()
const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'])
window.addEventListener('keydown', event => {
  if (event.code === 'KeyE' && !event.repeat && !inspection.open) openInspection()
  if (inspection.open) return
  if (movementKeys.has(event.code)) { event.preventDefault(); keys.add(event.code) }
})
window.addEventListener('keyup', event => keys.delete(event.code))
function clearInput() { keys.clear(); document.querySelectorAll('.touch button').forEach(button => button.classList.remove('pressed')) }
window.addEventListener('blur', clearInput)
document.addEventListener('visibilitychange', clearInput)
document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => {
  button.addEventListener('pointerdown', event => { event.preventDefault(); if (inspection.open) return; button.setPointerCapture(event.pointerId); keys.add(button.dataset.key!); button.classList.add('pressed') })
  const release = () => { keys.delete(button.dataset.key!); button.classList.remove('pressed') }
  button.addEventListener('pointerup', release)
  button.addEventListener('pointercancel', release)
  button.addEventListener('lostpointercapture', release)
})
let mixer: THREE.AnimationMixer | undefined
let actions: Record<string, THREE.AnimationAction> = {}
let currentState = 'Idle'
let speed = 0
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const previousPosition = new THREE.Vector3()
const cameraShift = new THREE.Vector3()
const targetRotation = new THREE.Quaternion()
const up = new THREE.Vector3(0, 1, 0)
const profile = document.querySelector<HTMLElement>('#profile')!
const inspection = document.querySelector<HTMLDialogElement>('#inspection')!
const inspectButton = document.querySelector<HTMLButtonElement>('#inspect')!
let activeExhibit = -1
function updateProfile() {
  const next = nearestExhibit(player.position, activeExhibit)
  if (next === activeExhibit) return
  activeExhibit = next
  profile.hidden = next < 0
  if (next < 0) return
  document.querySelector('#profile-name')!.textContent = exhibits[next].name
  document.querySelector('#profile-description')!.textContent = exhibits[next].description
}
function openInspection() {
  if (activeExhibit < 0 || !mixer) return
  const exhibit = exhibits[activeExhibit]
  const art = document.querySelector<HTMLImageElement>('#inspection-art')!
  art.src = exhibit.image
  art.alt = exhibit.name + ' — placeholder for the original manga drawing'
  document.querySelector('#inspection-name')!.textContent = exhibit.name
  document.querySelector('#inspection-description')!.textContent = exhibit.description
  clearInput()
  velocity.set(0, 0, 0)
  orbit.enabled = false
  inspection.showModal()
}
inspectButton.addEventListener('click', openInspection)
document.querySelector('#close-inspection')!.addEventListener('click', () => inspection.close())
inspection.addEventListener('close', () => {
  clearInput()
  orbit.enabled = true
  inspectButton.focus({ preventScroll: true })
})
function reset() {
  clearInput()
  player.position.set(0, 0, 0)
  player.rotation.set(0, 0, 0)
  velocity.set(0, 0, 0)
  camera.position.set(6, 4.5, 8)
  orbit.target.set(0, 1.2, 0)
  orbit.update()
}
document.querySelector('#reset')!.addEventListener('click', reset)

// Keep skeletal motion, but remove horizontal root travel so controls own world movement.
function inPlace(source: THREE.AnimationClip) {
  const clip = source.clone()
  for (const track of clip.tracks) {
    if (/Hips\.position$/.test(track.name)) {
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] = track.values[0]
        track.values[i + 2] = track.values[2]
      }
    }
  }
  return clip
}
async function loadCharacter() {
  const loader = new GLTFLoader()
  const base = import.meta.env.BASE_URL
  const [walking, running] = await Promise.all([
    loader.loadAsync(`${base}Meshy_AI_samurai_mecha_rigged_biped_Animation_Walking_withSkin.glb`),
    loader.loadAsync(`${base}Meshy_AI_samurai_mecha_rigged_biped_Animation_Running_withSkin.glb`),
  ])
  if (!walking.animations[0] || !running.animations[0]) throw new Error('An animation clip is missing from a model.')
  const model = walking.scene
  model.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(model)
  const scale = 2.7 / bounds.getSize(new THREE.Vector3()).y
  model.scale.multiplyScalar(scale)
  model.updateMatrixWorld(true)
  bounds.setFromObject(model)
  const center = bounds.getCenter(new THREE.Vector3())
  model.position.add(new THREE.Vector3(-center.x, -bounds.min.y, -center.z))
  model.traverse(object => {
    if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; object.frustumCulled = false }
  })
  player.add(model)
  mixer = new THREE.AnimationMixer(model)
  const walk = inPlace(walking.animations[0])
  const run = inPlace(running.animations[0])
  // Capture the authored resting pose before animation playback changes the rig.
  // Constant tracks allow smooth blending back to these exact bone transforms.
  const idleTracks: THREE.KeyframeTrack[] = []
  model.traverse(object => {
    if (!(object instanceof THREE.Bone)) return
    idleTracks.push(
      new THREE.VectorKeyframeTrack(object.uuid + '.position', [0], object.position.toArray()),
      new THREE.QuaternionKeyframeTrack(object.uuid + '.quaternion', [0], object.quaternion.toArray()),
      new THREE.VectorKeyframeTrack(object.uuid + '.scale', [0], object.scale.toArray()),
    )
  })
  const idle = new THREE.AnimationClip('Authored idle pose', 1, idleTracks)
  actions = { Idle: mixer.clipAction(idle), Walking: mixer.clipAction(walk), Running: mixer.clipAction(run) }
  actions.Idle.play()
  mixer.update(0)
  loading.hidden = true
  stateLabel.textContent = 'Idle'
}
loadCharacter().catch(error => {
  console.error(error)
  loading.replaceChildren()
  const message = document.createElement('strong')
  message.textContent = 'Unable to load the mecha. Please reload to try again.'
  loading.append(message)
  stateLabel.textContent = 'Load failed'
})
let lastTime = performance.now()
renderer.setAnimationLoop(now => {
  const dt = Math.min((now - lastTime) / 1000, 0.05)
  lastTime = now
  if (mixer && !inspection.open) {
    const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'))
    const z = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'))
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, up).normalize()
    direction.copy(forward).multiplyScalar(z).addScaledVector(right, x).normalize()
    const targetSpeed = direction.lengthSq() ? (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 6 : 2.4) : 0
    velocity.lerp(direction.multiplyScalar(targetSpeed), 1 - Math.exp(-12 * dt))
    if (velocity.lengthSq() < 0.0001) velocity.set(0, 0, 0)
    previousPosition.copy(player.position)
    player.position.addScaledVector(velocity, dt)
    constrainPosition(player.position)
    updateProfile()
    speed = player.position.distanceTo(previousPosition) / Math.max(dt, 0.001)
    if (speed > 0.05) {
      targetRotation.setFromAxisAngle(up, Math.atan2(velocity.x, velocity.z))
      player.quaternion.rotateTowards(targetRotation, dt * 10)
    }
    const nextState = speed < 0.1 ? 'Idle' : targetSpeed > 3 ? 'Running' : 'Walking'
    if (nextState !== currentState) {
      const next = actions[nextState]
      next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play()
      actions[currentState].crossFadeTo(next, 0.2, false)
      currentState = nextState
      stateLabel.textContent = currentState
    }
    if (currentState !== 'Idle') actions[currentState].setEffectiveTimeScale(THREE.MathUtils.clamp(speed / (currentState === 'Running' ? 6 : 2.4), 0.25, 1.3))
    mixer.update(dt)
    cameraShift.copy(player.position).sub(previousPosition)
    camera.position.add(cameraShift)
    orbit.target.add(cameraShift)
    speedLabel.textContent = `${speed.toFixed(1)} m/s`
    meter.style.width = `${Math.min(speed / 6, 1) * 100}%`
  }
  orbit.update()
  renderer.render(scene, camera)
})
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
})

