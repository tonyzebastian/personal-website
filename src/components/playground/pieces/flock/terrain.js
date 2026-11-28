// Endless painted landscape seen from above.
//
// The world is one continuous map. `u` runs along the flight heading, `w` across it.
// Ground colour, relief, water and objects are all functions of (u, w), so the scenery
// morphs from one region into the next through noise-warped, dithered borders instead
// of crossfading. The ground is rasterised in chunks at low resolution (soft, wash-like
// once upscaled) with hill-shaded relief; trees, rocks and buildings are drawn live as
// vectors with cast shadows for depth.

const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------------ noise
const PERM = (() => {
  const p = new Uint8Array(512);
  let s = 1337;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const a = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = (r() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = a[i & 255];
  return p;
})();

const hv = (ix, iy) => PERM[PERM[ix & 255] + (iy & 255)] / 256;

function noise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hv(ix, iy);
  const b = hv(ix + 1, iy);
  const c = hv(ix, iy + 1);
  const d = hv(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, oct) {
  let amp = 0.5;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * noise(x, y);
    norm += amp;
    const nx = 0.8 * x - 0.6 * y + 17.3;
    y = 0.6 * x + 0.8 * y + 9.1;
    x = nx;
    amp *= 0.5;
  }
  return sum / norm;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------- palettes
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const pal = (list) => list.map(rgb);

const P = {
  hills: pal(['#245f2a', '#38802f', '#5fa53a', '#8cc44e', '#b6d86a']),
  crops: pal(['#77ad3f', '#93bf48', '#b4cd58', '#d6c05a', '#e3cd76', '#a4835a', '#5c9638', '#c8b55a']),
  dry: pal(['#c2a676', '#d3bb8a', '#e1cfa4', '#ece0bd']),
  plow: rgb('#b49c78'),
  oasis: rgb('#98b068'),
  forest: pal(['#143a22', '#1d4f2b', '#2b6a33', '#46853c']),
  meadow: rgb('#78ab48'),
  dune: pal(['#789f48', '#9fb460', '#c6c284', '#e0d4a2']),
  sand: rgb('#ecdfb8'),
  wetSand: rgb('#cdbf99'),
  foam: rgb('#f4f7f2'),
  seaShallow: rgb('#86d2c2'),
  seaMid: rgb('#3f9fb2'),
  seaDeep: rgb('#1b5d86'),
  riverShallow: rgb('#8ccdb8'),
  riverDeep: rgb('#2e7f93'),
  hedge: rgb('#32632c'),
  track: rgb('#e6dfb6'),
};

// Soft-edged colour washes: a value picks a band; band borders are soft and slightly
// darker, like pigment pooling at the edge of a wash.
function ramp(colors, x, out) {
  const n = colors.length - 1;
  const p = clamp(x, 0, 0.9999) * n;
  const i = p | 0;
  const f = p - i;
  const s = smooth(0.42, 0.58, f);
  const a = colors[i];
  const b = colors[i + 1];
  const edge = 1 - clamp(Math.abs(f - 0.5) / 0.07);
  const dk = 1 - 0.09 * edge;
  out[0] = (a[0] + (b[0] - a[0]) * s) * dk;
  out[1] = (a[1] + (b[1] - a[1]) * s) * dk;
  out[2] = (a[2] + (b[2] - a[2]) * s) * dk;
}

const mix3 = (o, c, k) => {
  o[0] += (c[0] - o[0]) * k;
  o[1] += (c[1] - o[1]) * k;
  o[2] += (c[2] - o[2]) * k;
};

// ------------------------------------------------------------------------- zones
const ZL = 3600; // length of one region along the flight path
const TW = 0.3; // fraction of a region spent blending into the next
const NB = 5;
const zone = { a: 0, b: 1, t: 0 };

function zoneAt(u, w) {
  const z = u / ZL + (fbm(u * 0.0011 + 3.1, w * 0.0011 + 7.7, 2) - 0.5) * 0.36 + (noise(u * 0.02, w * 0.02) - 0.5) * 0.07;
  const zi = Math.floor(z);
  zone.a = ((zi % NB) + NB) % NB;
  zone.b = (zone.a + 1) % NB;
  zone.t = smooth(1 - TW, 1, z - zi);
}

const heightAt = (u, w) => fbm(u * 0.002 + 100, w * 0.002 + 200, 4);

// ------------------------------------------------------------------------ water
let WATER = 0;

function waterShade(u, w, d, out, shallow, deep) {
  const g = noise(u * 0.018, w * 0.018);
  mix3Into(out, shallow, deep, smooth(0, 0.9, d) + (g - 0.5) * 0.12);
  const glint = Math.pow(noise(u * 0.07 + 5, w * 0.07 + 9), 6) * 70;
  out[0] += glint;
  out[1] += glint;
  out[2] += glint;
}

function mix3Into(out, a, b, k) {
  k = clamp(k);
  out[0] = a[0] + (b[0] - a[0]) * k;
  out[1] = a[1] + (b[1] - a[1]) * k;
  out[2] = a[2] + (b[2] - a[2]) * k;
}

const RIVER_W = 0.05;
const riverR = (u, w) => Math.abs(fbm(u * 0.0014 + 31, w * 0.0014 + 12, 3) - 0.5);

function river(u, w, wt, o) {
  const W0 = RIVER_W * wt;
  const r = riverR(u, w);
  if (r > W0 * 1.6) return;
  if (r < W0) {
    const d = 1 - r / W0;
    const edge = smooth(0, 0.14, d);
    const tmp = [0, 0, 0];
    waterShade(u, w, d, tmp, P.riverShallow, P.riverDeep);
    mix3(o, tmp, edge);
    WATER = Math.max(WATER, edge);
  } else {
    // Dark damp bank around the water.
    const f = 1 - (r - W0) / (W0 * 0.6);
    o[0] *= 1 - 0.28 * f;
    o[1] *= 1 - 0.2 * f;
    o[2] *= 1 - 0.3 * f;
  }
}

const LAKE_T = 0.36;
const lakeL = (u, w) => fbm(u * 0.0016 + 80, w * 0.0016 + 40, 3);

// ----------------------------------------------------------------------- grounds
const FARM = { hv: 0, e: 0, fx: 0, fy: 0, ang: 0 };
const FC = 215;

function farmCell(u, w) {
  const wx = (fbm(u * 0.003, w * 0.003, 2) - 0.5) * 0.9;
  const wy = (fbm(u * 0.003 + 40, w * 0.003 + 40, 2) - 0.5) * 0.9;
  const x = (u * 0.9 + w * 0.44) / FC + wx;
  const y = (-u * 0.44 + w * 0.9) / FC + wy;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  FARM.fx = x - ix;
  FARM.fy = y - iy;
  FARM.e = Math.min(FARM.fx, 1 - FARM.fx, FARM.fy, 1 - FARM.fy) * FC;
  FARM.hv = hv(ix * 7 + 3, iy * 13 + 5);
}

function gHills(u, w, hh, wt, o) {
  const t = fbm(u * 0.0042 + 11, w * 0.0042 + 4, 3) + (noise(u * 0.025, w * 0.025) - 0.5) * 0.07;
  ramp(P.hills, (t - 0.28) / 0.45, o);
  if (wt > 0.02) river(u, w, wt, o);
}

function gFarm(u, w, hh, wt, o) {
  farmCell(u, w);
  const c = P.crops[(FARM.hv * P.crops.length) | 0];
  const v = 0.93 + 0.14 * noise(u * 0.012, w * 0.012) + (FARM.fx - 0.5) * 0.07;
  o[0] = c[0] * v;
  o[1] = c[1] * v;
  o[2] = c[2] * v;
  // Pale tracks between the fields, with a hedge along some of them.
  const e = FARM.e;
  if (e < 7) {
    if (e < 2.6) mix3(o, P.track, 0.85);
    else if (FARM.hv > 0.45) mix3(o, P.hedge, 0.8 * (1 - smooth(4.2, 7, e)));
    else {
      o[0] *= 0.93;
      o[1] *= 0.94;
      o[2] *= 0.93;
    }
  }
}

function gDry(u, w, hh, wt, o) {
  const t = fbm(u * 0.003 + 2, w * 0.003 + 9, 3);
  ramp(P.dry, (t - 0.28) / 0.45, o);
  const x = (u * 0.8 - w * 0.6) / 330 + (fbm(u * 0.004, w * 0.004, 2) - 0.5) * 0.5;
  const y = (u * 0.6 + w * 0.8) / 330 + (fbm(u * 0.004 + 9, w * 0.004 + 3, 2) - 0.5) * 0.5;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const e = Math.min(x - ix, 1 - (x - ix), y - iy, 1 - (y - iy)) * 330;
  const h = hv(ix * 5 + 1, iy * 11 + 2);
  if (h > 0.7) mix3(o, P.plow, 0.65 * smooth(8, 26, e));
  if (h > 0.5 && e < 5) mix3(o, P.track, 0.9 * (1 - smooth(2.5, 5, e)));
  const m = fbm(u * 0.0025 + 50, w * 0.0025 + 17, 3);
  mix3(o, P.oasis, 0.8 * smooth(0.6, 0.7, m));
}

function gForest(u, w, hh, wt, o) {
  const t = fbm(u * 0.005 + 3, w * 0.005 + 8, 3);
  ramp(P.forest, (t - 0.25) / 0.5, o);
  const m = fbm(u * 0.002 + 20, w * 0.002 + 60, 3);
  mix3(o, P.meadow, 0.85 * smooth(0.62, 0.7, m));
  if (wt > 0.02) {
    river(u, w, wt, o);
    const thr = lerp(0.2, LAKE_T, wt);
    const L = lakeL(u, w);
    if (L < thr + 0.05) {
      const d = (thr - L) / 0.12;
      if (d > 0) {
        const edge = smooth(0, 0.18, d);
        const tmp = [0, 0, 0];
        waterShade(u, w, clamp(d), tmp, P.riverShallow, P.riverDeep);
        mix3(o, tmp, edge);
        WATER = Math.max(WATER, edge);
      } else {
        const f = 1 + d / 0.42;
        o[0] *= 1 - 0.3 * f;
        o[1] *= 1 - 0.2 * f;
        o[2] *= 1 - 0.3 * f;
      }
    }
  }
}

const shoreAt = (u) => 140 * (fbm(u * 0.0011 + 5, 3.3, 2) - 0.5) * 2 + (noise(u * 0.006, 1.7) - 0.5) * 60;

function gCoast(u, w, hh, wt, o) {
  const s = shoreAt(u) + (1 - wt) * 1100;
  const dist = w - s;
  if (dist < 0) {
    const ld = -dist;
    const t = fbm(u * 0.004 + 7, w * 0.004 + 2, 3);
    ramp(P.dune, (t - 0.28) / 0.45, o);
    const jig = noise(u * 0.02, w * 0.02) * 40;
    mix3(o, P.sand, 1 - smooth(50, 170, ld + jig));
    mix3(o, P.wetSand, 1 - smooth(0, 26, ld + jig * 0.3));
  } else {
    const d = clamp(dist / 460);
    const k = smooth(0, 0.45, d);
    const k2 = smooth(0.4, 1, d);
    const g = noise(u * 0.003, w * 0.03);
    const base = [0, 0, 0];
    mix3Into(base, P.seaShallow, P.seaMid, k + (g - 0.5) * 0.12);
    mix3(base, P.seaDeep, k2 * 0.9);
    // Slow swell bands and sparkles.
    const sw = (noise(u * 0.006 + 3, w * 0.025) - 0.5) * 22;
    const glint = Math.pow(noise(u * 0.07, w * 0.07), 6) * 80;
    o[0] = base[0] + sw + glint;
    o[1] = base[1] + sw + glint;
    o[2] = base[2] + sw + glint;
    const foamEdge = 6 + noise(u * 0.03, w * 0.03) * 22;
    mix3(o, P.foam, (1 - smooth(0, foamEdge, dist)) * 0.95);
    // A fainter second line of surf.
    const f2 = Math.exp(-Math.pow((dist - 70 - noise(u * 0.012, 4) * 40) / 7, 2)) * 0.4;
    mix3(o, P.foam, f2);
    WATER = 1;
  }
}

const GROUND = [gHills, gFarm, gDry, gForest, gCoast];
const RELIEF = [1.0, 0.35, 0.85, 0.7, 0.6];

// Is this spot water (or close enough that nothing should stand on it)?
function isWater(bi, u, w, wt) {
  if (bi === 0) return wt > 0.02 && riverR(u, w) < RIVER_W * wt * 1.7;
  if (bi === 3) {
    if (wt <= 0.02) return false;
    if (riverR(u, w) < RIVER_W * wt * 1.7) return true;
    return lakeL(u, w) < lerp(0.2, LAKE_T, wt) + 0.06;
  }
  if (bi === 4) return w > shoreAt(u) + (1 - wt) * 1100 - 90;
  return false;
}

// ---------------------------------------------------------------------- features
const CL = 560; // chunk length in world units
const PAD = 3; // overlap, in raster pixels, so neighbouring chunks hide their seam
const GS_T = 40;
const GS_S = 90;
const GS_H = 190;

const TREE_PAL = {
  hills: [pal(['#1d4f25', '#356f2d', '#6a9f3a']), pal(['#7a3a1c', '#b0561f', '#e0902f'])],
  farm: [pal(['#2f5c2a', '#4a7f33', '#7fae4c'])],
  dry: [pal(['#5b6a33', '#7a8a42', '#a5ad62'])],
  forest: [pal(['#0e2e1b', '#1a4a27', '#2e7a35']), pal(['#6b2f16', '#a94c1b', '#d98a2e']), pal(['#183f23', '#2c6a33', '#5a9a42'])],
  coast: [pal(['#4d6b30', '#6f8f43', '#9db463'])],
};

function genFeatures(c) {
  const rng = mulberry(c * 9973 + 17);
  const out = [];
  const u0 = c * CL;
  const WL = world.WL;
  const pick = (u, w) => {
    zoneAt(u, w);
    const useB = rng() < zone.t;
    return { bi: useB ? zone.b : zone.a, wt: useB ? zone.t : 1 - zone.t, a: zone.a, b: zone.b, t: zone.t };
  };
  const wet = (z, u, w) => isWater(z.a, u, w, 1 - z.t) || isWater(z.b, u, w, z.t);

  // Trees and tall things.
  for (let gu = u0; gu < u0 + CL; gu += GS_T) {
    for (let gw = -WL / 2; gw < WL / 2; gw += GS_T) {
      const u = gu + rng() * GS_T;
      const w = gw + rng() * GS_T;
      const z = pick(u, w);
      if (wet(z, u, w)) continue;
      const r = rng();
      const hvv = rng();
      if (z.bi === 0) {
        const cl = smooth(0.5, 0.7, fbm(u * 0.004 + 60, w * 0.004 + 9, 3));
        if (r < 0.8 * cl) out.push({ k: 't', u, w, r: 15 + rng() * 14, pal: TREE_PAL.hills[hvv < 0.07 ? 1 : 0], h: hvv });
      } else if (z.bi === 1) {
        farmCell(u, w);
        if (FARM.e < 8 && FARM.hv > 0.4 && r < 0.3) out.push({ k: 't', u, w, r: 9 + rng() * 6, pal: TREE_PAL.farm[0], h: hvv });
        else if (r < 0.025) out.push({ k: 'c', u, w, r: 5 + rng() * 2.5, pal: TREE_PAL.farm[0], h: hvv });
      } else if (z.bi === 2) {
        const m = fbm(u * 0.0025 + 50, w * 0.0025 + 17, 3);
        if (m > 0.66 && r < 0.55) out.push({ k: 't', u, w, r: 11 + rng() * 8, pal: TREE_PAL.dry[0], h: hvv });
        else if (r < 0.02) out.push({ k: 'c', u, w, r: 5 + rng() * 2, pal: TREE_PAL.dry[0], h: hvv });
      } else if (z.bi === 3) {
        const clear = smooth(0.62, 0.7, fbm(u * 0.002 + 20, w * 0.002 + 60, 3));
        if (r < 0.92 * (1 - clear)) {
          const pi = hvv < 0.1 ? 1 : hvv < 0.4 ? 2 : 0;
          out.push({ k: 't', u, w, r: 21 + rng() * 17, pal: TREE_PAL.forest[pi], h: hvv });
        }
      } else if (z.bi === 4) {
        if (r < 0.1 && w < shoreAt(u) + (1 - z.wt) * 1100 - 140) out.push({ k: 't', u, w, r: 8 + rng() * 6, pal: TREE_PAL.coast[0], h: hvv });
      }
    }
  }

  // Bushes and rocks.
  for (let gu = u0; gu < u0 + CL; gu += GS_S) {
    for (let gw = -WL / 2; gw < WL / 2; gw += GS_S) {
      const u = gu + rng() * GS_S;
      const w = gw + rng() * GS_S;
      const z = pick(u, w);
      if (wet(z, u, w)) continue;
      const r = rng();
      const hvv = rng();
      if (z.bi === 0) {
        if (r < 0.07) out.push({ k: 'r', u, w, r: 7 + rng() * 8, h: hvv });
        else if (r < 0.2) out.push({ k: 'b', u, w, r: 6 + rng() * 5, pal: TREE_PAL.hills[0], h: hvv });
      } else if (z.bi === 2) {
        if (r < 0.1) out.push({ k: 'r', u, w, r: 7 + rng() * 9, h: hvv });
        else if (r < 0.22) out.push({ k: 'b', u, w, r: 5 + rng() * 4, pal: TREE_PAL.dry[0], h: hvv });
      } else if (z.bi === 3 && r < 0.04) {
        out.push({ k: 'r', u, w, r: 6 + rng() * 7, h: hvv });
      }
    }
  }

  // The odd farmhouse, on a field's edge.
  for (let gu = u0; gu < u0 + CL; gu += GS_H) {
    for (let gw = -WL / 2; gw < WL / 2; gw += GS_H) {
      const u = gu + rng() * GS_H;
      const w = gw + rng() * GS_H;
      const z = pick(u, w);
      if (z.bi === 1 && z.wt > 0.9 && rng() < 0.1) {
        farmCell(u, w);
        if (FARM.e > 24) out.push({ k: 'h', u, w, r: 20 + rng() * 8, h: rng(), ang: Math.atan2(0.44, 0.9) });
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------------- state
const world = { WL: 1500 };

export const LIGHT_SCREEN = (() => {
  const x = -0.5;
  const y = -0.72;
  const l = Math.hypot(x, y);
  return [x / l, y / l]; // toward the sun: up and to the left
})();

export function createTerrain(heading) {
  const HX = Math.sin(heading);
  const HY = -Math.cos(heading);
  const NX = -HY;
  const NY = HX;
  const lu = LIGHT_SCREEN[0] * HX + LIGHT_SCREEN[1] * HY;
  const lw = LIGHT_SCREEN[0] * NX + LIGHT_SCREEN[1] * NY;
  let Q = 0.28; // raster pixels per screen pixel (lower on phones)
  const REL = 650;

  let width = 1;
  let height = 1;
  let k = 1;
  let sdpr = 1;
  let ppw = Q;
  let chunks = new Map();
  const grain = makeGrain();

  function setSize(w, h, kk, dprScene, quality = 0.28) {
    Q = quality;
    width = w;
    height = h;
    k = kk;
    sdpr = dprScene;
    ppw = Q * k;
    world.WL = Math.hypot(w, h) / k + 320;
    chunks = new Map();
  }

  function makeChunk(c) {
    const cw = Math.ceil(CL * ppw) + PAD * 2;
    const ch = Math.ceil(world.WL * ppw);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    return {
      c,
      cw,
      ch,
      canvas,
      ctx,
      img: ctx.createImageData(cw, ch),
      H: null,
      stage: 0,
      row: 0,
      done: false,
      features: genFeatures(c),
    };
  }

  function computeHeights(ch) {
    const stride = ch.cw + 2;
    const H = new Float32Array(stride * (ch.ch + 2));
    const ub = ch.c * CL - PAD / ppw;
    const w0 = -world.WL / 2;
    for (let j = 0; j < ch.ch + 2; j++) {
      const w = w0 + (j - 0.5) / ppw;
      for (let i = 0; i < stride; i++) H[j * stride + i] = heightAt(ub + (i - 0.5) / ppw, w);
    }
    ch.H = H;
  }

  const oA = [0, 0, 0];
  const oB = [0, 0, 0];

  function renderRows(ch, j0, j1) {
    const stride = ch.cw + 2;
    const ub = ch.c * CL - PAD / ppw;
    const w0 = -world.WL / 2;
    const data = ch.img.data;
    const H = ch.H;
    for (let j = j0; j < j1; j++) {
      const w = w0 + (j + 0.5) / ppw;
      for (let i = 0; i < ch.cw; i++) {
        const u = ub + (i + 0.5) / ppw;
        zoneAt(u, w);
        const za = zone.a;
        const zb = zone.b;
        const zt = zone.t;
        const hi = (j + 1) * stride + i + 1;
        const gu = (H[hi + 1] - H[hi - 1]) * ppw * 0.5;
        const gw = (H[hi + stride] - H[hi - stride]) * ppw * 0.5;
        WATER = 0;
        GROUND[za](u, w, H[hi], 1 - zt, oA);
        let r = oA[0];
        let g = oA[1];
        let b = oA[2];
        let S = RELIEF[za];
        let wat = WATER;
        if (zt > 0.003) {
          WATER = 0;
          GROUND[zb](u, w, H[hi], zt, oB);
          r += (oB[0] - r) * zt;
          g += (oB[1] - g) * zt;
          b += (oB[2] - b) * zt;
          S += (RELIEF[zb] - S) * zt;
          wat += (WATER - wat) * zt;
        }
        // Hill-shading: slopes facing the sun glow, slopes away cool and darken.
        let sh = -(gu * lu + gw * lw) * REL * S * (1 - 0.85 * wat);
        sh = sh < -1 ? -1 : sh > 1 ? 1 : sh;
        const f = sh > 0 ? 1 + 0.3 * sh : 1 + 0.4 * sh;
        const amb = (0.93 + 0.14 * H[hi]) * f;
        const cool = sh < 0 ? -sh * 0.05 : 0;
        const idx = (j * ch.cw + i) * 4;
        data[idx] = r * amb * (1 - cool);
        data[idx + 1] = g * amb;
        data[idx + 2] = b * amb * (1 + cool);
        data[idx + 3] = 255;
      }
    }
  }

  function step(ch, deadline) {
    if (ch.stage === 0) {
      computeHeights(ch);
      ch.stage = 1;
      ch.row = 0;
    }
    while (ch.row < ch.ch && performance.now() < deadline) {
      const r1 = Math.min(ch.row + 6, ch.ch);
      renderRows(ch, ch.row, r1);
      ch.ctx.putImageData(ch.img, 0, 0, 0, ch.row, ch.cw, r1 - ch.row);
      ch.row = r1;
    }
    if (ch.row >= ch.ch) {
      ch.done = true;
      ch.img = null;
      ch.H = null;
    }
  }

  // Keep the chunks around the view (and a few ahead) built, within a time budget.
  function update(dist, budgetMs, ahead = 2) {
    const R = Math.hypot(width, height) / (2 * k) + 120;
    const lo = Math.floor((dist - R) / CL);
    const hi = Math.floor((dist + R) / CL);
    const want = [];
    for (let c = lo; c <= hi + ahead; c++) want.push(c);
    // Visible chunks first (ahead of the bird is where new ground appears).
    want.sort((a, b) => (a > hi ? a + 100 : a) - (b > hi ? b + 100 : b));
    for (const c of want) if (!chunks.has(c)) chunks.set(c, makeChunk(c));
    for (const key of chunks.keys()) if (key < lo - 1 || key > hi + ahead + 3) chunks.delete(key);
    const deadline = performance.now() + budgetMs;
    for (const c of want) {
      const ch = chunks.get(c);
      if (!ch.done) {
        step(ch, deadline);
        if (performance.now() >= deadline) break;
      }
    }
  }

  function warm(dist) {
    const R = Math.hypot(width, height) / (2 * k) + 120;
    const lo = Math.floor((dist - R) / CL);
    const hi = Math.floor((dist + R) / CL);
    for (let c = lo; c <= hi; c++) {
      if (!chunks.has(c)) chunks.set(c, makeChunk(c));
      const ch = chunks.get(c);
      while (!ch.done) step(ch, performance.now() + 1000);
    }
  }

  // ---------------------------------------------------------------- vector objects
  const circle = (ctx, x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const css = (c, m = 1) => `rgb(${(c[0] * m) | 0},${(c[1] * m) | 0},${(c[2] * m) | 0})`;
  const lx = LIGHT_SCREEN[0];
  const ly = LIGHT_SCREEN[1];
  const sAng = Math.atan2(-ly, -lx);

  function shadowOf(ctx, x, y, r, stretch, h) {
    ctx.save();
    ctx.translate(x - lx * r * 0.9 * stretch, y - ly * r * 0.9 * stretch);
    ctx.rotate(sAng);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * (0.95 + 0.3 * stretch), r * 0.78, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(8,28,20,${0.3 - h * 0.04})`;
    ctx.fill();
    ctx.restore();
  }

  function drawBody(ctx, f, x, y, r) {
    if (f.k === 't' || f.k === 'b') {
      const [d, m, l] = f.pal;
      const rr = f.k === 'b' ? r : r;
      ctx.fillStyle = css(d);
      circle(ctx, x, y, rr);
      for (let i = 0; i < 5; i++) {
        const a = f.h * 6.28 + i * 1.26;
        circle(ctx, x + Math.cos(a) * rr * 0.55, y + Math.sin(a) * rr * 0.55, rr * (0.5 + 0.12 * ((i * 7 + f.h * 10) % 3) / 3));
      }
      ctx.fillStyle = css(m);
      circle(ctx, x + lx * rr * 0.2, y + ly * rr * 0.2, rr * 0.8);
      ctx.fillStyle = css(l);
      circle(ctx, x + lx * rr * 0.4, y + ly * rr * 0.4, rr * 0.45);
      // A few darker gaps in the canopy.
      if (f.k === 't' && rr > 14) {
        ctx.fillStyle = css(d, 0.85);
        circle(ctx, x - lx * rr * 0.35 + Math.cos(f.h * 9) * rr * 0.2, y - ly * rr * 0.35, rr * 0.18);
      }
    } else if (f.k === 'c') {
      const [d, m, l] = f.pal;
      ctx.fillStyle = css(d);
      circle(ctx, x, y, r);
      ctx.fillStyle = css(m);
      circle(ctx, x + lx * r * 0.25, y + ly * r * 0.25, r * 0.7);
      ctx.fillStyle = css(l);
      circle(ctx, x + lx * r * 0.45, y + ly * r * 0.45, r * 0.35);
    } else if (f.k === 'r') {
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 6.28 + f.h * 6;
        const rr = r * (0.8 + 0.3 * ((f.h * 13 + i * 3.7) % 1));
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = '#7f827c';
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 6.28 + f.h * 6;
        const rr = r * 0.6 * (0.8 + 0.3 * ((f.h * 13 + i * 3.7) % 1));
        ctx.lineTo(x + lx * r * 0.22 + Math.cos(a) * rr, y + ly * r * 0.22 + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = '#b4b6ac';
      ctx.fill();
    } else if (f.k === 'h') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.ang);
      const w = r * 1.5;
      const h = r * 0.95;
      // Roof: sun-lit half and shaded half, with a ridge.
      ctx.fillStyle = '#d27553';
      ctx.fillRect(-w / 2, -h / 2, w, h / 2);
      ctx.fillStyle = '#9a4a36';
      ctx.fillRect(-w / 2, 0, w, h / 2);
      ctx.fillStyle = 'rgba(60,25,15,0.5)';
      ctx.fillRect(-w / 2, -1, w, 2);
      ctx.fillStyle = '#6e5a4d';
      ctx.fillRect(w * 0.2, -h * 0.35, 4, 4);
      ctx.restore();
    }
  }

  function shadowPoly(ctx, f, x, y, r) {
    if (f.k === 'c') {
      ctx.save();
      ctx.translate(x - lx * r * 2.2, y - ly * r * 2.2);
      ctx.rotate(sAng);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 3.2, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8,28,20,0.3)';
      ctx.fill();
      ctx.restore();
    } else if (f.k === 'h') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.ang);
      const w = r * 1.5;
      const h = r * 0.95;
      ctx.fillStyle = 'rgba(8,28,20,0.32)';
      ctx.beginPath();
      const sx = -lx * r * 0.9;
      const sy = -ly * r * 0.9;
      ctx.moveTo(-w / 2, h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(w / 2 + sx, h / 2 + sy);
      ctx.lineTo(-w / 2 + sx, h / 2 + sy);
      ctx.closePath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fill();
      ctx.restore();
    } else if (f.k === 'r') {
      shadowOf(ctx, x, y, r * 0.9, 0.9, f.h);
    } else if (f.k === 'b') {
      shadowOf(ctx, x, y, r, 0.6, f.h);
    } else {
      shadowOf(ctx, x, y, r, 1, f.h);
    }
  }

  const vis = [];

  function draw(ctx, dist, sweep, cx, cy, overlay) {
    ctx.save();
    ctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
    ctx.fillStyle = '#4c8a38';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Ground chunks.
    for (const ch of chunks.values()) {
      const U0 = ch.c * CL - PAD / ppw;
      const W0 = -world.WL / 2;
      const ox = cx + (HX * (U0 - dist) + NX * W0) * k;
      const oy = cy + (HY * (U0 - dist) + NY * W0) * k;
      ctx.setTransform(HX * k * sdpr, HY * k * sdpr, NX * k * sdpr, NY * k * sdpr, ox * sdpr, oy * sdpr);
      ctx.drawImage(ch.canvas, 0, 0, ch.cw / ppw, ch.ch / ppw);
    }
    ctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);

    // Objects: cast shadows for all of them first, then bodies back to front.
    vis.length = 0;
    const m = 80;
    for (const ch of chunks.values()) {
      for (const f of ch.features) {
        const x = cx + (HX * (f.u - dist) + NX * f.w) * k;
        const y = cy + (HY * (f.u - dist) + NY * f.w) * k;
        const r = f.r * k;
        if (x < -m - r * 3 || x > width + m + r * 3 || y < -m - r * 3 || y > height + m + r * 3) continue;
        vis.push({ f, x, y, r });
      }
    }
    for (const v of vis) shadowPoly(ctx, v.f, v.x, v.y, v.r);
    vis.sort((a, b) => a.y - b.y);
    for (const v of vis) drawBody(ctx, v.f, v.x, v.y, v.r);

    if (overlay) overlay(ctx);

    // Paper grain and a soft vignette tie it together like a print.
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = ctx.createPattern(grain, 'repeat');
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(cx, cy, Math.min(width, height) * 0.4, cx, cy, Math.hypot(width, height) * 0.62);
    vg.addColorStop(0, 'rgba(0,18,10,0)');
    vg.addColorStop(1, `rgba(0,18,10,${0.22 + 0.1 * sweep})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  return { setSize, update, warm, draw };
}

function makeGrain() {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 192;
  const g = c.getContext('2d');
  const img = g.createImageData(192, 192);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + Math.random() * 120;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
