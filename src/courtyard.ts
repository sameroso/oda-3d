import * as THREE from 'three'

export const exhibits: { name: string; description: string; image: string; position: THREE.Vector3; rotation: number }[] = [{
  name: 'Agente Victor-Daniel Sass',
  description: 'Este é o agente Victor. Gente boa',
  image: `${import.meta.env.BASE_URL}exhibits/victor-daniel.png`,
  position: new THREE.Vector3((0 % 3 - 1) * 7, 0, 0 < 3 ? -8 : 8),
  rotation: 0 < 3 ? 0 : Math.PI,
}, {
  name: 'Besouro Mangagá',
  description: 'Este é o Besouro Mangagá direto da bahia.',
  image: `${import.meta.env.BASE_URL}exhibits/besouro.png`,
  position: new THREE.Vector3((1 % 3 - 1) * 7, 0, 1 < 3 ? -8 : 8),
  rotation: 1 < 3 ? 0 : Math.PI,
}, {
  name: 'Dra. Pâmela Randall',
  description: 'Esta é a doutora que fez doutorado.',
  image: `${import.meta.env.BASE_URL}exhibits/pamela-randall.png`,
  position: new THREE.Vector3((2 % 3 - 1) * 7, 0, 2 < 3 ? -8 : 8),
  rotation: 2 < 3 ? 0 : Math.PI,
}, {
  name: 'Tolui Khan',
  description: 'Este é o filho de Gengis Khan.',
  image: `${import.meta.env.BASE_URL}exhibits/tolui-khan.png`,
  position: new THREE.Vector3((3 % 3 - 1) * 7, 0, 3 < 3 ? -8 : 8),
  rotation: 3 < 3 ? 0 : Math.PI,
}, {
  name: 'Vivian Hunter',
  description: 'Esta é o Vivian Hunter. Gente boníssima.',
  image: `${import.meta.env.BASE_URL}exhibits/vivian-hunter.png`,
  position: new THREE.Vector3((4 % 3 - 1) * 7, 0, 4 < 3 ? -8 : 8),
  rotation: 4 < 3 ? 0 : Math.PI,
}, {
  name: 'Princesa Thakane',
  description: 'Esta é a Princesa Thakane. Gosta de shopping centers.',
  image: `${import.meta.env.BASE_URL}exhibits/princesa-thakane.png`,
  position: new THREE.Vector3((5 % 3 - 1) * 7, 0, 5 < 3 ? -8 : 8),
  rotation: 5 < 3 ? 0 : Math.PI,
}]


export function createCourtyard(scene: THREE.Scene) {
  const timber = new THREE.MeshStandardMaterial({ color: '#574436', roughness: .9 })
  const stone = new THREE.MeshStandardMaterial({ color: '#bcbcaf', roughness: 1 })
  const plaster = new THREE.MeshStandardMaterial({ color: '#e2d9c4', roughness: 1 })
  const roof = new THREE.MeshStandardMaterial({ color: '#535e59', roughness: .9 })
  function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    parent.add(mesh)
  }
  box(scene, 0, -.13, 0, 29, .25, 25, new THREE.MeshStandardMaterial({ color: '#d3cfbd', roughness: 1 }))
  for (let x = -12; x <= 12; x += 2) for (let z = -10; z <= 10; z += 2) box(scene, x, .015, z, 1.94, .035, 1.94, stone)
  for (const side of [-1, 1]) {
    box(scene, 0, 1.2, side * 12.5, 29, 2.4, .35, plaster)
    box(scene, 0, 2.5, side * 12.5, 29.6, .22, 1, roof)
    box(scene, side * 14.5, 1.2, 0, .35, 2.4, 25, plaster)
    box(scene, side * 14.5, 2.5, 0, 1, .22, 26, roof)
    for (let x = -14; x <= 14; x += 3.5) box(scene, x, 1.2, side * 12.3, .18, 2.4, .2, timber)
    for (const z of [-9, 0, 9]) {
      box(scene, side * 12.8, .15, z, 2, .3, 3, roof)
      box(scene, side * 12.8, .32, z, 1.85, .12, 2.85, new THREE.MeshStandardMaterial({ color: '#728064' }))
      box(scene, side * 12.8, 1.65, z, .22, 2.7, .22, timber)
      for (let layer = 0; layer < 3; layer++) {
        const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.25 - layer * .2, 12, 8), new THREE.MeshStandardMaterial({ color: ['#62795a', '#788b63', '#899969'][layer] }))
        leaves.scale.y = .45
        leaves.position.set(side * 12.8 + (layer === 1 ? .35 : 0), 2.2 + layer * .55, z)
        leaves.castShadow = true
        scene.add(leaves)
      }
    }
  }
  const loader = new THREE.TextureLoader()
  for (const exhibit of exhibits) {
    const display = new THREE.Group()
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
  position.x = THREE.MathUtils.clamp(position.x, -11.3, 11.3)
  position.z = THREE.MathUtils.clamp(position.z, -11.2, 11.2)
  for (const exhibit of exhibits) {
    const dx = position.x - exhibit.position.x
    const dz = position.z - exhibit.position.z
    const overlapX = 2.15 - Math.abs(dx)
    const overlapZ = 1.05 - Math.abs(dz)
    if (overlapX > 0 && overlapZ > 0) {
      if (overlapX < overlapZ) position.x += (dx < 0 ? -1 : 1) * overlapX
      else position.z += (dz < 0 ? -1 : 1) * overlapZ
    }
  }
}

export function nearestExhibit(position: THREE.Vector3, current = -1) {
  let nearest = -1
  let distance = Infinity
  exhibits.forEach((exhibit, index) => {
    const front = (position.z - exhibit.position.z) * (index < 3 ? 1 : -1)
    const nextDistance = position.distanceTo(exhibit.position)
    if (front > .6 && nextDistance < (index === current ? 4.2 : 3.7) && nextDistance < distance) {
      nearest = index
      distance = nextDistance
    }
  })
  return nearest
}

