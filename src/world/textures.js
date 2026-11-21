/**
 * Textures painted in code at load time (nothing to download).
 *
 * createFacades(): four tiling building fronts in one array texture. Each tile is 2 x 2
 * window bays. The channels mean:
 *   R  how bright the wall is (panels, seams, grime, frames)
 *   G  1 where there is glass
 *   B  what a lit window looks like inside (ceiling light falloff, blinds, partitions)
 *   A  small lights that are always on (LED strips, unit status lights)
 * createNoise(): tiling smooth noise in R, G (two scales) and white noise in B.
 */
import * as THREE from 'three'
import { seededRandom } from './shared.js'

const SIZE = 256
const BAY = SIZE / 2

function painter(data, layer, random) {
  const base = layer * SIZE * SIZE * 4
  const at = (x, y, channel) => base + ((((y % SIZE) + SIZE) % SIZE) * SIZE + (((x % SIZE) + SIZE) % SIZE)) * 4 + channel
  const p = {
    /** Fills a rectangle of one channel. `value` is a number or (x, y) => number, x and y inside the rectangle. */
    rect(channel, x, y, w, h, value) {
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) data[at(x + i, y + j, channel)] = typeof value === 'function' ? value(i, j) : value
      }
    },
    /** A window: glass, a dark frame around it, and its lit interior. */
    window(x, y, w, h, interior) {
      p.rect(0, x - 3, y - 3, w + 6, h + 6, 46)
      p.rect(1, x, y, w, h, 255)
      p.rect(2, x, y, w, h, interior ?? ((i, j) => 110 + 145 * (j / h)))
    },
    /** A dark bar across glass (mullion, railing). */
    bar(x, y, w, h) {
      p.rect(1, x, y, w, h, 0)
      p.rect(0, x, y, w, h, 50)
    },
    /** Wall base with seams, plus streaks of grime. */
    wall(shade) {
      const streak = Array.from({ length: SIZE }, () => 0.86 + random() * 0.14)
      p.rect(0, 0, 0, SIZE, SIZE, (i, j) => shade * streak[i] * (0.94 + random() * 0.06) * (1 - 0.1 * (1 - (j % BAY) / BAY)))
    },
  }
  return p
}

export function createFacades(anisotropy = 1) {
  const random = seededRandom(11)
  const data = new Uint8Array(SIZE * SIZE * 4 * 4)
  const blinds = (rows) => (i, j) => (Math.floor(j / 5) % 2 && j < rows ? 70 : 215)

  // 0: office grid, one framed window per bay with a centre mullion
  let p = painter(data, 0, random)
  p.wall(150)
  for (let by = 0; by < 2; by++) {
    for (let bx = 0; bx < 2; bx++) {
      const x = bx * BAY
      const y = by * BAY
      p.rect(0, x, y, BAY, 3, 80) // floor seam
      p.rect(0, x, y, 2, BAY, 100) // panel seam
      p.window(x + 18, y + 28, 92, 80, (bx + by) % 2 ? blinds(52) : undefined)
      p.bar(x + 63, y + 28, 3, 80)
      p.rect(0, x + 14, y + 20, 100, 5, 205) // sill
      p.rect(0, x + 44, y + 6, 40, 9, (i, j) => (j % 3 ? 95 : 150)) // vent
    }
  }

  // 1: ribbon windows, a glass band on every floor and a solid band between
  p = painter(data, 1, random)
  p.wall(128)
  for (let by = 0; by < 2; by++) {
    const y = by * BAY
    p.rect(0, 0, y, SIZE, 3, 70)
    p.window(0, y + 46, SIZE, 66, (i, j) => (110 + 145 * (j / 66)) * (i % 64 > 50 && by ? 0.45 : 1))
    for (let x = 0; x < SIZE; x += 64) p.bar(x, y + 46, 3, 66)
    p.rect(0, 0, y + 40, SIZE, 4, 200)
    for (let x = 12; x < SIZE; x += 32) p.rect(0, x, y + 20, 3, 3, 210) // rivets
    p.rect(0, 150, y + 10, 60, 22, (i, j) => (j % 4 < 2 ? 80 : 140)) // grille
  }

  // 2: tall narrow windows between bright vertical fins
  p = painter(data, 2, random)
  p.wall(96)
  const fin = BAY / 3
  for (let by = 0; by < 2; by++) {
    for (let k = 0; k < 6; k++) {
      const x = Math.round(k * fin)
      const y = by * BAY
      p.window(x + 9, y + 8, Math.round(fin) - 12, BAY - 12, k % 3 === 1 ? blinds(70) : undefined)
      p.rect(0, x, y, 6, BAY, 225)
      p.rect(0, x, y, Math.round(fin), 5, 78)
      if (k === 2) p.rect(3, x + 2, y, 2, BAY, 255) // LED strip up one fin
    }
  }

  // 3: apartments, two small windows per bay with a balcony rail and a cooling unit
  p = painter(data, 3, random)
  p.wall(118)
  for (let by = 0; by < 2; by++) {
    for (let bx = 0; bx < 2; bx++) {
      const x = bx * BAY
      const y = by * BAY
      p.rect(0, x, y, BAY, 3, 76)
      p.window(x + 12, y + 50, 44, 58, bx === by ? (i, j) => (i < 20 ? 90 : 235) * (0.6 + 0.4 * (j / 58)) : undefined)
      p.window(x + 72, y + 50, 44, 58)
      p.rect(0, x + 6, y + 38, 116, 6, 215) // balcony slab
      for (let i = 8; i < 120; i += 7) p.bar(x + i, y + 44, 2, 16) // rail
      p.rect(0, x + 20, y + 10, 26, 20, (i, j) => (j % 4 < 2 ? 120 : 185))
      p.rect(3, x + 41, y + 25, 3, 3, 255)
    }
  }

  const texture = new THREE.DataArrayTexture(data, SIZE, SIZE, 4)
  texture.format = THREE.RGBAFormat
  texture.type = THREE.UnsignedByteType
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = anisotropy
  texture.needsUpdate = true
  return texture
}

export function createNoise() {
  const random = seededRandom(5)
  const data = new Uint8Array(SIZE * SIZE * 4)
  // smooth noise that wraps: random values on a coarse grid, blended between
  const smooth = (cells) => {
    const grid = Array.from({ length: cells * cells }, random)
    const fade = (t) => t * t * (3 - 2 * t)
    return (x, y) => {
      const gx = (x / SIZE) * cells
      const gy = (y / SIZE) * cells
      const x0 = Math.floor(gx)
      const y0 = Math.floor(gy)
      const fx = fade(gx - x0)
      const fy = fade(gy - y0)
      const g = (i, j) => grid[(j % cells) * cells + (i % cells)]
      return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy
    }
  }
  const coarse = smooth(8)
  const mid = smooth(24)
  const fine = smooth(64)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      data[i] = 255 * (coarse(x, y) * 0.65 + mid(x, y) * 0.35)
      data[i + 1] = 255 * (mid(x, y) * 0.6 + fine(x, y) * 0.4)
      data[i + 2] = 255 * random()
      data[i + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}
