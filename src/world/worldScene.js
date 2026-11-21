/**
 * The site's 3D world: a rain-wet avenue through a neon city, a warp gate at the end of it
 * and the gamepad model. One scene serves two moments:
 *
 *   intro  the camera flies down the road, the gamepad fills the screen, launch() warps
 *          into the gate
 *   hero   the same city, calmer and dimmer, as the background of the hero section; the
 *          gamepad docks onto a slot in the page and stays playable
 *
 * The pieces live next to this file: city.js (towers made of loose blocks), ground.js (the
 * mirror-wet street), gate.js, traffic.js, weather.js, textures.js. This file owns the
 * camera, the gamepad, the post-processing and the frame loop.
 *
 * createWorld(container, options) adds its own canvas to `container`, resolves once
 * everything is loaded and returns the controls used by GameIntro and Hero.
 * Plain three.js, loaded on demand.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { createCity } from './city.js'
import { createGate } from './gate.js'
import { createGround } from './ground.js'
import { CYAN, FOG, GLSL, GREEN, MAGENTA } from './shared.js'
import { createFacades, createNoise } from './textures.js'
import { createTraffic } from './traffic.js'
import { createDust, createRain } from './weather.js'

const INTRO = { speed: 16, bloom: 0.5, dim: 1 }
const HERO = { speed: 4.5, bloom: 0.38, dim: 0.72 } // behind text: slower, dimmer
const PAD_DEPTH = 7 // how far in front of the camera the docked gamepad floats
const FOREGROUND = 1 // layer for things the wet street should not mirror (gamepad, rain)
const TRAVEL = 55 // how far along the avenue one section's worth of page scroll carries the camera

// What each kind of device gets. `low` is phones, tablets and weak laptops.
const QUALITY = {
  high: { rows: 4, pieces: [0.85, 1.6], cars: 26, freighter: true, rain: 1400, dust: 800, mirror: true },
  low: { rows: 3, pieces: [2.2], cars: 10, freighter: false, rain: 450, dust: 300, mirror: false },
}

const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  in: (t) => t * t * t,
}

// ───────────────────────── world pieces ─────────────────────────
// Every shader multiplies its output by uDim so the whole world can sit back behind text.

function createSky(uniforms) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform float uTime, uDim;
      ${GLSL}
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 top = vec3(0.008, 0.005, 0.03);
        vec3 mid = vec3(0.07, 0.014, 0.17);
        vec3 horizon = vec3(0.34, 0.03, 0.36);
        vec3 col = mix(mid, top, smoothstep(0.0, 0.55, h));
        col = mix(horizon, col, smoothstep(0.0, 0.17, abs(h)));
        // the gate lights up the sky straight ahead
        float ahead = max(-normalize(d.xz + 0.0001).y, 0.0);
        col += vec3(0.16, 0.05, 0.28) * pow(ahead, 20.0) * exp(-abs(h) * 4.5);
        // smog, lit from below by the city
        float smog = noise(vec2(d.x * 4.0 + uTime * 0.012, h * 13.0)) * noise(d.xz * 2.6 - uTime * 0.008);
        col += vec3(0.1, 0.02, 0.16) * smoothstep(0.18, 0.7, smog) * smoothstep(0.02, 0.25, h) * smoothstep(0.8, 0.3, h);
        // stars, only above the horizon
        vec2 cell = floor(d.xz / (abs(h) + 0.25) * 60.0);
        float star = step(0.985, hash(cell)) * smoothstep(0.08, 0.4, h);
        col += star * (0.5 + 0.5 * sin(uTime * 2.0 + hash(cell + 3.0) * 40.0)) * vec3(0.8, 0.95, 1.0);
        gl_FragColor = vec4(col * uDim, 1.0);
      }`,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), material)
}

/** Dashed holographic rings that orbit the gamepad. */
function createHoloRings(uniforms) {
  const group = new THREE.Group()
  const ringMaterial = (color, dashes, speed) =>
    new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uColor: { value: color.clone().multiplyScalar(0.95) }, uDashes: { value: dashes }, uSpeed: { value: speed } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec3 vPos;
        uniform float uTime, uDashes, uSpeed, uReveal;
        uniform vec3 uColor;
        void main() {
          float a = atan(vPos.y, vPos.x) / 6.2831853 + 0.5;
          float dash = step(0.45, fract(a * uDashes + uTime * uSpeed));
          gl_FragColor = vec4(uColor * dash * uReveal, 1.0);
        }`,
    })
  group.userData.rings = [
    [1.3, 0.0035, CYAN, 36, 0.05, [1.25, 0.2, 0]],
    [1.5, 0.003, MAGENTA, 12, -0.08, [1.05, -0.5, 0.3]],
    [1.74, 0.0025, CYAN, 90, 0.03, [1.45, 0.6, -0.2]],
  ].map(([radius, tube, color, dashes, speed, rot]) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 160), ringMaterial(color, dashes, speed))
    mesh.rotation.set(...rot)
    group.add(mesh)
    return mesh
  })
  return group
}

/** The gamepad's stand in the hero: a glowing disc with a cone of light rising from it. */
function createProjector(uniforms) {
  const group = new THREE.Group()
  const common = { uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.ShaderMaterial({
      ...common,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv - 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uTime, uReveal;
        uniform vec3 uCyan, uMagenta;
        void main() {
          float r = length(vUv) * 2.0;
          float a = atan(vUv.y, vUv.x);
          float rings = smoothstep(0.8, 1.0, sin(r * 20.0 - uTime * 3.0)) * (1.0 - r);   // travelling outward
          float rim = smoothstep(0.05, 0.0, abs(r - 0.94));
          float ticks = step(0.5, fract(a * 9.549 + uTime * 0.08)) * smoothstep(0.035, 0.0, abs(r - 0.8));
          float core = smoothstep(0.75, 0.0, r);
          vec3 col = uCyan * (rings * 0.4 + rim * 1.1 + core * 0.3) + uMagenta * ticks * 1.2;
          gl_FragColor = vec4(col * smoothstep(1.0, 0.96, r) * uReveal, 1.0);
        }`,
    }),
  )
  // the cone points along +z (the disc's normal), narrow at the disc and wide at the top
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 0.45, 1, 48, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5),
    new THREE.ShaderMaterial({
      ...common,
      vertexShader: /* glsl */ `
        varying float vUp;
        void main() { vUp = position.z; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying float vUp;
        uniform float uTime, uReveal;
        uniform vec3 uCyan;
        void main() {
          float fade = pow(clamp(1.0 - vUp, 0.0, 1.0), 2.0);
          float flicker = 0.82 + 0.18 * sin(uTime * 9.0 + vUp * 30.0);
          gl_FragColor = vec4(uCyan * fade * 0.06 * flicker * uReveal, 1.0);
        }`,
    }),
  )
  group.add(disc, beam)
  return group
}

/** A soft pool of shadow behind the docked gamepad, so it reads against the busy street. */
function createBacking() {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: { uAmount: { value: 0 } },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv - 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uAmount;
        void main() { gl_FragColor = vec4(0.012, 0.008, 0.03, smoothstep(0.5, 0.1, length(vUv)) * 0.74 * uAmount); }`,
    }),
  )
  mesh.visible = false
  return mesh
}

function createShockwave() {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1, 96),
    new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  )
  mesh.visible = false
  return mesh
}

/**
 * What the gamepad's shiny surfaces reflect: a dark studio with long neon tubes, so its
 * highlights come out in the site's two colours instead of plain white.
 */
function neonStudio() {
  const studio = new THREE.Scene()
  studio.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x04050b, side: THREE.BackSide })))
  const tube = (color, strength, w, h, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide }))
    mesh.position.set(x, y, z)
    mesh.lookAt(0, 0, 0)
    studio.add(mesh)
  }
  tube(0x00f5ff, 9, 1.6, 16, -11, 2, 4)
  tube(0xff00d4, 9, 1.6, 16, 11, 1, 4)
  tube(0xffffff, 5, 12, 2.5, 0, 12, 3)
  tube(0x00f5ff, 4, 14, 0.8, 0, -3, 12)
  tube(0xff00d4, 3, 0.8, 10, 4, 4, -12)
  tube(0x7a5cff, 2.5, 18, 6, 0, -12, 0)
  return studio
}

// ───────────────────────── gamepad ─────────────────────────

const ACCENT = { AccentCyan: CYAN, AccentMagenta: MAGENTA, AccentGreen: GREEN }
const SURFACES = {
  Body: { color: 0x2a3552, metalness: 0.8, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.14 },
  BodyDark: { color: 0x191d2b, metalness: 0.7, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3 },
  Button: { color: 0x343a4e, metalness: 0.6, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 },
  Rubber: { color: 0x08090c, metalness: 0.0, roughness: 0.85 },
  Glass: { color: 0x03040a, metalness: 0.4, roughness: 0.06 },
}
// Which light colour each control glows with when pressed.
const PRESS_COLOR = { Btn_A: GREEN, Btn_B: MAGENTA, Btn_X: CYAN, Btn_Y: CYAN, Start: CYAN, Select: CYAN, Home: GREEN }
const DPAD = { Dpad_Up: [0, 1], Dpad_Down: [0, -1], Dpad_Left: [-1, 0], Dpad_Right: [1, 0] }
const FACE_BUTTONS = ['Btn_A', 'Btn_B', 'Btn_X', 'Btn_Y']

/**
 * Makes a gamepad material draw as hologram stripes above uHoloReveal and solid below it,
 * with neon light catching its edges. `screen` (optional) turns it into the gamepad's
 * display: bars that bounce like a sound meter, laid out over the given bounding box.
 */
function addHologram(material, holo, screen) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHoloReveal = holo.uHoloReveal
    shader.uniforms.uHoloTime = holo.uHoloTime
    if (screen) Object.assign(shader.uniforms, screen)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vHoloY;\nvarying vec3 vObject;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHoloY = (modelMatrix * vec4(transformed, 1.0)).y;\nvObject = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying float vHoloY;
        varying vec3 vObject;
        uniform float uHoloReveal;
        uniform float uHoloTime;
        uniform vec4 uScreenU, uScreenV;
        float meter(float n) { return fract(sin(n * 91.7) * 43758.5453); }`,
      )
      .replace(
        '#include <dithering_fragment>',
        /* glsl */ `#include <dithering_fragment>
        float holoEdge = vHoloY - uHoloReveal;
        if (holoEdge > 0.0) {
          if (fract(vHoloY * 24.0 - uHoloTime * 1.6) < 0.5) discard;
          gl_FragColor = vec4(vec3(0.0, 0.8, 1.0) * 1.25, 1.0);
        } else {
          gl_FragColor.rgb += vec3(0.0, 0.9, 1.0) * smoothstep(-0.2, 0.0, holoEdge) * 3.0;
          // neon light catching the edges, drifting between the two colours
          float rim = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 3.0);
          gl_FragColor.rgb += mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.0, 0.83), 0.5 + 0.5 * sin(vHoloY * 2.5 + uHoloTime * 0.8)) * rim * 0.55;
          ${
            screen
              ? /* glsl */ `
          vec2 at = vec2(dot(vObject, uScreenU.xyz) + uScreenU.w, dot(vObject, uScreenV.xyz) + uScreenV.w);
          float bar = floor(at.x * 14.0);
          float beat = floor(uHoloTime * 7.0);
          float level = 0.2 + 0.7 * mix(meter(bar + beat * 3.1), meter(bar + (beat + 1.0) * 3.1), fract(uHoloTime * 7.0));
          float cellsOn = step(0.08, at.x) * step(at.x, 0.92) * step(0.16, fract(at.x * 14.0)) * step(0.25, fract(at.y * 9.0)) * step(0.12, at.y) * step(at.y, 0.12 + level * 0.76);
          gl_FragColor.rgb += mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.0, 0.83), at.y) * cellsOn * 1.5;`
              : ''
          }
        }`,
      )
  }
  // one program per variant
  material.customProgramCacheKey = () => (screen ? 'pad-screen' : 'pad')
  return material
}

function prepareGamepad(root, holo) {
  const controls = {} // name -> { mesh, halo, rest, glow (0..1), target }
  const shared = {}
  const neon = []

  root.traverse((node) => {
    if (!node.isMesh) return
    node.layers.set(FOREGROUND)
    const kind = node.material.name
    if (ACCENT[kind]) {
      // Neon parts: every mesh gets its own material so each can be boosted on its own.
      node.material = addHologram(
        new THREE.MeshStandardMaterial({ color: 0x000000, emissive: ACCENT[kind], emissiveIntensity: 1.7, roughness: 0.4 }),
        holo,
      )
      node.userData.baseGlow = 1.7
      neon.push(node)
    } else if (PRESS_COLOR[node.name]) {
      node.material = addHologram(
        new THREE.MeshPhysicalMaterial({ ...SURFACES[kind], emissive: PRESS_COLOR[node.name], emissiveIntensity: 0 }),
        holo,
      )
    } else if (kind === 'Glass') {
      // the display: map its two long sides to 0..1
      node.geometry.computeBoundingBox()
      const box = node.geometry.boundingBox
      const size = box.getSize(new THREE.Vector3())
      const [u, v] = ['x', 'y', 'z'].sort((a, b) => size[b] - size[a])
      const axis = (name) => new THREE.Vector4(+(name === 'x') / size[name], +(name === 'y') / size[name], +(name === 'z') / size[name], -box.min[name] / size[name])
      node.material = addHologram(new THREE.MeshPhysicalMaterial(SURFACES.Glass), holo, { uScreenU: { value: axis(u) }, uScreenV: { value: axis(v) } })
    } else {
      shared[kind] ??= addHologram(new THREE.MeshPhysicalMaterial(SURFACES[kind] ?? SURFACES.Body), holo)
      node.material = shared[kind]
    }
  })

  const register = (name, mesh, halo) => {
    if (mesh) controls[name] = { mesh, halo, rest: mesh.position.clone(), glow: 0, target: 0, lit: 0 }
  }
  for (const name of Object.keys(PRESS_COLOR)) {
    register(name, root.getObjectByName(name), root.getObjectByName(`${name}_Halo`))
  }
  for (const name of Object.keys(DPAD)) register(name, root.getObjectByName(name))
  // neon parts that are not a control or its halo: the decorative light strips
  const used = new Set(Object.values(controls).flatMap((c) => [c.mesh, c.halo]))
  const strips = neon.filter((mesh) => !used.has(mesh))
  return { controls, strips, sticks: { L: root.getObjectByName('Stick_L'), R: root.getObjectByName('Stick_R') } }
}

// ───────────────────────── post-processing ─────────────────────────

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uAberration: { value: 0.0016 },
    uWarp: { value: 0 },
    uGlitch: { value: 0 },
    uFlash: { value: 0 },
    uFade: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime, uAberration, uWarp, uGlitch, uFlash, uFade;
    ${GLSL}
    void main() {
      vec2 uv = vUv;
      // glitch: a few horizontal bands jump sideways
      float band = floor(uv.y * 36.0);
      float jump = hash(vec2(band, floor(uTime * 24.0)));
      uv.x += (jump - 0.5) * 0.12 * uGlitch * step(0.72, jump);

      vec2 centre = uv - 0.5;
      float edge = dot(centre, centre);
      vec2 shift = centre * (uAberration * (0.5 + edge * 3.0) + uWarp * 0.02);

      // zoom blur toward the centre while warping; also splits the colour channels
      vec3 col = vec3(0.0);
      const int STEPS = 8;
      for (int i = 0; i < STEPS; i++) {
        float t = float(i) / float(STEPS - 1);
        vec2 at = uv - centre * uWarp * 0.32 * t;
        col.r += texture2D(tDiffuse, at + shift).r;
        col.g += texture2D(tDiffuse, at).g;
        col.b += texture2D(tDiffuse, at - shift).b;
      }
      col /= float(STEPS);

      col *= 1.0 - 0.035 * sin(uv.y * uResolution.y * 1.3);                // scanlines
      col += (hash(uv * uResolution + uTime) - 0.5) * 0.024;               // grain
      col *= mix(1.0, smoothstep(0.62, 0.12, edge), 0.85);                  // vignette
      col = mix(col, vec3(0.78, 1.0, 1.0), uFlash);
      gl_FragColor = vec4(col * uFade, 1.0);
    }`,
}

// ───────────────────────── scene ─────────────────────────

export async function createWorld(container, { low = false, mode = 'hero', onProgress = () => {} } = {}) {
  // Own canvas per scene: a disposed scene gives up its WebGL context for good.
  const canvas = document.createElement('canvas')
  container.appendChild(canvas)
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  } catch (err) {
    canvas.remove() // no WebGL here: leave nothing behind and let the caller fall back
    throw err
  }
  const quality = low ? QUALITY.low : QUALITY.high
  let pixelRatio = Math.min(window.devicePixelRatio || 1, low ? 1.25 : 1.75)
  renderer.setPixelRatio(pixelRatio)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  const scene = new THREE.Scene()
  scene.background = FOG
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(neonStudio(), 0.035)
  scene.environment = environment.texture
  scene.environmentIntensity = 1.0

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 900)
  camera.layers.enable(FOREGROUND)

  // Uniforms shared by every material in the world.
  const facades = createFacades(Math.min(8, renderer.capabilities.getMaxAnisotropy()))
  const noise = createNoise()
  const world = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uReveal: { value: 0 },
    uWarp: { value: 0 },
    uDim: { value: 1 },
    uRipple: { value: new THREE.Vector4(0, 0, -100, 0) },
    uCursor: { value: new THREE.Vector3() },
    uEye: { value: new THREE.Vector3() },
    uMagnet: { value: 0 },
    uMagnetDir: { value: [new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -1)] },
    uBlast: { value: new THREE.Vector4(0, 0, -1, -100) },
    uMirror: { value: quality.mirror ? 1 : 0 },
    uPixelRatio: { value: pixelRatio },
    uFacade: { value: facades },
    uNoise: { value: noise },
    uCyan: { value: CYAN },
    uMagenta: { value: MAGENTA },
    uFog: { value: FOG },
  }
  const holo = { uHoloReveal: { value: -100 }, uHoloTime: world.uTime }

  const sky = createSky(world)
  const ground = createGround(world, { mirror: quality.mirror, width: 512, height: 512 })
  const city = createCity(world, quality)
  const gate = createGate(world)
  gate.position.set(0, 0, -264)
  gate.scale.setScalar(1.8) // far behind the last towers and big enough to stand over them
  const rain = createRain(world, quality.rain)
  const dust = createDust(world, quality.dust)
  const rings = createHoloRings(world)
  const projector = createProjector(world)
  const shock = createShockwave()
  const backing = createBacking()
  scene.add(sky, ground, city, gate, rain, dust, rings, projector, shock, backing)
  for (const front of [rain, dust, rings, projector, shock, backing]) front.traverse((node) => node.layers.set(FOREGROUND))

  scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x1a0528, 0.5))
  const keyCyan = new THREE.PointLight(CYAN, 130, 30)
  const keyMagenta = new THREE.PointLight(MAGENTA, 130, 30)
  const front = new THREE.DirectionalLight(0xffffff, 2.2)
  front.position.set(0.5, 3, 6)
  scene.add(keyCyan, keyMagenta, front)

  // ── models: the gamepad (needed) and the traffic (the world works without it) ──
  onProgress(0.15)
  const [gltf, traffic] = await Promise.all([
    new GLTFLoader().loadAsync('/models/gamepad.glb', (e) => {
      if (e.total) onProgress(0.15 + 0.7 * (e.loaded / e.total))
    }),
    createTraffic(world, quality).catch((err) => {
      console.warn('Traffic models unavailable, the city stays empty of vehicles.', err)
      return null
    }),
  ])
  if (traffic) scene.add(traffic)
  const model = gltf.scene.getObjectByName('Gamepad') ?? gltf.scene
  const { controls, strips, sticks } = prepareGamepad(model, holo)
  const pad = new THREE.Group() // moved and rotated as a whole
  pad.add(model)
  scene.add(pad)
  const modelSize = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())

  // ── post ──
  // Smooth edges come from multisampling, which is only worth its cost on ordinary-density screens.
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: !low && pixelRatio < 1.3 ? 4 : 0 }))
  composer.setPixelRatio(pixelRatio)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), INTRO.bloom, 0.55, 0.62)
  composer.addPass(bloom)
  const final = new ShaderPass(FinalShader)
  composer.addPass(final)
  composer.addPass(new OutputPass())

  // ── layout: how the intro frames the gamepad ──
  const rig = { padY: 3.6, padScale: 1.5, camZ: 9.4, lookY: 1.6 }
  const size = { w: 1, h: 1 }
  const isPortrait = () => camera.aspect < 0.9
  function resize() {
    size.w = container.clientWidth || window.innerWidth
    size.h = container.clientHeight || window.innerHeight
    renderer.setSize(size.w, size.h, false)
    composer.setSize(size.w, size.h)
    bloom.resolution.set(low ? size.w / 2 : size.w, low ? size.h / 2 : size.h)
    final.uniforms.uResolution.value.set(size.w, size.h)
    ground.userData.resize(Math.round(size.w * pixelRatio * 0.5), Math.round(size.h * pixelRatio * 0.5)) // the mirror image is drawn at half size
    camera.aspect = size.w / size.h
    camera.fov = isPortrait() ? 58 : 46
    rig.camZ = isPortrait() ? 11.5 : 9.4
    rig.lookY = isPortrait() ? 2.2 : 1.6
    rig.padY = isPortrait() ? 5.0 : 3.6
    // keep the gamepad at most ~72% of the screen width, and never bigger than 2x
    const visibleWidth = 2 * rig.camZ * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect
    rig.padScale = Math.min(2.0, (visibleWidth * 0.72) / modelSize.x)
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  // ── state ──
  // `mix` runs from 0 (the intro's view) to 1 (the hero's); the flight between them animates it.
  const view = { mode, mix: 0, scroll: 0, scrollBefore: 0, scrollTarget: 0, anchor: null, padAt: new THREE.Vector2(), rect: null, docked: false }
  // How far each section has scrolled past (0..1 each): together they are the camera's journey
  // from street level in the hero to above the rooftops in About. `showing` is which sections
  // are on screen: the world draws while any of them is.
  const journey = { hero: 0, about: 0 }
  const showing = { hero: true, about: false }
  const state = {
    speed: 0,
    fovBoost: 0,
    camLift: 5.5, // intro: camera starts high and sweeps down during reveal
    camBack: 9,
    padSpin: -2.6, // extra turn that unwinds as the gamepad arrives
    padPush: 0, // how far the gamepad has shot ahead during launch
    padShrink: 1,
    ringScale: 0.001,
    launched: false,
    padHover: 0, // 0..1, the cursor is over the docked gamepad
    padFlip: 0, // extra turn while spinPad() plays
    flashUntil: 0, // every control stays lit until this time
  }
  const demo = { name: '', until: 0, next: 3 } // the button the idle gamepad is pressing by itself
  const X_AXIS = new THREE.Vector3(1, 0, 0)
  const pointer = new THREE.Vector2()
  const pointerSmooth = new THREE.Vector2()
  let pointerSeen = false
  const touchOnly = window.matchMedia('(hover: none)').matches
  // The magnet that pushes the city's blocks about: the cursor, followed at three speeds so
  // the blocks do not all move at once. With no cursor (touch screens) it wanders by itself.
  const magnet = { points: [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()], rates: [13, 5, 2], wander: new THREE.Vector2() }
  // The gamepad leans toward the cursor on a spring, and kicks back a little on every press.
  const lean = { x: 0, y: 0, vx: 0, vy: 0 }
  const recoil = { x: 0, v: 0 }
  const stickAim = { L: new THREE.Vector2(), R: new THREE.Vector2() }
  const api = { onGamepadButton: null }
  let usingRealGamepad = false

  const tweens = []
  const tween = (seconds, step, easing = ease.inOut) =>
    new Promise((resolve) => tweens.push({ t: 0, seconds, step, easing, resolve }))
  // Ends every running animation. Their promises resolve so nothing waiting on them hangs.
  const cancelTweens = () => tweens.splice(0).forEach((tw) => tw.resolve())

  const clock = new THREE.Clock()
  const scratch = { v: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler(), right: new THREE.Vector3(), up: new THREE.Vector3() }
  const ray = new THREE.Raycaster()
  let frame = 0
  let running = false
  let disposed = false

  // Adaptive quality: if frames run slow for a while, shed work one step at a time.
  const perf = { frames: 0, time: 0, level: 0, grace: 2 }
  function shedWork() {
    perf.level += 1
    if (perf.level === 1) {
      // the mirror in the street draws the whole city a second time: the biggest saving
      ground.userData.stopMirror()
      world.uMirror.value = 0
      if (!ground.isReflector) shedWork()
    } else if (perf.level === 2) {
      pixelRatio = Math.min(pixelRatio, 1)
      renderer.setPixelRatio(pixelRatio)
      composer.setPixelRatio(pixelRatio)
      world.uPixelRatio.value = pixelRatio
      resize()
    } else if (perf.level === 3) {
      bloom.enabled = false
    } else if (perf.level === 4) {
      // blocks are stored row by row, so this drops the rows furthest from the road
      city.userData.blocks.instanceCount = Math.floor(city.userData.blocks.instanceCount * 0.55)
      rain.visible = false
    }
  }

  function pollGamepad() {
    const gp = navigator.getGamepads?.().find((g) => g && g.connected && g.mapping === 'standard')
    usingRealGamepad = Boolean(gp)
    if (!gp) return
    const map = { 0: 'Btn_A', 1: 'Btn_B', 2: 'Btn_X', 3: 'Btn_Y', 8: 'Select', 9: 'Start', 12: 'Dpad_Up', 13: 'Dpad_Down', 14: 'Dpad_Left', 15: 'Dpad_Right', 16: 'Home' }
    let any = false
    for (const [index, name] of Object.entries(map)) {
      const pressed = Boolean(gp.buttons[index]?.pressed)
      if (controls[name]) controls[name].target = pressed ? 1 : 0
      any ||= pressed
    }
    stickAim.L.set(gp.axes[0] ?? 0, -(gp.axes[1] ?? 0))
    stickAim.R.set(gp.axes[2] ?? 0, -(gp.axes[3] ?? 0))
    if (any) api.onGamepadButton?.()
  }

  /**
   * Puts the gamepad where it belongs: centre stage in the intro, on its slot in the hero,
   * or on the way from one to the other. Returns where it aims (-1..1).
   */
  function placePad(t, dt) {
    const bob = Math.sin(t * 1.1) * 0.09
    const m = view.mix
    const at = scratch.a.set(0, rig.padY + bob, -state.padPush) // intro: centre stage
    let scale = rig.padScale * state.padShrink
    let aimX = pointerSmooth.x
    let aimY = pointerSmooth.y
    let visible = true
    const slot = view.rect && view.rect.width > 40 ? view.rect : null

    if (m > 0 && slot) {
      // hero: on the slot element in the page, whatever the layout or scroll position
      const nx = ((slot.left + slot.width / 2) / size.w) * 2 - 1
      const ny = -(((slot.top + slot.height / 2) / size.h) * 2 - 1)
      scratch.v.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize()
      const dock = scratch.b.copy(camera.position).addScaledVector(scratch.v, PAD_DEPTH)
      const widthAtDepth = 2 * PAD_DEPTH * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect
      const padWidth = (slot.width / size.w) * widthAtDepth * 0.92
      scratch.up.setFromMatrixColumn(camera.matrixWorld, 1)
      // the grips hang below the model's origin, so lift it to look centred in the slot
      dock.addScaledVector(scratch.up, padWidth * 0.1 + bob * 0.4)
      // on the way over it rises a little, so the path is an arc rather than a slide
      at.lerp(dock, m).addScaledVector(scratch.up, Math.sin(Math.PI * m) * 0.45)
      scale += ((padWidth / modelSize.x) * (1 + state.padHover * 0.06) - scale) * m
      view.padAt.set(nx, ny)
      // lean toward the cursor from wherever the gamepad is on screen
      aimX += (THREE.MathUtils.clamp((pointer.x - nx) * 1.4, -1, 1) - aimX) * m
      aimY += (THREE.MathUtils.clamp((pointer.y - ny) * 1.4, -1, 1) - aimY) * m
      visible = m < 1 || (slot.bottom > 0 && slot.top < size.h)
    } else if (m > 0) {
      // this layout has no slot (phones): the gamepad flies off toward the gate and is gone
      at.lerp(scratch.b.set(0, rig.padY + 9, -130), m)
      scale *= 1 - m
      visible = m < 1
    }
    view.docked = Boolean(slot) && visible && m > 0
    pad.visible = visible
    pad.position.copy(at)
    pad.scale.setScalar(Math.max(scale, 1e-4))

    // springs: the lean overshoots a touch and settles; a press knocks the gamepad back
    lean.vx += ((aimX - lean.x) * 60 - lean.vx * 8.5) * dt
    lean.vy += ((aimY - lean.y) * 60 - lean.vy * 8.5) * dt
    lean.x += lean.vx * dt
    lean.y += lean.vy * dt
    recoil.v += (-recoil.x * 160 - recoil.v * 13) * dt
    recoil.x += recoil.v * dt
    pad.position.addScaledVector(scratch.v.setFromMatrixColumn(camera.matrixWorld, 2), -recoil.x * 0.07 * pad.scale.x)

    // always face the camera, tilted so the top of the pad shows
    scratch.e.set(1.08 - lean.y * 0.24 + recoil.x * 0.09 + Math.sin(t * 0.7) * 0.04, lean.x * 0.6 + state.padSpin + state.padFlip + Math.sin(t * 0.5) * 0.06, -lean.x * 0.09)
    pad.quaternion.copy(camera.quaternion).multiply(scratch.q.setFromEuler(scratch.e))
    return { aimX: lean.x, aimY: lean.y }
  }

  function tick() {
    if (disposed || !running) return
    frame = requestAnimationFrame(tick)
    const rawDt = clock.getDelta()
    const dt = Math.min(rawDt, 0.05)
    const t = (world.uTime.value += dt)

    // adaptive quality (ignore tab switches and the deliberately heavy warp)
    if (perf.grace > 0) perf.grace -= rawDt
    else if (rawDt < 0.25 && !state.launched && perf.level < 4) {
      perf.frames += 1
      perf.time += rawDt
      if (perf.frames === 40) {
        const frameTime = perf.time / 40
        if (frameTime > 1 / 45) shedWork()
        if (frameTime > 1 / 30 && perf.level < 4) shedWork() // far behind: take two steps at once
        perf.frames = 0
        perf.time = 0
      }
    }

    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]
      tw.t = Math.min(1, tw.t + dt / tw.seconds)
      tw.step(tw.easing(tw.t))
      if (tw.t === 1) {
        tweens.splice(tweens.indexOf(tw), 1)
        tw.resolve()
      }
    }

    pollGamepad()
    world.uScroll.value += state.speed * dt
    pointerSmooth.lerp(pointer, 1 - Math.exp(-dt * 4))
    view.scroll += (view.scrollTarget - view.scroll) * (1 - Math.exp(-dt * 8))
    // scrolling the page also carries the camera along the avenue (and back again)
    world.uScroll.value += (view.scroll - view.scrollBefore) * TRAVEL
    view.scrollBefore = view.scroll

    // ── camera: the intro's view, the hero's, or part-way between during the flight ──
    const m = view.mix
    const s = view.scroll
    const px = pointerSmooth.x
    const py = pointerSmooth.y
    // intro: low on the road, looking at the gamepad. hero: horizon a little above the middle.
    // Scrolling the hero away lifts the camera off the street and tips it down; scrolling on
    // through About takes it above the rooftops and levels it out over the city.
    const lift = Math.min(s, 1)
    const over = THREE.MathUtils.smoothstep(s, 1, 2)
    camera.position.set(px * 0.9, 2.5 + state.camLift + py * 0.45, rig.camZ + state.camBack).lerp(scratch.a.set(px * 0.7, 3 + lift * 10 + over * 13 + py * 0.35, 10.5), m)
    camera.lookAt(scratch.a.set(px * 0.25, rig.lookY + state.camLift * 0.25, 0).lerp(scratch.b.set(px * 0.3, 0.4 - lift * 4.4 + over * 6, -30 - over * 40), m))
    // the further the page has scrolled into reading matter, the further the city sits back
    world.uDim.value = INTRO.dim + (HERO.dim - 0.2 * THREE.MathUtils.smoothstep(s, 0.6, 1.5) - INTRO.dim) * m
    camera.fov = (isPortrait() ? 58 : 46) + 4 * m + state.fovBoost
    // hero: the vanishing point moves over to the column the gamepad's slot is in, so the
    // road runs up to the profile card instead of behind the headline
    view.rect = view.mode === 'hero' ? (view.anchor?.getBoundingClientRect() ?? null) : null
    const shift = view.rect && view.rect.width > 40 ? (size.w / 2 - (view.rect.left + view.rect.width / 2)) * m : 0
    if (Math.abs(shift) > 0.5) camera.setViewOffset(size.w, size.h, shift, 0, size.w, size.h)
    else if (camera.view?.enabled) camera.clearViewOffset()
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    sky.position.copy(camera.position)
    world.uEye.value.copy(camera.position)

    // ── what answers the cursor: the city's blocks and a pool of light on the street ──
    const hovering = pointerSeen && !state.launched
    const magnetAt = pointerSeen ? pointer : magnet.wander.set(Math.sin(t * 0.21) * 0.82, 0.16 + Math.sin(t * 0.33) * 0.26)
    magnet.points.forEach((point, i) => {
      point.lerp(magnetAt, 1 - Math.exp(-dt * magnet.rates[i]))
      world.uMagnetDir.value[i].set(point.x, point.y, 0.5).unproject(camera).sub(camera.position).normalize()
    })
    // without a cursor the magnet only wanders during the intro and on touch screens
    const wandering = !pointerSeen && (m < 1 || touchOnly)
    world.uMagnet.value += ((state.launched ? 0 : pointerSeen ? 1 : wandering ? 0.7 : 0) - world.uMagnet.value) * (1 - Math.exp(-dt * 3))
    ray.setFromCamera(pointerSmooth, camera)
    const aim = ray.ray
    const onFloor = hovering && aim.direction.y < -0.02
    if (onFloor) {
      const reach = -aim.origin.y / aim.direction.y
      world.uCursor.value.x = aim.origin.x + aim.direction.x * reach
      world.uCursor.value.y = aim.origin.z + aim.direction.z * reach
    }
    world.uCursor.value.z += ((onFloor ? 1 : 0) - world.uCursor.value.z) * (1 - Math.exp(-dt * 6))

    // ── gamepad, its lights and rings ──
    const { aimX, aimY } = placePad(t, dt)
    const reach = pad.scale.x * 2.2
    scratch.right.setFromMatrixColumn(camera.matrixWorld, 0)
    scratch.up.setFromMatrixColumn(camera.matrixWorld, 1)
    keyCyan.position.copy(pad.position).addScaledVector(scratch.right, -reach).addScaledVector(scratch.up, reach * 0.4).addScaledVector(scratch.v.setFromMatrixColumn(camera.matrixWorld, 2), reach)
    keyMagenta.position.copy(pad.position).addScaledVector(scratch.right, reach).addScaledVector(scratch.up, -reach * 0.1).addScaledVector(scratch.v, reach)
    keyCyan.visible = keyMagenta.visible = pad.visible
    // docked in the hero it is small and sits over a busy street, so it gets more light
    keyCyan.intensity = keyMagenta.intensity = 130 + 60 * m
    scene.environmentIntensity = 1 + 0.4 * m

    rings.visible = pad.visible
    rings.position.copy(pad.position)
    rings.quaternion.copy(camera.quaternion)
    rings.scale.setScalar(pad.scale.x * state.ringScale)
    rings.userData.rings.forEach((ring, i) => {
      ring.rotation.z += dt * (0.25 + i * 0.12) * (i % 2 ? -1 : 1) * (1 + state.padHover * 3)
    })

    // hero: the gamepad wakes up under the cursor, stands on its projector, and has a pool
    // of shadow behind it
    const settled = THREE.MathUtils.smoothstep(m, 0.6, 1)
    const overPad = hovering && view.docked && m === 1 && Math.hypot((pointer.x - view.padAt.x) * camera.aspect, pointer.y - view.padAt.y) < 0.38
    state.padHover += ((overPad ? 1 : 0) - state.padHover) * (1 - Math.exp(-dt * 7))
    projector.visible = backing.visible = view.docked
    if (view.docked) {
      const padWidth = pad.scale.x * modelSize.x
      projector.position.copy(pad.position).addScaledVector(scratch.up, -padWidth * 0.36)
      // laid almost flat, tipped toward the viewer
      projector.quaternion.copy(camera.quaternion).multiply(scratch.q.setFromAxisAngle(X_AXIS, -1.2))
      projector.scale.setScalar(padWidth * 0.4 * settled + 1e-4)
      backing.position.copy(pad.position).addScaledVector(scratch.v.setFromMatrixColumn(camera.matrixWorld, 2), -1.3)
      backing.quaternion.copy(camera.quaternion)
      backing.scale.setScalar(padWidth * 2.3)
      backing.material.uniforms.uAmount.value = settled
    }
    strips.forEach((strip, i) => {
      strip.material.emissiveIntensity = strip.userData.baseGlow * (1 + 0.28 * Math.sin(t * 2.4 + i * 0.9) + state.padHover * 0.8)
    })

    gate.userData.update(dt)

    // ── controls: glow and travel ease toward their pressed state ──
    // idle demo: left alone in the hero, the gamepad presses a face button now and then
    if (m === 1 && !usingRealGamepad && t > demo.next) {
      demo.name = FACE_BUTTONS[Math.floor(Math.random() * FACE_BUTTONS.length)]
      demo.until = t + 0.16
      demo.next = t + 0.6 + Math.random() * 1.8
    }
    for (const [name, c] of Object.entries(controls)) {
      const lit = c.target || (name === demo.name && t < demo.until) || t < state.flashUntil ? 1 : 0
      if (lit && !c.lit && c.target) recoil.v += 1.1 // a real press kicks the gamepad back
      c.lit = lit
      c.glow += (lit - c.glow) * (1 - Math.exp(-dt * 18))
      if (DPAD[name]) {
        c.mesh.material.emissiveIntensity = c.mesh.userData.baseGlow + c.glow * 7
        c.mesh.scale.setScalar(1 + c.glow * 0.35)
      } else {
        c.mesh.position.y = c.rest.y - c.glow * 0.012
        c.mesh.material.emissiveIntensity = c.glow * 5
        if (c.halo) c.halo.material.emissiveIntensity = c.halo.userData.baseGlow + c.glow * 8
      }
    }
    // sticks: right follows the pointer, left follows the direction keys (or a real controller)
    if (!usingRealGamepad) {
      stickAim.R.set(aimX, aimY)
      stickAim.L.set(0, 0)
      for (const [name, [x, y]] of Object.entries(DPAD)) {
        if (controls[name]?.target) stickAim.L.add({ x, y })
      }
    }
    for (const side of ['L', 'R']) {
      const stick = sticks[side]
      if (!stick) continue
      stick.rotation.z += (-stickAim[side].x * 0.38 - stick.rotation.z) * (1 - Math.exp(-dt * 12))
      stick.rotation.x += (-stickAim[side].y * 0.38 - stick.rotation.x) * (1 - Math.exp(-dt * 12))
    }

    final.uniforms.uTime.value = t
    final.uniforms.uWarp.value = world.uWarp.value
    composer.render()
  }

  function setRunning(next) {
    if (disposed || running === next) return
    running = next
    canvas.style.visibility = next ? 'visible' : 'hidden'
    if (next) {
      clock.getDelta() // drop the time spent paused
      tick()
    } else {
      cancelAnimationFrame(frame)
    }
  }

  /** Everything the hero's view needs, set at once. */
  function setHeroState() {
    cancelTweens()
    view.mode = 'hero'
    view.mix = 1
    Object.assign(state, { speed: HERO.speed, fovBoost: 0, camLift: 0, camBack: 0, padPush: 0, padShrink: 1, ringScale: 1, launched: false, padFlip: 0, flashUntil: 0 })
    world.uWarp.value = 0
    final.uniforms.uAberration.value = 0.0016
    final.uniforms.uGlitch.value = 0
    bloom.strength = HERO.bloom
    shock.visible = false
    perf.grace = 2
  }

  /**
   * The flight from the intro into the hero: one unbroken move. The camera glides from its
   * intro position to the hero's, the vanishing point slides over to the profile card, the
   * world dims and slows, and the gamepad arcs down onto its slot, all on the same clock.
   * `surge` (0..1) adds a burst of speed in the first half, like punching the accelerator.
   */
  function flyToHero(seconds, surge) {
    if (view.mode === 'hero') return
    cancelTweens()
    view.mode = 'hero'
    state.launched = true // pauses the magnet and the frame-rate watch until we have arrived
    holo.uHoloReveal.value = 1e4
    const from = { speed: state.speed, reveal: world.uReveal.value, fade: final.uniforms.uFade.value, spin: state.padSpin, rings: state.ringScale, lift: state.camLift, back: state.camBack }

    let rush = 0
    if (surge) tween(seconds * 0.62, (k) => (rush = surge * Math.pow(Math.sin(Math.PI * k), 1.4)), (x) => x)
    if (surge > 0.5) {
      shock.visible = true
      tween(0.7, (k) => {
        shock.position.copy(pad.position)
        shock.quaternion.copy(camera.quaternion)
        shock.scale.setScalar(pad.scale.x * (0.4 + k * 5))
        shock.material.opacity = (1 - k) * 0.9
      }, ease.out).then(() => (shock.visible = false))
      tween(0.18, (k) => (final.uniforms.uGlitch.value = Math.sin(k * Math.PI)), (x) => x)
    }

    tween(seconds, (k) => {
      view.mix = k
      world.uReveal.value = from.reveal + (1 - from.reveal) * Math.min(1, k * 2.5)
      final.uniforms.uFade.value = from.fade + (1 - from.fade) * Math.min(1, k * 4)
      state.ringScale = from.rings + (1 - from.rings) * k
      state.camLift = from.lift * (1 - k)
      state.camBack = from.back * (1 - k)
      state.padSpin = (from.spin + Math.PI * 2) * (1 - k) // one last roll on the way down
      bloom.strength = INTRO.bloom + (HERO.bloom - INTRO.bloom) * k + rush * 0.45
      state.speed = from.speed + (HERO.speed - from.speed) * k + rush * 130
      state.fovBoost = rush * 22
      world.uWarp.value = rush * 0.5
      final.uniforms.uAberration.value = 0.0016 + rush * 0.008
    }, ease.inOut).then(() => {
      if (view.mix === 1) setHeroState()
    })
  }

  // Compile shaders now, so the first visible frame does not stutter.
  renderer.compile(scene, camera)
  onProgress(1)
  setRunning(true)

  if (mode === 'hero') {
    // No intro: the city assembles and the gamepad materialises behind the page.
    setHeroState()
    state.padSpin = -2.2
    tween(1.2, (k) => (final.uniforms.uFade.value = k), ease.out)
    tween(3, (k) => (world.uReveal.value = k), ease.out)
    tween(1.8, (k) => (state.padSpin = -2.2 * (1 - k)), ease.out)
    tween(1.9, (k) => {
      const span = 1.6 * pad.scale.x
      holo.uHoloReveal.value = pad.position.y - span + span * 2.2 * k
    }, ease.inOut).then(() => (holo.uHoloReveal.value = 1e4))
  }

  return {
    /** Intro: fades the world in, sweeps the camera down and materialises the gamepad. */
    async reveal() {
      const top = rig.padY + 1.5 * rig.padScale
      const bottom = rig.padY - 1.5 * rig.padScale
      holo.uHoloReveal.value = bottom - 0.5
      tween(0.9, (k) => (final.uniforms.uFade.value = k), ease.out)
      tween(2.6, (k) => {
        world.uReveal.value = k
        state.speed = INTRO.speed * k
      }, ease.out)
      tween(2.4, (k) => {
        state.camLift = 5.5 * (1 - k)
        state.camBack = 9 * (1 - k)
        state.padSpin = -2.6 * (1 - k)
      }, ease.inOut)
      await tween(0.7, () => {}) // hold the hologram for a moment
      if (view.mode !== 'intro') return
      tween(1.2, (k) => (state.ringScale = 0.001 + k), ease.out)
      await tween(1.5, (k) => (holo.uHoloReveal.value = bottom - 0.5 + (top - bottom + 1) * k), ease.inOut)
      if (view.mode === 'intro') holo.uHoloReveal.value = 1e4
    },

    /**
     * Intro: the player pressed start. Begins the flight into the hero with a burst of speed
     * and resolves once the page should start to appear over it; the flight itself carries on
     * underneath for about another second and a half.
     */
    async launch() {
      if (view.mode !== 'intro') return
      flyToHero(2.2, 1)
      if (controls.Btn_A) {
        controls.Btn_A.target = 1
        tween(0.3, () => {}).then(() => (controls.Btn_A.target = 0))
      }
      await tween(0.6, () => {})
    },

    /**
     * Hands the world over to the hero section. After launch() this does nothing (the flight
     * is already under way); on a skip it starts a shorter, gentler flight from wherever the
     * intro had got to.
     */
    enterHero() {
      flyToHero(1.4, 0.3)
    },

    /** Lights a control (and presses it down) while `on` is true. */
    press(name, on) {
      if (controls[name]) controls[name].target = on ? 1 : 0
    },

    /** x and y in -1..1 across the viewport, with y pointing up. */
    setPointer(x, y) {
      pointer.set(x, y)
      pointerSeen = true
    },

    /** How far a section (`hero` or `about`) has scrolled past, 0..1. Moves the camera on. */
    setScroll(progress, part = 'hero') {
      journey[part] = THREE.MathUtils.clamp(progress, 0, 1)
      view.scrollTarget = journey.hero + journey.about
    },

    /** The page element the gamepad should sit on in hero mode (null hides it). */
    setPadAnchor(element) {
      view.anchor = element
    },

    /** A click on the scene: the blocks around it burst apart and a ring of light crosses the street. */
    ripple(clientX, clientY) {
      ray.setFromCamera({ x: (clientX / size.w) * 2 - 1, y: -((clientY / size.h) * 2 - 1) }, camera)
      const { origin, direction } = ray.ray
      world.uBlast.value.set(direction.x, direction.y, direction.z, world.uTime.value)
      if (direction.y >= -0.01) return false // clicked the sky
      const hit = origin.clone().addScaledVector(direction, -origin.y / direction.y)
      world.uRipple.value.set(hit.x, hit.z - world.uScroll.value, world.uTime.value, 1)
      return true
    },

    /** Hero: the gamepad spins once, every control flashes and a ring bursts out of it. */
    spinPad() {
      if (view.mix < 1 || !view.docked || state.padFlip) return
      state.flashUntil = world.uTime.value + 0.3
      recoil.v += 1.6
      const padWidth = pad.scale.x * modelSize.x
      shock.visible = true
      tween(0.7, (k) => {
        shock.position.copy(pad.position)
        shock.quaternion.copy(camera.quaternion)
        shock.scale.setScalar(padWidth * (0.25 + k * 0.5))
        shock.material.opacity = (1 - k) * 0.85
      }, ease.out).then(() => (shock.visible = false))
      tween(1, (k) => (state.padFlip = k < 1 ? Math.PI * 2 * (1 - k) : 0), ease.out)
    },

    /** Whether a section is on screen. Drawing stops (and the canvas hides) when none is. */
    setActive(active, part = 'hero') {
      showing[part] = Boolean(active)
      setRunning(showing.hero || showing.about)
    },

    set onGamepadButton(fn) {
      api.onGamepadButton = fn
    },

    dispose() {
      setRunning(false)
      disposed = true
      window.removeEventListener('resize', resize)
      scene.traverse((node) => {
        node.geometry?.dispose()
        for (const m of [].concat(node.material ?? [])) m.dispose()
      })
      if (ground.isReflector) ground.dispose()
      facades.dispose()
      noise.dispose()
      environment.dispose()
      pmrem.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
