/**
 * Traffic: hover cars and vans in lanes above the avenue and along the kerbs, and a
 * freighter gliding overhead. The models come from /models/vehicles.glb (built by
 * tools/vehicles/build_vehicles.py); each kind is drawn in one instanced call, plus one
 * call for all light trails and one for the glare of head and tail lights.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLSL } from './shared.js'

// Material names in the model file, in the order the shader numbers them.
const PARTS = ['Paint', 'Dark', 'Glass', 'Head', 'Tail', 'Neon', 'Glow', 'Window']

/** One geometry per vehicle, with each vertex tagged by which part it belongs to. */
function vehicleGeometry(root, name) {
  const object = root.getObjectByName(name)
  if (!object) throw new Error(`vehicles.glb has no ${name}`)
  object.updateWorldMatrix(true, true)
  const pieces = []
  object.traverse((node) => {
    if (!node.isMesh) return
    const piece = new THREE.BufferGeometry()
    piece.setIndex(node.geometry.index)
    piece.setAttribute('position', node.geometry.getAttribute('position'))
    piece.setAttribute('normal', node.geometry.getAttribute('normal'))
    piece.applyMatrix4(node.matrixWorld)
    const part = Math.max(0, PARTS.indexOf(node.material.name))
    piece.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(piece.getAttribute('position').count).fill(part), 1))
    pieces.push(piece)
  })
  return mergeGeometries(pieces)
}

// Shared by the three draw calls: where a vehicle is and which way it faces.
const PLACE = /* glsl */ `
  attribute vec4 aLane;   // x, height, place on the loop, speed over the ground (+ toward the camera)
  attribute vec4 aLook;   // size, paint, phase, length of the vehicle
  uniform float uScroll, uTime, uReveal;
  ${GLSL}
  // local position (nose at +z) to world
  vec3 place(vec3 local) {
    float heading = aLane.w > 0.0 ? 1.0 : -1.0;
    float sway = sin(uTime * 0.9 + aLook.z * 40.0);
    local = turn(local, vec3(0.0, 0.0, 1.0), sway * 0.07);                 // a slight roll
    local.xz *= heading;
    return local * aLook.x * smoothstep(0.3, 0.8, uReveal)
      + vec3(aLane.x + sway * 0.25, aLane.y + sin(uTime * 1.3 + aLook.z * 70.0) * 0.18, loopZ(aLane.z, uScroll + uTime * aLane.w));
  }
`

function bodyMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aPart;
      ${PLACE}
      varying vec3 vWorld, vNormalW;
      varying vec3 vTag;   // part, paint, phase
      void main() {
        vWorld = place(position);
        vNormalW = normalize(place(position + normal * 0.01) - vWorld);
        vTag = vec3(aPart, aLook.y, aLook.z);
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld, vNormalW, vTag;
      uniform float uTime, uDim;
      uniform vec3 uCyan, uMagenta, uFog;
      ${GLSL}
      void main() {
        vec3 n = normalize(vNormalW);
        vec3 view = normalize(cameraPosition - vWorld);
        float part = vTag.x;
        float paint = vTag.y;
        vec3 accent = paint < 0.5 ? uCyan : uMagenta;

        vec3 body = paint < 0.2 ? vec3(0.02, 0.13, 0.15) : paint < 0.4 ? vec3(0.07, 0.075, 0.09) : paint < 0.55 ? vec3(0.5, 0.52, 0.56)
          : paint < 0.7 ? vec3(0.62, 0.33, 0.03) : paint < 0.85 ? vec3(0.36, 0.02, 0.05) : vec3(0.17, 0.04, 0.32);
        vec3 albedo = part < 0.5 ? body : part < 1.5 ? vec3(0.025, 0.027, 0.035) : vec3(0.008, 0.01, 0.016);

        // moonlight, the glow of the street from underneath, and a glossy pick-up of the sky
        vec3 moon = vec3(0.34, 0.42, 0.7) * max(dot(n, normalize(vec3(-0.45, 0.7, 0.55))), 0.0);
        vec3 street = mix(uMagenta, uCyan, 0.5 + 0.5 * n.x) * max(-n.y * 0.7 + 0.3, 0.0) * exp(-max(vWorld.y, 0.0) * 0.05);
        vec3 col = albedo * (vec3(0.1, 0.09, 0.16) + moon + street);
        vec3 sky = mix(vec3(0.3, 0.04, 0.34), vec3(0.03, 0.02, 0.09), clamp(reflect(-view, n).y * 1.6 + 0.2, 0.0, 1.0));
        col += sky * pow(clamp(1.0 - dot(view, n), 0.0, 1.0), 3.0) * (part > 1.5 && part < 2.5 ? 1.0 : 0.35);

        if (part > 6.5) col = vec3(1.0, 0.7, 0.38) * 1.5;                                               // windows
        else if (part > 5.5) col = vec3(0.35, 0.9, 1.0) * (2.0 + 0.7 * sin(uTime * 11.0 + vTag.z * 50.0));  // thrusters
        else if (part > 4.5) col = accent * 2.2;                                                        // neon trim
        else if (part > 3.5) col = vec3(1.0, 0.07, 0.22) * 2.6;                                         // tail lights
        else if (part > 2.5) col = vec3(0.85, 0.95, 1.0) * 3.2;                                         // head lights

        gl_FragColor = vec4(haze(col, vWorld, uFog) * uDim, 1.0);
      }`,
  })
}

/**
 * Loads the models and returns a group with all traffic. `cars` is how many cars and vans
 * together; a freighter is added when `freighter` is true.
 */
export async function createTraffic(uniforms, { cars, freighter }) {
  const gltf = await new GLTFLoader().loadAsync('/models/vehicles.glb')
  gltf.scene.updateMatrixWorld(true)
  const group = new THREE.Group()
  const material = bodyMaterial(uniforms)
  const lanes = [] // every car and van, for the trails and the glare

  const fleet = (name, rows) => {
    if (!rows.length) return
    const model = vehicleGeometry(gltf.scene, name)
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.index = model.index
    for (const key of ['position', 'normal', 'aPart']) geometry.setAttribute(key, model.getAttribute(key))
    const data = new THREE.InstancedInterleavedBuffer(new Float32Array(rows.flat()), 8)
    geometry.setAttribute('aLane', new THREE.InterleavedBufferAttribute(data, 4, 0))
    geometry.setAttribute('aLook', new THREE.InterleavedBufferAttribute(data, 4, 4))
    geometry.instanceCount = rows.length
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    group.add(mesh)
  }

  const sport = []
  const van = []
  for (let i = 0; i < cars; i++) {
    const oncoming = i % 2 === 0
    const onRoad = i % 5 === 4 // one in five drives the kerb lanes; the rest fly
    const isVan = Math.random() < 0.4
    const row = onRoad
      ? [oncoming ? -5.2 : 5.2, 0.45, Math.random() * 260, oncoming ? 16 + Math.random() * 10 : -(9 + Math.random() * 6)]
      : [(oncoming ? -1 : 1) * (2.5 + Math.random() * 9.5), 7 + Math.floor(Math.random() * 5) * 4.6 + Math.random(), Math.random() * 260, oncoming ? 14 + Math.random() * 18 : -(15 + Math.random() * 18)]
    row.push(1, Math.random(), Math.random(), isVan ? 5.2 : 4.6)
    ;(isVan ? van : sport).push(row)
    lanes.push(row)
  }
  fleet('HoverCar', sport)
  fleet('HoverVan', van)
  if (freighter) {
    fleet('Freighter', [
      [-5, 44, 40, -6.5, 1, 0.3, 0.2, 40],
      [9, 52, 170, -5.5, 1.15, 0.9, 0.7, 40],
    ])
  }

  // ── light trails and glare, for the cars and vans ──
  const laneData = new THREE.InstancedInterleavedBuffer(new Float32Array(lanes.flat()), 8)
  const additive = { uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }

  const ribbon = new THREE.BoxGeometry(1, 0.05, 1).translate(0, 0, -0.5) // stretches back from the tail
  const trailGeometry = new THREE.InstancedBufferGeometry()
  trailGeometry.index = ribbon.index
  trailGeometry.setAttribute('position', ribbon.getAttribute('position'))
  trailGeometry.setAttribute('aLane', new THREE.InterleavedBufferAttribute(laneData, 4, 0))
  trailGeometry.setAttribute('aLook', new THREE.InterleavedBufferAttribute(laneData, 4, 4))
  trailGeometry.instanceCount = lanes.length
  const trails = new THREE.Mesh(
    trailGeometry,
    new THREE.ShaderMaterial({
      ...additive,
      vertexShader: /* glsl */ `
        ${PLACE}
        uniform float uDim;
        varying float vTail, vOncoming, vFade;
        void main() {
          float len = 3.0 + abs(aLane.w) * 0.55;
          vec3 world = place(vec3(position.x * 1.5, 0.5 + position.y, -aLook.w * 0.5 + position.z * len));
          vTail = 1.0 + position.z;                 // 1 at the car, 0 at the end of the trail
          vOncoming = step(0.0, aLane.w);
          vFade = exp(-length(world.xz - cameraPosition.xz) * 0.011) * uDim;
          gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vTail, vOncoming, vFade;
        void main() {
          vec3 col = mix(vec3(1.8, 0.08, 0.4), vec3(0.5, 1.1, 1.4), vOncoming);
          gl_FragColor = vec4(col * pow(max(vTail, 0.0), 2.2) * 0.7 * vFade, 1.0);
        }`,
    }),
  )
  trails.frustumCulled = false

  const glareGeometry = new THREE.InstancedBufferGeometry()
  glareGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
  glareGeometry.setAttribute('aLane', new THREE.InterleavedBufferAttribute(laneData, 4, 0))
  glareGeometry.setAttribute('aLook', new THREE.InterleavedBufferAttribute(laneData, 4, 4))
  glareGeometry.instanceCount = lanes.length
  const glare = new THREE.Points(
    glareGeometry,
    new THREE.ShaderMaterial({
      ...additive,
      vertexShader: /* glsl */ `
        ${PLACE}
        uniform float uDim, uPixelRatio;
        varying vec3 vColor;
        void main() {
          // whichever lights face the viewer: head lights coming toward us, tail lights going away
          vec3 world = place(vec3(0.0, 0.55, aLook.w * (aLane.w > 0.0 ? 0.5 : -0.5)));
          vec4 mv = viewMatrix * vec4(world, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(uPixelRatio * 520.0 / -mv.z, 2.0, 90.0);
          vColor = (aLane.w > 0.0 ? vec3(0.8, 0.95, 1.0) : vec3(1.0, 0.1, 0.3)) * exp(-length(world.xz - cameraPosition.xz) * 0.009) * uDim * smoothstep(0.3, 0.8, uReveal);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          // a soft core with a wide, flat streak through it, like a lens does to a bright light
          float core = smoothstep(0.5, 0.0, length(p * vec2(1.0, 2.2)));
          float streak = smoothstep(0.5, 0.0, abs(p.x)) * smoothstep(0.06, 0.0, abs(p.y));
          gl_FragColor = vec4(vColor * (core * core * 0.9 + streak * 0.5), 1.0);
        }`,
    }),
  )
  glare.frustumCulled = false

  group.add(trails, glare)
  return group
}
