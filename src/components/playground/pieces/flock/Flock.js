'use client';
import { useEffect, useRef } from 'react';
import { createTerrain, LIGHT_SCREEN } from './terrain';
import { createClouds } from './clouds';

// A flock of white birds seen from above, over an endless painted landscape
// (see terrain.js) that scrolls past and gradually becomes new scenery.
// `sweep` (0 = gliding, 1 = wings swept back) is the only pose input.
// Bird space: nose toward -y, wings along x, tail toward +y.

const HEADING = (24 * Math.PI) / 180; // flock flies up and slightly right
const HX = Math.sin(HEADING);
const HY = -Math.cos(HEADING);
const NX = -HY;
const NY = HX;
const HA = Math.atan2(HY, HX);
const BIRD = '#f7f9f1';

const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (x) => x * x * (3 - 2 * x);

// ------------------------------------------------------------------- the bird
// Each bird carries its own state (`bd`): flap phase, flap envelope `fa`, a glide /
// flap mode with a bout length, plus fixed random traits so no two birds (or two
// wings) are alike.
const LIGHT = [247, 249, 241];
const SHADE = [212, 221, 228];
const mixRgb = (k) => `rgb(${LIGHT.map((c, i) => Math.round(lerp(c, SHADE[i], k))).join(',')})`;

function makeBird(i, rand) {
  const wing = () => ({ span: 0.985 + rand() * 0.03, amp: 0.95 + rand() * 0.1, off: (rand() - 0.5) * 0.12 });
  return {
    ph: PHASES[i],
    phase: rand() * Math.PI * 2,
    fa: 0,
    mode: rand() < 0.5 ? 'flap' : 'glide',
    t: 1 + rand() * 3,
    end: 0,
    freq: 1.6 + rand() * 0.7,
    left: wing(),
    right: wing(),
    rnd: Array.from({ length: 24 }, rand),
    neck: (rand() - 0.5) * 2,
  };
}

function updateBird(bd, dt, held, rand) {
  const ω = bd.freq * Math.PI * 2;
  if (held) {
    bd.mode = 'glide';
    bd.t = 1 + rand() * 2;
  } else if (bd.mode === 'glide') {
    bd.t -= dt;
    if (bd.t <= 0) {
      bd.mode = 'flap';
      bd.end = bd.phase + (3 + Math.floor(rand() * 6)) * Math.PI * 2;
    }
  } else if (bd.phase >= bd.end && bd.end > 0) {
    bd.mode = 'glide';
    bd.t = 2 + rand() * 4;
  }
  if (bd.mode === 'flap' && bd.end === 0) bd.end = bd.phase + 4 * Math.PI * 2;
  const target = bd.mode === 'flap' ? 1 : 0;
  bd.fa += (target - bd.fa) * (1 - Math.exp(-dt * (target ? 3 : 2.2)));
  if (bd.fa > 0.02) bd.phase += dt * ω * Math.min(1, bd.fa * 1.5);
}

function featherAt(ctx, root, ang, len, w, line) {
  ctx.save();
  ctx.translate(root.x, root.y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -w / 2);
  ctx.bezierCurveTo(len * 0.5, -w * 0.55, len * 0.9, -w * 0.42, len, -w * 0.08);
  ctx.bezierCurveTo(len * 0.98, w * 0.32, len * 0.6, w * 0.5, 0, w / 2);
  ctx.closePath();
  ctx.fill();
  if (line) ctx.stroke();
  ctx.restore();
}

function drawWing(ctx, side, bd, s, t, bank, mono) {
  const wg = side < 0 ? bd.left : bd.right;
  const ph = bd.ph;
  const wph = bd.phase + wg.off;
  const fa = bd.fa;
  const bob = Math.sin(t * 0.9 + ph) * rad(4) * (1 - 0.5 * s) * (1 - fa);
  const flapArm = fa * rad(30) * wg.amp * Math.sin(wph);
  const flapHand = fa * rad(52) * wg.amp * Math.sin(wph - 0.9); // the tip lags the shoulder
  const eArm = rad(8) * (1 - fa) + flapArm + bob;
  const eHand = rad(10) * (1 - fa) + flapHand + bob * 1.4;
  const up = Math.max(0, Math.sin(eHand));

  ctx.save();
  if (side < 0) ctx.scale(-1, 1);

  const span = wg.span * (1 + bank * -side);
  const a1 = rad(lerp(-6, 24, s)) - 0.25 * Math.sin(eArm);
  const a2 = rad(lerp(12, 44, s)) + Math.sin(t * 1.3 + ph + 1) * rad(3) - 0.5 * Math.sin(eHand);
  const L1 = lerp(30, 26, s) * span * Math.cos(eArm);
  const L2 = lerp(34, 28, s) * span * Math.cos(eHand);
  const S = { x: 5.5, y: -13 };
  const W = { x: S.x + L1 * Math.cos(a1), y: S.y + L1 * Math.sin(a1) };
  const T = { x: W.x + L2 * Math.cos(a2), y: W.y + L2 * Math.sin(a2) };
  const Pt = { x: lerp(W.x, T.x, 0.5), y: lerp(W.y, T.y, 0.5) };
  const R = { x: 4, y: 15 };
  const angS = rad(lerp(86, 102, s)) + 0.2 * Math.sin(eArm);
  const spread = 1 + 0.35 * fa * up;
  const line = !mono;
  if (line) {
    ctx.strokeStyle = 'rgba(95,115,128,0.4)';
    ctx.lineWidth = 0.45;
  }

  // Flight feathers, drawn first so the coverts hide their roots.
  const feathers = [];
  for (let j = 0; j < 8; j++) {
    const k = j / 7;
    const rl = 0.96 + bd.rnd[j] * 0.08;
    const ra = (bd.rnd[j + 16] - 0.5) * rad(3);
    const outer = j < 4 ? 1 - Math.abs(j - 1) * 0.06 : 1 - (j - 1) * 0.07;
    feathers.push({
      root: { x: lerp(Pt.x, W.x, k), y: lerp(Pt.y, W.y, k) },
      ang: lerp(a2, angS, Math.min(1, k * 0.95 * spread)) + ra + Math.sin(t * 2 + j * 0.6 + ph) * rad(3) * (0.6 + 0.6 * s + fa),
      len: (j === 0 ? Math.hypot(T.x - Pt.x, T.y - Pt.y) : 31) * outer * rl,
      w: 7.2,
      cov: 9,
    });
  }
  for (let m = 0; m < 8; m++) {
    const k = (m + 1) / 8;
    const rl = 0.96 + bd.rnd[(m + 3) % 24] * 0.08;
    feathers.push({
      root: { x: lerp(W.x, R.x, k), y: lerp(W.y, R.y, k) },
      ang: angS + m * rad(1.2) + Math.sin(t * 1.8 + m * 0.8 + ph) * rad(2.5),
      len: (21 + 3 * Math.sin(k * Math.PI)) * rl,
      w: 8,
      cov: 9,
    });
  }
  if (!mono) ctx.fillStyle = mixRgb(Math.min(1, 0.22 + up * 0.7));
  feathers.forEach((f) => featherAt(ctx, f.root, f.ang, f.len, f.w, line));

  // Coverts: one smooth shape from the leading edge back to a scalloped line over the feather roots.
  const edge = feathers.map((f) => ({
    x: f.root.x + Math.cos(f.ang) * f.cov,
    y: f.root.y + Math.sin(f.ang) * f.cov,
    ang: f.ang,
  }));
  if (!mono) ctx.fillStyle = mixRgb(Math.min(1, up * 0.75));
  ctx.beginPath();
  // The leading edge leaves the neck in a concave fillet, then sweeps out along the arm.
  const N = { x: 2.5, y: -27 };
  ctx.moveTo(N.x, N.y);
  ctx.bezierCurveTo(N.x + 2.5, -17, W.x - Math.cos(a1) * 14, W.y - Math.sin(a1) * 14 - 2, W.x, W.y);
  ctx.quadraticCurveTo((W.x + Pt.x) / 2 + Math.sin(a2) * 1.5, (W.y + Pt.y) / 2 - Math.cos(a2) * 1.5, Pt.x, Pt.y);
  ctx.lineTo(edge[0].x, edge[0].y);
  for (let i = 1; i < edge.length; i++) {
    const p = edge[i - 1];
    const q = edge[i];
    ctx.quadraticCurveTo((p.x + q.x) / 2 + Math.cos(q.ang) * 2.2, (p.y + q.y) / 2 + Math.sin(q.ang) * 2.2, q.x, q.y);
  }
  ctx.lineTo(3, edge[edge.length - 1].y);
  ctx.lineTo(3, N.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBird(ctx, bd, s, t, bank, mono) {
  const ph = bd.ph;
  ctx.save();
  ctx.lineCap = 'round';
  // Legs trail behind the tail, a little unevenly, with small feet.
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = mono ? '#000' : '#c9d3d8';
  [[-1.9, 48 + bd.rnd[3] * 6], [1.9, 46 + bd.rnd[4] * 8]].forEach(([x, y], i) => {
    const ex = x * 1.5 + Math.sin(t * 1.1 + ph + i) * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, 22);
    ctx.lineTo(ex, y);
    ctx.lineTo(ex + (i ? 1.6 : -1.6), y + 4);
    ctx.stroke();
  });
  ctx.restore();

  // Tail: a narrow fan.
  if (!mono) ctx.fillStyle = mixRgb(0.1);
  [-12, -5, 0, 6, 13].forEach((d, i) => {
    featherAt(ctx, { x: 0, y: 17 }, rad(90 + d) + Math.sin(t * 1.4 + i + ph) * rad(2) + bank * 0.2, 17 + (i === 2 ? 3 : 0) + bd.rnd[i] * 2.5, 6);
  });

  // Fuselage and neck as one outline: neck, shoulders, belly, tail root.
  const bend = bd.neck * 4 + Math.sin(t * 0.5 + ph) * 3 + bank * 8;
  const head = { x: bend, y: -49 - 3 * s };
  const c1 = { x: -bend * 0.5, y: -28 };
  const c2 = { x: bend * 1.2, y: -40 };
  if (!mono) ctx.fillStyle = BIRD;
  // Neck as a chain of discs, tapering toward the head: always solid, any bend.
  const steps = 28;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const v = 1 - u;
    const x = 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * head.x;
    const y = v * v * v * -13 + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * head.y;
    const r = lerp(6.2, 2.1, Math.pow(u, 0.6));
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
  // Body: shoulders, belly, tail root.
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.bezierCurveTo(6, -17, 9.5, -7, 8.2, 5);
  ctx.bezierCurveTo(7.4, 13, 4, 20, 0, 24);
  ctx.bezierCurveTo(-4, 20, -7.4, 13, -8.2, 5);
  ctx.bezierCurveTo(-9.5, -7, -6, -17, 0, -17);
  ctx.closePath();
  ctx.fill();

  // Head and beak.
  ctx.beginPath();
  ctx.ellipse(head.x, head.y - 1.5, 2.7, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!mono) ctx.fillStyle = '#e8b9a4';
  ctx.beginPath();
  ctx.moveTo(head.x - 1.3, head.y - 3.5);
  ctx.lineTo(head.x + 0.2, head.y - 12);
  ctx.lineTo(head.x + 1.3, head.y - 3.5);
  ctx.closePath();
  ctx.fill();

  drawWing(ctx, -1, bd, s, t, bank, mono);
  drawWing(ctx, 1, bd, s, t, bank, mono);
}

// A loose flock in formation, in units of bird size (x across, y behind the leader).
const FORMATION = [
  [0, 0], [-1.1, 0.55], [1.0, 0.8], [-0.5, 1.6], [-1.9, 1.5], [0.6, 2.2], [1.8, 2.0],
].map(([x, y]) => [x, y - 1.0]);
const PHASES = [0, 1.9, 3.1, 4.4, 0.8, 2.6, 5.2];

function drawFlock(ctx, ox, oy, k, s, t, spread, birds, mono) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(HEADING);
  FORMATION.forEach(([fx, fy], i) => {
    const bd = birds[i];
    const ph = bd.ph;
    const bank = Math.sin(t * 0.33 + ph * 1.7) * 0.07 * (1 - 0.6 * s);
    const dx = Math.sin(t * 0.45 + ph) * 7;
    const dy = Math.cos(t * 0.6 + ph * 1.3) * 7 - bd.fa * Math.sin(bd.phase) * 2;
    ctx.save();
    ctx.translate((fx * 78 * spread + dx) * k, (fy * 78 * (1 + 0.3 * s) * spread + dy) * k);
    ctx.rotate(Math.sin(t * 0.5 + ph) * rad(4) + bank * 0.35 + rad((i % 3) * 2 - 2));
    const sc = k * 0.55 * (0.88 + (i % 4) * 0.07);
    ctx.scale(sc, sc);
    drawBird(ctx, bd, s, t, bank, mono);
    ctx.restore();
  });
  ctx.restore();
}

// Flock in Flight (from the playground repo).
export default function Flock({ showHint = true }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const hintRef = useRef(null);
  const heldRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const shadow = document.createElement('canvas');
    const sctx = shadow.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Phones and tablets: cheaper ground raster and lighter canvases.
    const lite = window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 600;
    let width = 1;
    let height = 1;
    let dpr = 1;
    const terrain = createTerrain(HEADING);
    const clouds = createClouds(HEADING, LIGHT_SCREEN);
    const scene = document.createElement('canvas');
    const scx = scene.getContext('2d');
    let sdpr = 1;
    let dist = 400;
    let kNow = 1;
    const resize = () => {
      const rect = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      shadow.width = Math.max(1, Math.round(width / 4));
      shadow.height = Math.max(1, Math.round(height / 4));
      sdpr = Math.min(dpr, lite ? 1.25 : 1.5);
      scene.width = Math.round(width * sdpr);
      scene.height = Math.round(height * sdpr);
      kNow = Math.min(width, height) / 640;
      terrain.setSize(width, height, kNow, sdpr, lite ? 0.2 : 0.28);
      clouds.setSize(kNow, lite ? 1 : dpr);
      terrain.warm(dist);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    // A few faint wind streaks that only show up at speed.
    const wind = Array.from({ length: 26 }, () => ({ u: Math.random(), w: Math.random() * 2 - 1, len: 60 + Math.random() * 160, sp: 1.2 + Math.random() }));

    const birds = FORMATION.map((_, i) => makeBird(i, Math.random));
    let sweep = 0;
    let time = 0;
    let last = performance.now();
    let raf = 0;

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(root);

    const frame = (now) => {
      if (!visible) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      time += dt;

      birds.forEach((bd) => updateBird(bd, dt, heldRef.current, Math.random));
      const target = heldRef.current ? 1 : 0;
      sweep += (target - sweep) * (1 - Math.exp(-dt * (target ? 3.2 : 1.8)));

      const unit = Math.min(width, height);
      const k = unit / 640;
      // World units per second: 256 gliding, up to about 1900 when diving.
      const speed = 640 * (reduced ? 0.1 : 0.4) * (1 + 6.5 * sweep * sweep);
      dist += speed * dt;

      const kb = k * (unit < 500 ? 1.3 : 1); // birds a touch larger on phones
      const cx = width / 2;
      const cy = height / 2;

      terrain.update(dist, (lite ? 4 : 6) + 12 * sweep, 2 + Math.round(sweep * 4));
      terrain.draw(scx, dist, sweep, cx, cy, (g) => clouds.drawShadows(g, dist, cx, cy, sweep, width, height));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(scene, 0, 0, width, height);
      if (sweep > 0.15) {
        // Speed smear: ghost copies of the ground trailing along the flight path.
        const off = sweep * 26 * k;
        ctx.globalAlpha = 0.32 * sweep;
        ctx.drawImage(scene, -HX * off, -HY * off, width, height);
        ctx.globalAlpha = 0.22 * sweep;
        ctx.drawImage(scene, HX * off, HY * off, width, height);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.4 * k;
        ctx.globalAlpha = Math.min(1, (sweep - 0.15) * 1.4) * 0.55;
        ctx.beginPath();
        const F = Math.hypot(width, height) + 300;
        for (const p of wind) {
          let u = (p.u - (dist * k * p.sp) / F) % 1;
          if (u < 0) u += 1;
          const uu = (u - 0.5) * F;
          const x = cx + HX * uu + NX * p.w * F * 0.5;
          const y = cy + HY * uu + NY * p.w * F * 0.5;
          const len = p.len * k * (0.4 + sweep * 1.2);
          ctx.moveTo(x, y);
          ctx.lineTo(x + HX * len, y + HY * len);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      clouds.draw(ctx, 'low', dist, cx, cy, sweep, width, height);

      // Shadows: one opaque silhouette on a half-size layer, composited translucent.
      const jitter = sweep * 0.8;
      const bx = cx + Math.sin(time * 0.4) * 8 * k + (Math.random() - 0.5) * jitter;
      const by = cy + Math.cos(time * 0.5) * 8 * k + (Math.random() - 0.5) * jitter;
      const spread = 1 - 0.18 * sweep;
      sctx.setTransform(0.25, 0, 0, 0.25, 0, 0);
      sctx.clearRect(0, 0, width, height);
      sctx.fillStyle = '#04140a';
      drawFlock(sctx, bx + 62 * k, by + 96 * k, kb, sweep, time, spread, birds, true);
      ctx.globalAlpha = 0.15;
      ctx.filter = `blur(${5 * k}px)`;
      ctx.drawImage(shadow, 0, 0, width, height);
      ctx.filter = 'none';
      ctx.globalAlpha = 1;

      ctx.fillStyle = BIRD;
      drawFlock(ctx, bx, by, kb, sweep, time, spread, birds, false);

      clouds.draw(ctx, 'high', dist, cx, cy, sweep, width, height);

      if (hintRef.current) hintRef.current.style.opacity = String(1 - Math.min(1, sweep * 2));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      heldRef.current = true;
    };
    const noMenu = (e) => e.preventDefault();
    const up = () => (heldRef.current = false);
    const keyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        heldRef.current = true;
      }
    };
    const keyUp = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') heldRef.current = false;
    };
    root.addEventListener('pointerdown', down);
    root.addEventListener('contextmenu', noMenu);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', up);
    // Keys only while the flock has focus, so Space and Enter keep working
    // on the rest of the page.
    root.addEventListener('keydown', keyDown);
    root.addEventListener('keyup', keyUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener('pointerdown', down);
      root.removeEventListener('contextmenu', noMenu);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('blur', up);
      root.removeEventListener('keydown', keyDown);
      root.removeEventListener('keyup', keyUp);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      aria-label="Flock in Flight. Hold Space, Enter or the pointer to fly faster"
      className="absolute inset-0 select-none overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      style={{ background: '#3f8a2b', touchAction: 'pan-y', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label="A flock of birds gliding over changing landscapes" />
      {showHint && (
        <p
          ref={hintRef}
          className="pointer-events-none absolute top-3 right-14 z-40 rounded-full bg-black/25 px-3 py-1.5 text-[11px] font-medium tracking-widest text-white backdrop-blur-sm"
        >
          <span className="[@media(pointer:coarse)]:hidden">HOLD TO FLY FASTER</span>
          <span className="hidden [@media(pointer:coarse)]:inline">PRESS &amp; HOLD TO GLIDE</span>
        </p>
      )}
    </div>
  );
}

// On the site the hint lives in the panel's header (the entry's tagline).
export function Piece() {
  return <Flock showHint={false} />;
}
