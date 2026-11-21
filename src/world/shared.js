/** Constants and shader snippets shared by every part of the 3D world. */
import * as THREE from 'three'

export const CYAN = new THREE.Color(0x00f5ff)
export const MAGENTA = new THREE.Color(0xff00d4)
export const GREEN = new THREE.Color(0x39ff14)
export const FOG = new THREE.Color(0x0b0320)

/**
 * The world never moves: the road is a loop RANGE units long and every piece of scenery
 * computes where it is from its place on the loop plus `uScroll`. LOOP_Z turns that into a
 * z coordinate from -(RANGE - 30) far ahead to +30 just behind the camera.
 */
export const RANGE = 260
const AHEAD = RANGE - 30

/** Same sequence on every visit, so the city (and every screenshot of it) is the same city. */
export function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const GLSL = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  // where something that lives at "home" on the looping road is right now
  float loopZ(float home, float scroll) { return mod(home + scroll, ${RANGE.toFixed(1)}) - ${AHEAD.toFixed(1)}; }
  // night haze: thicker near the street, where it also picks up the neon
  vec3 haze(vec3 col, vec3 world, vec3 fogColor) {
    float low = exp(-max(world.y, 0.0) * 0.07);
    float amount = 1.0 - exp(-length(world.xz - cameraPosition.xz) * 0.0135 * (0.6 + 0.8 * low));
    return mix(col, fogColor + vec3(0.05, 0.004, 0.07) * low, amount);
  }
  // rotation about an axis (Rodrigues)
  vec3 turn(vec3 v, vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
  }
`
