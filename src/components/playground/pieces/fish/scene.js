// The painted world for A School of Fish, after a gouache illustration:
// bright cyan water deepening to violet, dappled brush marks, rough-edged
// cliffs, colourful swaying plants, bubbles and many kinds of fish. The still
// layers are painted once per size into offscreen canvases; each fish is
// painted once into a few frames of tail beat; each frame then only stacks
// images and draws the plants.

const TAU = Math.PI * 2;
const FRAMES = 16; // tail-beat frames per species
const SPRITE_L = 128; // fish length in sprite pixels
const MARGIN = 24; // painted past the edges so parallax never shows a seam

// Shapes: body height, dorsal and anal fin height, tail size, and size
// relative to the others. Colours: body, the lit back, the shaded belly.
const SPECIES = [
  { name: 'magenta', body: 0.3, dorsal: 0.08, anal: 0.05, tail: 0.28, size: 1, base: '#d8358f', light: '#ff92c9', dark: '#8f1c68' },
  { name: 'violet', body: 0.33, dorsal: 0.1, anal: 0.06, tail: 0.28, size: 1, base: '#6b40d8', light: '#ab8cff', dark: '#3a1f8c' },
  { name: 'gold', body: 0.42, dorsal: 0.1, anal: 0.07, tail: 0.3, size: 0.8, base: '#f7a01e', light: '#ffd86e', dark: '#c4560f' },
  { name: 'coral', body: 0.28, dorsal: 0.07, anal: 0.05, tail: 0.27, size: 0.9, base: '#ee4b5d', light: '#ff9ea6', dark: '#a9213d' },
  { name: 'teal', body: 0.24, dorsal: 0.06, anal: 0.04, tail: 0.26, size: 1.1, base: '#1fa8aa', light: '#86ead9', dark: '#0f6a7a' },
  { name: 'angel', body: 0.62, dorsal: 0.3, anal: 0.26, tail: 0.24, size: 0.9, base: '#ffd23f', light: '#fff2a8', dark: '#e0901a', stripes: '#2a2470' },
  { name: 'needle', body: 0.13, dorsal: 0.04, anal: 0.03, tail: 0.2, size: 1.3, base: '#3d7ff0', light: '#b4e3ff', dark: '#1d4bb0' },
  { name: 'pink', body: 0.26, dorsal: 0.06, anal: 0.04, tail: 0.28, size: 0.7, base: '#ff9fcb', light: '#ffd8ea', dark: '#d65c9c' },
  { name: 'shadow', body: 0.38, dorsal: 0.09, anal: 0.06, tail: 0.29, size: 1.2, base: '#16226b', light: '#2c45a8', dark: '#0b1242' },
];
const FRONT = [0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 7, 8];
const BACK = [1, 7, 8, 8, 6];
const NEAR = [8, 1, 4, 0];

export function pickSpecies(front) {
  const list = front ? FRONT : BACK;
  return list[Math.floor(Math.random() * list.length)];
}

// ---- noise -------------------------------------------------------------

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(i, j, s) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const ease = (t) => t * t * (3 - 2 * t);

function noise(x, y, s) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = ease(x - xi);
  const fy = ease(y - yi);
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(x, y, s, octaves = 4) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    v += amp * noise(x * f, y * f, s + o);
    f *= 2;
    amp *= 0.5;
  }
  return v;
}

// ---- helpers -----------------------------------------------------------

function layer(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function dab(ctx, x, y, r, color, alpha, squash = 1, angle = 0) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * squash, angle, 0, TAU);
  ctx.fill();
}

// Smooth curve through a list of points (already started at pts[0]).
function through(ctx, pts) {
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    ctx.quadraticCurveTo(x, y, (x + pts[i + 1][0]) / 2, (y + pts[i + 1][1]) / 2);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
}

// A painted mass (a cliff, a rock): flat colour, brushy patches of light and
// shade inside, and dabs along the outline so the edge is rough, like gouache.
function mass(ctx, outline, o, rand) {
  const alpha = o.alpha ?? 1;
  const path = new Path2D();
  path.moveTo(outline[0][0], outline[0][1]);
  for (const [x, y] of outline.slice(1)) path.lineTo(x, y);
  path.closePath();

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of outline) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = o.base;
  ctx.fill(path);

  ctx.clip(path);
  // Light falls from the open water: the side facing it is lighter.
  const g = ctx.createLinearGradient(o.lightFrom[0], o.lightFrom[1], o.lightTo[0], o.lightTo[1]);
  g.addColorStop(0, `${o.light}cc`);
  g.addColorStop(0.35, `${o.light}00`);
  g.addColorStop(0.7, `${o.dark}00`);
  g.addColorStop(1, `${o.dark}bb`);
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const count = ((x1 - x0) * (y1 - y0)) / 60;
  for (let i = 0; i < count; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = y0 + rand() * (y1 - y0);
    const n = noise(x * 0.02, y * 0.02, o.seed);
    const color = n > 0.55 ? o.light : n < 0.42 ? o.dark : o.accent || o.base;
    dab(ctx, x, y, 2 + rand() * o.brush, color, (0.12 + rand() * 0.2) * alpha, 0.5 + rand() * 0.5, rand() * TAU);
  }
  ctx.restore();

  // Rough edge.
  ctx.save();
  for (let i = 0; i < outline.length; i++) {
    const [x, y] = outline[i];
    if (rand() < 0.5) continue;
    const r = 1 + rand() * o.brush * 0.45;
    dab(ctx, x + (rand() - 0.5) * 6, y + (rand() - 0.5) * 6, r, rand() < 0.3 ? o.light : o.base, alpha * (0.5 + rand() * 0.5));
  }
  ctx.restore();
}

// Outline of a cliff hugging the left or right edge. `reach(f)` gives how far
// in it comes at height fraction f.
function cliffOutline(W, H, side, reach, seed) {
  const m = MARGIN;
  const pts = [];
  for (let y = -m; y <= H + m; y += 4) {
    const f = y / H;
    const n = fbm(y * 0.006, seed, seed, 5) - 0.5;
    const rough = (noise(y * 0.15, seed + 3, seed) - 0.5) * 6;
    const d = W * reach(f) + W * 0.12 * n + rough;
    pts.push([side < 0 ? d : W - d, y]);
  }
  const edge = side < 0 ? -m : W + m;
  return [[edge, -m], ...pts, [edge, H + m]];
}

function groundOutline(W, H, base, amp, freq, seed) {
  const m = MARGIN;
  const pts = [[-m, H + m]];
  for (let x = -m; x <= W + m; x += 4) {
    const rough = (noise(x * 0.15, seed + 5, seed) - 0.5) * 6;
    pts.push([x, base(x) - amp * fbm(x * freq, seed, seed, 5) + rough]);
  }
  pts.push([W + m, H + m]);
  return pts;
}

// ---- plants --------------------------------------------------------------

// One stalk that bends more toward its tip, carrying leaves of a given shape:
// 'round' (vine coins), 'paddle' (gouache coral) or 'blade' (fern).
function plant(ctx, p, t) {
  const step = p.height / p.segs;
  let x = p.x;
  let y = p.base;
  const pts = [[x, y, -Math.PI / 2]];
  for (let i = 1; i <= p.segs; i++) {
    const f = i / p.segs;
    const a = -Math.PI / 2 + p.lean * f + Math.sin(t * 0.6 + p.phase + i * 0.35) * p.sway * f;
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    pts.push([x, y, a]);
  }

  ctx.globalAlpha = p.alpha;
  ctx.strokeStyle = p.stem;
  ctx.lineWidth = p.stemWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  through(ctx, pts);
  ctx.stroke();

  for (let i = 1; i <= p.segs; i++) {
    const [lx, ly, la] = pts[i];
    const f = i / p.segs;
    const color = p.colors[(i * 7 + p.tone) % p.colors.length];
    const flutter = Math.sin(t * 1.3 + i * 1.7 + p.phase) * 0.15;
    if (p.leaf === 'round') {
      const side = i % 2 ? 1 : -1;
      const r = p.size * (1 - f * 0.35);
      const d = la + side * 1.2 + flutter;
      dab(ctx, lx + Math.cos(d) * r * 1.2, ly + Math.sin(d) * r * 1.2, r, color, p.alpha);
      dab(ctx, lx + Math.cos(d) * r, ly + Math.sin(d) * r - r * 0.3, r * 0.45, p.highlight, p.alpha * 0.5);
    } else if (p.leaf === 'paddle') {
      for (const side of [-1, 1]) {
        const d = la + side * 0.5 + flutter;
        const r = p.size * (1.1 - f * 0.4);
        const cx = lx + Math.cos(d) * r * 1.1;
        const cy = ly + Math.sin(d) * r * 1.1;
        dab(ctx, cx, cy, r, color, p.alpha, 0.55, d);
        dab(ctx, cx - r * 0.15, cy - r * 0.2, r * 0.5, p.highlight, p.alpha * 0.45, 0.55, d);
      }
    } else {
      const side = i % 2 ? 1 : -1;
      const len = p.size * (1.05 - f * 0.5);
      const d = la + side * (0.7 + flutter);
      const tx = lx + Math.cos(d) * len;
      const ty = ly + Math.sin(d) * len;
      const mx = (lx + tx) / 2;
      const my = (ly + ty) / 2;
      const nx = -Math.sin(d) * len * 0.3;
      const ny = Math.cos(d) * len * 0.3;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(mx + nx, my + ny, tx, ty);
      ctx.quadraticCurveTo(mx - nx * 0.5, my - ny * 0.5, lx, ly);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// A bush: several stalks from one root, fanned out.
function bush(x, base, o, rand) {
  return Array.from({ length: o.stalks }, (_, i) => ({
    ...o,
    x: x + (rand() - 0.5) * o.spread * 0.3,
    base,
    lean: (i / Math.max(1, o.stalks - 1) - 0.5) * o.spread * 0.02 + (rand() - 0.5) * 0.2,
    height: o.height * (0.6 + rand() * 0.5),
    phase: rand() * TAU,
    tone: i,
  }));
}

// ---- fish ----------------------------------------------------------------

// Fish outline facing +x, centred on the origin, tail bent by `phase`. The
// outline wobbles a little, the same in every frame, like a drawn line.
function fishPaths(L, sp, phase, seed) {
  const bodyLen = L * 0.7;
  const xh = L * 0.48;
  const H = sp.body * L * 0.5;
  const T = sp.tail * L;
  const A = 0.05 * L;
  const N = 16;
  const top = [];
  const bot = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = xh - t * bodyLen;
    const c = A * t * t * Math.sin(phase - t * 2.4);
    const h = H * Math.pow(Math.sin(Math.PI * 0.92 * Math.pow(t, 0.62)), 0.7);
    const wobTop = 1 + (noise(i * 0.9, 1, seed) - 0.5) * 0.12;
    const wobBot = 1 + (noise(i * 0.9, 2, seed) - 0.5) * 0.12;
    top.push([x, c - h * wobTop]);
    bot.push([x, c + h * wobBot]);
  }
  const xt = xh - bodyLen;
  const c1 = (top[N][1] + bot[N][1]) / 2;
  const sw = 0.1 * L * Math.sin(phase - 2.9);

  const body = new Path2D();
  body.moveTo(top[0][0], top[0][1]);
  through(body, top);
  body.quadraticCurveTo(xt - T * 0.35, c1 - T * 0.2 + sw * 0.5, xt - T, c1 - T * 0.72 + sw);
  body.quadraticCurveTo(xt - T * 0.72, c1 - T * 0.2 + sw, xt - T * 0.58, c1 + sw * 0.8);
  body.quadraticCurveTo(xt - T * 0.72, c1 + T * 0.2 + sw, xt - T, c1 + T * 0.72 + sw);
  body.quadraticCurveTo(xt - T * 0.35, c1 + T * 0.2 + sw * 0.5, bot[N][0], bot[N][1]);
  through(body, [...bot].reverse());
  body.closePath();

  const fin = (path, pts, a, b, height, dir) => {
    const mid = Math.round((a + b) / 2);
    path.moveTo(pts[a][0], pts[a][1]);
    path.quadraticCurveTo(pts[mid][0] + L * 0.04, pts[mid][1] + dir * height * 1.2, pts[b][0] - L * 0.05, pts[b][1] + dir * height);
    path.lineTo(pts[b][0], pts[b][1]);
    path.closePath();
  };
  const fins = new Path2D();
  fin(fins, top, 4, 10, sp.dorsal * L, -1);
  fin(fins, bot, 8, 12, sp.anal * L, 1);
  const px = top[3][0];
  const py = (top[3][1] + bot[3][1]) / 2 + H * 0.2;
  fins.moveTo(px, py);
  fins.quadraticCurveTo(px - L * 0.06, py + H * 0.35 + sw * 0.1, px - L * 0.12, py + H * 0.5);
  fins.quadraticCurveTo(px - L * 0.05, py + H * 0.1, px, py);

  return { body, fins, H, top, bot };
}

function paintFish(ctx, L, sp, phase, seed) {
  const { body, fins, H, top, bot } = fishPaths(L, sp, phase, seed);
  const rand = rng(seed);

  ctx.fillStyle = sp.dark;
  ctx.globalAlpha = 0.9;
  ctx.fill(fins);
  ctx.globalAlpha = 1;
  ctx.fillStyle = sp.base;
  ctx.fill(body);

  ctx.save();
  ctx.clip(body);
  // Lit back and shaded belly, laid in with brush dabs.
  for (let i = 0; i < 70; i++) {
    const x = -L * 0.5 + rand() * L;
    const y = -H * 1.1 + rand() * H * 2.2;
    const up = y < -H * 0.15;
    const down = y > H * 0.35;
    if (!up && !down && rand() < 0.7) continue;
    dab(ctx, x, y, L * (0.025 + rand() * 0.05), up ? sp.light : down ? sp.dark : sp.base, 0.35 + rand() * 0.35, 0.6, rand());
  }
  if (sp.stripes) {
    for (const s of [0.22, 0.5]) {
      const i = Math.round(s * 16);
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = sp.stripes;
      ctx.lineWidth = L * 0.07;
      ctx.beginPath();
      ctx.moveTo(top[i][0], top[i][1] - L * 0.05);
      ctx.lineTo(bot[i][0] - L * 0.02, bot[i][1] + L * 0.05);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Rough edge: a few dabs straying past the outline.
  for (let i = 1; i < top.length - 2; i++) {
    for (const [pts, color] of [
      [top, sp.light],
      [bot, sp.dark],
    ]) {
      if (rand() < 0.5) continue;
      dab(ctx, pts[i][0], pts[i][1], L * (0.008 + rand() * 0.014), color, 0.8);
    }
  }
  ctx.globalAlpha = 1;
}

// Every species in every tail position, sharp and slightly soft (for the
// big fish passing close to the glass).
function paintSprites() {
  const L = SPRITE_L;
  const w = Math.ceil(L * 1.14);
  const h = Math.ceil(L * 1.1);
  const ox = L * 0.57;
  const oy = L * 0.55;
  return SPECIES.map((sp, index) => {
    const frames = Array.from({ length: FRAMES }, (_, f) => {
      const sharp = layer(w, h);
      const ctx = sharp.getContext('2d');
      ctx.translate(ox, oy);
      paintFish(ctx, L, sp, (f / FRAMES) * TAU, 101 + index * 17);

      const tiny = layer(w / 2.5, h / 2.5);
      const tctx = tiny.getContext('2d');
      tctx.imageSmoothingQuality = 'high';
      tctx.drawImage(sharp, 0, 0, tiny.width, tiny.height);
      const soft = layer(w, h);
      const sctx = soft.getContext('2d');
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(tiny, 0, 0, w, h);
      return { sharp, soft };
    });
    return { frames, w, h, ox, oy, size: sp.size };
  });
}

function bubbleSprite() {
  const s = 64;
  const c = layer(s, s);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s * 0.5, s * 0.5, s * 0.1, s * 0.5, s * 0.5, s * 0.48);
  g.addColorStop(0, 'rgba(190,240,255,0.15)');
  g.addColorStop(0.8, 'rgba(210,248,255,0.4)');
  g.addColorStop(1, 'rgba(230,252,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.48, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.ellipse(s * 0.36, s * 0.34, s * 0.1, s * 0.07, -0.6, 0, TAU);
  ctx.fill();
  return c;
}

// ---- still layers ------------------------------------------------------

function paintBack(ctx, W, H, rand) {
  const m = MARGIN;
  const LW = W + 2 * m;
  const LH = H + 2 * m;

  // The base wash, painted small and scaled up so every edge bleeds.
  const s = 0.2;
  const lo = layer(LW * s, LH * s);
  const l = lo.getContext('2d');
  l.setTransform(s, 0, 0, s, m * s, m * s);
  const g = l.createLinearGradient(0, -m, 0, H + m);
  g.addColorStop(0, '#d8fbff');
  g.addColorStop(0.14, '#5fd6f5');
  g.addColorStop(0.4, '#2c97e8');
  g.addColorStop(0.7, '#2753cf');
  g.addColorStop(1, '#2d1d92');
  l.fillStyle = g;
  l.fillRect(-m, -m, LW, LH);
  const blooms = ['#46c7f0', '#2a6fe0', '#5b3fd0', '#1fb8d8', '#7c4fe0', '#c25bd8'];
  for (let i = 0; i < 40; i++) {
    const x = -m + rand() * LW;
    const y = -m + rand() * LH;
    const r = (0.06 + rand() * 0.2) * Math.max(W, H);
    const c = blooms[Math.floor(rand() * blooms.length)];
    const rg = l.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `${c}40`);
    rg.addColorStop(1, `${c}00`);
    l.fillStyle = rg;
    l.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // Light shafts.
  l.globalCompositeOperation = 'screen';
  const sx = W * 0.45;
  const sy = -H * 0.35;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI / 2 + (rand() - 0.5) * 0.7;
    const spread = 0.015 + rand() * 0.04;
    const len = H * 2.2;
    const rg = l.createLinearGradient(0, 0, 0, H);
    rg.addColorStop(0, `rgba(220,252,255,${0.15 + rand() * 0.2})`);
    rg.addColorStop(1, 'rgba(220,252,255,0)');
    l.fillStyle = rg;
    l.beginPath();
    l.moveTo(sx, sy);
    l.lineTo(sx + Math.cos(a - spread) * len, sy + Math.sin(a - spread) * len);
    l.lineTo(sx + Math.cos(a + spread) * len, sy + Math.sin(a + spread) * len);
    l.closePath();
    l.fill();
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(lo, -m, -m, LW, LH);

  // Dappled brushwork over the whole wash: bright dabs near the surface,
  // blue and violet ones deeper down.
  const count = (LW * LH) / 420;
  for (let i = 0; i < count; i++) {
    const x = -m + rand() * LW;
    const y = -m + Math.pow(rand(), 1.3) * LH;
    const depth = y / H;
    const n = noise(x * 0.01, y * 0.01, 9);
    let color;
    let alpha;
    if (depth < 0.3 && rand() < (0.3 - depth) * 3) {
      color = rand() < 0.6 ? '#ffffff' : '#c8f6ff';
      alpha = 0.25 + rand() * 0.45;
    } else {
      color = n > 0.55 ? '#5fd0f5' : n < 0.4 ? '#2b45c0' : depth > 0.6 ? '#4a35b8' : '#3a8fe6';
      alpha = 0.06 + rand() * 0.12;
    }
    const r = depth < 0.3 ? 2 + rand() * 6 : 6 + rand() * 16;
    dab(ctx, x, y, r, color, alpha, 0.35 + rand() * 0.5, rand() * TAU);
  }
  // Surface ripples: bright broken arcs.
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const cx = W * (0.1 + rand() * 0.6);
    const cy = -H * 0.1 + rand() * H * 0.15;
    const r = W * (0.08 + rand() * 0.25);
    const a0 = 0.2 + rand() * 1.2;
    ctx.globalAlpha = 0.35 + rand() * 0.4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 + rand() * 8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.35, 0, a0, a0 + 0.4 + rand() * 0.8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Far cliffs, hazy blue-violet.
  mass(ctx, cliffOutline(W, H, -1, (f) => 0.04 + 0.22 * ease(Math.min(1, Math.max(0, (f - 0.25) / 0.75))), 13), {
    base: '#3d62cf', light: '#5f92ea', dark: '#3445b6', alpha: 0.7, brush: 8, seed: 13,
    lightFrom: [W * 0.3, 0], lightTo: [0, H],
  }, rand);
  mass(ctx, groundOutline(W, H, () => H * 0.88, H * 0.16, 0.004, 17), {
    base: '#3a4fc4', light: '#5a86e6', dark: '#33389e', alpha: 0.7, brush: 8, seed: 17,
    lightFrom: [0, H * 0.7], lightTo: [0, H],
  }, rand);
}

function paintMid(ctx, W, H, rand) {
  const m = MARGIN;
  // A veil of water between the far school and everything nearer.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(120,220,250,0.08)');
  g.addColorStop(1, 'rgba(60,70,200,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(-m, -m, W + 2 * m, H + 2 * m);

  const right = cliffOutline(W, H, 1, (f) => 0.03 + 0.3 * ease(Math.min(1, Math.max(0, (f - 0.05) / 0.8))), 29);
  mass(ctx, right, {
    base: '#2c3aa8', light: '#4a74e0', dark: '#241c78', accent: '#3a2c9c', brush: 10, seed: 29,
    lightFrom: [W * 0.6, 0], lightTo: [W, H],
  }, rand);
  const left = cliffOutline(W, H, -1, (f) => 0.02 + 0.2 * ease(Math.min(1, Math.max(0, (f - 0.45) / 0.55))), 31);
  mass(ctx, left, {
    base: '#33339e', light: '#5468d6', dark: '#26196e', accent: '#45309a', brush: 10, seed: 31,
    lightFrom: [W * 0.25, H * 0.4], lightTo: [0, H],
  }, rand);
  // The cliffs' inner edge, for rooting plants.
  const edgeAt = (outline, y) => {
    let best = outline[1];
    for (const p of outline) if (Math.abs(p[1] - y) < Math.abs(best[1] - y)) best = p;
    return best[0];
  };
  return { right: (y) => edgeAt(right, y), left: (y) => edgeAt(left, y) };
}

function paintFront(ctx, W, H, rand) {
  const m = MARGIN;
  const side = (x, from, width, rise) => rise * Math.pow(Math.max(0, 1 - Math.abs(x - from) / width), 1.6);
  mass(ctx, groundOutline(W, H, (x) => H + 6 - Math.max(side(x, -m, W * 0.36, H * 0.3), side(x, W + m, W * 0.42, H * 0.36)), H * 0.06, 0.012, 37), {
    base: '#3a1f78', light: '#7a3fb0', dark: '#1f1050', accent: '#5a2a8a', brush: 9, seed: 37,
    lightFrom: [0, H * 0.6], lightTo: [0, H],
  }, rand);

  const v = ctx.createRadialGradient(W / 2, H * 0.4, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.8);
  v.addColorStop(0, 'rgba(40,20,120,0)');
  v.addColorStop(1, 'rgba(40,20,120,0.4)');
  ctx.fillStyle = v;
  ctx.fillRect(-m, -m, W + 2 * m, H + 2 * m);
}

// ---- the scene -----------------------------------------------------------

export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  const sprites = paintSprites();
  const bubble = bubbleSprite();

  let W = 0;
  let H = 0;
  let dpr = 1;
  let layers = null;
  let midPlants = [];
  let frontPlants = [];
  let rays = [];
  let motes = [];
  const near = [0, 1].map((i) => ({ active: false, wait: 3 + i * 6 }));

  function bake(w, h, ratio) {
    W = w;
    H = h;
    dpr = ratio;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if (!W || !H) return;

    const rand = rng(1907);
    const make = (paint) => {
      const c = layer((W + 2 * MARGIN) * dpr, (H + 2 * MARGIN) * dpr);
      const lctx = c.getContext('2d');
      lctx.setTransform(dpr, 0, 0, dpr, MARGIN * dpr, MARGIN * dpr);
      return { c, out: paint(lctx) };
    };
    const back = make((l) => paintBack(l, W, H, rand));
    const mid = make((l) => paintMid(l, W, H, rand));
    const front = make((l) => paintFront(l, W, H, rand));
    layers = { back: back.c, mid: mid.c, front: front.c };
    const edges = mid.out;

    // Coin vines trailing up the cliffs.
    midPlants = [];
    for (const [f, side] of [
      [0.35, 1],
      [0.5, 1],
      [0.68, 1],
      [0.8, -1],
    ]) {
      const y = H * f;
      midPlants.push({
        x: (side > 0 ? edges.right(y) : edges.left(y)) - side * 4,
        base: y + H * 0.15,
        height: H * (0.28 + rand() * 0.15),
        segs: 12,
        leaf: 'round',
        size: H * 0.022,
        lean: -side * 0.4,
        sway: 0.25,
        phase: rand() * TAU,
        tone: Math.floor(rand() * 4),
        alpha: 0.9,
        stem: '#1d6a6a',
        stemWidth: 1.2,
        colors: ['#3fbf8f', '#2fa6a0', '#6fd38a', '#2d8fb0'],
        highlight: '#c8f7b0',
      });
    }
    const size = Math.min(W, H);
    frontPlants = [
      ...bush(W * 0.07, H + 10, {
        stalks: 6, spread: 34, height: H * 0.4, segs: 8, leaf: 'paddle', size: size * 0.04,
        sway: 0.15, alpha: 0.95, stem: '#a5481c', stemWidth: 2,
        colors: ['#f08a2a', '#f7b33a', '#e8662a', '#ffcf5a'], highlight: '#ffe9a6',
      }, rand),
      ...bush(W * 0.2, H + 14, {
        stalks: 4, spread: 24, height: H * 0.26, segs: 7, leaf: 'paddle', size: size * 0.032,
        sway: 0.18, alpha: 0.95, stem: '#b0402a', stemWidth: 1.6,
        colors: ['#f26b6b', '#f59a5a', '#ffbf6a'], highlight: '#ffe0b0',
      }, rand),
      ...bush(W * 0.86, H + 10, {
        stalks: 6, spread: 34, height: H * 0.38, segs: 11, leaf: 'blade', size: size * 0.08,
        sway: 0.2, alpha: 0.95, stem: '#8f1a3a', stemWidth: 2,
        colors: ['#ff3d6e', '#e0245a', '#ff6f8f', '#c21d50'], highlight: '#ffc0d0',
      }, rand),
    ];
    rays = Array.from({ length: 4 }, () => ({
      x: 0.25 + rand() * 0.45,
      a: (rand() - 0.5) * 0.5,
      w: W * (0.03 + rand() * 0.06),
      speed: 0.15 + rand() * 0.2,
      phase: rand() * TAU,
      alpha: 0.06 + rand() * 0.07,
    }));
    const count = Math.round(Math.min(120, (W * H) / 4000));
    motes = Array.from({ length: count }, () => {
      const z = rand();
      return {
        x: rand() * W,
        y: rand() * H,
        z,
        vx: 0,
        vy: 0,
        r: z < 0.75 ? 0.8 + z * 1.6 : 3 + (z - 0.75) * 40,
        phase: rand() * TAU,
      };
    });
  }

  function drawLayer(c, dx, dy) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c, (dx - MARGIN) * dpr, (dy - MARGIN) * dpr);
  }

  function drawFish(f, x, y, angle, length, alpha, soft) {
    const sp = sprites[f.species];
    const frame = sp.frames[Math.floor(((((f.phase % TAU) + TAU) % TAU) / TAU) * FRAMES) % FRAMES];
    const s = (length * sp.size) / SPRITE_L;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const flip = cos < 0 ? -1 : 1; // keep the back up when swimming left
    ctx.globalAlpha = alpha;
    ctx.setTransform(dpr * cos * s, dpr * sin * s, -dpr * sin * s * flip, dpr * cos * s * flip, dpr * x, dpr * y);
    ctx.drawImage(soft ? frame.soft : frame.sharp, -sp.ox, -sp.oy);
  }

  function drawMotes(front, k, t, px, py) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const p of motes) {
      if (p.z >= 0.75 !== front) continue;
      p.x += (Math.sin(t * 0.5 + p.phase) * 0.08 + p.vx) * k;
      p.y += (-(0.05 + p.z * 0.25) + p.vy) * k;
      p.vx *= 0.97 ** k;
      p.vy *= 0.97 ** k;
      if (p.y < -30) {
        p.y = H + 30;
        p.x = Math.random() * W;
      }
      if (p.x < -30) p.x = W + 30;
      if (p.x > W + 30) p.x = -30;
      const shift = (p.z - 0.5) * 30;
      const x = p.x - px * shift;
      const y = p.y - py * shift * 0.5;
      if (front) {
        ctx.globalAlpha = 0.85;
        ctx.drawImage(bubble, x - p.r, y - p.r, p.r * 2, p.r * 2);
      } else {
        ctx.globalAlpha = 0.35 + p.z * 0.5;
        ctx.fillStyle = '#e8fbff';
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawRays(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 1;
    for (const r of rays) {
      const sway = Math.sin(t * r.speed + r.phase);
      const x = W * r.x + sway * W * 0.04;
      const reach = Math.cos(Math.PI / 2 + r.a + sway * 0.04) * H * 1.3;
      const alpha = r.alpha * (0.55 + 0.45 * Math.sin(t * r.speed * 1.7 + r.phase * 2));
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.9);
      g.addColorStop(0, `rgba(225,252,255,${alpha})`);
      g.addColorStop(1, 'rgba(225,252,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - r.w * 0.3, -4);
      ctx.lineTo(x + r.w * 0.3, -4);
      ctx.lineTo(x + reach + r.w, H * 1.1);
      ctx.lineTo(x + reach - r.w, H * 1.1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // Big fish that now and then glide past close to the glass.
  function drawNear(k, t, px, py) {
    const size = Math.min(W, H);
    for (const n of near) {
      if (!n.active) {
        n.wait -= k / 120;
        if (n.wait > 0) continue;
        n.active = true;
        n.dir = Math.random() < 0.5 ? 1 : -1;
        n.length = size * (0.16 + Math.random() * 0.06);
        n.x = n.dir > 0 ? -n.length : W + n.length;
        n.y = H * (0.15 + Math.random() * 0.7);
        n.speed = 0.3 + Math.random() * 0.2;
        n.species = NEAR[Math.floor(Math.random() * NEAR.length)];
        n.phase = 0;
      }
      n.x += n.dir * n.speed * k;
      n.phase += 0.035 * k;
      const angle = (n.dir > 0 ? 0 : Math.PI) + Math.sin(t * 0.6 + n.y) * 0.05;
      drawFish(n, n.x + px * 24, n.y + py * 12 + Math.sin(t * 0.8 + n.y) * 4, angle, n.length, 1, true);
      if ((n.dir > 0 && n.x > W + n.length * 1.5) || (n.dir < 0 && n.x < -n.length * 1.5)) {
        n.active = false;
        n.wait = 6 + Math.random() * 10;
      }
    }
  }

  return {
    resize: bake,

    disturb(x, y) {
      for (const p of motes) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 160) {
          const push = (1 - d / 160) * 1.6;
          p.vx += (dx / d) * push;
          p.vy += (dy / d) * push;
        }
      }
    },

    // k: how many 120fps frames passed; t: seconds; px, py: pointer from
    // the centre (-0.5 to 0.5), for a little parallax between layers.
    draw({ k, t, px, py, front, back }) {
      if (!layers) return;
      const size = Math.min(W, H);
      const mainLength = Math.min(60, Math.max(30, size * 0.11));

      drawLayer(layers.back, -px * 10, -py * 5);
      for (const f of back) {
        drawFish(f, f.x - px * 8, f.y - py * 4, f.currentAngle, mainLength * f.scale * 0.5, 0.35 + f.z * 0.2, false);
      }
      drawLayer(layers.mid, -px * 6, -py * 3);
      ctx.setTransform(dpr, 0, 0, dpr, -px * 6 * dpr, -py * 3 * dpr);
      for (const p of midPlants) plant(ctx, p, t);
      drawMotes(false, k, t, px, py);
      for (const f of front) {
        drawFish(f, f.x, f.y, f.currentAngle, mainLength * f.scale, 0.9 + f.z * 0.1, false);
      }
      drawRays(t);
      ctx.setTransform(dpr, 0, 0, dpr, px * 14 * dpr, py * 7 * dpr);
      for (const p of frontPlants) plant(ctx, p, t);
      drawLayer(layers.front, px * 14, py * 7);
      drawNear(k, t, px, py);
      drawMotes(true, k, t, px, py);
      ctx.globalAlpha = 1;
    },
  };
}
