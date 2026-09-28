import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// The imported courtyard paving is at y=0.192; leave a small contact clearance.
export const courtyardFloorHeight = 0.2
const displayScale = 0.8
const displayHalfWidth = 1.8 * displayScale + 0.35
const displayHalfDepth = 0.6 * displayScale + 0.35

export const exhibits: { name: string; description: string; image: string; position: THREE.Vector3; rotation: number }[] = [{
  name: 'Agente Victor-Daniel Sass',
  description: 'Este é o agente Victor. Gente boa',
  image: `${import.meta.env.BASE_URL}exhibits/victor-daniel.png`,
  position: new THREE.Vector3(-5.2, 0, -1.2),
  rotation: Math.atan2(5.2, 1.2),
}, {
  name: 'Besouro Mangagá',
  description: 'Este é o Besouro Mangagá direto da bahia.',
  image: `${import.meta.env.BASE_URL}exhibits/besouro.png`,
  position: new THREE.Vector3(-1.8, 0, -5.2),
  rotation: Math.atan2(1.8, 5.2),
}, {
  name: 'Dra. Pâmela Randall',
  description: 'Esta é a doutora que fez doutorado.',
  image: `${import.meta.env.BASE_URL}exhibits/pamela-randall.png`,
  position: new THREE.Vector3(1.8, 0, -5.2),
  rotation: Math.atan2(-1.8, 5.2),
}, {
  name: 'Tolui Khan',
  description: 'Este é o filho de Gengis Khan.',
  image: `${import.meta.env.BASE_URL}exhibits/tolui-khan.png`,
  position: new THREE.Vector3(4.6, 0, -3.2),
  rotation: Math.atan2(-4.6, 3.2),
}, {
  name: 'Vivian Hunter',
  description: 'Esta é o Vivian Hunter. Gente boníssima.',
  image: `${import.meta.env.BASE_URL}exhibits/vivian-hunter.png`,
  position: new THREE.Vector3(4.1, 0, 3.7),
  rotation: Math.atan2(-4.1, -3.7),
}, {
  name: 'Princesa Thakane',
  description: 'Esta é a Princesa Thakane. Gosta de shopping centers.',
  image: `${import.meta.env.BASE_URL}exhibits/princesa-thakane.png`,
  position: new THREE.Vector3(-4.1, 0, 5.8),
  rotation: Math.atan2(4.1, -5.8),
}]


export async function createCourtyard(scene: THREE.Scene) {
  const { scene: environment } = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}an_overgrown_japanese-style_location.glb`)
  environment.name = 'Overgrown Japanese location'
  environment.scale.setScalar(2)
  environment.traverse(object => {
    if (object instanceof THREE.Mesh) object.receiveShadow = true
  })
  scene.add(environment)
  const timber = new THREE.MeshStandardMaterial({ color: '#574436', roughness: .9 })
  const stone = new THREE.MeshStandardMaterial({ color: '#bcbcaf', roughness: 1 })
  function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    parent.add(mesh)
  }
  const loader = new THREE.TextureLoader()
  for (const exhibit of exhibits) {
    exhibit.position.y = courtyardFloorHeight
    const display = new THREE.Group()
    display.name = `Character display: ${exhibit.name}`
    display.scale.setScalar(displayScale)
    display.position.copy(exhibit.position)
    display.rotation.y = exhibit.rotation
    scene.add(display)
    box(display, 0, .12, 0, 3.6, .24, 1.2, stone)
    for (const x of [-1.55, 1.55]) box(display, x, 1.9, 0, .16, 3.8, .22, timber)
    box(display, 0, 3.65, 0, 3.5, .18, .35, timber)
    box(display, 0, 2.1, 0, 2.95, 2.85, .16, timber)
    const texture = loader.load(exhibit.image)
    texture.colorSpace = THREE.SRGBColorSpace
    const artwork = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.6), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }))
    artwork.position.set(0, 2.1, .09)
    display.add(artwork)
  }
}

export function constrainPosition(position: THREE.Vector3) {
  position.y = courtyardFloorHeight
  position.x = THREE.MathUtils.clamp(position.x, -11.3, 11.3)
  position.z = THREE.MathUtils.clamp(position.z, -11.2, 11.2)
  for (const exhibit of exhibits) {
    const dx = position.x - exhibit.position.x
    const dz = position.z - exhibit.position.z
    const cosine = Math.cos(exhibit.rotation)
    const sine = Math.sin(exhibit.rotation)
    // Resolve collisions in the rotated display's local coordinates.
    let localX = cosine * dx - sine * dz
    let localZ = sine * dx + cosine * dz
    const overlapX = displayHalfWidth - Math.abs(localX)
    const overlapZ = displayHalfDepth - Math.abs(localZ)
    if (overlapX > 0 && overlapZ > 0) {
      if (overlapX < overlapZ) localX += (localX < 0 ? -1 : 1) * overlapX
      else localZ += (localZ < 0 ? -1 : 1) * overlapZ
      position.x = exhibit.position.x + cosine * localX + sine * localZ
      position.z = exhibit.position.z - sine * localX + cosine * localZ
    }
  }
}

export function nearestExhibit(position: THREE.Vector3, current = -1) {
  let nearest = -1
  let distance = Infinity
  exhibits.forEach((exhibit, index) => {
    const front = (position.x - exhibit.position.x) * Math.sin(exhibit.rotation)
      + (position.z - exhibit.position.z) * Math.cos(exhibit.rotation)
    const nextDistance = position.distanceTo(exhibit.position)
    if (front > displayHalfDepth && nextDistance < (index === current ? 2.1 : 1.8) && nextDistance < distance) {
      nearest = index
      distance = nextDistance
    }
  })
  return nearest
}

