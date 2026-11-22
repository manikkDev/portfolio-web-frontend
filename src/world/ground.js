/**
 * The street: wet asphalt with lane lights, kerbs, pavements and plazas, mirroring the
 * city in its puddles. With `mirror` on, the scene is drawn a second time upside down at
 * reduced size (three's Reflector) and the wet surface shows it; without it the road only
 * picks up the glow of the sky, which is much cheaper.
 */
import * as THREE from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import { GLSL } from './shared.js'

const VERTEX = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 vMirror;
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vMirror = textureMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const FRAGMENT = /* glsl */ `
  uniform sampler2D tDiffuse, uNoise;
  uniform float uScroll, uReveal, uTime, uDim, uMirror;
  uniform vec4 uRipple[4]; // recent clicks on the floor: x, z (in road coordinates), start time, strength
  uniform vec3 uCursor;    // x, z where the cursor points at the floor, strength
  uniform vec3 uCyan, uMagenta, uFog;
  varying vec4 vMirror;
  varying vec3 vWorld;
  ${GLSL}

  void main() {
    vec2 p = vec2(vWorld.x, vWorld.z - uScroll);
    float ax = abs(p.x);
    vec3 view = normalize(cameraPosition - vWorld);
    float near = exp(-length(vWorld.xz - cameraPosition.xz) * 0.03);    // detail fades with distance

    vec4 big = texture2D(uNoise, p * 0.021);
    vec4 fine = texture2D(uNoise, p * 0.19);
    vec4 swell = texture2D(uNoise, p * 0.06);

    // ── surfaces, from the centre line outward: road, kerb, pavement, plaza ──
    float road = smoothstep(7.25, 7.05, ax);
    float kerb = smoothstep(7.05, 7.25, ax) * smoothstep(7.95, 7.75, ax);
    float walk = smoothstep(7.75, 7.95, ax) * smoothstep(17.6, 17.4, ax);
    float plaza = smoothstep(17.4, 17.6, ax);

    vec3 col = vec3(0.014, 0.014, 0.02) * (0.6 + 0.8 * fine.g);                           // asphalt
    col = mix(col, vec3(0.05, 0.05, 0.06) * (0.8 + 0.4 * fine.g), kerb);
    vec2 tile = abs(fract(p / 2.2) - 0.5);
    col = mix(col, vec3(0.026, 0.026, 0.034) * (0.75 + 0.5 * fine.r) * (1.0 - 0.5 * smoothstep(0.46, 0.5, max(tile.x, tile.y)) * near), walk);
    vec2 plate = abs(fract(p / 8.0) - 0.5);
    col = mix(col, vec3(0.012, 0.012, 0.02) * (0.7 + 0.6 * fine.g), plaza);

    // paint: dashed centre line, lane dividers, a crossing every so often
    float dash = step(0.5, fract(p.y / 7.0));
    float paint = smoothstep(0.17, 0.09, ax) * dash + smoothstep(0.1, 0.05, abs(ax - 3.5)) * step(0.62, fract(p.y / 5.0));
    float crossing = step(abs(fract(p.y / 65.0) - 0.5), 0.03) * step(0.45, fract(p.x / 1.5)) * step(ax, 6.4);
    col += vec3(0.5, 0.52, 0.56) * (paint * 0.5 + crossing * 0.16) * road * (0.55 + 0.45 * fine.r);

    // lights set into the street: a strip along each kerb that pulses toward the gate,
    // a thin line down each pavement, and faint seams between the plaza plates
    vec3 glow = uCyan * smoothstep(0.16, 0.05, abs(ax - 6.85)) * (0.8 + 1.4 * smoothstep(0.2, 0.0, fract(p.y / 26.0 + uTime * 0.35)));
    glow += uMagenta * smoothstep(0.07, 0.02, abs(ax - 12.6)) * 0.9;
    glow += mix(uCyan, uMagenta, step(0.0, p.x)) * smoothstep(0.495, 0.5, max(plate.x, plate.y)) * plaza * 0.45 * near;
    // a pulse of light that runs down the road every few seconds
    glow += uMagenta * smoothstep(5.0, 0.0, abs(fract(p.y / 90.0) * 90.0 - 45.0)) * smoothstep(0.1, 0.05, abs(ax - 3.5)) * 1.2;

    // ── water ──
    float puddle = smoothstep(0.5, 0.66, big.r) * (1.0 - plaza * 0.6);
    float wet = mix(0.4, 1.0, puddle) * (1.0 - kerb * 0.5);
    col *= mix(1.0, 0.45, puddle);

    // raindrops ringing in the puddles
    vec2 cell = p / 1.3;
    vec2 id = floor(cell);
    vec2 drop = fract(cell) - 0.5 - (vec2(hash(id), hash(id + 7.0)) - 0.5) * 0.5;
    float t = fract(uTime * 0.9 + hash(id + 3.0));
    float ring = smoothstep(0.045, 0.0, abs(length(drop) - t * 0.42)) * (1.0 - t) * puddle * near;

    // what the wet surface mirrors: sharp in puddles, smeared toward the viewer elsewhere
    float facing = max(view.y, 0.0);
    float fresnel = 0.05 + 0.95 * pow(clamp(1.0 - facing, 0.0, 1.0), 4.0);
    vec3 mirror;
    if (uMirror > 0.5) {
      vec2 uv = vMirror.xy / vMirror.w + (swell.rg - 0.5) * mix(0.02, 0.003, puddle) + (fine.rg - 0.5) * 0.004 + normalize(drop + 0.0001) * ring * 0.02;
      float smear = mix(0.012, 0.0015, puddle);
      mirror = texture2D(tDiffuse, uv).rgb * 0.4
        + texture2D(tDiffuse, uv + vec2(0.0, smear)).rgb * 0.2 + texture2D(tDiffuse, uv - vec2(0.0, smear)).rgb * 0.2
        + texture2D(tDiffuse, uv + vec2(0.0, smear * 2.4)).rgb * 0.1 + texture2D(tDiffuse, uv - vec2(0.0, smear * 2.4)).rgb * 0.1;
    } else {
      mirror = mix(vec3(0.2, 0.02, 0.24), vec3(0.01, 0.006, 0.04), facing * 3.0) * uDim * (0.7 + 0.6 * fine.r);
    }
    col = col * uDim + mirror * fresnel * wet * 0.85 + vec3(0.5, 0.8, 1.0) * ring * 0.12 * uDim;
    col += glow * uDim * (0.75 + 0.25 * fine.r);

    col = haze(col, vWorld, uFog * uDim);

    // a click on the floor sends a ring of light spreading slowly outward across the street
    // (never dimmed); four can be on their way at once, so a fast click never cuts one off
    for (int i = 0; i < 4; i++) {
      vec4 r = uRipple[i];
      float age = uTime - r.z;
      if (age < 0.0 || age > 4.0) continue;
      float front = abs(distance(p, r.xy) - age * 11.0);
      float wave = smoothstep(1.8, 0.0, front) + smoothstep(5.0, 0.0, front) * 0.35;
      col += mix(uCyan, vec3(1.0), 0.35) * wave * exp(-age * 1.1) * r.w * (0.3 + 0.5 * puddle + 0.4 * wet * fresnel);
    }

    // under the cursor: a soft pool of neon light on the wet asphalt, strongest where it is
    // wettest, with the raindrops glinting in it
    vec2 toCursor = vWorld.xz - uCursor.xy;
    float pool = exp(-dot(toCursor, toCursor) * 0.05) * uCursor.z;
    col += mix(uCyan, uMagenta, 0.4) * pool * (0.03 + 0.26 * wet * fresnel + 0.14 * puddle) + vec3(0.7, 0.95, 1.0) * ring * pool * 0.8;

    gl_FragColor = vec4(col * smoothstep(0.0, 0.5, uReveal), 1.0);
  }
`

export function createGround(uniforms, { mirror, width, height }) {
  const geometry = new THREE.PlaneGeometry(700, 700)
  const shader = {
    uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: new THREE.Matrix4() } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
  }
  const ground = mirror
    ? new Reflector(geometry, { shader, textureWidth: width, textureHeight: height, clipBias: 0.003, multisample: 0 })
    : new THREE.Mesh(geometry, new THREE.ShaderMaterial(shader))
  Object.assign(ground.material.uniforms, uniforms)
  ground.rotation.x = -Math.PI / 2

  /** Turns the mirror off for good (the cheap sky glow takes over). */
  ground.userData.stopMirror = () => {
    if (!ground.isReflector) return
    ground.onBeforeRender = () => {}
    ground.getRenderTarget().dispose()
  }
  ground.userData.resize = (w, h) => ground.isReflector && ground.getRenderTarget().setSize(w, h)
  return ground
}
