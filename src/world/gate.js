/**
 * The warp gate at the end of the road: two towers holding a pair of segmented rings that
 * turn against each other around a spinning sheet of energy. The intro's launch flies into it.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { CYAN, GLSL, MAGENTA } from './shared.js'

const CENTRE_Y = 29

/** A slice of a ring with a rectangular section, standing upright and facing down the road. */
function arc(inner, outer, depth, start, length, z = 0) {
  const h = depth / 2
  const profile = [[inner, -h], [outer, -h], [outer, h], [inner, h], [inner, -h]].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(profile, Math.max(6, Math.round(length * 14)), start, length).rotateX(Math.PI / 2).translate(0, 0, z)
}

/** `count` equal slices round a full circle, with a gap between each. */
function ring(count, gap, make) {
  const step = (Math.PI * 2) / count
  return mergeGeometries(Array.from({ length: count }, (_, i) => make(i * step + gap / 2, step - gap)))
}

const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z)

export function createGate(uniforms) {
  const group = new THREE.Group()

  // Structure: so far away that it reads as a dark shape with light catching its edges.
  const steel = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vWorld, vNormalW;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormalW = mat3(modelMatrix) * normal;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld, vNormalW;
      uniform float uDim, uReveal;
      uniform vec3 uCyan, uMagenta;
      void main() {
        vec3 n = normalize(vNormalW);
        vec3 view = normalize(cameraPosition - vWorld);
        float rim = pow(clamp(1.0 - abs(dot(n, view)), 0.0, 1.0), 2.0);
        float panels = step(0.94, fract(vWorld.y / 3.0)) + step(0.96, fract(vWorld.x / 3.0));
        vec3 col = vec3(0.022, 0.014, 0.034) * (1.0 - 0.4 * panels) + mix(uMagenta, uCyan, 0.5 + 0.5 * n.x) * rim * 0.1;
        gl_FragColor = vec4(col * uDim * smoothstep(0.15, 0.7, uReveal), 1.0);
      }`,
  })
  // Lights: plain colour, brighter than white so they bloom.
  const neon = (color, strength) =>
    new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uColor: { value: color.clone().multiplyScalar(strength) } },
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uDim, uReveal, uWarp;
        void main() { gl_FragColor = vec4(uColor * (1.0 + uWarp * 2.0) * uDim * smoothstep(0.3, 0.9, uReveal), 1.0); }`,
    })

  // two towers, stepped, with arms that grip the outer ring
  const towers = []
  const strips = []
  for (const side of [-1, 1]) {
    const x = side * 36
    towers.push(box(12, 18, 14, x, 9, 0), box(8.5, 20, 10, x, 28, 0), box(5.5, 14, 7, x, 45, 0), box(1.4, 12, 1.4, x, 58, 0), box(7, 4, 5, side * 30.5, CENTRE_Y, 0))
    towers.push(box(16, 3, 18, x, 1.5, 0))
    strips.push(box(0.5, 34, 0.3, x - side * 2.5, 21, 7.2), box(0.5, 34, 0.3, x + side * 2.5, 21, 7.2), box(6, 0.5, 0.3, x, 39.5, 5.2))
  }
  group.add(new THREE.Mesh(mergeGeometries(towers), steel), new THREE.Mesh(mergeGeometries(strips), neon(CYAN, 1.6)))
  const beacons = new THREE.Mesh(mergeGeometries([box(2, 1, 2, -36, 64.5, 0), box(2, 1, 2, 36, 64.5, 0)]), neon(MAGENTA, 3))
  group.add(beacons)

  // outer ring: eight heavy segments; inner ring: twelve lighter ones, turning the other way
  const outer = new THREE.Group()
  outer.add(
    new THREE.Mesh(ring(8, 0.1, (a, len) => arc(23.4, 28, 5.5, a, len)), steel),
    new THREE.Mesh(ring(8, 0.22, (a, len) => arc(26.4, 26.8, 0.4, a, len, 2.9)), neon(CYAN, 2.2)),
    new THREE.Mesh(ring(16, 0.2, (a, len) => arc(24.4, 24.6, 0.4, a, len, 2.9)), neon(MAGENTA, 1.4)),
  )
  const inner = new THREE.Group()
  inner.add(
    new THREE.Mesh(ring(12, 0.14, (a, len) => arc(21, 23, 3.2, a, len)), steel),
    new THREE.Mesh(ring(12, 0.3, (a, len) => arc(21.6, 21.95, 0.4, a, len, 1.75)), neon(MAGENTA, 2.4)),
  )
  outer.position.y = inner.position.y = CENTRE_Y

  // the sheet of energy inside the rings
  const energy = new THREE.Mesh(
    new THREE.CircleGeometry(21, 72),
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv - 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uTime, uReveal, uWarp, uDim;
        uniform vec3 uCyan, uMagenta;
        ${GLSL}
        void main() {
          float r = length(vUv) * 2.0;
          float a = atan(vUv.y, vUv.x);
          // spiral arms: the angle is wound up more and more toward the centre
          float wound = a + 2.6 / (r + 0.3) + uTime * 0.5;
          vec2 spin = vec2(cos(wound), sin(wound));
          float arms = noise(spin * 2.2 + vec2(r * 5.0 - uTime * 1.4, 0.0)) * 0.65 + noise(spin * 5.0 - vec2(0.0, r * 11.0 - uTime * 2.6)) * 0.35;
          arms = pow(max(arms, 0.0), 2.4) * 1.5;
          float core = exp(-r * r * 7.0);
          float crackle = smoothstep(0.72, 1.0, r) * noise(vec2(cos(a), sin(a)) * 6.0 + uTime * 3.0);
          vec3 col = mix(uMagenta, uCyan, smoothstep(0.1, 0.9, r)) * arms
            + vec3(1.0, 0.92, 1.0) * core * (0.45 + uWarp * 5.0)
            + uCyan * crackle * 1.3;
          gl_FragColor = vec4(col * smoothstep(1.0, 0.93, r) * 0.75 * uReveal * uDim, 1.0);
        }`,
    }),
  )
  energy.position.y = CENTRE_Y

  // light thrown out of the gate: a shaft into the sky and a streak across the horizon
  const flare = (w, h, x, y, strength) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.ShaderMaterial({
        uniforms: { ...uniforms, uStrength: { value: strength } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv - 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          uniform float uTime, uReveal, uDim, uStrength, uWarp;
          uniform vec3 uCyan, uMagenta;
          void main() {
            float fade = pow(max(1.0 - abs(vUv.x) * 2.0, 0.0), 2.0) * pow(max(1.0 - abs(vUv.y) * 2.0, 0.0), 2.0);
            float flicker = 0.85 + 0.15 * sin(uTime * 7.0);
            gl_FragColor = vec4(mix(uMagenta, uCyan, 0.6) * fade * uStrength * flicker * (1.0 + uWarp * 2.0) * uReveal * uDim, 1.0);
          }`,
      }),
    )
    mesh.position.set(x, y, 1)
    return mesh
  }

  group.add(outer, inner, energy, flare(5, 260, 0, CENTRE_Y + 100, 0.4), flare(200, 5, 0, CENTRE_Y, 0.3))

  /** Turns the rings. */
  group.userData.update = (dt) => {
    outer.rotation.z += dt * 0.11
    inner.rotation.z -= dt * 0.26
  }
  return group
}
