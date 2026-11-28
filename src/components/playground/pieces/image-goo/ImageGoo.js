'use client';

import { useEffect, useRef, useState } from 'react';
import PhotoModal from '../PhotoModal';
import { SPHERE_IMAGES } from '../sphere-images';
import { createGooRenderer } from './goo-gl';
import { releaseContext } from '@/lib/webgl';

// Image Goo: four photos in green squircle bubbles around a small drop, all
// one liquid. At rest the group sits in the middle of the box. Move the
// pointer over it and the drop follows; on each new empty square of a grid
// (PITCH px, lined up on the box's centre) the four bubbles around it come out
// of the drop, each joined to it by a neck that stretches and lets go, and
// the ones left behind are drawn back in. Nudge toward a bubble and a thin
// bridge reaches out to it; rest on one and it grows outward, away from the
// others; click it to see the photo larger (the same card as Image Sphere).
// When the pointer leaves, the group glides back to the middle. On touch,
// drag a finger.
//
// The photos are Image Sphere's, from Unsplash: small square crops of each are
// drawn into one canvas (the atlas) for the GPU. The drawing is goo-gl.js;
// here each bubble is a set of springs (place, size, hover growth), stepped
// once a frame while anything moves or the pointer is over the box.

const PITCH = 52; // px between bubble centres: the closest at which bubbles and the drop sit apart at rest
const R = 20.5; // px, half a bubble's size (a 38px photo and its frame)
const INSET = 1.5; // px of green frame around each photo, at rest
const HOT_R = 46.5; // px, half the size of the bubble under the pointer
const REACH = 3.5; // px the frame swells on the side facing the pointer as it comes close
const DROP = 7; // px, half the size of the drop under the pointer (a 14px squircle)
const K = 18; // px, the neck's reach: two shapes join when under K / 2 apart
// A bridge: a line from the drop to a bubble once the gap between them is
// under BRIDGE px. At rest the gap is 24.5px, so there's none; a nudge of a
// couple of px toward a bubble draws a hairline, which thickens to BRIDGE_W
// px across as the gap closes.
const BRIDGE = 24;
const BRIDGE_W = 6;
const STAGGER = 0.04; // s between the bubbles of a step
// Springs: [stiffness, damping], for a mass of 1. Coming out is a little
// underdamped so the bubble settles like a drop; going back in is quicker.
const OUT_MOVE = [140, 18];
const OUT_SIZE = [190, 21];
const IN_MOVE = [210, 26];
const IN_SIZE = [170, 24];
const HOVER = [320, 30];
const FOLLOW = [600, 46]; // the drop trailing the pointer
const HOME = [90, 19]; // the drop gliding back to the middle when the pointer leaves
const GREEN = [0, 130 / 255, 54 / 255]; // green-700, the square cursor's colour
// Squircles, the goo green throughout, no outline. wobble: px the edges
// wander at most, while the pointer moves and in the necks.
const LOOK = { kind: 'squircle', round: 0, fill: GREEN, wobble: 1 };
const ENERGY_SPEED = 400; // px/s of pointer movement for the full wobble
const COLS = 4; // the atlas: a 4 x 4 grid of square crops (12 used)
const CELL = 192; // px per photo in the atlas
const SIDES = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

const spring = (x, [k, c]) => ({ x, v: 0, t: x, k, c });
const tune = (s, [k, c]) => {
  s.k = k;
  s.c = c;
};
const step = (s, dt) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
  s.x += s.v * dt;
};
const still = (s) => Math.abs(s.x - s.t) < 0.02 && Math.abs(s.v) < 0.02;

export function Piece() {
  const box = useRef(null);
  const surface = useRef(null);
  const [open, setOpen] = useState(null); // the photo in the card

  useEffect(() => {
    const root = box.current;
    const canvas = surface.current;
    if (!root || !canvas) return;
    const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frame = 0;
    let last = 0;
    let energy = 0; // 0 to 1, how much the pointer is moving (wakes the wobble)
    let cells = []; // every bubble on screen, shown and leaving
    let inside = false; // the pointer is over the box (or a finger is down)
    let homing = false; // gliding back to the middle after the pointer left
    const drop = { x: spring(0, FOLLOW), y: spring(0, FOLLOW), r: spring(0, OUT_SIZE) };
    // The group: the grid's origin (the box's centre), where the pointer is,
    // the square it's on, the square the group is gathered around, the
    // bubbles shown by square, the one under the pointer, and the photo deck.
    const run = {
      px: 0,
      py: 0,
      x: 0,
      y: 0,
      at: { i: NaN, j: NaN },
      center: { i: 0, j: 0 },
      shown: new Map(),
      hot: null,
      deck: shuffle(SPHERE_IMAGES.map((_, index) => index)),
      dealt: 0,
    };

    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    let gl = null;
    const atlas = loadAtlas();
    const setup = () => {
      gl = createGooRenderer(canvas, atlas, COLS, wake);
    };
    setup();
    if (!gl) return;
    const lost = (event) => {
      event.preventDefault();
      gl = null;
    };
    const restored = () => {
      setup();
      wake();
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);

    const size = () => ({ w: root.clientWidth, h: root.clientHeight });
    // Bubbles stay inside the box.
    const free = (x, y) => {
      const { w, h } = size();
      return x - R >= 2 && x + R <= w - 2 && y - R >= 2 && y + R <= h - 2;
    };

    // The next photo from the shuffled deck, skipping any already shown.
    const deal = () => {
      const showing = new Set([...run.shown.values()].map((cell) => cell.index));
      for (let k = 0; k < run.deck.length; k++) {
        const index = run.deck[(run.dealt + k) % run.deck.length];
        if (showing.has(index)) continue;
        run.dealt += k + 1;
        return index;
      }
      return run.deck[run.dealt++ % run.deck.length];
    };

    // Puts a bubble on grid square (i, j), coming out of the drop.
    const place = (i, j, delay) => {
      const key = `${i},${j}`;
      if (run.shown.has(key)) return;
      const hx = run.px + i * PITCH;
      const hy = run.py + j * PITCH;
      if (!free(hx, hy)) return;
      const calm = reduce();
      const cell = {
        key,
        i,
        j,
        hx,
        hy,
        index: deal(),
        x: spring(calm ? hx : drop.x.x, OUT_MOVE),
        y: spring(calm ? hy : drop.y.x, OUT_MOVE),
        s: spring(calm ? 0.6 : 0.25, calm ? [400, 40] : OUT_SIZE),
        g: spring(0, HOVER),
        leaving: false,
        hold: calm ? 0 : delay, // s it waits in the drop before coming out
      };
      cell.x.t = hx;
      cell.y.t = hy;
      cell.s.t = 1;
      run.shown.set(key, cell);
      cells.push(cell);
    };

    const leave = (cell) => {
      cell.leaving = true;
      cell.s.t = 0;
      cell.g.t = 0;
      tune(cell.x, IN_MOVE);
      tune(cell.y, IN_MOVE);
      tune(cell.s, reduce() ? [400, 40] : IN_SIZE);
    };

    // The bubble under the pointer grows, outward: away from the square the
    // group is gathered around, so it doesn't cover the others.
    const heat = (cell) => {
      if (cell === run.hot) return;
      if (run.hot) {
        run.hot.g.t = 0;
        run.hot.x.t = run.hot.hx;
        run.hot.y.t = run.hot.hy;
      }
      if (cell) {
        const dx = Math.sign(cell.i - run.center.i);
        const dy = Math.sign(cell.j - run.center.j);
        cell.g.t = 1;
        cell.x.t = cell.hx + dx * (HOT_R - R);
        cell.y.t = cell.hy + dy * (HOT_R - R);
        tune(cell.x, HOVER);
        tune(cell.y, HOVER);
      }
      run.hot = cell;
      root.style.cursor = cell ? 'pointer' : '';
      if (cell) root.dataset.cursor = 'View';
      else delete root.dataset.cursor;
    };

    // The pointer moved to square (i, j). On a bubble, it grows and the group
    // holds still. On an empty square, the four around it come out and every
    // other bubble is drawn back in.
    const visit = (i, j) => {
      const cell = run.shown.get(`${i},${j}`) ?? null;
      heat(cell);
      if (cell) return;
      run.center = { i, j };
      const keep = new Set(SIDES.map(([di, dj]) => `${i + di},${j + dj}`));
      for (const [key, other] of run.shown) {
        if (keep.has(key)) continue;
        run.shown.delete(key);
        leave(other);
      }
      let n = 0;
      for (const [di, dj] of SIDES) {
        if (!run.shown.has(`${i + di},${j + dj}`)) place(i + di, j + dj, n++ * STAGGER);
      }
    };

    const follow = () => {
      // Anywhere on the grown bubble still counts as on it.
      const hot = run.hot;
      if (hot && Math.max(Math.abs(run.x - hot.x.t), Math.abs(run.y - hot.y.t)) <= HOT_R) return;
      const i = Math.round((run.x - run.px) / PITCH);
      const j = Math.round((run.y - run.py) / PITCH);
      if (i === run.at.i && j === run.at.j) return;
      run.at = { i, j };
      visit(i, j);
    };

    // Lines the grid up on the box's centre and gathers the group there.
    const settle = (first) => {
      const { w, h } = size();
      run.px = w / 2;
      run.py = h / 2;
      if (first || !inside) {
        run.x = run.px;
        run.y = run.py;
        drop.x.t = run.px;
        drop.y.t = run.py;
        if (first) {
          drop.x.x = run.px;
          drop.y.x = run.py;
        }
      }
      for (const cell of run.shown.values()) leave(cell);
      run.shown.clear();
      heat(null);
      run.at = { i: NaN, j: NaN };
      follow();
    };

    // One frame: step every spring, drop bubbles that have gone back in, draw.
    function tick(now) {
      frame = 0;
      const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60);
      last = now;
      const calm = reduce();
      let moving = false;

      for (const s of [drop.x, drop.y, drop.r]) {
        step(s, dt);
        moving ||= !still(s);
      }
      // Gliding home: the group follows the drop back to the middle.
      if (homing) {
        run.x = drop.x.x;
        run.y = drop.y.x;
        follow();
        if (still(drop.x) && still(drop.y)) homing = false;
      }

      cells = cells.filter((cell) => {
        if (cell.leaving) {
          // Drawn back into the drop, wherever it has got to.
          if (!calm) {
            cell.x.t = drop.x.x;
            cell.y.t = drop.y.x;
          }
          if (cell.s.x < 0.05) return false;
        } else if (cell.hold > 0) {
          // Waiting its turn inside the drop.
          cell.hold -= dt;
          if (cell.hold > 0) {
            cell.x.x = drop.x.x;
            cell.y.x = drop.y.x;
            moving = true;
            return true;
          }
        }
        for (const s of [cell.x, cell.y, cell.s, cell.g]) {
          if (calm && (s === cell.x || s === cell.y)) s.x = s.t;
          else step(s, dt);
          moving ||= !still(s);
        }
        return true;
      });

      // Movement wakes the wobble: it rises with the drop's speed and fades
      // about half a second after the pointer stops.
      const speed = Math.hypot(drop.x.v, drop.y.v);
      const target = Math.min(1, speed / ENERGY_SPEED);
      energy += (target - energy) * Math.min(1, dt * (target > energy ? 10 : 3));
      if (energy < 0.005) energy = 0;

      if (gl) {
        const bubbles = cells.map((cell) => {
          const r = Math.max(0, (R + cell.g.x * (HOT_R - R)) * cell.s.x);
          // A bridge and a swell toward the drop, by how close it is (none
          // while leaving or under the pointer).
          const gap = Math.hypot(cell.x.x - drop.x.x, cell.y.x - drop.y.x) - r - drop.r.x;
          const near = cell.leaving || cell === run.hot ? 0 : Math.min(1, Math.max(0, (BRIDGE - gap) / BRIDGE));
          return {
            x: cell.x.x,
            y: cell.y.x,
            r,
            photo: Math.max(0, r - INSET * Math.min(1, cell.s.x)),
            index: cell.index,
            hot: cell === run.hot,
            bridge: near > 0 ? 0.4 + (BRIDGE_W / 2 - 0.4) * near : 0,
            reach: near * REACH,
          };
        });
        bubbles.sort((a, b) => a.hot - b.hot); // the grown one's photo on top
        LOOK.time = now / 1000;
        LOOK.energy = calm ? 0 : energy;
        gl.draw(bubbles, { x: drop.x.x, y: drop.y.x, r: Math.max(0, drop.r.x) }, K, LOOK);
      }
      // Keep going while anything moves, the wobble is fading, or the pointer
      // is over the box (the necks near it wobble). Otherwise the last frame
      // stays on the canvas.
      if (moving || energy > 0 || inside || homing) frame = requestAnimationFrame(tick);
    }

    const local = (event) => {
      const box = root.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    const move = (event) => {
      if (event.pointerType === 'touch' && !inside) return;
      const p = local(event);
      inside = true;
      homing = false;
      tune(drop.x, FOLLOW);
      tune(drop.y, FOLLOW);
      run.x = p.x;
      run.y = p.y;
      drop.x.t = p.x;
      drop.y.t = p.y;
      follow();
      wake();
    };
    const down = (event) => {
      if (event.pointerType === 'touch') {
        inside = true;
        root.setPointerCapture?.(event.pointerId);
      }
      move(event);
    };
    // The pointer left (or the finger lifted): glide back to the middle.
    const away = (event) => {
      if (event.type === 'pointerleave' && event.pointerType === 'touch') return;
      if (event.type === 'pointerup' && event.pointerType !== 'touch') return;
      inside = false;
      homing = true;
      heat(null);
      tune(drop.x, HOME);
      tune(drop.y, HOME);
      drop.x.t = run.px;
      drop.y.t = run.py;
      wake();
    };
    const click = () => {
      if (run.hot) setOpen(SPHERE_IMAGES[run.hot.index]);
    };

    root.addEventListener('pointermove', move);
    root.addEventListener('pointerdown', down);
    root.addEventListener('pointerleave', away);
    root.addEventListener('pointerup', away);
    root.addEventListener('pointercancel', away);
    root.addEventListener('click', click);

    // The box's size: the canvas follows it, and the group re-centres.
    let sized = false;
    const observer = new ResizeObserver(() => {
      gl?.resize();
      settle(!sized);
      sized = true;
      drop.r.t = DROP;
      wake();
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerdown', down);
      root.removeEventListener('pointerleave', away);
      root.removeEventListener('pointerup', away);
      root.removeEventListener('pointercancel', away);
      root.removeEventListener('click', click);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      cancelAnimationFrame(frame);
      releaseContext(gl?.gl);
    };
  }, []);

  return (
    <div ref={box} className="relative size-full touch-none select-none">
      <canvas ref={surface} aria-hidden className="absolute inset-0 size-full" />
      <PhotoModal image={open} onClose={() => setOpen(null)} />
    </div>
  );
}

// Small square crops of the photos, from Unsplash, drawn into one canvas.
// Photos that fail to load leave their square grey.
function loadAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = COLS * CELL;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ebebeb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return Promise.all(
    SPHERE_IMAGES.map(
      (image, i) =>
        new Promise((done) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.decoding = 'async';
          img.onload = () => {
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            const sx = (img.naturalWidth - side) / 2;
            const sy = (img.naturalHeight - side) / 2;
            ctx.drawImage(img, sx, sy, side, side, (i % COLS) * CELL, Math.floor(i / COLS) * CELL, CELL, CELL);
            done();
          };
          img.onerror = () => done();
          img.src = crop(image.src);
        }),
    ),
  ).then(() => canvas);
}

// The same Unsplash photo, as a CELL px square crop.
function crop(src) {
  const url = new URL(src);
  url.searchParams.set('w', String(CELL));
  url.searchParams.set('h', String(CELL));
  url.searchParams.set('fit', 'crop');
  return url.toString();
}

// The list, in a random order (Fisher–Yates).
function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
