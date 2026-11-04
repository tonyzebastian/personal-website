// Water already on a fogged window. The finest beads are drawn by the glass shader; this file
// holds the small drops you can make out one by one. They are placed once and stay put.
// Very rarely one of them grows heavy enough to slide: slowly, in small lurches, collecting
// the drops it touches and leaving a thin clear line that fogs over again.
// Each frame fills `drops` (x, y, radius x, radius y, size) and `wipes` (x, y, radius). Stage units, y up.

export const DROP_STRIDE = 5;
const MAX_SMALL = 2400;
const MAX_SLIDING = 3;
const CELL = 0.02;

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export function createRain() {
  let small = [];
  let sliding = [];
  let key = '';
  let wait = 6;
  const drops = new Float32Array((MAX_SMALL + MAX_SLIDING * 2) * DROP_STRIDE);
  const wipes = new Float32Array(MAX_SLIDING * 3);

  // Scatter the drops once: mostly tiny, a few larger, never overlapping much.
  const place = (values, aspect, lite, seed) => {
    const rand = mulberry32(seed * 104729 + 17);
    const count = Math.min(MAX_SMALL, Math.round((lite ? 700 : 1700) * values.amount * aspect));
    const cols = Math.ceil(aspect / CELL) + 1;
    const grid = new Map();
    small = [];
    for (let tries = 0; tries < count * 4 && small.length < count; tries++) {
      const r = (0.0011 + rand() ** 3.2 * 0.0038) * values.dropSize;
      const x = rand() * aspect;
      const y = rand() * 1.02;
      const cx = Math.floor(x / CELL);
      const cy = Math.floor(y / CELL);
      let clash = false;
      for (let gy = cy - 1; gy <= cy + 1 && !clash; gy++) {
        for (let gx = cx - 1; gx <= cx + 1 && !clash; gx++) {
          for (const o of grid.get(gy * cols + gx) || []) {
            if ((o.x - x) ** 2 + (o.y - y) ** 2 < (o.r + r + 0.0008) ** 2) {
              clash = true;
              break;
            }
          }
        }
      }
      if (clash) continue;
      // Slightly flattened, the way drops sag on vertical glass.
      const d = { x, y, r, ry: r * (1.02 + rand() * 0.12) };
      small.push(d);
      const k = cy * cols + cx;
      (grid.get(k) || grid.set(k, []).get(k)).push(d);
    }
  };

  const update = (dt, values, aspect, lite, seed) => {
    const nextKey = `${seed}|${values.amount.toFixed(2)}|${values.dropSize.toFixed(2)}|${aspect.toFixed(2)}|${lite}`;
    if (nextKey !== key) {
      key = nextKey;
      place(values, aspect, lite, seed);
      sliding = [];
    }

    // Once in a long while (about every 25 s at the default rate) a drop starts to slide.
    wait -= dt * values.slideRate;
    if (wait <= 0 && sliding.length < MAX_SLIDING && small.length) {
      wait = 14 + Math.random() * 26;
      const candidates = small.filter((d) => d.y > 0.35 && d.r > 0.0024 * values.dropSize);
      const start = candidates[Math.floor(Math.random() * candidates.length)];
      if (start) {
        small.splice(small.indexOf(start), 1);
        sliding.push({ x: start.x, y: start.y, r: Math.max(start.r, 0.003 * values.dropSize), v: 0, hold: 0.6 + Math.random(), phase: Math.random() * 6, drift: 0, travelled: 0 });
      }
    }

    let wipeCount = 0;
    for (const s of sliding) {
      s.hold -= dt;
      let target = 0;
      if (s.hold <= 0) {
        s.phase += dt * 1.6;
        target = (0.012 + 0.03 * Math.max(0, Math.sin(s.phase)) ** 2) * values.slideSpeed;
        if (Math.random() < dt * 0.35) s.hold = 0.3 + Math.random() * 1.6;
      }
      s.v += (target - s.v) * Math.min(1, dt * 5);
      if (Math.random() < dt * 0.8) s.drift = (Math.random() - 0.5) * 0.25;
      const step = s.v * dt;
      s.y -= step;
      s.x += step * s.drift;
      s.travelled += step;

      // Touching another drop pulls it in.
      for (let i = small.length - 1; i >= 0; i--) {
        const d = small[i];
        if ((d.x - s.x) ** 2 + (d.y - s.y) ** 2 < (s.r + d.r) ** 2) {
          s.r = Math.min(0.0055 * values.dropSize, Math.sqrt(s.r * s.r + d.r * d.r * 0.7));
          small.splice(i, 1);
        }
      }
      // Now and then a tiny bead is left on the track.
      if (s.travelled > 0.03 + Math.random() * 0.05) {
        s.travelled = 0;
        s.r *= 0.97;
        if (small.length < MAX_SMALL) small.push({ x: s.x + (Math.random() - 0.5) * s.r * 0.4, y: s.y + s.r * 1.4, r: s.r * (0.25 + Math.random() * 0.15), ry: s.r * 0.35 });
      }
      if (s.v > 0.002) wipes.set([s.x, s.y + s.r * 0.4, s.r * 1.15], (wipeCount++) * 3);
    }
    sliding = sliding.filter((s) => s.y > -0.03 && s.r > 0.0015);

    let n = 0;
    for (const d of small) {
      drops.set([d.x, d.y, d.r, d.ry, d.r], n * DROP_STRIDE);
      n++;
    }
    for (const s of sliding) {
      const stretch = 1 + Math.min(0.3, s.v * 8);
      drops.set([s.x, s.y + s.r * 0.8, s.r * 0.5, s.r * 0.65, s.r * 0.6], n * DROP_STRIDE);
      n++;
      drops.set([s.x, s.y, s.r, s.r * stretch, s.r], n * DROP_STRIDE);
      n++;
    }
    return { dropCount: n, wipeCount };
  };

  return { drops, wipes, update };
}
