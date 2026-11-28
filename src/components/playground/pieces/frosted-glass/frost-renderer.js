import { createFrameLoop } from '@/lib/frame-loop';
import { releaseContext } from '@/lib/webgl';
import { FROST_COLORS } from './frostConfig';
import { createStreet, EYE, FOCAL, HORIZON, ROAD, LIGHT_STRIDE, MAX_BUILDINGS, MAX_GLARE, MAX_LIGHTS, MAX_PEOPLE, MAX_POOLS, MAX_TREES, MAX_VEHICLES } from './street';
import { createRain, DROP_STRIDE } from './rain';

// A night street seen from a skywalk through a fogged, wet window, in raw WebGL2.
//
// The street is rendered in HDR (brighter than white) so lights blur the way a lens blurs them:
// 1. Scene: sky, road, buildings, shopfronts and windows, with lamp light pooled on them.
// 2. Lens blur: the scene is spread by a disc blur, then every light (street.js) is added as
//    its own out-of-focus disc, with a brighter rim and a cat's-eye cut toward the corners.
// 3. The same scene nearly sharp, with small sharp lights: what each drop shows, upside down.
// 4. Water map: each drop (rain.js) as a small dome (normal in RG, size in B, coverage in A).
// 5. Mist: fogs back slowly and is wiped where a drop slides.
// 6. Glass: the blurred street under the mist, fine condensation beads drawn per pixel,
//    the drops bending the sharp street, then tone mapping and film grain.

const FULLSCREEN_VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const HASH = `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

const SCENE_FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uAspect;
uniform float uTime;
uniform float uStore;
uniform float uWindows;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uGround;
uniform vec3 uBuilding;
uniform vec3 uWindow;
uniform vec3 uGlow;
uniform vec4 uBuildings[${MAX_BUILDINGS * 3}];
uniform int uBuildingCount;
uniform vec4 uVehicles[${MAX_VEHICLES * 3}];
uniform int uVehicleCount;
uniform vec4 uTrees[${MAX_TREES * 2}];
uniform int uTreeCount;
uniform vec4 uPeople[${MAX_PEOPLE * 2}];
uniform int uPeopleCount;
uniform vec4 uPools[${MAX_POOLS * 2}];
uniform int uPoolCount;
uniform int uTaps;   // reflection samples: fewer for the sharp copy the drops show
out vec4 outColor;
${HASH}

const float F = ${FOCAL.toFixed(4)};
const float EYE = ${EYE.toFixed(4)};
const float HZ = ${HORIZON.toFixed(4)};
const float ROAD = ${ROAD.toFixed(4)};

float box(vec2 f, vec2 lo, vec2 hi) {
  vec2 a = step(lo, f) * step(f, hi);
  return a.x * a.y;
}

vec3 shopColor(float k) {
  if (k < 1.5) return vec3(1.0, 0.72, 0.42);
  if (k < 2.5) return vec3(0.85, 0.92, 1.0);
  if (k < 3.5) return vec3(1.0, 0.86, 0.6);
  return vec3(1.0, 0.55, 0.7);
}

vec3 paintColor(float k) {
  if (k < -1.5) return vec3(0.62, 0.64, 0.66);   // truck box
  if (k < -0.5) return vec3(0.5, 0.1, 0.07);     // bus
  if (k < 0.5) return vec3(0.03);
  if (k < 1.5) return vec3(0.45, 0.47, 0.5);
  if (k < 2.5) return vec3(0.72, 0.73, 0.75);
  if (k < 3.5) return vec3(0.42, 0.05, 0.04);
  if (k < 4.5) return vec3(0.05, 0.08, 0.18);
  if (k < 5.5) return vec3(0.18);
  return vec3(0.1, 0.2, 0.22);
}

// The air: dark overhead, glowing where the street opens onto the city.
vec3 sky(vec2 p) {
  float cx = uAspect * 0.5;
  vec3 c = mix(uSkyHorizon, uSkyTop, smoothstep(HZ - 0.05, 1.0, p.y));
  vec2 g = (p - vec2(cx, HZ)) * vec2(1.6, 4.0);
  c += uGlow * exp(-dot(g, g) * 3.0) * 0.55;
  return c;
}

// Distance haze: everything far away sinks into the glow at the end of the street.
vec3 hazeOf(vec2 p) {
  return mix(uSkyHorizon, uGlow, 0.35) * 0.9;
}

// Towers beyond the end of the street, in layers that fade with distance.
vec3 city(vec2 p, vec3 base) {
  float cx = uAspect * 0.5;
  vec3 c = base;
  for (int k = 3; k >= 0; k--) {
    float D = 380.0 * pow(1.9, float(k));
    float lateral = (p.x - cx) * D / F;
    float w = 26.0 + float(k) * 12.0;
    float id = floor(lateral / w + float(k) * 3.7);
    float fx = fract(lateral / w + float(k) * 3.7);
    float h = hash12(vec2(id, float(k)));
    float H = 18.0 + 150.0 * h * h;
    // Some towers carry a spire.
    float spire = step(0.86, hash12(vec2(id, float(k) + 9.0))) * step(abs(fx - 0.5), 0.05) * 40.0;
    float top = HZ + (H - EYE) * F / D;
    float spireTop = HZ + (H + spire - EYE) * F / D;
    float inside = step(0.08, fx) * step(fx, 0.92);
    float hit = max(step(p.y, top) * inside, step(p.y, spireTop) * step(0.5, spire));
    if (hit > 0.5 && p.y > HZ - 0.02) {
      float haze = 0.35 + 0.17 * float(k);
      vec3 t = mix(uBuilding * 0.7, hazeOf(p), haze);
      // A scatter of faint lit windows.
      vec2 wv = vec2(lateral / 3.0, (p.y - HZ) * D / F / 3.2);
      float lit = step(0.9, hash12(floor(wv) + id)) * box(fract(wv), vec2(0.25), vec2(0.75));
      c = t + uWindow * lit * 0.5 * (1.0 - haze) * uWindows;
    }
  }
  return c;
}

// The buildings along both sides. Each pixel is traced to the nearest facade, end wall or
// rooftop. Returns the colour and writes the distance hit (1e5 if nothing).
vec3 street(vec2 p, out float hitD) {
  float cx = uAspect * 0.5;
  float dx = p.x - cx;
  hitD = 1e5;
  int hitI = -1;
  float hu = 0.0;
  float hv = 0.0;
  float face = 0.0;   // 0 front, 1 end wall, 2 rooftop clutter
  for (int i = 0; i < ${MAX_BUILDINGS}; i++) {
    if (i >= uBuildingCount) break;
    vec4 A = uBuildings[i * 3];       // side, d0, d1, height
    vec4 C = uBuildings[i * 3 + 2];   // shop + type*8, tone, depth, wash
    if (A.x * dx <= 0.0) continue;
    float d = A.x * F / dx;
    if (d >= A.y && d <= A.z && d < hitD) {
      float h = (p.y - HZ) * d / F + EYE;
      if (h >= 0.0 && h <= A.w) { hitD = d; hitI = i; hu = d - A.y; hv = h; face = 0.0; }
      else if (h > A.w) {
        // Plant rooms and tanks on the roof.
        float unit = floor((d - A.y) / 5.0 + float(i));
        float clutter = step(0.55, hash12(vec2(unit, float(i)))) * (1.5 + 2.5 * hash12(vec2(unit, float(i) + 3.0)));
        if (h < A.w + clutter) { hitD = d; hitI = i; hu = d - A.y; hv = h; face = 2.0; }
      }
    }
    // The end wall facing us, where the building starts.
    float sidePx = dx * A.y / F;
    float into = abs(sidePx) - abs(A.x);
    if (into > 0.0 && into < C.z && A.y < hitD) {
      float h = (p.y - HZ) * A.y / F + EYE;
      if (h >= 0.0 && h <= A.w) { hitD = A.y; hitI = i; hu = into; hv = h; face = 1.0; }
    }
  }
  if (hitI < 0) return vec3(0.0);

  vec4 A = uBuildings[hitI * 3];
  vec4 B = uBuildings[hitI * 3 + 1];   // floor height, column width, lit share, warmth
  vec4 C = uBuildings[hitI * 3 + 2];
  float seed = float(hitI) * 17.31;
  float shop = mod(C.x, 8.0);
  float type = floor(C.x / 8.0 + 0.01);
  vec3 wall = uBuilding * C.y * (0.85 + 0.3 * hash12(vec2(seed, 2.0)));
  // A painterly unevenness across each wall.
  wall *= 0.85 + 0.3 * vnoise(vec2(hu * 0.15 + seed, hv * 0.1));
  if (face > 1.5) return mix(wall * 0.6, hazeOf(p), 1.0 - exp(-hitD / 260.0));
  if (face > 0.5) wall *= 0.55;
  // Street light washes the lower floors; some facades glow warm all the way up.
  wall *= 0.7 + 0.5 * exp(-hv / 6.0);
  wall += uGlow * C.w * 0.22 * exp(-hv / 10.0) * (face > 0.5 ? 0.4 : 1.0);
  if (type > 2.5) wall = mix(wall, mix(uSkyTop, uSkyHorizon, 0.5 + 0.4 * hv / A.w) * 0.8, 0.6);

  vec3 lit3 = vec3(0.0);
  vec2 grid = vec2(hu / B.y, hv / B.x);
  vec2 cell = floor(grid);
  vec2 f = fract(grid);
  if (cell.y < 0.5 && shop > 0.5 && face < 0.5) {
    // Shopfront: a bright, uneven interior, a dark awning, a lit sign board above.
    float bay = floor(cell.x * 0.5);
    float pane = box(f, vec2(0.04, 0.06), vec2(0.96, 0.62)) * step(0.06, fract(grid.x * 0.5));
    float inside = 0.55 + 0.7 * vnoise(vec2(grid.x * 3.0, seed));
    inside *= 1.0 - 0.35 * step(0.5, fract(f.y * 4.0)) * step(0.25, f.y);
    lit3 += shopColor(shop) * pane * inside * 3.0;
    float board = box(f, vec2(0.03, 0.72), vec2(0.97, 0.94)) * step(0.35, hash12(vec2(bay, seed + 4.0)));
    lit3 += shopColor(1.0 + floor(hash12(vec2(bay, seed + 9.0)) * 4.0)) * board * 1.8;
    wall *= 1.0 - 0.5 * box(f, vec2(0.0, 0.62), vec2(1.0, 0.72));
  } else {
    float h = hash12(cell + seed + face * 5.0);
    float h2 = hash12(cell + seed + 7.7);
    float clock = floor(uTime / (35.0 + h * 90.0) + h * 7.0);
    float lit = step(hash12(cell + seed + clock * 1.37), B.z * (face > 0.5 ? 0.5 : 1.0));
    vec3 tint = mix(vec3(0.78, 0.88, 1.0), uWindow, clamp(0.35 + B.w * 0.65 + (h - 0.5) * 0.6, 0.0, 1.0));
    float level = 0.3 + 0.9 * hash12(cell + seed + 3.3);
    float pane;
    if (type > 0.5 && type < 1.5) {
      pane = box(f, vec2(0.0, 0.32), vec2(1.0, 0.86)) * step(0.05, f.x);
      lit = step(hash12(vec2(floor(grid.x * 0.3), cell.y) + seed + clock), B.z * 1.2);
      tint = mix(vec3(0.82, 0.9, 1.0), tint, 0.3);
    } else if (type > 1.5) {
      pane = box(f, vec2(0.32, 0.14), vec2(0.68, 0.86));
    } else {
      vec2 lo = vec2(0.14 + 0.16 * h2, 0.22 + 0.1 * hash12(cell.yy + seed));
      pane = box(f, lo, vec2(1.0 - lo.x, 0.8)) * step(0.1, h2);
    }
    float split = hash12(cell + seed + 11.0);
    float curtain = split < 0.45 ? 1.0 : smoothstep(split - 0.05, split + 0.05, f.x) * 0.75 + 0.25;
    float hot = 0.6 + 0.6 * exp(-dot(f - vec2(0.3 + 0.4 * h, 0.4), f - vec2(0.3 + 0.4 * h, 0.4)) * 10.0);
    if (h > 0.985) { level *= 0.4 + 0.6 * vnoise(vec2(uTime * 4.0, seed)); tint = vec3(0.6, 0.75, 1.0); }
    float recess = 1.0 - 0.45 * smoothstep(0.6, 0.86, f.y);
    lit3 += tint * pane * lit * level * curtain * hot * recess * 2.4;
    wall *= 1.0 - 0.2 * pane * (1.0 - lit);
  }
  vec3 c = wall + lit3 * uWindows;
  return mix(c, hazeOf(p), 1.0 - exp(-hitD / 260.0));
}

// Rain landing on the wet road, in ground metres: rings that spread and fade.
// Returns how the rings tilt the surface (xy) and how much they catch the light (z).
vec3 rainRings(vec2 g, float t) {
  vec2 q = g / 0.45;
  vec2 id = floor(q);
  vec2 f = fract(q);
  vec2 n = vec2(0.0);
  float hl = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 k = id + o;
      float h = hash12(k * 1.3 + 5.0);
      float ph = fract(t * (0.7 + 0.6 * h) + h * 7.0);
      vec2 dv = f - (o + hash22(k));
      float d = length(dv);
      float xr = (d - ph * 0.5) / 0.05;
      float a = (1.0 - ph) * (1.0 - ph);
      n += dv / max(d, 1e-4) * sin(xr * 2.2) * exp(-xr * xr) * a;
      hl += exp(-xr * xr) * a;
    }
  }
  return vec3(n, hl);
}

// Everything above the ground: buildings, the city beyond, the sky.
vec3 above(vec2 p, out float hitD) {
  vec3 c = street(p, hitD);
  if (hitD > 9e4) c = city(p, sky(p));
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float cx = uAspect * 0.5;

  float hitD;
  vec3 col = above(p, hitD);

  // The ground, where it is nearer than any building: a wet road that mirrors the street.
  if (p.y < HZ) {
    float dg = EYE * F / (HZ - p.y);
    if (dg < hitD) {
      float sideG = (p.x - cx) * dg / F;
      float a = abs(sideG);
      vec3 ground = a < ROAD ? uGround * 0.8 : uGround * 1.5;
      ground += vec3(0.04) * smoothstep(0.12, 0.0, abs(a - ROAD)) * exp(-dg / 60.0);
      // A double centre line, and broken lines between the two lanes each way.
      ground += vec3(0.16, 0.14, 0.08) * step(abs(abs(sideG) - 0.12), 0.06) * exp(-dg / 70.0);
      ground += vec3(0.16) * step(abs(a - 3.15), 0.07) * step(fract(dg / 9.0), 0.4) * exp(-dg / 60.0);
      // Puddles mirror almost perfectly; the rough tarmac around them smears each reflection
      // into vertical streaks, longer the nearer the road.
      // The pavement is matte and barely holds a puddle; the road is wetter.
      float kerb = smoothstep(ROAD - 0.3, ROAD + 0.5, a);
      float puddle = smoothstep(0.55, 0.8, vnoise(vec2(sideG * 0.35, dg * 0.12))) * (1.0 - kerb * 0.8);
      float rough = 1.0 - puddle;
      // Patches that are only damp: the reflection there is faint and smeared out.
      float damp = smoothstep(0.3, 0.75, vnoise(vec2(sideG * 0.22 + 5.0, dg * 0.07 + 3.0)));
      vec3 rings = dg < 30.0 ? rainRings(vec2(sideG, dg), uTime * 1.3) * smoothstep(30.0, 8.0, dg) : vec3(0.0);
      vec2 tilt = rings.xy * (0.25 + 0.75 * puddle) * F / dg * 0.05;
      float ripple = (vnoise(vec2(p.x * 60.0, p.y * 260.0)) - 0.5) * 0.006 * rough;
      float spread = rough * (0.012 + (HZ - p.y) * 0.18) * (1.0 + damp * 0.8 + kerb);
      float jitter = hash12(gl_FragCoord.xy) - 0.5;
      vec3 refl = vec3(0.0);
      for (int k = 0; k < 4; k++) {
        if (k >= uTaps) break;
        float o = uTaps > 1 ? (float(k) - float(uTaps - 1) * 0.5 + jitter) / (float(uTaps) * 0.5) : jitter;
        vec2 rp = vec2(p.x + ripple + tilt.x + o * spread * 0.12, 2.0 * HZ - p.y + o * spread + tilt.y);
        float rd;
        refl += above(rp, rd);
      }
      refl /= float(uTaps);
      // Fine vertical striations in the streaks.
      float striate = vnoise(vec2(p.x * 380.0, p.y * 5.0)) * 0.6 + vnoise(vec2(p.x * 120.0, p.y * 3.0)) * 0.4;
      refl *= mix(1.0, 0.55 + 0.9 * striate, rough * 0.6);
      refl *= 1.0 + rings.z * 0.35 * puddle;
      float fresnel = mix(0.25, 0.85, exp(-(HZ - p.y) * 6.0));
      float sheen = (fresnel + puddle * 0.3) * (1.0 - 0.55 * damp * rough) * (1.0 - 0.55 * kerb);
      col = mix(ground, refl * 0.85, clamp(sheen, 0.0, 0.95));
      col += mix(uSkyHorizon, uGlow, 0.5) * rings.z * 0.05 * puddle;
      hitD = dg;
    }
  }

  // Trees on the pavements: a trunk and a ragged crown; the gaps drift a little.
  for (int i = 0; i < ${MAX_TREES}; i++) {
    if (i >= uTreeCount) break;
    vec4 T = uTrees[i * 2];
    vec4 U = uTrees[i * 2 + 1];
    if (abs(p.x - T.x) < U.x && p.y > T.y && p.y < T.z) col = mix(col, vec3(0.006), 0.9);
    vec2 dd = (p - vec2(T.x, T.z)) / T.w;
    if (dot(dd, dd) > 2.5) continue;
    dd.y *= 1.15;
    float n = vnoise(dd * 2.6 + U.y) * 0.5 + vnoise(dd * 6.5 + U.y * 2.0) * 0.3 + vnoise(dd * 14.0 + U.y) * 0.2;
    float edge = length(dd) - (0.62 + 0.45 * n);
    float gaps = smoothstep(0.58, 0.75, vnoise(dd * 11.0 + U.y + vec2(uTime * 0.12, uTime * 0.05)));
    float mask = smoothstep(0.06, -0.06, edge) * (1.0 - gaps * 0.8);
    col = mix(col, vec3(0.006, 0.009, 0.007) + uGlow * 0.06 * smoothstep(0.6, -0.8, dd.y), mask);
  }

  // Vehicles, far to near, as boxes: the end facing us, then the roof and side running away.
  for (int i = 0; i < ${MAX_VEHICLES}; i++) {
    if (i >= uVehicleCount) break;
    vec4 N = uVehicles[i * 3];       // near face: x0, x1, y0, y1
    vec4 R = uVehicles[i * 3 + 1];   // far face
    vec4 C = uVehicles[i * 3 + 2];   // type, lit end (0 head, 1 tail, 2 none), glow, paint
    float lo = 0.0;
    float hi = 1.0;
    // p lies inside the face interpolated between near (t = 0) and far (t = 1).
    float a1 = R.x - N.x; float b1 = p.x - N.x;
    if (abs(a1) > 1e-6) { if (a1 > 0.0) hi = min(hi, b1 / a1); else lo = max(lo, b1 / a1); } else if (b1 < 0.0) continue;
    float a2 = N.y - R.y; float b2 = N.y - p.x;
    if (abs(a2) > 1e-6) { if (a2 > 0.0) hi = min(hi, b2 / a2); else lo = max(lo, b2 / a2); } else if (b2 < 0.0) continue;
    float a3 = R.z - N.z; float b3 = p.y - N.z;
    if (abs(a3) > 1e-6) { if (a3 > 0.0) hi = min(hi, b3 / a3); else lo = max(lo, b3 / a3); } else if (b3 < 0.0) continue;
    float a4 = N.w - R.w; float b4 = N.w - p.y;
    if (abs(a4) > 1e-6) { if (a4 > 0.0) hi = min(hi, b4 / a4); else lo = max(lo, b4 / a4); } else if (b4 < 0.0) continue;
    if (lo > hi) continue;
    vec3 paint = paintColor(C.w);
    float lum = dot(paint, vec3(0.3, 0.6, 0.1));
    vec3 body;
    if (lo < 1e-4) {
      // The end facing us: lower body, glass above (narrower on a car), lamps at the corners.
      float u = (p.x - N.x) / max(N.y - N.x, 1e-4);
      float v = (p.y - N.z) / max(N.w - N.z, 1e-4);
      body = paint * 0.12 + uSkyHorizon * 0.15 * v + uGlow * 0.05;
      if (C.x < 0.5 || C.x > 2.5) {
        if (v > 0.58 && (u < 0.1 + (v - 0.58) * 0.4 || u > 0.9 - (v - 0.58) * 0.4)) continue;
        if (v > 0.6 && v < 0.94) body = vec3(0.01) + uSkyHorizon * 0.25 * (1.0 - v) + uGlow * 0.4 * exp(-pow((u - 0.3 - v * 0.2) / 0.06, 2.0));
      } else if (C.x < 1.5) {
        if (v > 0.45 && v < 0.85) body = mix(body, uWindow * 0.8, step(0.08, u) * step(u, 0.92));
      } else if (v > 0.55 && v < 0.85 && C.y < 1.5) {
        body = vec3(0.01) + uSkyHorizon * 0.2;
      }
      vec3 lamp = C.y < 0.5 ? vec3(1.0, 0.86, 0.6) : vec3(1.0, 0.12, 0.06);
      float corners = exp(-pow((u - 0.13) / 0.12, 2.0)) + exp(-pow((u - 0.87) / 0.12, 2.0));
      body += lamp * C.z * 0.8 * corners * exp(-pow((v - 0.4) / 0.18, 2.0));
      // A sheen of street light along the top edge.
      body += (uGlow * 0.6 + uSkyHorizon * 0.4) * exp(-pow((v - 0.55) / 0.04, 2.0)) * (0.4 + 0.6 * lum);
    } else {
      // Roof and side, running away from us.
      float yTop = mix(N.w, R.w, lo);
      bool roof = p.y > yTop - 0.002 * (1.0 + lo);
      body = roof ? paint * 0.18 + uSkyHorizon * 0.35 + uGlow * 0.15 : paint * 0.08 + uSkyHorizon * 0.08;
      if (!roof && C.x > 0.5 && C.x < 1.5) body = mix(body, uWindow * 0.7, step(0.45, fract(lo * 6.0)) * step(p.y, yTop - 0.004) * step(mix(N.z, R.z, lo) + (yTop - mix(N.z, R.z, lo)) * 0.45, p.y));
    }
    col = body;
  }

  // Lamplight pooled on the pavements, road and walls.
  for (int i = 0; i < ${MAX_POOLS}; i++) {
    if (i >= uPoolCount) break;
    vec4 P = uPools[i * 2];
    vec3 c = uPools[i * 2 + 1].rgb;
    vec2 d = (p - P.xy) * vec2(1.0, p.y < HZ ? 3.0 : 0.8);
    col += c * P.w * exp(-dot(d, d) / (P.z * P.z)) * (p.y < HZ ? 0.4 : 0.15);
  }

  // People on the pavements: dark shapes, soft at the edges.
  for (int i = 0; i < ${MAX_PEOPLE}; i++) {
    if (i >= uPeopleCount) break;
    vec4 P = uPeople[i * 2];
    vec4 Q = uPeople[i * 2 + 1];
    vec2 q = (p - P.xy) / P.z;
    if (abs(q.x) > 0.6 || q.y < -0.15 || q.y > 1.25) continue;
    float swing = sin(Q.x) * 0.07;
    float torso = length(max(abs(q - vec2(0.0, 0.6)) - vec2(0.07, 0.19), 0.0)) - 0.06;
    float head = length(q - vec2(0.0, 0.88)) - 0.065;
    vec2 hip = vec2(0.0, 0.4);
    vec2 l1 = q - hip; vec2 s1 = vec2(swing, 0.0) - hip;
    vec2 l2 = q - hip; vec2 s2 = vec2(-swing, 0.0) - hip;
    float leg1 = length(l1 - s1 * clamp(dot(l1, s1) / dot(s1, s1), 0.0, 1.0)) - 0.04;
    float leg2 = length(l2 - s2 * clamp(dot(l2, s2) / dot(s2, s2), 0.0, 1.0)) - 0.04;
    float sdf = min(min(torso, head), min(leg1, leg2));
    if (P.w > 0.5) {
      vec2 e = (q - vec2(0.05, 0.98)) / vec2(0.36, 0.17);
      sdf = min(sdf, max((length(e) - 1.0) * 0.17, 0.98 - q.y));
    }
    float mask = smoothstep(0.05, -0.05, sdf) * Q.z;
    vec2 sh = q * vec2(2.4, 9.0);
    col *= 1.0 - exp(-dot(sh, sh)) * 0.7 * Q.z;
    col = mix(col, vec3(Q.y * 0.25) + uSkyHorizon * 0.06 * smoothstep(0.75, 1.1, q.y), mask);
  }

  outColor = vec4(col * uStore, 1.0);
}
`;

// Lens blur: a golden-angle disc that favours bright samples, as a lens does.
const BLUR_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uAspect;
uniform float uRadius;
uniform float uLod;
out vec4 outColor;
${HASH}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float rot = hash12(gl_FragCoord.xy) * 6.2831853;
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  const int N = 44;
  for (int i = 0; i < N; i++) {
    float r = sqrt((float(i) + 0.5) / float(N));
    float a = float(i) * 2.39996323 + rot;
    vec3 c = textureLod(uScene, uv + vec2(cos(a), sin(a)) * r * vec2(uRadius / uAspect, uRadius), uLod).rgb;
    float w = 1.0 + dot(c, vec3(0.3, 0.6, 0.1)) * 3.0;
    acc += c * w;
    wsum += w;
  }
  outColor = vec4(acc / wsum, 1.0);
}
`;

const LIGHT_VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aA;     // x, y, radius, intensity
layout(location=2) in vec4 aB;     // r, g, b, kind + seed
layout(location=3) in vec4 aC;     // motion x, motion y, reflection length
uniform float uAspect;
uniform float uRadiusScale;
uniform float uSharp;
uniform float uStore;
out vec2 vLocal;
out vec3 vColor;
out float vKind;
out float vSeed;
out float vLength;
out vec2 vOffset;
out vec2 vScreen;
out vec2 vSmear;     // half the motion, in radii
out vec2 vBeam;
out vec2 vBeamPos;
out vec2 vBeamWidth;
void main() {
  float kind = floor(aB.w + 0.001);
  float seed = fract(aB.w);
  float r = uSharp > 0.5 ? 0.0035 + aA.z * 0.05 : aA.z * uRadiusScale;
  vec2 motion = aC.xy;
  vec2 extent;
  vec2 center;
  if (kind > 1.5) {
    // A headlight beam: from the light, along aC.xy, widening as it goes.
    extent = abs(motion) * 0.5 + vec2(aA.z);
    center = aA.xy + motion * 0.5;
  } else if (kind > 0.5) {
    float len = aC.z;
    extent = vec2(r * 2.0 + abs(motion.x) * 0.5, r * (len * 0.5 + 1.4) + abs(motion.y) * 0.5);
    center = aA.xy - vec2(0.0, r * len * 0.5);
  } else {
    extent = vec2(r * (uSharp > 0.5 ? 3.0 : 3.4)) + abs(motion) * 0.5;
    center = aA.xy;
  }
  vec2 p = center + aCorner * extent;
  vLocal = (p - aA.xy) / r;
  vBeam = motion;
  vBeamPos = p - aA.xy;
  vBeamWidth = vec2(aC.z, aA.z);
  vSmear = motion * 0.5 / r;
  vKind = kind;
  vSeed = seed;
  vLength = aC.z;
  vScreen = p;
  // Lights toward the frame edges are clipped by the lens into a cat's eye.
  vOffset = (aA.xy - vec2(uAspect * 0.5, 0.5)) * 1.1;
  // A smeared light spreads the same light over a longer shape.
  float smear = kind > 1.5 ? 1.0 : 1.0 + length(motion) / max(r, 1e-4) * 0.55;
  float energy = kind > 1.5 ? 0.35 : uSharp > 0.5 ? 1.0 : pow(0.05 / max(r, 0.004), 1.4) * 0.42;
  vColor = aB.rgb * aA.w * energy * uStore / smear;
  gl_Position = vec4(p.x / uAspect * 2.0 - 1.0, p.y * 2.0 - 1.0, 0.0, 1.0);
}
`;

const LIGHT_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec3 vColor;
in float vKind;
in float vSeed;
in float vLength;
in vec2 vOffset;
in vec2 vScreen;
in vec2 vSmear;
in vec2 vBeam;
in vec2 vBeamPos;
in vec2 vBeamWidth;
uniform float uSharp;
uniform float uTime;
out vec4 outColor;
${HASH}

void main() {
  // Motion blur: measure from the nearest point on the path the light travelled.
  float m = length(vSmear);
  vec2 q = vLocal;
  if (m > 1e-3) {
    vec2 dir = vSmear / m;
    q -= dir * clamp(dot(vLocal, dir), -m, m);
  }
  float d = length(q);
  // The fog on the glass isn't even: the same patchy texture dims every light passing behind it.
  float frost = 0.72 + 0.38 * vnoise(vScreen * 28.0) + 0.18 * vnoise(vScreen * 71.0);
  float v;

  if (vKind > 1.5) {
    // Headlight beam on wet tarmac: bright near the car, spreading and fading along the road,
    // broken up by the uneven wet surface.
    float L2 = max(dot(vBeam, vBeam), 1e-6);
    float t = dot(vBeamPos, vBeam) / L2;
    float across = length(vBeamPos - vBeam * t);
    float w = mix(vBeamWidth.x, vBeamWidth.y, clamp(t, 0.0, 1.0));
    float x = across / max(w, 1e-4);
    float sheen = 0.6 + 0.4 * vnoise(vScreen * vec2(60.0, 14.0) + vSeed * 9.0);
    v = exp(-x * x * 1.6) * smoothstep(-0.02, 0.06, t) * pow(max(1.0 - t, 0.0), 1.4) * sheen * 1.4;
  } else if (vKind > 0.5) {
    // A reflection on wet tarmac: fades in under the light, breaks into ripples, tapers away.
    float len = max(vLength, 1.0);
    float t = clamp(-q.y / len, 0.0, 1.0);
    float width = (0.38 + 0.35 * vSeed) * (1.0 + t * 0.9) * (uSharp > 0.5 ? 0.5 : 1.0);
    float x = q.x / width;
    float fadeIn = smoothstep(0.6, -0.9, q.y);
    float fadeOut = pow(1.0 - t, 1.6) * smoothstep(1.0, 0.7, t);
    float ripple = 0.45 + 0.55 * vnoise(vec2(q.y * (1.3 + vSeed) + uTime * 0.35, vSeed * 37.0));
    ripple *= 0.7 + 0.3 * vnoise(vec2(q.y * 6.0, vSeed * 11.0 + uTime * 0.2));
    float wobble = (vnoise(vec2(q.y * 0.9, vSeed * 5.0)) - 0.5) * 0.5 * t;
    x += wobble / width;
    v = exp(-x * x * 1.3) * fadeIn * fadeOut * ripple * 0.75 * frost;
  } else if (uSharp > 0.5) {
    v = exp(-d * d * 3.5) * 1.8 + exp(-d * d * 0.35) * 0.1;
  } else {
    // A defocused light seen through fogged glass: a hot middle, a soft edge whose outline
    // differs light to light, a cat's-eye cut near the corners, and a wide misty glow.
    float a = atan(q.y, q.x);
    float edge = 1.0 + 0.09 * (vnoise(vec2(a * 1.7 + vSeed * 31.0, vSeed * 9.0)) - 0.5) * 2.0;
    // Some lights stay fairly crisp, others melt into the fog.
    float soft = 0.16 + 0.55 * vSeed * vSeed;
    float disc = smoothstep(edge, edge - soft, d) * smoothstep(1.2, 1.2 - soft, length(q + vOffset));
    float body = 0.5 + 0.5 * exp(-d * d * 1.7);
    float glow = exp(-d * d * 0.3) * 0.17 + exp(-d * 0.85) * 0.05;
    v = (disc * body * frost + glow) * smoothstep(3.3, 2.3, d);
  }
  outColor = vec4(vColor * v, 0.0);
}
`;

const DROP_VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aDrop;    // x, y, radius x, radius y
layout(location=2) in float aSize;
uniform float uAspect;
uniform float uGrow;
out vec2 vLocal;
out float vSize;
out float vSeed;
void main() {
  // A little margin so an irregular outline can bulge past the nominal radius.
  vec2 p = aDrop.xy + aCorner * aDrop.zw * uGrow;
  vLocal = aCorner * uGrow;
  vSize = aSize;
  vSeed = fract(sin(dot(aDrop.xy, vec2(12.9898, 78.233))) * 43758.5453);
  gl_Position = vec4(p.x / uAspect * 2.0 - 1.0, p.y * 2.0 - 1.0, 0.0, 1.0);
}
`;

// No two drops alike: a wobbly outline, a bottom that sags, a tilt that moves the highlight,
// and a thickness that sets how strongly it bends light.
const DROP_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vSize;
in float vSeed;
uniform float uPixel;   // one pixel, in stage units
out vec4 outColor;
void main() {
  vec2 l = vLocal;
  float s2 = fract(vSeed * 7.13);
  float s3 = fract(vSeed * 13.7);
  if (l.y < 0.0) l.y /= 1.0 + 0.3 * s2;
  float ang = atan(l.y, l.x);
  float wob = 1.0 + (0.08 + 0.12 * s3) * (sin(ang * 2.0 + vSeed * 20.0) * 0.6 + sin(ang * 3.0 + s2 * 40.0) * 0.4);
  float d = length(l) / wob;
  if (d > 1.0) discard;
  float edge = clamp(uPixel / max(vSize, 1e-4), 0.02, 0.6);
  float a = smoothstep(1.0, 1.0 - edge * 1.5, d);
  vec2 n = l / wob;
  n += (vec2(vSeed, s2) - 0.5) * 0.45 * (1.0 - d * d);
  float thick = 0.45 + 0.55 * s3;
  outColor = vec4(clamp(n * 0.5 + 0.5, 0.0, 1.0), clamp(vSize * thick / 0.012, 0.0, 1.0), a);
}
`;

const WIPE_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vSize;
out vec4 outColor;
void main() {
  float d = length(vLocal);
  if (d > 1.0) discard;
  outColor = vec4(0.0, 0.0, 0.0, smoothstep(1.0, 0.2, d) * 0.35);
}
`;

// The clear ring around a bigger drop: it has swallowed the fine beads that were next to it.
const CLEAR_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vSize;
in float vSeed;
out vec4 outColor;
void main() {
  float d = length(vLocal);
  float big = smoothstep(0.0007, 0.0022, vSize);
  float reach = 1.5 + 1.1 * vSeed;
  float v = smoothstep(reach, 1.0, d) * big;
  if (v <= 0.0) discard;
  outColor = vec4(v);
}
`;

const FILL_FRAG = `#version 300 es
precision highp float;
uniform float uAlpha;
out vec4 outColor;
void main() { outColor = vec4(1.0, 1.0, 1.0, uAlpha); }
`;

// Light streaks: fine scratches and old wipe marks on the glass draw a thin ray out of each
// very bright light. The scratches run in arcs (the way glass gets wiped), so the rays point
// out from a centre below the frame, slanting a little differently across it.
// Pass 1 keeps only the hot centres of the brightest lights from the sharp scene, capped so a
// headlight isn't many times stronger than a lamp, and smeared vertically (rows are averaged)
// so the rays can be traced smoothly with few samples.
const BRIGHT_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSharp;
uniform vec2 uRes;
uniform float uLoad;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    vec2 q = vec2(uv.x, (gl_FragCoord.y - 0.5 + (float(i) + 0.5) / 24.0) / uRes.y);
    vec3 c = textureLod(uSharp, q, 0.0).rgb * uLoad;
    float l = max(dot(c, vec3(0.3, 0.6, 0.1)), 1e-4);
    acc += c / l * min(l, 2.0) * smoothstep(0.9, 2.4, l);
  }
  outColor = vec4(acc / 24.0, 1.0);
}
`;

// Pass 2: trace each pixel's ray back toward the light along the scratch direction.
const STREAK_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uBright;
uniform vec2 uRes;
uniform float uAspect;
uniform float uLength;
uniform float uSeed;
out vec4 outColor;
${HASH}

// Rays fanning out from a point far below. \`line\` is the same all along a ray, so a light
// either has this ray or not, and keeps its strength.
vec3 fan(vec2 p, vec2 pivot, float salt, float len) {
  vec2 toUv = vec2(1.0 / uAspect, 1.0);
  vec2 dir = normalize(p - pivot);
  float line = atan(dir.y, dir.x) * 55.0;
  float scratch = smoothstep(0.58, 0.8, vnoise(vec2(line + salt, salt)));
  if (scratch < 0.01) return vec3(0.0);
  float L = uLength * len * 0.6 * (0.5 + 0.5 * vnoise(vec2(line * 0.7, salt + 7.0)));
  vec3 acc = vec3(0.0);
  const int N = 56;
  for (int i = 0; i < N; i++) {
    float t = ((float(i) + 0.5) / float(N) * 2.0 - 1.0) * L;
    vec3 c = textureLod(uBright, (p + dir * t) * toUv, 0.0).rgb;
    float f = abs(t) / L;
    acc += c * exp(-f * 4.5) * (1.0 - f);
  }
  // The scratch is a little uneven along its length, never broken into bits.
  float along = dot(p, dir);
  float even = 0.7 + 0.3 * vnoise(vec2(line * 0.5 + salt, along * 7.0));
  return acc * (2.0 * L / float(N) / 0.01) * scratch * even;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float k = uSeed * 13.0;
  vec2 a = vec2(uAspect * (0.25 + 0.2 * hash12(vec2(uSeed, 31.0))), -0.9);
  vec2 b = vec2(uAspect * (0.75 + 0.3 * hash12(vec2(uSeed, 32.0))), -1.4);
  vec3 c = fan(p, a, k, 1.0) + fan(p, b, k + 50.0, 0.7) * 0.5;
  outColor = vec4(c, 1.0);
}
`;

const GLASS_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uBlur;
uniform sampler2D uSharp;
uniform sampler2D uWater;
uniform sampler2D uMist;
uniform sampler2D uClear;
uniform sampler2D uStreak;
uniform float uStreaks;
uniform float uStreakBlur;
uniform vec2 uRes;
uniform float uAspect;
uniform float uSeed;
uniform float uLoad;
uniform float uLens;
uniform float uMistAmount;
uniform float uCondense;
uniform float uWarp;
uniform float uExposure;
uniform vec3 uHaze;
uniform float uGrain;
uniform float uGrainSize;
uniform float uChroma;
uniform vec4 uGlare[${MAX_GLARE * 2}];   // x, y, radius, strength | r, g, b
out vec4 outColor;
${HASH}

vec2 frost(vec2 p) {
  vec2 q = p * 3.0;
  vec2 d = vec2(vnoise(q), vnoise(q + 17.3)) - 0.5;
  vec2 q2 = p * 24.0;
  d += (vec2(vnoise(q2), vnoise(q2 + 5.1)) - 0.5) * 0.45;
  return d;
}

// Condensation: a bead in some cells of a jittered grid. Returns the bead's normal and coverage.
vec4 beads(vec2 px, float cell, float density, float seed) {
  vec2 g = px / cell;
  vec2 id = floor(g);
  vec2 f = fract(g);
  vec4 best = vec4(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 k = id + o + seed;
      if (hash12(k * 1.7) > density) continue;
      vec2 c = o + 0.15 + 0.7 * hash22(k);
      float h = hash12(k + 3.1);
      float rad = 0.1 + 0.38 * h * h;
      vec2 dv = f - c;
      dv.y *= 1.0 + 0.2 * hash12(k + 8.4);
      float d = length(dv);
      float cov = smoothstep(rad, rad - 1.2 / cell, d);
      if (cov > best.z) best = vec4(dv / rad, cov, hash12(k + 5.9));
    }
  }
  return best;
}

float capsule(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

// How thick the fog is before any drop touches it: heavier low down and toward the cold frame,
// thinner in the warm middle. "marks" is what people and old drips left: a half-wiped arc,
// a couple of finger smears, thin dried drip lines (1 untouched, 0 clear).
float fogShape(vec2 p, vec2 uv, out float marks) {
  float edge = min(min(uv.x, 1.0 - uv.x) * uAspect, min(uv.y, 1.0 - uv.y));
  float t = 0.75 + 0.32 * pow(1.0 - uv.y, 1.6) + 0.2 * exp(-edge / 0.06);
  vec2 c = (uv - vec2(0.5, 0.6)) * vec2(uAspect, 1.0);
  t -= 0.2 * exp(-dot(c, c) * 6.0);
  t *= 0.82 + 0.36 * vnoise(p * 2.3 + uSeed * 1.7);
  marks = 1.0;

  // A half-wiped arc, as if a patch was cleared with the side of a hand and is fogging back.
  vec2 W = vec2(uAspect * (0.32 + 0.36 * hash12(vec2(uSeed, 1.0))), 0.16 + 0.18 * hash12(vec2(uSeed, 2.0)));
  vec2 dw = (p - W) * vec2(1.0, 1.1);
  float R = 0.24 + 0.08 * hash12(vec2(uSeed, 3.0));
  float ang = atan(dw.y, dw.x);
  float a0 = 0.3 + 0.5 * hash12(vec2(uSeed, 4.0));
  float a1 = a0 + 1.3 + 0.7 * hash12(vec2(uSeed, 5.0));
  float along = smoothstep(a0, a0 + 0.3, ang) * smoothstep(a1, a1 - 0.5, ang);
  float rr = length(dw);
  float width = 0.04 + 0.015 * sin(ang * 3.0 + uSeed);
  float band = smoothstep(width, width * 0.4, abs(rr - R));
  float streak = vnoise(vec2(rr * 520.0, ang * 4.0)) * 0.6 + vnoise(vec2(rr * 140.0, ang * 2.0)) * 0.4;
  marks *= 1.0 - along * band * (0.5 + 0.45 * streak);

  // Two finger smears.
  for (int i = 0; i < 2; i++) {
    float k = float(i) * 7.0 + uSeed;
    vec2 a = vec2(uAspect * (0.15 + 0.7 * hash12(vec2(k, 11.0))), 0.45 + 0.4 * hash12(vec2(k, 12.0)));
    vec2 b = a + vec2(0.02 + 0.04 * hash12(vec2(k, 13.0)), -0.05 - 0.07 * hash12(vec2(k, 14.0)));
    float bend = (vnoise(vec2(p.y * 30.0, k)) - 0.5) * 0.008;
    float dd = capsule(p + vec2(bend, 0.0), a, b);
    float sm = smoothstep(0.011, 0.005, dd) * (0.55 + 0.45 * vnoise(vec2(p.x * 900.0, p.y * 140.0)));
    marks *= 1.0 - 0.75 * sm;
  }

  // Old drip lines: thin, slightly wavy, clearer tracks running down from where a drop let go.
  float colW = 0.032;
  float id = floor(p.x / colW);
  float h1 = hash12(vec2(id, uSeed + 21.0));
  if (h1 > 0.74) {
    float x0 = (id + 0.25 + 0.5 * hash12(vec2(id, uSeed + 22.0))) * colW;
    float top = 0.5 + 0.5 * hash12(vec2(id, uSeed + 23.0));
    float bottom = top - 0.08 - 0.35 * hash12(vec2(id, uSeed + 24.0));
    float x = x0 + (vnoise(vec2(p.y * 9.0, id)) - 0.5) * 0.009 + (vnoise(vec2(p.y * 40.0, id + 3.0)) - 0.5) * 0.0015;
    float w = 0.0012 + 0.0016 * hash12(vec2(id, uSeed + 25.0));
    float span = smoothstep(top, top - 0.03, p.y) * smoothstep(bottom - 0.04, bottom + 0.02, p.y);
    float age = 0.25 + 0.4 * hash12(vec2(id, uSeed + 26.0));
    marks *= 1.0 - smoothstep(w, w * 0.3, abs(p.x - x)) * span * age;
  }
  return t;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * uAspect, uv.y);
  vec2 toUv = vec2(1.0 / uAspect, 1.0);

  // Fogged glass: the blurred street, softened and lifted where the mist is.
  float fog = texture(uMist, uv).r;
  float marks;
  float shape = fogShape(p, uv, marks);
  float clearing = texture(uClear, uv).r;
  float m = clamp(fog * uMistAmount * shape * marks * (1.0 - clearing * 0.35), 0.0, 1.0);
  vec2 suv = uv + frost(p) * uWarp * 0.008 * m * toUv;
  vec3 bg = textureLod(uBlur, suv, 0.0).rgb * uLoad;
  // Thicker fog scatters light further.
  vec3 scatter = textureLod(uBlur, uv, 3.5 + 2.0 * m).rgb * uLoad;
  bg = mix(bg, bg * 0.62 + scatter * 0.55, m) + uHaze * 0.03 * m;
  // Bright lights bloom into the fog: a wide halo, strongest where the fog is thick and where
  // old fingerprints and grease on the glass catch it.
  float grease = 0.65 + 0.7 * vnoise(p * 6.0 + uSeed) * vnoise(p * 15.0 + 3.0);
  vec3 bloom = textureLod(uBlur, uv, 5.0).rgb * 0.6 + textureLod(uBlur, uv, 6.5).rgb * 0.4;
  float bl = dot(bloom, vec3(0.3, 0.6, 0.1)) * uLoad;
  // Only light that is brighter than its surroundings blooms; the dark gets no lift.
  bg += bloom * uLoad * smoothstep(0.15, 0.8, bl) * (0.03 + 0.2 * m * m) * grease;

  // Headlights aimed at the window: their light catches in the fog on the glass itself.
  vec3 glare = vec3(0.0);
  for (int i = 0; i < ${MAX_GLARE}; i++) {
    vec4 G = uGlare[i * 2];
    if (G.w <= 0.0) continue;
    vec2 dv = (p - G.xy) * vec2(0.8, 1.0);
    float r2 = dot(dv, dv) / (G.z * G.z);
    glare += uGlare[i * 2 + 1].rgb * G.w * (exp(-r2 * 1.6) + exp(-r2 * 0.25) * 0.25);
  }
  float patchy = 0.7 + 0.6 * vnoise(p * 9.0) * vnoise(p * 23.0 + 4.0);
  bg += glare * (0.15 + m * 0.85) * patchy;
  vec3 col = bg;

  // Fine condensation beads, sized in pixels so they stay fine at any resolution.
  // Condensation gathers unevenly: thick patches, thinner ones, heavier toward the bottom,
  // and where fine beads have merged, fewer and larger ones.
  float px = uRes.y / 1000.0;
  float field = vnoise(p * 3.1 + 7.0) * 0.65 + vnoise(p * 8.3 + 2.0) * 0.35;
  float dense = smoothstep(0.22, 0.78, field) * (0.6 + 0.55 * (1.0 - uv.y));
  dense *= clamp(shape, 0.0, 1.2) * marks * (1.0 - clearing * 0.95);
  vec4 b0 = beads(gl_FragCoord.xy, 3.0 * px, 0.8 * dense, 23.0);
  vec4 b1 = beads(gl_FragCoord.xy, 5.6 * px, 0.62 * dense, 0.0);
  vec4 b2 = beads(gl_FragCoord.xy, 8.5 * px, 0.42 * (1.0 - dense * 0.55), 11.0);
  vec4 b = b0;
  if (b1.z > b.z) b = b1;
  if (b2.z > b.z) b = b2;
  float beadCover = b.z * uCondense * smoothstep(0.25, 0.9, fog) * marks;
  if (beadCover > 0.001) {
    vec2 n = b.xy;
    float e = length(n);
    float lum = dot(scatter + bg, vec3(0.3, 0.6, 0.1));
    float lit = clamp(lum * 2.5, 0.0, 1.0);
    // Explicit level: the offset jumps per pixel, which would otherwise pick a tiny mip.
    vec3 inside = textureLod(uBlur, uv - n * 0.012 * toUv, 0.0).rgb * uLoad * 1.05;
    // A dark edge only shows against light; in the dark a bead just catches a little haze.
    inside = mix(inside, bg * 0.5, smoothstep(0.65, 1.0, e) * 0.5 * lit);
    inside += uHaze * 0.012 * (1.0 - lit);
    vec2 hl = vec2(-0.35, 0.4) + (vec2(b.w, fract(b.w * 7.3)) - 0.5) * 0.5;
    float spark = exp(-dot(n - hl, n - hl) * 12.0);
    inside += bg * spark * lum * 2.0 + glare * spark * 2.5;
    col = mix(col, inside, beadCover * (0.55 + 0.45 * lit));
  }

  // Drops: each is a short-focus lens showing a sharper, upside-down patch of street.
  vec4 w = texture(uWater, uv);
  float cover = w.a;
  if (cover > 0.002) {
    vec2 n = (w.rg - 0.5) * 2.0 / max(cover, 0.05);
    float size = w.b / max(cover, 0.05);
    float e = clamp(length(n), 0.0, 1.0);
    vec2 slope = n / sqrt(max(0.06, 1.0 - e * e * 0.92));
    vec2 look = -slope * (0.02 + size * 0.03) * uLens;
    vec3 drop = texture(uSharp, uv + look * toUv).rgb * uLoad + bg * 0.1;
    // Light can't get out near the edge (total internal reflection): a dark rim...
    float lum = dot(scatter, vec3(0.3, 0.6, 0.1));
    float lit = clamp(lum * 3.0, 0.0, 1.0);
    float rim = smoothstep(0.72, 0.98, e);
    drop = mix(drop, bg * 0.12, rim * (0.35 + 0.5 * lit));
    // ...and gathers into a bright crescent on the lower inside edge.
    drop += scatter * 1.4 * smoothstep(0.5, 0.82, e) * (1.0 - rim) * smoothstep(0.1, -0.9, n.y);
    // The highlight sits wherever this drop's own tilt puts it (the tilt is baked into n).
    float spec = exp(-dot(n - vec2(-0.3, 0.42), n - vec2(-0.3, 0.42)) * 30.0);
    drop += vec3(0.9, 0.94, 1.0) * spec * (0.015 + lum * 1.6) * (0.4 + size);
    drop += glare * (spec * 3.0 + smoothstep(0.55, 0.9, e) * (1.0 - rim) * 0.8);
    col = mix(col, drop, cover);
  }

  // Rays from the scratches, with a faint colour split along them.
  // Softened sideways, the way out-of-focus light spreads, plus a faint wider glow.
  vec3 st = vec3(0.0);
  float sw = 0.0;
  for (int i = -4; i <= 4; i++) {
    float o = float(i) / 4.0;
    float wgt = exp(-o * o * 2.5);
    st += textureLod(uStreak, uv + vec2(o * 0.02 * uStreakBlur / uAspect, o * 0.006 * uStreakBlur), 0.0).rgb * wgt;
    sw += wgt;
  }
  st /= sw;
  // Thick fog spreads light into a haze rather than lines, so rays show mostly where the glass
  // is thinly fogged or wet. Compressed so a ray never outshines the light it comes from.
  st *= uStreaks * 2.2 * (0.7 + 0.3 * marks) * (1.0 - 0.75 * smoothstep(0.25, 0.85, m));
  col += st / (1.0 + st * 1.5);

  // Dust on the glass: invisible in the dark, tiny bright specks where light is behind it.
  vec2 dc = floor(gl_FragCoord.xy / (1.6 * px));
  float speck = step(0.9984, hash12(dc + uSeed * 3.1));
  col += vec3(1.0, 0.96, 0.9) * speck * (dot(scatter, vec3(0.3, 0.6, 0.1)) * 1.4 + 0.004);

  // Very bright light burns toward white, then a filmic curve.
  // Tone map brightness but keep each light's hue, so overlapping lights stay coloured;
  // only the very brightest cores drift toward white.
  col *= uExposure;
  float L = max(dot(col, vec3(0.3, 0.6, 0.1)), 1e-5);
  vec3 kept = col * (aces(vec3(L)).x / L);
  kept = mix(kept, vec3(aces(vec3(L)).x), smoothstep(4.0, 14.0, L) * 0.6);
  col = mix(aces(col), clamp(kept, 0.0, 1.0), 0.7);
  col = pow(col, vec3(0.95));

  vec2 c = uv - 0.5;
  col *= 1.0 - dot(c, c) * 0.6;
  vec2 cell = floor(gl_FragCoord.xy / uGrainSize);
  float gr = hash12(cell) + hash12(cell + 7.7) - 1.0;
  vec3 tint = vec3(hash12(cell + 3.1), hash12(cell + 5.3), hash12(cell + 9.7)) - 0.5;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col += (vec3(gr) + tint * uChroma) * uGrain * 0.06 * (0.45 + 0.55 * (1.0 - luma));
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const hexToRgb = (hex, fallback = [0, 0, 0]) => {
  const m = /^#?([0-9a-f]{6})/i.exec(hex || '');
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// `getValues()` returns the live control values (see frostConfig.js). Returns `destroy()`.
export function createFrost(canvas, getValues, { lite = false, onReady } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) {
    onReady?.();
    return () => {};
  }
  // Float targets keep lights brighter than white until the end. Without them, values are
  // stored scaled down in 8-bit textures.
  const hdr = !!gl.getExtension('EXT_color_buffer_float');
  const STORE = hdr ? 1 : 1 / 6;

  const compile = (type, src) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const link = (vert, frag) => {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(program));
    return program;
  };
  const uniforms = (program, names) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)]));

  const sceneProgram = link(FULLSCREEN_VERT, SCENE_FRAG);
  const blurProgram = link(FULLSCREEN_VERT, BLUR_FRAG);
  const lightProgram = link(LIGHT_VERT, LIGHT_FRAG);
  const dropProgram = link(DROP_VERT, DROP_FRAG);
  const wipeProgram = link(DROP_VERT, WIPE_FRAG);
  const fillProgram = link(FULLSCREEN_VERT, FILL_FRAG);
  const clearProgram = link(DROP_VERT, CLEAR_FRAG);
  const brightProgram = link(FULLSCREEN_VERT, BRIGHT_FRAG);
  const streakProgram = link(FULLSCREEN_VERT, STREAK_FRAG);
  const glassProgram = link(FULLSCREEN_VERT, GLASS_FRAG);
  const sceneU = uniforms(sceneProgram, ['uRes', 'uAspect', 'uTime', 'uStore', 'uWindows', 'uSkyTop', 'uSkyHorizon', 'uGround', 'uBuilding', 'uWindow', 'uGlow', 'uBuildings', 'uBuildingCount', 'uVehicles', 'uVehicleCount', 'uPeople', 'uPeopleCount', 'uTrees', 'uTreeCount', 'uPools', 'uPoolCount', 'uTaps']);
  const blurU = uniforms(blurProgram, ['uScene', 'uRes', 'uAspect', 'uRadius', 'uLod']);
  const lightU = uniforms(lightProgram, ['uAspect', 'uRadiusScale', 'uSharp', 'uStore', 'uTime']);
  const dropU = uniforms(dropProgram, ['uAspect', 'uPixel', 'uGrow']);
  const wipeU = uniforms(wipeProgram, ['uAspect', 'uGrow']);
  const clearU = uniforms(clearProgram, ['uAspect', 'uGrow']);
  const brightU = uniforms(brightProgram, ['uSharp', 'uRes', 'uLoad']);
  const streakU = uniforms(streakProgram, ['uBright', 'uRes', 'uAspect', 'uLength', 'uSeed']);
  const fillU = uniforms(fillProgram, ['uAlpha']);
  const glassU = uniforms(glassProgram, ['uBlur', 'uSharp', 'uWater', 'uMist', 'uClear', 'uStreak', 'uStreaks', 'uStreakBlur', 'uRes', 'uAspect', 'uSeed', 'uLoad', 'uLens', 'uMistAmount', 'uCondense', 'uWarp', 'uExposure', 'uHaze', 'uGrain', 'uGrainSize', 'uChroma', 'uGlare']);

  // One quad, drawn once per light, drop or wipe with per-instance attributes.
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const instances = (layout) => {
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    layout.attribs.forEach(([loc, size, offset]) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, layout.stride * 4, offset * 4);
      gl.vertexAttribDivisor(loc, 1);
    });
    gl.bindVertexArray(null);
    return { vao, buffer };
  };
  const lightInstances = instances({ stride: LIGHT_STRIDE, attribs: [[1, 4, 0], [2, 4, 4], [3, 4, 8]] });
  const dropInstances = instances({ stride: DROP_STRIDE, attribs: [[1, 4, 0], [2, 1, 4]] });
  const wipeInstances = instances({ stride: 4, attribs: [[1, 4, 0], [2, 1, 2]] });
  const wipeData = new Float32Array(16 * 4);
  const emptyVao = gl.createVertexArray();

  const target = ({ float = false, mipmaps = false } = {}) => ({ texture: gl.createTexture(), fbo: gl.createFramebuffer(), w: 0, h: 0, float: float && hdr, mipmaps });
  const sizeTarget = (t, w, h, clear) => {
    if (t.w === w && t.h === h) return;
    t.w = w;
    t.h = h;
    gl.bindTexture(gl.TEXTURE_2D, t.texture);
    if (t.float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, t.mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (t.mipmaps) gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.texture, 0);
    if (clear) {
      gl.clearColor(...clear);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  const sceneTarget = target({ float: true, mipmaps: true });
  const blurTarget = target({ float: true, mipmaps: true });
  const sharpTarget = target({ float: true });
  const waterTarget = target();
  const mistTarget = target();
  const clearTarget = target();
  const brightTarget = target({ float: true });
  const streakTarget = target({ float: true });

  let width = 0;
  let height = 0;
  const resize = (v) => {
    const q = v.quality;
    const dpr = Math.min(window.devicePixelRatio || 1, q.pixelRatio, lite ? 1.5 : 2);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (w !== width || h !== height) {
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
    }
    const s = Math.min(q.sceneScale, lite ? 0.35 : 1);
    const at = (k) => [Math.max(2, Math.round(w * s * k)), Math.max(2, Math.round(h * s * k))];
    sizeTarget(sceneTarget, ...at(0.5));
    sizeTarget(blurTarget, ...at(0.75));
    sizeTarget(sharpTarget, ...at(1));
    sizeTarget(waterTarget, w, h);
    sizeTarget(brightTarget, Math.max(2, Math.round(w / 2)), Math.max(2, Math.round(h / 24)));
    sizeTarget(streakTarget, Math.max(2, Math.round(w / 2)), Math.max(2, Math.round(h / 3)));
    sizeTarget(clearTarget, Math.max(2, Math.round(w / 2)), Math.max(2, Math.round(h / 2)));
    sizeTarget(mistTarget, Math.max(2, Math.round(w / 4)), Math.max(2, Math.round(h / 4)), [1, 1, 1, 1]);
  };

  const street = createStreet();
  const rain = createRain();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let time = 0;
  let mistReturn = 0;
  let announced = false;

  const drawScene = (t, v, colors, aspect, counts, taps) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.viewport(0, 0, t.w, t.h);
    gl.useProgram(sceneProgram);
    gl.uniform2f(sceneU.uRes, t.w, t.h);
    gl.uniform1f(sceneU.uAspect, aspect);
    gl.uniform1f(sceneU.uTime, time);
    gl.uniform1f(sceneU.uStore, STORE);
    gl.uniform1f(sceneU.uWindows, v.street.windows);
    gl.uniform3fv(sceneU.uSkyTop, hexToRgb(colors.skyTop));
    gl.uniform3fv(sceneU.uSkyHorizon, hexToRgb(colors.skyHorizon));
    gl.uniform3fv(sceneU.uGround, hexToRgb(colors.ground));
    gl.uniform3fv(sceneU.uBuilding, hexToRgb(colors.building));
    gl.uniform3fv(sceneU.uWindow, hexToRgb(colors.window));
    gl.uniform3fv(sceneU.uGlow, hexToRgb(colors.glow));
    gl.uniform4fv(sceneU.uBuildings, street.buildingData);
    gl.uniform1i(sceneU.uBuildingCount, counts.buildingCount);
    gl.uniform4fv(sceneU.uVehicles, street.vehicleData);
    gl.uniform1i(sceneU.uVehicleCount, counts.vehicleCount);
    gl.uniform4fv(sceneU.uTrees, street.treeData);
    gl.uniform1i(sceneU.uTreeCount, counts.treeCount);
    gl.uniform4fv(sceneU.uPeople, street.peopleData);
    gl.uniform1i(sceneU.uPeopleCount, counts.peopleCount);
    gl.uniform4fv(sceneU.uPools, street.poolData);
    gl.uniform1i(sceneU.uPoolCount, counts.poolCount);
    gl.uniform1i(sceneU.uTaps, taps);
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const drawLights = (t, aspect, sharp, radiusScale, lightCount) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.viewport(0, 0, t.w, t.h);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(lightProgram);
    gl.uniform1f(lightU.uAspect, aspect);
    gl.uniform1f(lightU.uRadiusScale, radiusScale);
    gl.uniform1f(lightU.uSharp, sharp ? 1 : 0);
    gl.uniform1f(lightU.uStore, STORE);
    gl.uniform1f(lightU.uTime, time);
    gl.bindVertexArray(lightInstances.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, lightCount);
    gl.disable(gl.BLEND);
  };

  const mipmap = (t) => {
    gl.bindTexture(gl.TEXTURE_2D, t.texture);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  const colors = FROST_COLORS;

  const frame = (dt) => {
    const v = getValues();
    const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    resize(v);

    const step = v.motion.playing ? dt * v.motion.speed * (reduceMotion.matches ? 0.4 : 1) : 0;
    time += step;

    // The "shutter": how long each frame's light smear lasts, in street seconds.
    const shutter = v.motion.playing ? 0.14 * v.motion.speed : 0;
    const counts = street.update(step, v.street, aspect, { lamp: hexToRgb(colors.lamp), window: hexToRgb(colors.window) }, shutter);
    const { dropCount, wipeCount } = rain.update(step, v.drops, aspect, lite, v.street.seed);
    gl.bindBuffer(gl.ARRAY_BUFFER, lightInstances.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, street.lights.subarray(0, counts.lightCount * LIGHT_STRIDE), gl.DYNAMIC_DRAW);
    gl.disable(gl.BLEND);

    // 1–2. The scene, then its lens blur, then the out-of-focus lights on top.
    drawScene(sceneTarget, v, colors, aspect, counts, 4);
    mipmap(sceneTarget);
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurTarget.fbo);
    gl.viewport(0, 0, blurTarget.w, blurTarget.h);
    gl.useProgram(blurProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTarget.texture);
    gl.uniform1i(blurU.uScene, 0);
    gl.uniform2f(blurU.uRes, blurTarget.w, blurTarget.h);
    gl.uniform1f(blurU.uAspect, aspect);
    const radius = 0.032 * v.glass.blur;
    gl.uniform1f(blurU.uRadius, radius);
    gl.uniform1f(blurU.uLod, Math.max(0, Math.log2((radius * sceneTarget.h) / 4)));
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    drawLights(blurTarget, aspect, false, v.glass.blur, counts.lightCount);
    mipmap(blurTarget);

    // 3. Nearly sharp, for the drops.
    drawScene(sharpTarget, v, colors, aspect, counts, 1);
    drawLights(sharpTarget, aspect, true, 1, counts.lightCount);

    // 3b. Light streaks from scratches on the glass.
    const streaks = v.streaks?.amount ?? 0;
    if (streaks > 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, brightTarget.fbo);
      gl.viewport(0, 0, brightTarget.w, brightTarget.h);
      gl.useProgram(brightProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sharpTarget.texture);
      gl.uniform1i(brightU.uSharp, 0);
      gl.uniform2f(brightU.uRes, brightTarget.w, brightTarget.h);
      gl.uniform1f(brightU.uLoad, 1 / STORE);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, streakTarget.fbo);
      gl.viewport(0, 0, streakTarget.w, streakTarget.h);
      gl.useProgram(streakProgram);
      gl.bindTexture(gl.TEXTURE_2D, brightTarget.texture);
      gl.uniform1i(streakU.uBright, 0);
      gl.uniform2f(streakU.uRes, streakTarget.w, streakTarget.h);
      gl.uniform1f(streakU.uAspect, aspect);
      gl.uniform1f(streakU.uLength, v.streaks.length);
      gl.uniform1f(streakU.uSeed, v.street.seed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // 4. The water map.
    gl.bindFramebuffer(gl.FRAMEBUFFER, waterTarget.fbo);
    gl.viewport(0, 0, waterTarget.w, waterTarget.h);
    gl.clearColor(0.5, 0.5, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(dropProgram);
    gl.uniform1f(dropU.uAspect, aspect);
    gl.uniform1f(dropU.uPixel, 1 / height);
    gl.uniform1f(dropU.uGrow, 1.2);
    gl.bindBuffer(gl.ARRAY_BUFFER, dropInstances.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, rain.drops.subarray(0, dropCount * DROP_STRIDE), gl.DYNAMIC_DRAW);
    gl.bindVertexArray(dropInstances.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, dropCount);

    // 4b. Clear rings around the bigger drops (same drop buffer, a wider quad).
    gl.bindFramebuffer(gl.FRAMEBUFFER, clearTarget.fbo);
    gl.viewport(0, 0, clearTarget.w, clearTarget.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendEquation(gl.MAX);
    gl.useProgram(clearProgram);
    gl.uniform1f(clearU.uAspect, aspect);
    gl.uniform1f(clearU.uGrow, 2.7);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, dropCount);
    gl.blendEquation(gl.FUNC_ADD);

    // 5. Mist creeps back in steps an 8-bit texture can hold; a sliding drop wipes it.
    gl.bindFramebuffer(gl.FRAMEBUFFER, mistTarget.fbo);
    gl.viewport(0, 0, mistTarget.w, mistTarget.h);
    mistReturn += step * v.glass.mistReturn * 0.04;
    if (mistReturn > 0.012) {
      gl.useProgram(fillProgram);
      gl.uniform1f(fillU.uAlpha, mistReturn);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      mistReturn = 0;
    }
    if (wipeCount) {
      for (let i = 0; i < wipeCount; i++) {
        const r = rain.wipes[i * 3 + 2];
        wipeData.set([rain.wipes[i * 3], rain.wipes[i * 3 + 1], r, r], i * 4);
      }
      gl.useProgram(wipeProgram);
      gl.uniform1f(wipeU.uAspect, aspect);
      gl.uniform1f(wipeU.uGrow, 1.2);
      gl.bindBuffer(gl.ARRAY_BUFFER, wipeInstances.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, wipeData.subarray(0, wipeCount * 4), gl.DYNAMIC_DRAW);
      gl.bindVertexArray(wipeInstances.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, wipeCount);
    }
    gl.disable(gl.BLEND);

    // 6. The glass.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(glassProgram);
    [blurTarget, sharpTarget, waterTarget, mistTarget, clearTarget, streakTarget].forEach((t, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t.texture);
    });
    gl.uniform1i(glassU.uBlur, 0);
    gl.uniform1i(glassU.uSharp, 1);
    gl.uniform1i(glassU.uWater, 2);
    gl.uniform1i(glassU.uMist, 3);
    gl.uniform1i(glassU.uClear, 4);
    gl.uniform1i(glassU.uStreak, 5);
    gl.uniform1f(glassU.uStreaks, streaks);
    gl.uniform1f(glassU.uStreakBlur, v.streaks?.blur ?? 0.6);
    gl.uniform1f(glassU.uSeed, v.street.seed);
    gl.uniform2f(glassU.uRes, width, height);
    gl.uniform1f(glassU.uAspect, aspect);
    gl.uniform1f(glassU.uLoad, 1 / STORE);
    gl.uniform1f(glassU.uLens, v.drops.lens);
    gl.uniform1f(glassU.uMistAmount, v.glass.mist);
    gl.uniform1f(glassU.uCondense, v.glass.condensation);
    gl.uniform1f(glassU.uWarp, v.glass.frostWarp);
    gl.uniform1f(glassU.uExposure, v.street.exposure);
    gl.uniform3fv(glassU.uHaze, hexToRgb(colors.haze));
    gl.uniform1f(glassU.uGrain, v.grain.amount);
    gl.uniform1f(glassU.uGrainSize, v.grain.size);
    gl.uniform1f(glassU.uChroma, v.grain.chroma);
    gl.uniform4fv(glassU.uGlare, street.glareData);
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);

    if (!announced) {
      announced = true;
      onReady?.();
    }
  };

  const onContextLost = (e) => e.preventDefault();
  canvas.addEventListener('webglcontextlost', onContextLost);
  const stop = createFrameLoop(canvas, frame);

  return () => {
    stop();
    canvas.removeEventListener('webglcontextlost', onContextLost);
    releaseContext(gl);
  };
}
