/**
 * The city: towers built out of separate blocks, drawn in one instanced call.
 *
 * At rest the blocks sit together and read as solid buildings with textured fronts, lit
 * windows, shops at street level, rooftop gear and neon signs. Every block can come loose:
 *   - the cursor is a magnet that pushes blocks away from wherever it points; each block
 *     follows the cursor with its own delay, so they drift out and settle back one by one
 *   - a click sends a burst through the blocks around it
 *   - as the scene is revealed the blocks fly in and assemble, floor by floor
 * All of that is worked out in the vertex shader from a few uniforms, so it costs the same
 * whether nothing or everything is moving.
 */
import * as THREE from 'three'
import { GLSL, RANGE, seededRandom } from './shared.js'

const KIND = { wall: 0, gear: 1, sign: 2, screen: 3, mast: 4 }
const FACE = { right: 1, left: 2, top: 4, bottom: 8, front: 16, back: 32 }
const ALL_FACES = 63
const LOT = 13 // one building plot along the road; RANGE / LOT plots make the loop
const FLOATS = 19

/** Lays out the city. Returns the per-block data and one outline per building tier. */
function layout({ rows, pieces }) {
  const random = seededRandom(7)
  const blocks = []
  const outlines = []
  const add = (tower, x, y, z, kind, sx, sy, sz, faces, tier, free) =>
    blocks.push(...tower, x, y, z, kind, sx, sy, sz, faces, random(), random(), random(), free, ...tier)

  // one tier of a tower, cut into a shell of blocks about `piece` across (0: left whole)
  const tier = (tower, w, d, y0, h, piece) => {
    const free = piece ? 1 : 0
    const nx = piece ? Math.min(12, Math.max(2, Math.round(w / piece))) : 1
    const nz = piece ? Math.min(12, Math.max(2, Math.round(d / piece))) : 1
    const ny = piece ? Math.max(1, Math.round(h / (piece * 1.1))) : 1
    const info = [w / 2, d / 2, y0 + h]
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        for (let iz = 0; iz < nz; iz++) {
          const inside = ix > 0 && ix < nx - 1 && iz > 0 && iz < nz - 1
          if (inside && iy < ny - 1) continue // hollow, except for the roof
          const faces =
            (ix === nx - 1 ? FACE.right : 0) | (ix === 0 ? FACE.left : 0) | (iz === nz - 1 ? FACE.front : 0) | (iz === 0 ? FACE.back : 0) | (iy === ny - 1 ? FACE.top : 0)
          add(tower, ((ix + 0.5) / nx - 0.5) * w, y0 + ((iy + 0.5) / ny) * h, ((iz + 0.5) / nz - 0.5) * d, KIND.wall, w / nx, h / ny, d / nz, faces, info, free)
        }
      }
    }
    if (free) outlines.push(...tower, 0, y0 + h / 2, 0, w, h, d)
  }

  const lots = RANGE / LOT
  for (let row = 0; row < rows; row++) {
    const piece = pieces[row] ?? 0 // rows next to the road are made of loose blocks, finest in front
    const free = piece ? 1 : 0
    for (const side of [-1, 1]) {
      for (let lot = 0; lot < lots; lot++) {
        if (random() < 0.08) continue // an empty plot now and then
        const w = 6.5 + random() * 5
        const d = 6.5 + random() * 4.5
        const tall = Math.pow(random(), 1.6)
        const h = row === 0 ? (random() < 0.3 ? 6 + random() * 4 : 11 + tall * 26) : row === 1 ? 18 + tall * 34 : 34 + tall * 30 + row * 12
        const x = side * (18 + row * 17 + w / 2 + random() * 2.5)
        const tower = [x, lot * LOT + LOT / 2 + (random() - 0.5) * 2, random(), h]

        const tiers = h > 22 ? (random() < 0.55 ? 2 : 3) : random() < 0.35 && h > 10 ? 2 : 1
        const share = tiers === 1 ? [1] : tiers === 2 ? [0.62, 0.38] : [0.46, 0.32, 0.22]
        let y = 0
        let tw = w
        let td = d
        for (let k = 0; k < tiers; k++) {
          tier(tower, tw, td, y, h * share[k], piece)
          y += h * share[k]
          if (free && k < tiers - 1 && random() < 0.7) {
            // cooling units on the ledge the next tier leaves
            add(tower, (random() - 0.5) * tw * 0.3, y + 0.45, (td / 2 - 0.9) * (random() < 0.5 ? 1 : -1), KIND.gear, 1.6, 0.9, 1.1, ALL_FACES, [0, 0, 0], 1)
          }
          tw *= 0.66 + random() * 0.14
          td *= 0.66 + random() * 0.14
        }
        if (!free) continue

        // on the roof
        const roofW = tw / 0.73
        if (h > 16 && random() < 0.65) add(tower, (random() - 0.5) * roofW * 0.4, h + 3 + random() * 3, 0, KIND.mast, 0.16, 6 + random() * 6, 0.16, ALL_FACES, [0, 0, 0], 1)
        if (random() < 0.6) add(tower, (random() - 0.5) * 1.5, h + 0.55, (random() - 0.5) * 1.5, KIND.gear, 1.8, 1.1, 1.4, ALL_FACES, [0, 0, 0], 1)
        const toRoad = -side
        if (row < 2 && h > 12 && h < 34 && random() < 0.32) {
          // a screen on legs at the roof edge, facing the road
          add(tower, toRoad * (w / 2 - 0.4), h + 3.2, 0, KIND.screen, 0.35, 4.6, Math.min(d * 0.9, 7.5), ALL_FACES, [0, 0, 0], 1)
        }
        if (row === 0) {
          // blade signs sticking out over the pavement, and a sign board over the shops
          const signs = random() < 0.75 ? (random() < 0.35 ? 2 : 1) : 0
          for (let k = 0; k < signs; k++) {
            const sh = 4 + random() * 4.5
            add(tower, toRoad * (w / 2 + 0.95), Math.min(h - sh / 2, 5 + sh / 2 + random() * Math.max(0, h * 0.4)), (random() - 0.5) * d * 0.6, KIND.sign, 1.6, sh, 0.22, ALL_FACES, [0, 0, 0], 1)
          }
          if (random() < 0.7) add(tower, toRoad * (w / 2 + 0.12), 3.95, (random() - 0.5) * d * 0.3, KIND.sign, 0.2, 1.05, 3 + random() * 2.5, ALL_FACES, [0, 0, 0], 1)
        }
      }
    }
  }
  return { blocks: new Float32Array(blocks), outlines: new Float32Array(outlines) }
}

const VERTEX = /* glsl */ `
  attribute vec4 aTower;  // x, place on the loop, seed, height
  attribute vec4 aBox;    // centre of the block inside its tower, kind
  attribute vec4 aSize;   // size, which faces are on the outside of the building (bits)
  attribute vec4 aRand;   // delay behind the cursor, two random numbers, 1 if the block can come loose
  attribute vec3 aTier;   // half width, half depth and top of the tier the block belongs to
  uniform float uScroll, uReveal, uTime, uMagnet;
  uniform vec3 uEye;
  uniform vec3 uMagnetDir[3];   // where the cursor points: now, a moment ago, a while ago
  uniform vec4 uBlast;          // direction of the last click and when it happened
  varying vec4 vWall;     // window bay, floor, distance along the wall, distance to the wall's nearer end
  varying vec4 vRoof;     // position on the tier (x, z) and its half size
  flat varying vec4 vInfo; // tower seed, kind, 1 on an outside face, how loose the block is (flat: it seeds random choices)
  varying vec3 vPlace;    // height above the street, distance below the tier's top, 1 if it can come loose
  varying vec2 vFace;
  flat varying vec2 vFaceSize;
  varying vec3 vWorld, vNormalW;
  flat varying vec3 vFlat;
  ${GLSL}

  const float REACH = 0.165;  // how wide the magnet is, as an angle from the cursor
  const float PUSH = 0.13;    // how far it pushes, same unit

  // 1 where a cursor pointing along dir is right on a point rel away from the eye, 0 beyond the magnet's reach
  float reachOf(vec3 rel, vec3 dir) {
    float along = max(dot(rel, dir), 0.001);
    return smoothstep(1.0, 0.0, length(rel - dir * along) / (along * REACH));
  }

  void main() {
    float towerZ = loopZ(aTower.y, uScroll);
    vec3 home = vec3(aTower.x, 0.0, towerZ) + aBox.xyz;
    float r3 = fract(aRand.y * 37.31 + aRand.z * 11.7);
    vec3 scatter = vec3(aRand.y, aRand.z, r3) - 0.5;
    vec3 rel = home - uEye;

    // assembling: towers build upward, one after another
    float built = clamp(uReveal * 2.3 - aTower.z * 0.55 - min(aBox.y * 0.012, 0.5) - aRand.y * 0.25, 0.0, 1.0);
    built = built * built * (3.0 - 2.0 * built);

    // the magnet: pushed away from the line the cursor points along
    vec3 dir = normalize(aRand.x < 0.5 ? mix(uMagnetDir[0], uMagnetDir[1], aRand.x * 2.0) : mix(uMagnetDir[1], uMagnetDir[2], aRand.x * 2.0 - 1.0));
    float along = max(dot(rel, dir), 0.001);
    vec3 off = rel - dir * along;
    float reach = along * REACH;
    float pull = smoothstep(1.0, 0.0, length(off) / reach);
    pull *= pull * uMagnet;
    vec3 away = normalize(off + scatter * reach * 0.6);
    vec3 drift = (away * (0.45 + aRand.y * 1.0) + dir * (aRand.z - 0.3) * 0.7 + vec3(0.0, 0.3, 0.0)) * pull * along * PUSH;

    // a click: a burst that spreads outward and dies away
    float bAlong = max(dot(rel, uBlast.xyz), 0.001);
    vec3 bOff = rel - uBlast.xyz * bAlong;
    float bSpread = length(bOff) / bAlong;
    float age = (uTime - uBlast.w - bSpread * 0.7 - aRand.z * 0.12) * 5.0;
    float burst = age > 0.0 ? age * exp(1.0 - age) * smoothstep(0.5, 0.0, bSpread) : 0.0;
    drift += normalize(bOff + scatter * bAlong * 0.2) * burst * bAlong * 0.15;

    float loose = max(max(pull, burst), 0.0) * aRand.w;
    drift *= aRand.w;
    // loose pieces never hang still: they bob about as if weightless
    drift += vec3(sin(uTime * 1.1 + aRand.y * 40.0), cos(uTime * 0.9 + aRand.z * 40.0), sin(uTime * 1.3 + r3 * 40.0)) * loose * 0.22;
    // blocks that have not arrived yet hang scattered above their place
    drift += (scatter * vec3(26.0, 0.0, 26.0) + vec3(0.0, 10.0 + aRand.z * 34.0, 0.0)) * (1.0 - built) * aRand.w;
    float tumble = loose * (1.2 + aRand.y * 3.6) + (1.0 - built) * (2.0 + aRand.z * 5.0) * aRand.w;
    vec3 axis = normalize(scatter + vec3(0.001, 0.002, 0.003));
    float grow = mix(built, 1.0, 1.0 - aRand.w);        // solid towers just rise instead
    float size = (1.0 - 0.58 * smoothstep(0.0, 0.6, loose)) * smoothstep(0.0, 0.35, built);
    vec3 scale = aSize.xyz * mix(vec3(1.0, grow, 1.0), vec3(size), aRand.w);

    vec3 local = turn(position * scale, axis, tumble);
    vec3 world = home * vec3(1.0, mix(grow, 1.0, aRand.w), 1.0) + drift + local;
    world.y *= smoothstep(-229.5, -200.0, towerZ);    // towers rise out of the haze where the loop starts

    // which face this is, and what it shows
    vec3 inTower = aBox.xyz + position * aSize.xyz;
    float bit = normal.x > 0.5 ? 1.0 : normal.x < -0.5 ? 2.0 : normal.y > 0.5 ? 4.0 : normal.y < -0.5 ? 8.0 : normal.z > 0.5 ? 16.0 : 32.0;
    float outside = mod(floor(aSize.w / bit + 0.01), 2.0);
    float u;
    float width;
    if (abs(normal.x) > 0.5) { vFace = position.zy; vFaceSize = aSize.zy; u = inTower.z; width = aTier.y * 2.0; }
    else if (abs(normal.y) > 0.5) { vFace = position.xz; vFaceSize = aSize.xz; u = inTower.x; width = aTier.x * 2.0; }
    else { vFace = position.xy; vFaceSize = aSize.xy; u = inTower.x; width = aTier.x * 2.0; }
    float bays = max(1.0, floor(width / 1.3 + 0.5));   // a whole number of windows across each wall
    vWall = vec4((u / max(width, 0.001) + 0.5) * bays, inTower.y / 1.7, u + width * 0.5, width * 0.5 - abs(u));
    vRoof = vec4(inTower.xz, aTier.xy);
    vInfo = vec4(aTower.z, aBox.w, outside, max(loose, (1.0 - built) * 0.7 * aRand.w));
    vPlace = vec3(inTower.y, aTier.z - inTower.y, aRand.w);
    vWorld = world;
    vFlat = normal;
    vNormalW = turn(normal, axis, tumble);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);

    // Faces between neighbouring blocks can only be seen once something nearby has moved.
    // Everywhere else they are thrown away here, which is most of the city most of the time.
    float stirred = (reachOf(rel, uMagnetDir[0]) + reachOf(rel, uMagnetDir[1]) + reachOf(rel, uMagnetDir[2])) * uMagnet
      + step(bSpread, 0.55) * step(0.0, uTime - uBlast.w) * step(uTime - uBlast.w, 2.6)
      + step(uReveal, 0.999);
    if (outside < 0.5 && (stirred <= 0.0 || aRand.w < 0.5)) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  precision highp sampler2DArray;
  uniform sampler2DArray uFacade;
  uniform float uTime, uDim;
  uniform vec3 uCyan, uMagenta, uFog;
  varying vec4 vWall, vRoof;
  flat varying vec4 vInfo;
  varying vec3 vPlace, vWorld, vNormalW;
  flat varying vec3 vFlat;
  varying vec2 vFace;
  flat varying vec2 vFaceSize;
  ${GLSL}

  const vec3 WARM = vec3(1.0, 0.66, 0.3);
  const vec3 COOL = vec3(0.62, 0.85, 1.0);

  // moonlight from above, plus the neon of the street lighting everything from below
  vec3 shade(vec3 albedo, vec3 n, float height) {
    vec3 moon = vec3(0.34, 0.42, 0.7) * max(dot(n, normalize(vec3(-0.45, 0.7, 0.55))), 0.0);
    vec3 street = mix(uMagenta, uCyan, 0.5 + 0.5 * n.x) * exp(-height * 0.09) * (0.35 + 0.65 * max(-n.y + 0.3, 0.0));
    return albedo * (vec3(0.1, 0.09, 0.17) + moon + street * 0.9);
  }

  // rows of made-up characters, built from blocks like a dot-matrix sign
  float glyphs(vec2 p, float seed) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    vec2 dotAt = floor(f * vec2(5.0, 6.0));
    vec2 inDot = fract(f * vec2(5.0, 6.0));
    float margin = step(0.5, dotAt.x) * step(dotAt.x, 3.5) * step(0.5, dotAt.y) * step(dotAt.y, 4.5);
    float stroke = step(0.42, hash(dotAt + cell * 13.7 + seed * 71.0));
    return stroke * margin * step(0.12, inDot.x) * step(inDot.x, 0.88) * step(0.12, inDot.y) * step(inDot.y, 0.88);
  }

  void main() {
    float seed = vInfo.x;
    float kind = vInfo.y;
    float energy = vInfo.w;
    float height = vPlace.x;
    vec3 n = normalize(vNormalW);
    vec3 view = normalize(cameraPosition - vWorld);
    vec3 accent = seed < 0.5 ? uCyan : uMagenta;
    vec3 col;

    // distance to the edge of this face, in world units
    vec2 toEdge = (0.5 - abs(vFace)) * vFaceSize;
    float edge = min(toEdge.x, toEdge.y);

    if (kind < 0.5) {
      if (vInfo.z < 0.5) {
        // a face that is normally buried inside the building: dark, with circuit lines
        vec2 g = vFace * vFaceSize * 1.4;
        float lines = step(0.9, fract(g.x)) + step(0.9, fract(g.y));
        col = vec3(0.005, 0.007, 0.018) + accent * (0.03 + 0.1 * lines);
      } else if (vFlat.y > 0.5) {
        // roof: gravel-dark, with a lit parapet round the edge of the tier
        float rim = min(vRoof.z - abs(vRoof.x), vRoof.w - abs(vRoof.y));
        col = shade(vec3(0.05, 0.05, 0.065) * (0.6 + 0.5 * hash(floor(vRoof.xy / 1.3) + seed)), n, height);
        col += accent * smoothstep(0.2, 0.08, rim) * 1.1;
      } else {
        float layer = floor(seed * 3.999);
        vec2 bay = vWall.xy;
        vec4 tex = texture(uFacade, vec3(bay * 0.5, layer));
        float sharp = clamp(1.0 - length(fwidth(bay)) * 2.4, 0.0, 1.0);   // 0 once windows are too small to tell apart

        // which windows are lit: decided once per window, and whole floors go dark together
        vec2 parts = layer > 2.5 ? vec2(2.0, 1.0) : layer > 1.5 ? vec2(3.0, 1.0) : vec2(1.0);
        vec2 id = floor(bay * parts) + seed * 91.7 + vFlat.xz * 31.0;
        float pick = hash(id);
        float level = hash(vec2(floor(bay.y), seed * 37.0));
        float lit = step(0.44, pick) * step(0.2, level);
        if (layer > 0.5 && layer < 1.5) lit = step(0.32, level) * (0.5 + 0.5 * step(0.3, hash(floor(bay * vec2(0.34, 1.0)) + seed)));
        float hue = hash(id.yx + 5.0);
        vec3 tint = hue < 0.46 ? COOL : hue < 0.8 ? WARM : hue < 0.91 ? uMagenta : uCyan;
        tint *= 0.8 + 0.2 * sin(uTime * (0.6 + hue * 2.0) + pick * 40.0);

        vec3 base = mix(vec3(0.075, 0.08, 0.1), vec3(0.11, 0.085, 0.1), hash(vec2(seed * 13.0, 2.0)));
        col = shade(base * (0.35 + 0.9 * tex.r), n, height);
        // glass: nearly black, picking up a little of the sky
        vec3 sky = mix(vec3(0.24, 0.03, 0.27), vec3(0.02, 0.012, 0.06), clamp(reflect(-view, n).y * 2.0 + 0.3, 0.0, 1.0));
        col = mix(col, vec3(0.004, 0.005, 0.01) + sky * pow(clamp(1.0 - dot(view, n), 0.0, 1.0), 3.0), tex.g);
        col += tint * tex.g * (0.35 + 0.65 * tex.b) * mix(0.42, lit, sharp) * 1.05;
        col += accent * tex.a * 1.6 * sharp;

        // corner piers, and a band with a neon line where each tier ends
        col = mix(col, shade(base * 0.45, n, height), smoothstep(0.34, 0.26, vWall.w));
        col = mix(col, shade(base * 0.6, n, height), smoothstep(0.75, 0.62, vPlace.y));
        col += accent * smoothstep(0.17, 0.06, vPlace.y) * 1.25;

        // street level: shop fronts, lit from inside, with a sign board over each
        if (height < 3.45 && vPlace.z > 0.5) {
          float shop = vWall.z / 3.6;
          float sx = fract(shop);
          float sid = floor(shop) + floor(seed * 57.0) * 13.0;
          float pick = hash(vec2(sid, 1.0));
          float open = step(0.22, hash(vec2(sid, 4.0)));                       // some are shut for the night
          vec3 light = pick < 0.45 ? WARM : pick < 0.75 ? COOL : accent;       // two whites and the building's own colour
          float glass = step(0.07, sx) * step(sx, 0.93) * step(0.45, height) * step(height, 2.5) * step(0.035, abs(fract(sx * 3.0 + 0.5) - 0.5));
          float inside = (0.2 + 0.8 * smoothstep(0.4, 2.5, height)) * (0.7 + 0.3 * noise(vec2(vWall.z * 1.1 + sid, 3.0)));
          float board = step(0.05, sx) * step(sx, 0.95) * step(2.78, height) * step(height, 3.28);
          col = shade(vec3(0.028, 0.028, 0.036), n, height);
          col += light * glass * inside * open * 0.5;
          col += mix(accent, vec3(1.0), 0.2) * board * (0.12 + 0.88 * glyphs(vec2(sx * 6.0, (height - 2.78) / 0.5 * 0.999), sid)) * open * 0.9;
        }
        // the joints between blocks show faintly, like panel lines
        col *= 1.0 - 0.14 * (1.0 - smoothstep(0.0, 0.035, edge)) * sharp * vPlace.z;
      }
    } else if (kind < 1.5) {
      // rooftop gear
      col = shade(vec3(0.09, 0.095, 0.11) * (0.7 + 0.3 * step(0.5, fract(vFace.y * vFaceSize.y * 3.0))), n, height);
    } else if (kind < 2.5) {
      // neon sign: characters down (or along) the board, the whole sign flickering now and then
      bool wide = vFaceSize.x > vFaceSize.y;
      float small = min(vFaceSize.x, vFaceSize.y);
      vec2 p = (vFace + 0.5) * vFaceSize / small;
      float big = step(1.0, small);                       // only the two large faces carry characters
      float on = glyphs(wide ? p : vec2(p.x, -p.y), seed + vFaceSize.y) * big;
      vec3 ink = hash(vec2(seed, vFaceSize.y)) < 0.4 ? uCyan : hash(vec2(seed, vFaceSize.y)) < 0.75 ? uMagenta : hash(vec2(seed, 9.0)) < 0.5 ? WARM : vec3(0.5, 1.0, 0.45);
      float flicker = step(0.06, hash(vec2(floor(uTime * 9.0), seed * 91.0))) * 0.35 + 0.65;
      float frame = (1.0 - smoothstep(0.03, 0.09, edge)) * big;
      col = vec3(0.006, 0.006, 0.012) + ink * (on * 1.7 + frame * 0.9 + 0.05) * flicker;
    } else if (kind < 3.5) {
      // screen: a pixel creature that changes every few seconds
      float big = step(2.0, min(vFaceSize.x, vFaceSize.y));
      vec2 q = vFace + 0.5;
      vec2 g = (q - 0.12) / 0.76 * 9.0;
      vec2 px = floor(g);
      float inside = step(0.0, g.x) * step(g.x, 9.0) * step(0.0, g.y) * step(g.y, 9.0);
      float shape = floor(uTime * 0.25 + seed * 40.0);
      float on = step(0.52, hash(vec2(min(px.x, 8.0 - px.x), px.y) + shape * 7.31 + seed * 53.0)) * inside;
      vec2 pf = fract(g);
      float block = step(0.1, pf.x) * step(pf.x, 0.9) * step(0.1, pf.y) * step(pf.y, 0.9);
      float sharp = clamp(1.0 - length(fwidth(g)) * 1.3, 0.0, 1.0);
      vec3 ink = seed > 0.5 ? uMagenta : uCyan;
      float lines = 0.85 + 0.15 * sin(vWorld.y * 14.0 - uTime * 3.0);
      col = vec3(0.005, 0.005, 0.014) + ink * big * (on * mix(0.5, block, sharp) * 1.25 + (1.0 - smoothstep(0.03, 0.1, edge)) * 0.8 + 0.06) * lines;
    } else {
      // mast with a warning light that blinks at the top
      col = shade(vec3(0.08), n, height);
      col += vec3(1.0, 0.08, 0.1) * step(0.42, vFace.y) * step(0.5, fract(uTime * 0.7 + seed * 5.0)) * 3.0;
    }

    // loose blocks light up along their edges
    col += accent * (1.0 - smoothstep(0.02, 0.13, edge)) * energy * 1.7;
    gl_FragColor = vec4(haze(col, vWorld, uFog) * mix(uDim, 1.0, min(energy * 1.4, 1.0)), 1.0);
  }
`

/**
 * `detail`: { rows, pieces }. `rows` of plots each side of the road; `pieces` gives, for the
 * rows nearest the road, roughly how big their loose blocks are. Further rows are left whole.
 */
export function createCity(uniforms, detail) {
  const { blocks, outlines } = layout(detail)
  const group = new THREE.Group()

  const box = new THREE.BoxGeometry(1, 1, 1)
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.index = box.index
  geometry.setAttribute('position', box.getAttribute('position'))
  geometry.setAttribute('normal', box.getAttribute('normal'))
  const buffer = new THREE.InstancedInterleavedBuffer(blocks, FLOATS)
  geometry.setAttribute('aTower', new THREE.InterleavedBufferAttribute(buffer, 4, 0))
  geometry.setAttribute('aBox', new THREE.InterleavedBufferAttribute(buffer, 4, 4))
  geometry.setAttribute('aSize', new THREE.InterleavedBufferAttribute(buffer, 4, 8))
  geometry.setAttribute('aRand', new THREE.InterleavedBufferAttribute(buffer, 4, 12))
  geometry.setAttribute('aTier', new THREE.InterleavedBufferAttribute(buffer, 3, 16))
  geometry.instanceCount = blocks.length / FLOATS
  const towers = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT }))
  towers.frustumCulled = false
  group.add(towers)

  // A faint outline of every tier, hidden inside the building until its blocks move away.
  const edges = new THREE.EdgesGeometry(box)
  const wire = new THREE.InstancedBufferGeometry()
  wire.setAttribute('position', edges.getAttribute('position'))
  const wireBuffer = new THREE.InstancedInterleavedBuffer(outlines, 10)
  wire.setAttribute('aTower', new THREE.InterleavedBufferAttribute(wireBuffer, 4, 0))
  wire.setAttribute('aCentre', new THREE.InterleavedBufferAttribute(wireBuffer, 3, 4))
  wire.setAttribute('aSize', new THREE.InterleavedBufferAttribute(wireBuffer, 3, 7))
  wire.instanceCount = outlines.length / 10
  const skeleton = new THREE.LineSegments(
    wire,
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec4 aTower;
        attribute vec3 aCentre, aSize;
        uniform float uScroll, uReveal, uDim;
        uniform vec3 uCyan, uMagenta;
        varying vec3 vColor;
        ${GLSL}
        void main() {
          float towerZ = loopZ(aTower.y, uScroll);
          vec3 world = vec3(aTower.x, 0.0, towerZ) + aCentre + position * aSize * 0.93;
          world.y *= smoothstep(-229.5, -200.0, towerZ);
          float fade = exp(-length(world.xz - cameraPosition.xz) * 0.02) * smoothstep(0.5, 1.0, uReveal) * uDim;
          vColor = (aTower.z < 0.5 ? uCyan : uMagenta) * 0.5 * fade;
          gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() { gl_FragColor = vec4(vColor, 1.0); }`,
    }),
  )
  skeleton.frustumCulled = false
  group.add(skeleton)

  group.userData.blocks = geometry
  return group
}
