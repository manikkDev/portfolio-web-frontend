/** What hangs in the air: rain, and motes of light drifting over the road. */
import * as THREE from 'three'

const SHARED = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }

/** Streaks of rain in a box that follows the camera. */
export function createRain(uniforms, count) {
  const position = new Float32Array(count * 6)
  const end = new Float32Array(count * 2)
  const seed = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 60
    const y = Math.random() * 30
    const z = Math.random() * 60
    position.set([x, y, z, x, y, z], i * 6)
    end.set([0, 1], i * 2)
    seed.fill(Math.random(), i * 2, i * 2 + 2)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geometry.setAttribute('aEnd', new THREE.BufferAttribute(end, 1))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const rain = new THREE.LineSegments(
    geometry,
    new THREE.ShaderMaterial({
      uniforms,
      ...SHARED,
      vertexShader: /* glsl */ `
        attribute float aEnd, aSeed;
        uniform float uScroll, uTime, uReveal, uDim;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y = mod(p.y - uTime * (24.0 + aSeed * 12.0), 30.0);
          p.z = mod(p.z + uScroll, 60.0) - 50.0 + cameraPosition.z - 10.0;
          p.x += cameraPosition.x;
          // the lower end of each streak trails downwind
          p += vec3(0.12, -1.0, 0.0) * aEnd * (0.7 + aSeed * 0.9);
          vec4 mv = viewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          vAlpha = (1.0 - aEnd * 0.8) * (0.1 + 0.16 * aSeed) * smoothstep(-55.0, -30.0, mv.z) * uReveal * uDim;
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() { gl_FragColor = vec4(vec3(0.6, 0.78, 1.0) * vAlpha, 1.0); }`,
    }),
  )
  rain.frustumCulled = false
  return rain
}

/** Glowing motes drifting above the street. */
export function createDust(uniforms, count) {
  const position = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    position.set([(Math.random() - 0.5) * 34, 0.3 + Math.random() * 11, -Math.random() * 60], i * 3)
    seed[i] = Math.random()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const points = new THREE.Points(
    geometry,
    new THREE.ShaderMaterial({
      uniforms,
      ...SHARED,
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uScroll, uTime, uReveal, uPixelRatio, uDim;
        varying float vSeed, vAlpha;
        void main() {
          vec3 p = position;
          p.z = mod(p.z + uScroll * 0.35 + 60.0, 70.0) - 60.0;
          p.x += sin(uTime * 0.4 + aSeed * 30.0) * 0.6;
          p.y += sin(uTime * 0.6 + aSeed * 50.0) * 0.3;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.0 + aSeed * 5.0) * uPixelRatio * (9.0 / -mv.z);
          vSeed = aSeed;
          vAlpha = uReveal * uDim * smoothstep(-60.0, -40.0, p.z) * (0.5 + 0.3 * sin(uTime * 2.0 + aSeed * 80.0));
        }`,
      fragmentShader: /* glsl */ `
        varying float vSeed, vAlpha;
        uniform vec3 uCyan, uMagenta;
        void main() {
          float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
          vec3 col = vSeed < 0.5 ? uCyan : (vSeed < 0.85 ? uMagenta : vec3(1.0));
          gl_FragColor = vec4(col * glow * glow * 1.6 * vAlpha, 1.0);
        }`,
    }),
  )
  points.frustumCulled = false
  return points
}
