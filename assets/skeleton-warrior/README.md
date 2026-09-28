# Skeleton warrior
Stylized static model based on the supplied reference. No armature or animations.

- Editable scene: skeleton-warrior.blend
- Web asset: ../../public/models/skeleton-warrior.glb
- Preview: preview.png
- Procedural starting model: build.py (before final mesh optimization and rust placement cleanup)
- Final export: 58,040 triangles, 11 meshes, 11 PBR materials, 1,575,420 bytes.
- No external textures or decoder dependencies.
- GLB uses Y-up, meters; approximately 3 units tall including the base.
- Original default Blender scene is preserved separately; only the Warrior collection is exported.
- Validated with the installed Three.js GLTFLoader.

Load from this project's public directory:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const { scene: warrior } = await new GLTFLoader().loadAsync('/models/skeleton-warrior.glb');
scene.add(warrior);
warrior.traverse(object => {
  if (object.isMesh) {
    object.castShadow = true;
    object.receiveShadow = true;
  }
});
```

Use scene lighting or an environment map for the metallic materials.
