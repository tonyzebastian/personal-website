// The street behind the glass: from a skywalk across the road we look down the
// street. Buildings line both sides, the road runs up the frame and vanishes into a hazy city
// of towers. Two lanes each way: oncoming cars pass under us and leave through the bottom
// left, departing cars appear at the bottom right and drive away. People walk the pavements.
//
// A plain pinhole camera: `d` is metres ahead, `side` metres to the right (negative = left),
// `height` metres up. Each frame `update` fills `lights` (stage units, y up) and packs the
// buildings, vehicles, people, trees and lamp pools the scene shader draws. Lights behind a
// body are dimmed by how much of them the body covers.

// x, y, radius, intensity | r, g, b, kind + seed | motion x, motion y, reflection length, 0
// kind: 0 light, 1 road reflection, 2 headlight beam on the road (motion = the beam's
// direction and length, reflection length = its width where it starts).
// The seed (0..1) gives each light its own shape.
export const LIGHT_STRIDE = 12;
export const MAX_LIGHTS = 480;
export const MAX_BUILDINGS = 30;
export const BUILDING_STRIDE = 12;
export const MAX_VEHICLES = 24;
export const VEHICLE_STRIDE = 12;
export const MAX_PEOPLE = 16;
export const PERSON_STRIDE = 8;
export const MAX_POOLS = 12;
export const MAX_GLARE = 2;
export const MAX_TREES = 8;
export const TREE_STRIDE = 8;

// Camera: focal length (stage heights per unit of side/d) and eye height in metres. The
// skywalk is about 7 m up; the horizon sits high in the frame, so we look down onto the road.
export const FOCAL = 0.5;
export const EYE = 7;
export const HORIZON = 0.64;
// Half the road's width, kerb to kerb.
export const ROAD = 7;
const FAR = 260;

const WHITE_LED = [0.86, 0.92, 1];
// Headlights: a warm white, some more yellow (older halogen bulbs).
const HEAD_WARM = [1, 0.88, 0.64];
const HEAD_YELLOW = [1, 0.78, 0.46];
const TAIL = [1, 0.08, 0.04];
const BRAKE = [1, 0.06, 0.03];
const SODIUM = [1, 0.5, 0.16];
const MARKER = [1, 0.55, 0.12];
const BEACON = [1, 0.08, 0.05];
const HAZARD = [1, 0.5, 0.05];
const SIGNAL = { green: [0.2, 1, 0.62], amber: [1, 0.6, 0.1], red: [1, 0.1, 0.07] };
const SIGN_COLORS = [[1, 0.2, 0.55], [0.2, 0.75, 1], [1, 0.62, 0.15], [0.35, 1, 0.55], [0.8, 0.35, 1]];

// Vehicle sizes in metres: length, width, height.
const BODY = { car: [4.4, 1.8, 1.45], bus: [12, 2.5, 3.1], truck: [11, 2.5, 3.6], bike: [2, 0.7, 1.4] };
const VEHICLE_TYPE = { car: 0, bus: 1, truck: 2, bike: 3 };
const PAINTS = 7; // the shader holds the paint colours

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Smooth 1D noise, 0..1, for flickers that never repeat on a beat.
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise = (t) => {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
};

export function project(d, side, height, aspect) {
  const dd = Math.max(d, 0.5);
  return {
    x: aspect * 0.5 + (side * FOCAL) / dd,
    y: HORIZON + ((height - EYE) * FOCAL) / dd,
    // How big things look, for light sizes and fading (1 at about 8 m).
    scale: Math.min(1.6, 8 / dd),
  };
}

// Light cycle in seconds.
const GREEN = 11;
const AMBER = 2.5;
// Each direction has its own signal, half a cycle apart: one moves while the other waits.
const RED = GREEN + AMBER;
const CYCLE = GREEN + AMBER + RED;
const SIGNAL_D = 30;

export function createStreet() {
  const lights = new Float32Array(MAX_LIGHTS * LIGHT_STRIDE);
  const buildingData = new Float32Array(MAX_BUILDINGS * BUILDING_STRIDE);
  const vehicleData = new Float32Array(MAX_VEHICLES * VEHICLE_STRIDE);
  const peopleData = new Float32Array(MAX_PEOPLE * PERSON_STRIDE);
  const poolData = new Float32Array(MAX_POOLS * 8);
  const glareData = new Float32Array(MAX_GLARE * 8);
  const treeData = new Float32Array(MAX_TREES * TREE_STRIDE);
  let count = 0;
  let key = '';
  let rand = Math.random;
  let fixed = [];
  let buildings = [];
  let trees = [];
  let parked = [];
  let pools = [];
  let glare = [];
  let occluders = [];
  let cars = [];
  let people = [];
  let peopleTimer = 1;
  let lanes = [];
  let clock = 0;
  let aspect = 0.8;
  let shutter = 0;

  // How much of a light at `depth` is still visible past the bodies in front of it.
  const visible = (x, y, r, depth, owner) => {
    let v = 1;
    for (const o of occluders) {
      if (o.depth >= depth || o.owner === owner) continue;
      if (x < o.x0 - r || x > o.x1 + r || y < o.y0 - r || y > o.y1 + r) continue;
      const inside = Math.min(x - o.x0, o.x1 - x, y - o.y0, o.y1 - y);
      v *= 1 - Math.min(1, Math.max(0, 0.5 + inside / (r * 1.2))) * o.opacity;
    }
    return v;
  };

  const add = (x, y, r, intensity, c, kind = 0, seed = 0, mx = 0, my = 0, len = 0, depth = 0, owner = null) => {
    if (count >= MAX_LIGHTS || intensity <= 0.002) return;
    if (x < -0.3 || x > aspect + 0.3 || y < -0.3 || y > 1.3) return;
    const k = depth > 0 ? visible(x, y, r, depth, owner) : 1;
    if (intensity * k <= 0.002) return;
    lights.set([x, y, r, intensity * k, c[0], c[1], c[2], kind + seed * 0.98, mx, my, len, 0], count * LIGHT_STRIDE);
    count++;
  };

  // A light over the wet street also gets a long reflection under it. `motion` is how far it
  // moves (metres ahead, metres sideways) while the shutter is open.
  const addWithReflection = (d, side, height, r, intensity, c, wet = 0.45, seed = 0, motion = null, owner = null) => {
    if (d < 1) return;
    const p = project(d, side, height, aspect);
    const m = motion ? project(d + motion[0], side + motion[1], height, aspect) : p;
    // Distant lights are dimmer; out-of-focus lights are a similar size, a little larger up close.
    const fade = Math.min(1, 0.06 + p.scale * p.scale * 2);
    const radius = r * (0.8 + 0.22 * Math.min(1, p.scale));
    add(p.x, p.y, radius, intensity * fade, c, 0, seed, m.x - p.x, m.y - p.y, 0, d, owner);
    if (wet > 0) {
      const q = project(d, side, -height, aspect);
      const qm = motion ? project(d + motion[0], side + motion[1], -height, aspect) : q;
      // Higher lights throw longer streaks; the wet road breaks each one up differently.
      const rs = (seed * 7.31) % 1;
      const len = Math.min(13, (2.2 + height * 0.85) * (0.5 + rs * 1.1));
      add(q.x, q.y, radius, intensity * fade * wet, c, 1, rs, qm.x - q.x, qm.y - q.y, len, d, owner);
    }
  };

  const layout = (seed) => {
    rand = mulberry32(seed * 7919);
    const r = rand;

    // Both sides of the street: a mix of flats, offices, older narrow-windowed buildings and
    // glass, set back by different amounts so their end walls show.
    buildings = [];
    for (const sign of [-1, 1]) {
      let d = 3;
      let n = 0;
      while (d < FAR && n < MAX_BUILDINGS / 2) {
        const len = 7 + r() * 15;
        const tall = r() < 0.18;
        const t = r();
        buildings.push({
          side: sign * (ROAD + 3.4 + r() * 2.4),
          d0: d, d1: d + len,
          height: tall ? 32 + r() * 40 : 9 + r() * 20,
          floorH: 2.9 + r() * 0.9, colW: 1.8 + r() * 2.2,
          lit: 0.15 + r() ** 1.2 * 0.55, warmth: r(),
          shop: r() < 0.7 ? 1 + Math.floor(r() * 4) : 0,
          type: t < 0.42 ? 0 : t < 0.62 ? 1 : t < 0.9 ? 2 : 3,
          tone: 0.6 + r() * 0.8,
          depth: 10 + r() * 12,
          // A few facades are washed with warm light from the street below.
          wash: r() < 0.16 ? 0.6 + r() * 0.6 : 0,
          sign: r() < 0.35 ? Math.floor(r() * SIGN_COLORS.length) + 1 : 0,
        });
        d += len + (r() < 0.2 ? 3 + r() * 10 : 0.2);
        n++;
      }
    }

    // Trees and parked cars along both pavements.
    trees = [];
    for (const sign of [-1, 1]) {
      for (let td = 9 + r() * 6; td < 90 && trees.length < MAX_TREES; td += 16 + r() * 18) {
        if (r() < 0.3) continue;
        trees.push({ d: td, side: sign * (ROAD + 1.2 + r() * 0.6), trunk: 2.6 + r() * 1.2, canopy: 2 + r() * 1.6, seed: r() * 50 });
      }
    }
    parked = [];
    for (const sign of [-1, 1]) {
      for (let pd = 12 + r() * 6; pd < 80; pd += 7 + r() * 14) {
        if (r() < 0.4) continue;
        parked.push({ kind: r() < 0.1 ? 'truck' : 'car', d: pd, side: sign * (ROAD - 1.1), paint: Math.floor(r() * PAINTS), seed: r(), hazard: r() < 0.15 ? r() * 20 : -1 });
      }
    }

    fixed = [];
    // Street lamps down both pavements, mostly sodium orange, some white LED.
    for (const sign of [-1, 1]) {
      for (let ld = 7 + r() * 5; ld < FAR; ld += 16 + r() * 8) {
        fixed.push({ kind: 'lamp', d: ld, side: sign * (ROAD + 0.6), height: 6.5, color: r() < 0.8 ? SODIUM : WHITE_LED, flicker: r() < 0.06 ? 1 : 0 });
      }
    }
    // Right signal: traffic going away. Left signal: traffic coming toward us.
    fixed.push({ kind: 'signal', d: SIGNAL_D, side: ROAD + 0.4, height: 4.2, dir: 1 });
    fixed.push({ kind: 'signal', d: SIGNAL_D + 1, side: -ROAD - 0.4, height: 4.2, dir: -1 });

    // Hanging signs: steady, slowly breathing, or a tired neon that stutters.
    for (const b of buildings) {
      if (!b.sign) continue;
      const sd = b.d0 + (b.d1 - b.d0) * (0.15 + r() * 0.5);
      fixed.push({ kind: 'sign', d: sd, side: b.side - Math.sign(b.side) * 1.2, height: 4 + r() * 4, color: SIGN_COLORS[b.sign - 1], mode: Math.floor(r() * 3), phase: r() * 50, size: 0.7 + r() * 0.6 });
    }
    // Red warning lights on the tallest towers.
    for (const b of buildings) {
      if (b.height < 45) continue;
      fixed.push({ kind: 'beacon', d: (b.d0 + b.d1) / 2, side: b.side + Math.sign(b.side) * 4, height: b.height + 1, phase: r() * 3, period: 2.2 + r() * 1.4 });
    }

    // The city at the end of the street: small lights in the haze around the vanishing point.
    for (let i = 0; i < 60; i++) {
      const t = r();
      fixed.push({
        kind: 'city',
        d: 300 + r() * 1500,
        side: (r() - 0.5) * 500,
        height: r() ** 2 * 120,
        color: t < 0.45 ? [1, 0.55 + r() * 0.3, 0.25] : t < 0.6 ? WHITE_LED : t < 0.8 ? [1, 0.18, 0.12] : SIGN_COLORS[Math.floor(r() * SIGN_COLORS.length)],
        power: 0.05 + r() ** 2 * 0.3,
        phase: r() * 100,
      });
    }

    // Faint reflections of the room behind us on the glass.
    fixed.push({ kind: 'room', x: 0.12, y: 0.82, r: 0.16, power: 0.05 });
    fixed.push({ kind: 'room', x: 0.62, y: 0.9, r: 0.12, power: 0.035 });

    fixed.forEach((f) => { f.seed = r(); });

    // Right-hand traffic: two lanes coming toward us on the left, two going away on the right.
    // Departing cars start just behind the camera, under the skywalk.
    lanes = [
      { dir: -1, side: -1.7, start: FAR, stop: SIGNAL_D + 3, timer: 1 },
      { dir: -1, side: -4.6, start: FAR, stop: SIGNAL_D + 3, timer: 4 },
      { dir: 1, side: 1.7, start: 0.6, stop: SIGNAL_D - 3, timer: 2 },
      { dir: 1, side: 4.6, start: 0.6, stop: SIGNAL_D - 3, timer: 6 },
    ];
    cars = [];
    people = [];
  };

  const signal = (dir) => {
    const t = (clock + (dir > 0 ? CYCLE / 2 : 0)) % CYCLE;
    return t < GREEN ? 'green' : t < GREEN + AMBER ? 'amber' : 'red';
  };

  const spawn = (lane) => {
    const t = rand();
    const kind = t < 0.07 ? 'bus' : t < 0.13 ? 'truck' : t < 0.2 ? 'bike' : 'car';
    const big = kind === 'bus' || kind === 'truck';
    const vmax = (big ? 8 + rand() * 2 : 9 + rand() * 6) * (0.85 + rand() * 0.3);
    const b = rand();
    const beamMode = b < 0.2 ? 'high' : b < 0.34 ? 'flash' : 'low';
    cars.push({
      lane, kind, d: lane.start, v: vmax * 0.9, vmax,
      side: lane.side,
      len: BODY[kind][0],
      beamMode,
      beam: beamMode === 'high' ? 1 : 0,
      dipAt: 30 + rand() * 30,
      flashAt: 35 + rand() * 60,
      flashClock: -1,
      head: rand() < 0.6 ? HEAD_WARM : HEAD_YELLOW,
      power: 0.8 + rand() * 0.5,
      paint: kind === 'bus' ? -1 : kind === 'truck' ? -2 : Math.floor(rand() * PAINTS),
      braking: 0,
      // How hard this driver presses the brake, and when they next ease off it for a moment.
      pressure: 0.5 + rand() * 0.5,
      easeAt: 2 + rand() * 6,
      easing: 0,
      // Tail lamps differ car to car: small slits, round lamps, wide light bars.
      tailSize: kind === 'bus' || kind === 'truck' ? 0.9 + rand() * 0.4 : 0.55 + rand() * 0.75,
      seed: rand(),
    });
  };

  const stepTraffic = (dt, traffic) => {
    for (const lane of lanes) {
      lane.timer -= dt * traffic;
      // Not next to a car in the other lane either, so two never arrive side by side.
      const room = !cars.some((c) => c.lane.dir === lane.dir && Math.abs(c.d - lane.start) < (c.lane === lane ? 16 : 18));
      if (lane.timer <= 0 && room && traffic > 0) {
        spawn(lane);
        lane.timer = rand() < 0.55 ? 1.5 + rand() * 2.5 : 6 + rand() * 12;
      }
    }
    for (const car of cars) {
      const { lane } = car;
      let target = car.vmax;
      const toLine = (lane.stop - car.d) * lane.dir;
      if (signal(lane.dir) !== 'green' && toLine > 0.5 && toLine < 45) target = Math.min(target, Math.max(0, (toLine - 1) * 0.55));
      for (const other of cars) {
        if (other === car || other.lane !== lane) continue;
        const ahead = (other.d - car.d) * lane.dir;
        const gap = ahead - (lane.dir > 0 ? car.len : other.len);
        if (ahead > 0 && gap < 30) target = Math.min(target, Math.max(0, (gap - 2.5) * 0.6));
      }
      const accel = target > car.v ? 2.2 : 6;
      car.v += Math.sign(target - car.v) * Math.min(Math.abs(target - car.v), accel * dt);
      // Keep staggered with the neighbouring lane: a car level with or just ahead of us in the
      // other lane makes us drop back, so two pairs of lights never come through together.
      for (const other of cars) {
        if (other === car || other.lane === lane || other.lane.dir !== lane.dir) continue;
        const ahead = (other.d - car.d) * lane.dir;
        if (ahead > -1.5 && ahead < 14 && (ahead > 0.5 || other.seed > car.seed)) {
          target = Math.min(target, Math.max(0, other.v - (14 - ahead) * 0.5));
        }
      }
      // Waiting in the queue, drivers shift their foot: pressing harder or softer, and now and
      // then lifting off the pedal for a moment before pressing again.
      const held = target < car.v - 0.3 || car.v < 0.5;
      if (held && car.v < 0.5) {
        car.easeAt -= dt;
        if (car.easeAt <= 0 && car.easing <= 0) {
          car.easing = 0.25 + rand() * 1.2;
          car.easeAt = 3 + rand() * 9;
          car.pressure = 0.4 + rand() * 0.6;
        }
      }
      car.easing -= dt;
      const pedal = held ? (car.easing > 0 ? 0.08 : car.pressure * (0.85 + 0.15 * noise(clock * 0.7 + car.seed * 40))) : 0;
      car.braking += (pedal - car.braking) * Math.min(1, dt * 9);
      car.d += lane.dir * car.v * dt;

      if (lane.dir < 0) {
        let beam = 0;
        if (car.beamMode === 'high') beam = car.d > car.dipAt ? 1 : 0;
        if (car.beamMode === 'flash') {
          if (car.flashClock < 0 && car.d < car.flashAt) car.flashClock = 0;
          if (car.flashClock >= 0) {
            car.flashClock += dt;
            const f = car.flashClock;
            beam = (f < 0.22) || (f > 0.42 && f < 0.64) ? 1 : 0;
          }
        }
        car.beam += (beam - car.beam) * Math.min(1, dt * 22);
      }
    }
    // Oncoming cars are gone once they have passed under the skywalk.
    cars = cars.filter((c) => c.d < FAR + 5 && c.d > 0.5);
  };

  const stepPeople = (dt, density) => {
    peopleTimer -= dt * density;
    if (peopleTimer <= 0 && people.length < MAX_PEOPLE / 2 && density > 0) {
      peopleTimer = 3 + rand() * 8;
      const dir = rand() < 0.5 ? 1 : -1;
      const sign = rand() < 0.6 ? 1 : -1;
      people.push({
        dir, d: dir > 0 ? 2.5 : 30 + rand() * 10,
        side: sign * (ROAD + 0.9 + rand() * 1.4),
        speed: 1.1 + rand() * 0.5,
        tall: 1.6 + rand() * 0.3,
        umbrella: rand() < 0.4 ? 1 : 0,
        tone: 0.01 + rand() * 0.03,
        phase: rand() * 6,
        // Some walk in pairs.
        pair: rand() < 0.35,
      });
    }
    for (const p of people) p.d += p.dir * p.speed * dt;
    people = people.filter((p) => p.d > 2 && p.d < 45);
  };

  // A box seen from the front: its near face at `d` and far face at `d + len`, in screen units.
  const box = (d, side, len, width, height) => {
    const hw = width / 2;
    const n0 = project(d, side - hw, 0, aspect);
    const n1 = project(d, side + hw, height, aspect);
    const f0 = project(d + len, side - hw, 0, aspect);
    const f1 = project(d + len, side + hw, height, aspect);
    return [n0.x, n1.x, n0.y, n1.y, f0.x, f1.x, f0.y, f1.y];
  };

  const update = (dt, values, nextAspect, colors, nextShutter = 0) => {
    shutter = nextShutter;
    aspect = nextAspect;
    const nextKey = `${values.seed}|${aspect.toFixed(2)}`;
    if (nextKey !== key) {
      key = nextKey;
      layout(values.seed);
    }
    clock += dt;
    stepTraffic(dt, values.traffic);
    stepPeople(dt, values.people ?? 1);
    const R = 0.05 * values.lightSize;
    const B = values.brightness;
    count = 0;
    pools = [];
    glare = [];

    // Bodies first: vehicles, people and tree crowns, as screen boxes that hide what is behind.
    occluders = [];
    vehicleData.fill(0);
    const bodies = [
      ...cars.map((car) => ({ car, moving: true })),
      ...parked.map((car) => ({ car, moving: false })),
    ].sort((a, b) => b.car.d - a.car.d);
    const shown = [];
    for (const { car, moving } of bodies) {
      if (car.d > 160) continue;
      const [len, width, height] = BODY[car.kind];
      // Moving cars show the end facing us: oncoming cars their front, departing ones their back.
      const b = box(car.d, car.side, len, width, height);
      const x0 = Math.min(b[0], b[4]);
      const x1 = Math.max(b[1], b[5]);
      if (x1 < -0.1 || x0 > aspect + 0.1) continue;
      occluders.push({ x0, x1, y0: b[2], y1: Math.max(b[3], b[7]), depth: car.d, owner: car, opacity: car.kind === 'bike' ? 0.5 : 0.92 });
      shown.push({ car, moving, b });
    }
    // The shader has room for MAX_VEHICLES bodies: give it the nearest ones (the far ones are
    // tiny and blurred away), still drawn far to near so nearer bodies cover farther ones.
    let nv = 0;
    for (const { car, moving, b } of shown.slice(-MAX_VEHICLES)) {
      const coming = moving && car.lane.dir < 0;
      const glow = !moving ? 0 : coming ? 0.4 + car.beam : 0.3 + car.braking;
      vehicleData.set([...b, VEHICLE_TYPE[car.kind], moving ? (coming ? 0 : 1) : 2, glow, car.paint], nv * VEHICLE_STRIDE);
      nv++;
    }
    peopleData.fill(0);
    let np = 0;
    for (const p of people) {
      for (const twin of p.pair ? [0, 1] : [0]) {
        if (np >= MAX_PEOPLE) break;
        const side = p.side + twin * 0.6 * Math.sign(p.side);
        const feet = project(p.d, side, 0, aspect);
        const head = project(p.d, side, p.tall, aspect);
        const h = head.y - feet.y;
        const alpha = Math.min(1, Math.max(0, Math.min(p.d - 2, 45 - p.d) / 3));
        const w = h * (p.umbrella ? 0.32 : 0.17);
        occluders.push({ x0: feet.x - w, x1: feet.x + w, y0: feet.y, y1: feet.y + h, depth: p.d, owner: p, opacity: 0.85 * alpha });
        peopleData.set([feet.x, feet.y, h, p.umbrella && !twin ? 1 : 0, (p.d * 1.6 + p.phase + twin) % 6.2832, p.tone, alpha, p.dir], np * PERSON_STRIDE);
        np++;
      }
    }
    treeData.fill(0);
    trees.forEach((t, i) => {
      const base = project(t.d, t.side, 0, aspect);
      const crown = project(t.d, t.side, t.trunk + t.canopy * 0.8, aspect);
      const rad = (t.canopy * FOCAL) / t.d;
      occluders.push({ x0: crown.x - rad, x1: crown.x + rad, y0: crown.y - rad * 0.8, y1: crown.y + rad * 0.8, depth: t.d, owner: t, opacity: 0.55 });
      treeData.set([base.x, base.y, crown.y, rad, Math.max(0.0015, (0.18 * FOCAL) / t.d), t.seed, 0, 0], i * TREE_STRIDE);
    });

    for (const f of fixed) {
      if (f.kind === 'lamp') {
        let k = 1;
        if (f.flicker) {
          const n = noise(clock * 0.35 + 7);
          k = n > 0.78 ? (noise(clock * 18) > 0.45 ? 1 : 0.15) : 1;
        }
        const color = f.color === SODIUM ? colors.lamp : f.color;
        addWithReflection(f.d, f.side, f.height, R * 1.1, 2.2 * k * B, color, 0.3, f.seed);
        if (pools.length < MAX_POOLS && f.d < 90) pools.push({ ...project(f.d, f.side - Math.sign(f.side), 0, aspect), color, k, size: 1 });
      } else if (f.kind === 'signal') {
        addWithReflection(f.d, f.side, f.height, R * 0.9, 2.4 * B, SIGNAL[signal(f.dir)], 0.4, f.seed);
      } else if (f.kind === 'sign') {
        let k = 1;
        if (f.mode === 1) k = 0.55 + 0.45 * noise(clock * 0.25 + f.phase);
        if (f.mode === 2) k = noise(clock * 0.4 + f.phase) > 0.7 ? (noise(clock * 14 + f.phase) > 0.5 ? 1 : 0.1) : 1;
        addWithReflection(f.d, f.side, f.height, R * f.size, 2 * k * B, f.color, 0.3, f.seed);
      } else if (f.kind === 'beacon') {
        const t = (clock + f.phase) % f.period;
        const k = t < 0.9 ? Math.sin((t / 0.9) * Math.PI) : 0;
        if (k > 0.01) {
          const p = project(f.d, f.side, f.height, aspect);
          add(p.x, p.y, R * 0.45, 0.6 * k * B, BEACON, 0, f.seed, 0, 0, 0, f.d);
        }
      } else if (f.kind === 'city') {
        const p = project(f.d, f.side, f.height, aspect);
        add(p.x, p.y, R * (0.3 + f.power * 0.3), f.power * (0.7 + 0.3 * noise(clock * 0.3 + f.phase)) * B, f.color, 0, f.seed, 0, 0, 0, f.d);
      } else if (f.kind === 'room') {
        add(f.x * aspect / 0.8, f.y, f.r, f.power, colors.window, 0, f.seed);
      }
    }

    for (const car of parked) {
      if (car.hazard < 0) continue;
      const on = noise(clock * 0.05 + car.hazard) > 0.55 && (clock % 1.1) < 0.55;
      if (on) {
        // Parked cars face away from us: their rear lamps blink.
        addWithReflection(car.d, car.side - 0.75, 0.85, R * 0.5, 1.4 * B, HAZARD, 0.4, car.seed, null, car);
        addWithReflection(car.d, car.side + 0.75, 0.85, R * 0.5, 1.4 * B, HAZARD, 0.4, (car.seed + 0.4) % 1, null, car);
      }
    }

    for (const car of cars) {
      const coming = car.lane.dir < 0;
      const motion = [car.lane.dir * car.v * shutter, 0];
      const s1 = car.seed;
      const s2 = (car.seed + 0.37) % 1;
      const big = car.kind === 'bus' || car.kind === 'truck';
      const halfW = car.kind === 'bike' ? 0 : big ? 1.1 : 0.72;
      if (coming) {
        const h = big ? 1.1 : 0.7;
        const p = 3.2 * car.power * B * (big ? 1.35 : 1) * (1 + 1.6 * car.beam);
        const rr = R * (big ? 1.2 : 1) * (1 + 0.25 * car.beam);
        addWithReflection(car.d, car.side - halfW, h, rr, p, car.head, 0.55, s1, motion, car);
        if (halfW) addWithReflection(car.d, car.side + halfW, h, rr, p, car.head, 0.55, s2, motion, car);
        if (car.kind === 'truck') {
          for (let i = -1; i <= 1; i++) addWithReflection(car.d, car.side + i * 0.6, 3.3, R * 0.45, 0.9 * B, MARKER, 0.12, (s1 + 0.2 * (i + 2)) % 1, motion, car);
        }
        // A beam across the wet road ahead: what ties the lights to a car.
        const from = project(car.d, car.side, 0.2, aspect);
        const to = project(Math.max(1.5, car.d - 12 - 10 * car.beam), car.side, 0, aspect);
        const bw = Math.max(0.004, (1.2 * FOCAL) / car.d);
        const bi = (0.45 + 0.9 * car.beam) * car.power * B;
        add(from.x, from.y, Math.min(0.4, (3.5 * FOCAL) / Math.max(car.d - 12, 3)), bi, car.head, 2, car.seed, to.x - from.x, to.y - from.y, bw, car.d, car);
        if (pools.length < MAX_POOLS && car.d < 60) {
          pools.push({ ...project(Math.max(3, car.d - 4), car.side, 0, aspect), color: car.head, k: 0.6 + 1.2 * car.beam, size: 0.7 });
        }
        // Coming straight at the window, the headlights light up the fog on the glass.
        const at = project(car.d, car.side, h, aspect);
        const near = Math.max(0, Math.min(1, (at.scale - 0.15) / 0.8));
        const strength = (0.15 + 1.1 * car.beam) * near * (big ? 1.5 : 1) * car.power * B * 0.35 * visible(at.x, at.y, 0.05, car.d, car);
        if (strength > 0.02) glare.push({ x: at.x, y: at.y, r: 0.22 + 0.3 * near + 0.12 * car.beam, strength, color: car.head });
      } else {
        const h = 0.95;
        // Running lights are dim; the brake lights are what blaze, when slowing or stopped.
        const p = (0.45 + 2.9 * car.braking) * car.power * B;
        const c = car.braking > 0.5 ? BRAKE : TAIL;
        const tr = R * 0.85 * car.tailSize;
        addWithReflection(car.d, car.side - halfW, h, tr, p, c, 0.5, s1, motion, car);
        if (halfW) addWithReflection(car.d, car.side + halfW, h, tr, p, c, 0.5, s2, motion, car);
      }
    }

    // Pack the buildings and lamp pools for the scene shader.
    buildingData.fill(0);
    buildings.forEach((b, i) => {
      buildingData.set([
        b.side, b.d0, b.d1, b.height,
        b.floorH, b.colW, b.lit, b.warmth,
        b.shop + b.type * 8, b.tone, b.depth, b.wash,
      ], i * BUILDING_STRIDE);
    });
    poolData.fill(0);
    pools.forEach((p, i) => poolData.set([p.x, p.y, (0.08 * Math.min(1.2, p.scale) + 0.02) * p.size, p.k, ...p.color, 0], i * 8));

    glare.sort((a, b) => b.strength - a.strength);
    glareData.fill(0);
    glare.slice(0, MAX_GLARE).forEach((g, i) => glareData.set([g.x, g.y, g.r, g.strength, ...g.color, 0], i * 8));

    return { lightCount: count, buildingCount: buildings.length, vehicleCount: nv, peopleCount: np, poolCount: pools.length, treeCount: trees.length };
  };

  return { lights, buildingData, vehicleData, peopleData, poolData, glareData, treeData, update, project: (d, s, h) => project(d, s, h, aspect) };
}
