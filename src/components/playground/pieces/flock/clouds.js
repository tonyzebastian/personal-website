// Drifting clouds on two layers.
//
// "Low" clouds sit between the ground and the birds: the flock flies over them, and each
// one throws a soft shadow on the ground. "High" clouds sit above the flock, so the birds
// pass behind them (seen faintly through). Clouds come in three looks: detailed cumulus
// (crisp puffs with a shaded underside), blurry banks, and thin wisps. They appear only
// now and then, from seeded bands along the flight path, and move faster than the ground.

const mulberry = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const BAND = 2400; // world units of path per cloud band
const LAYERS = {
  low: { par: 1.25, seed: 101, chance: 0.5, alpha: 0.94 },
  high: { par: 1.75, seed: 202, chance: 0.45, alpha: 0.82 },
};

export function createClouds(heading, light) {
  const HX = Math.sin(heading);
  const HY = -Math.cos(heading);
  const NX = -HY;
  const NY = HX;
  const lx = light[0];
  const ly = light[1];

  let k = 1;
  let res = 1;
  const bands = { low: new Map(), high: new Map() };

  function setSize(kk, dpr) {
    k = kk;
    res = Math.min(dpr, 1.5);
    bands.low.clear();
    bands.high.clear();
  }

  function makeBand(name, b) {
    const L = LAYERS[name];
    const rng = mulberry(L.seed + b * 7919);
    const list = [];
    if (rng() > L.chance) return list;
    const n = rng() < 0.35 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const r = rng();
      const kind = r < 0.4 ? 'detail' : r < 0.8 ? 'blur' : 'wisp';
      const size = kind === 'detail' ? 280 + rng() * 170 : kind === 'blur' ? 450 + rng() * 300 : 600 + rng() * 300;
      list.push({
        id: `${name}${b}.${i}`,
        kind,
        size: size * (i ? 0.6 : 1),
        u: b * BAND + rng() * BAND,
        w: (rng() - 0.5) * 900,
        seed: (b * 31 + i * 17 + L.seed) | 0,
        sprite: null,
        shadow: null,
      });
    }
    return list;
  }

  // ------------------------------------------------------------------ sprites
  const puff = (g, x, y, r, color) => {
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };

  function buildSprite(c) {
    const rng = mulberry(c.seed);
    // Generous margins so soft edges and blurs never hit the canvas border.
    const wU = c.size * (c.kind === 'detail' ? 1.5 : 1.9);
    const hU = c.size * (c.kind === 'detail' ? 0.95 : c.kind === 'blur' ? 1.35 : 0.7);
    const sc = Math.min(k * res, 900 / wU, 700 / hU);
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(wU * sc);
    cv.height = Math.ceil(hU * sc);
    const g = cv.getContext('2d');
    g.scale(sc, sc);
    g.translate(wU / 2, hU / 2);
    const a = c.size * 0.5;
    const b = c.size * 0.2;

    if (c.kind === 'detail') {
      g.filter = `blur(${Math.max(0.8, c.size * 0.004 * sc)}px)`;
      const lobes = [];
      const n = 70 + ((rng() * 25) | 0);
      for (let i = 0; i < n; i++) {
        const t = rng() * Math.PI * 2;
        const q = Math.pow(rng(), 0.6);
        const x = Math.cos(t) * a * q * 0.85;
        const y = Math.sin(t) * b * q;
        lobes.push({ x, y, r: c.size * (0.03 + rng() * 0.06) * (1 - 0.4 * Math.abs(x) / a) });
      }
      lobes.sort((p, q) => p.y - q.y);
      // Shaded underside, then the body, then sunlit tops: soft overlapping puffs.
      lobes.forEach((l) => puff(g, l.x - lx * l.r * 0.2, l.y - ly * l.r * 0.35, l.r, '#b9c6d5'));
      lobes.forEach((l) => puff(g, l.x, l.y, l.r * 0.92, '#e8eef5'));
      lobes.forEach((l) => puff(g, l.x + lx * l.r * 0.22, l.y + ly * l.r * 0.3, l.r * 0.66, '#f8fbfe'));
    } else if (c.kind === 'blur') {
      g.filter = `blur(${Math.max(2, c.size * 0.02 * sc)}px)`;
      const n = 8 + ((rng() * 4) | 0);
      for (let i = 0; i < n; i++) {
        const t = rng() * Math.PI * 2;
        const q = Math.sqrt(rng());
        const x = Math.cos(t) * a * q;
        const y = Math.sin(t) * b * 1.2 * q;
        const r = c.size * (0.16 + rng() * 0.14);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(255,255,255,0.55)');
        gr.addColorStop(0.55, 'rgba(240,246,252,0.3)');
        gr.addColorStop(1, 'rgba(235,243,250,0)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        // A hint of cool shadow beneath each mass.
        const gs = g.createRadialGradient(x - lx * r * 0.2, y - ly * r * 0.35, 0, x - lx * r * 0.2, y - ly * r * 0.35, r * 0.9);
        gs.addColorStop(0, 'rgba(160,178,198,0.16)');
        gs.addColorStop(1, 'rgba(160,178,198,0)');
        g.fillStyle = gs;
        g.beginPath();
        g.arc(x - lx * r * 0.2, y - ly * r * 0.35, r * 0.9, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      g.filter = `blur(${Math.max(1, c.size * 0.006 * sc)}px)`;
      for (let i = 0; i < 12; i++) {
        const x = (rng() - 0.5) * a * 1.3;
        const y = (rng() - 0.5) * b * 1.6;
        const rx = c.size * (0.16 + rng() * 0.28);
        const ry = c.size * (0.012 + rng() * 0.03);
        g.save();
        g.translate(x, y);
        g.rotate((rng() - 0.5) * 0.25);
        g.scale(1, ry / rx);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, 'rgba(255,255,255,0.6)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(0, 0, rx, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }
    return { cv, wU, hU };
  }

  function buildShadow(spr) {
    const cv = document.createElement('canvas');
    cv.width = spr.cv.width;
    cv.height = spr.cv.height;
    const g = cv.getContext('2d');
    g.filter = `blur(${Math.max(2, 7 * k * res)}px)`;
    g.drawImage(spr.cv, 0, 0);
    g.filter = 'none';
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = 'rgb(6,34,26)';
    g.fillRect(0, 0, cv.width, cv.height);
    return { cv, wU: spr.wU, hU: spr.hU };
  }

  function visible(name, dist, W, H) {
    const par = LAYERS[name].par;
    const R = Math.hypot(W, H) / (2 * k) + 700;
    const lo = Math.floor((dist * par - R) / BAND) - 1;
    const hi = Math.floor((dist * par + R) / BAND);
    const store = bands[name];
    const out = [];
    for (let b = lo; b <= hi; b++) {
      if (!store.has(b)) store.set(b, makeBand(name, b));
      for (const c of store.get(b)) out.push(c);
    }
    for (const key of store.keys()) if (key < lo - 2 || key > hi + 2) store.delete(key);
    return out;
  }

  function place(c, name, dist, cx, cy) {
    const u = c.u - dist * LAYERS[name].par;
    return [cx + (HX * u + NX * c.w) * k, cy + (HY * u + NY * c.w) * k];
  }

  function blit(ctx, spr, x, y, sweep, alpha) {
    const w = spr.wU * k;
    const h = spr.hU * k;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    // Stretch along the flight path as the flock speeds up.
    ctx.rotate(heading);
    ctx.scale(1 + sweep * 1.1, 1);
    ctx.rotate(-heading);
    ctx.drawImage(spr.cv, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // `ctx` is expected to be in CSS pixel space.
  function draw(ctx, name, dist, cx, cy, sweep, W, H) {
    const list = visible(name, dist, W, H);
    for (const c of list) {
      const [x, y] = place(c, name, dist, cx, cy);
      const r = c.size * 0.8 * k * (1 + sweep);
      if (x < -r || x > W + r || y < -r || y > H + r) continue;
      if (!c.sprite) c.sprite = buildSprite(c);
      blit(ctx, c.sprite, x, y, sweep, LAYERS[name].alpha);
    }
  }

  // Soft ground shadows of the low clouds.
  function drawShadows(ctx, dist, cx, cy, sweep, W, H) {
    const list = visible('low', dist, W, H);
    for (const c of list) {
      const [x, y] = place(c, 'low', dist, cx, cy);
      const r = c.size * 0.8 * k * (1 + sweep);
      const sx = x - lx * 150 * k;
      const sy = y - ly * 150 * k;
      if (sx < -r || sx > W + r || sy < -r || sy > H + r) continue;
      if (!c.sprite) c.sprite = buildSprite(c);
      if (!c.shadow) c.shadow = buildShadow(c.sprite);
      blit(ctx, c.shadow, sx, sy, sweep, c.kind === 'detail' ? 0.26 : c.kind === 'blur' ? 0.16 : 0.08);
    }
  }

  return { setSize, draw, drawShadows };
}
