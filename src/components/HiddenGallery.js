'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog } from '@base-ui/react/dialog';
import { X } from '@phosphor-icons/react';
import photos from '@/lib/photos.json';
import { createBloomRenderer } from '@/lib/bloom-gl';
import { releaseContext } from '@/lib/webgl';

// A hidden gallery on the home page. Press and hold anywhere on the home list
// that isn't a link, a control or media, and four of my photographs come out
// of the pointer in green-framed bubbles, one on each side, pulling out of a
// green drop under the pointer like a liquid: each stays joined to it by a
// neck that stretches thin and lets go. Drag, and the group follows: on each
// new empty square the four around it come out of the drop, and the ones left
// behind are drawn back into it, so only the photos beside the pointer are
// ever shown. Resting on a photo grows it outward, away from the others, and
// holds the group still; let go there to open it in a dialog. Letting go
// draws them all back into the release point.
//
// Bubbles keep clear of the content (CONTENT: text, images, cards, tiles,
// links) and stay within the home list, off the side panel. A scroll clears
// them, since they are fixed to the screen.
//
// A press on text can also be the start of selecting it, so the bloom waits
// WAIT ms and gives up if the pointer moves more than SLOP px first; once it
// starts, text selection is turned off until the release.
//
// How it's drawn: lib/bloom-gl.js renders every bubble and the drop as one
// liquid shape in WebGL (signed distances joined by a smooth minimum), with a
// green frame round each photo and the photos from one texture atlas
// (public/images/visuals/bloom-atlas.webp, built by
// scripts/build-bloom-atlas.mjs). Here each bubble is a set of springs
// (place, size, hover growth), stepped once a frame while anything moves.
// Which square the pointer is on comes from a grid of PITCH px lined up on the
// press point. Mouse and pen from 1024px wide, with WebGL 2, only.

const PITCH = 52; // px between bubble centres: the closest at which bubbles and the drop sit apart at rest (gap >= K)
const R = 20.5; // px, half a bubble's size (a 38px photo and its frame)
const INSET = 1.5; // px of green frame around each photo, at rest
const HOT_R = 46.5; // px, half the size of the bubble under the pointer
const REACH = 3.5; // px the frame swells on the side facing the pointer as it comes close
const DROP = 11; // px, the radius of the drop under the pointer
const K = 18; // px, the neck's reach: two shapes join when under K / 2 apart
// A bridge: a line from the drop to a bubble once the gap between them is
// under BRIDGE px. At rest (PITCH 52) the gap is 20.5px, so there's none; a
// nudge of a couple of px toward a bubble draws a hairline, which thickens
// to BRIDGE_W px across as the gap closes.
const BRIDGE = 20;
const BRIDGE_W = 6;
const WAIT = 120; // ms of holding before the first four appear, so a plain click shows nothing
const SLOP = 6; // px the pointer may move during WAIT before it counts as a drag (selecting text)
const STAGGER = 0.04; // s between the bubbles of a step
// Springs: [stiffness, damping], for a mass of 1. Coming out is a little
// underdamped so the bubble settles like a drop; going back in is quicker.
const OUT_MOVE = [140, 18];
const OUT_SIZE = [190, 21];
const IN_MOVE = [210, 26];
const IN_SIZE = [170, 24];
// Letting go: stiffer and without a bounce, so everything is back in the drop
// and gone in about a quarter of a second.
const RELEASE_MOVE = [560, 48];
const RELEASE_SIZE = [520, 46];
const RELEASE_STAGGER = 0.015; // s between bubbles on release, nearest first
const HOVER = [320, 30];
const FOLLOW = [600, 46]; // the drop trailing the pointer
const ATLAS = '/images/visuals/bloom-atlas.webp';
// The look: squircles, the goo green-700 throughout (the frame round each
// photo, the necks and the drop), no outline.
const GREEN = [0, 130 / 255, 54 / 255]; // green-700, the square cursor's colour
const LOOK = { kind: 'squircle', round: 0, fill: GREEN, wobble: 1 }; // wobble: px the edges wander at most
const ENERGY_SPEED = 400; // px/s of pointer movement for the full wobble
const COLS = Math.ceil(Math.sqrt(photos.length)); // the atlas grid (as in the build script)
// Presses on these don't start a bloom: links, controls, media, the Musings
// rail (it drags) and Playground tiles.
const IGNORE =
  'a, button, input, textarea, select, label, summary, img, video, canvas, iframe, svg, [role="button"], .musings-rail, .bento-tile, [data-no-bloom]';
// Bubbles never land on these, so they fill the empty space around the content.
const CONTENT = 'h1, h2, h3, p, li, a, button, img, video, canvas, figure, .bento-tile, [data-doc], [data-bloom-avoid]';
const CLEAR = 6; // px kept between a bubble and the content
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

export default function HiddenGallery() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(null); // the photo in the dialog
  const anchor = useRef(null); // sits in the home list: presses must start inside it
  const surface = useRef(null); // the canvas

  useEffect(() => {
    setMounted(true);
    const query = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled || !mounted) return;
    const scope = anchor.current?.parentElement;
    const canvas = surface.current;
    if (!scope || !canvas) return;
    const html = document.documentElement;
    let gl = null; // the renderer, set up when the browser is idle or on the first press
    let failed = false; // no WebGL 2: the bloom stays off
    let run = null; // the press, then the bloom, under way
    let cells = []; // every bubble on screen, shown and leaving
    let frame = 0;
    let last = 0;
    let energy = 0; // 0 to 1, how much the pointer is moving (wakes the wobble)
    const drop = { x: spring(0, FOLLOW), y: spring(0, FOLLOW), r: spring(0, OUT_SIZE), wait: 0 };

    const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setup = () => {
      if (gl || failed) return gl;
      gl = createBloomRenderer(canvas, ATLAS, COLS);
      if (!gl) failed = true;
      return gl;
    };
    const idle = window.requestIdleCallback?.(setup, { timeout: 3000 }) ?? setTimeout(setup, 1500);
    const lost = (event) => {
      event.preventDefault();
      gl = null;
      cells = [];
    };
    const restored = () => setup();
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    const resize = () => gl?.resize();
    window.addEventListener('resize', resize);

    // Where bubbles may go, measured when the bloom starts: on screen, inside
    // the home list (so never over the side panel) and clear of the content.
    const measure = () => {
      const list = scope.getBoundingClientRect();
      const bounds = {
        left: Math.max(0, list.left),
        right: Math.min(innerWidth, list.right),
        top: Math.max(0, list.top),
        bottom: Math.min(innerHeight, list.bottom),
      };
      const avoid = [...scope.querySelectorAll(CONTENT)]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width && r.height && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth);
      return (x, y) => {
        const l = x - R;
        const t = y - R;
        if (l < bounds.left || l + 2 * R > bounds.right || t < bounds.top || t + 2 * R > bounds.bottom) return false;
        return !avoid.some(
          (r) => l + 2 * R > r.left - CLEAR && l < r.right + CLEAR && t + 2 * R > r.top - CLEAR && t < r.bottom + CLEAR,
        );
      };
    };

    // One frame: step every spring, drop bubbles that have gone back in, draw.
    const tick = (now) => {
      frame = 0;
      const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60);
      last = now;
      const calm = reduce();
      let moving = false;

      for (const s of [drop.x, drop.y]) {
        step(s, dt);
        moving ||= !still(s);
      }
      if (drop.wait > 0) drop.wait -= dt;
      else {
        step(drop.r, dt);
        moving ||= !still(drop.r);
      }

      cells = cells.filter((cell) => {
        if (cell.leaving) {
          if (cell.wait > 0) {
            cell.wait -= dt;
            return true;
          }
          // Drawn back into the drop, wherever it has got to.
          if (!calm) {
            cell.x.t = drop.x.x;
            cell.y.t = drop.y.x;
          }
          if (cell.s.x < 0.05 && cell.s.t === 0) return false;
        } else if (cell.hold > 0) {
          // Waiting its turn inside the drop.
          cell.hold -= dt;
          const out = cell.hold <= 0;
          cell.x.x = out ? cell.x.x : drop.x.x;
          cell.y.x = out ? cell.y.x : drop.y.x;
          if (!out) return true;
        }
        for (const s of [cell.x, cell.y, cell.s, cell.g]) {
          if (calm && (s === cell.x || s === cell.y)) s.x = s.t;
          else step(s, dt);
          moving ||= !still(s);
        }
        return true;
      });

      if (gl) {
        const bubbles = cells.map((cell) => {
          const r = Math.max(0, (R + cell.g.x * (HOT_R - R)) * cell.s.x);
          // The line to the drop, by how close it is (none while leaving).
          const gap = Math.hypot(cell.x.x - drop.x.x, cell.y.x - drop.y.x) - r - drop.r.x;
          const near =
            cell.leaving || cell === run?.hot || drop.r.x < 1 ? 0 : Math.min(1, Math.max(0, (BRIDGE - gap) / BRIDGE));
          const bridge = near > 0 ? 0.4 + (BRIDGE_W / 2 - 0.4) * near : 0;
          // The frame also swells toward the pointer as it comes close.
          const reach = near * REACH;
          return {
            x: cell.x.x,
            y: cell.y.x,
            r,
            photo: Math.max(0, r - INSET * Math.min(1, cell.s.x)),
            index: cell.index,
            hot: cell === run?.hot,
            bridge,
            reach,
          };
        });
        bubbles.sort((a, b) => a.hot - b.hot); // the grown one's photo on top
        // Movement wakes the wobble: it rises with the drop's speed and fades
        // about half a second after the pointer stops.
        const speed = Math.hypot(drop.x.v, drop.y.v);
        const target = Math.min(1, speed / ENERGY_SPEED);
        energy += (target - energy) * Math.min(1, dt * (target > energy ? 10 : 3));
        LOOK.time = now / 1000;
        LOOK.energy = calm ? 0 : energy;
        gl.draw(bubbles, { x: drop.x.x, y: drop.y.x, r: Math.max(0, drop.r.x) }, K, LOOK);
      }
      if (moving || run?.started) frame = requestAnimationFrame(tick);
      else gl?.clear();
    };
    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    // The next photo from this press's shuffled deck, skipping any already on
    // screen, so each press starts differently and nothing repeats until the
    // whole set has been round.
    const deal = (r) => {
      const showing = new Set([...r.shown.values()].map((cell) => cell.index));
      for (let k = 0; k < r.deck.length; k++) {
        const index = r.deck[(r.dealt + k) % r.deck.length];
        if (showing.has(index)) continue;
        r.dealt += k + 1;
        return index;
      }
      return r.deck[r.dealt++ % r.deck.length];
    };

    // Puts a bubble on grid square (i, j), coming out of the drop, unless one
    // is there or the square isn't free.
    const place = (i, j, delay) => {
      const r = run;
      const key = `${i},${j}`;
      if (r.shown.has(key)) return;
      const hx = r.px + i * PITCH;
      const hy = r.py + j * PITCH;
      if (!r.free(hx, hy)) return;
      const index = deal(r);

      const calm = reduce();
      const cell = {
        key,
        i,
        j,
        hx,
        hy,
        index,
        x: spring(calm ? hx : drop.x.x, OUT_MOVE),
        y: spring(calm ? hy : drop.y.x, OUT_MOVE),
        s: spring(calm ? 0.6 : 0.25, calm ? [400, 40] : OUT_SIZE),
        g: spring(0, HOVER),
        leaving: false,
        wait: 0,
        hold: calm ? 0 : delay, // s it waits in the drop before coming out, to stagger the four
      };
      cell.x.t = hx;
      cell.y.t = hy;
      cell.s.t = 1;
      r.shown.set(key, cell);
      cells.push(cell);
    };

    // fast: letting go, which closes quicker than a bubble left behind by a drag.
    const leave = (cell, delay = 0, fast = false) => {
      cell.leaving = true;
      cell.wait = reduce() ? 0 : delay;
      cell.s.t = 0;
      cell.g.t = 0;
      tune(cell.x, fast ? RELEASE_MOVE : IN_MOVE);
      tune(cell.y, fast ? RELEASE_MOVE : IN_MOVE);
      tune(cell.s, reduce() ? [400, 40] : fast ? RELEASE_SIZE : IN_SIZE);
    };

    // The bubble under the pointer grows, outward: away from the square the
    // group is gathered around, so it doesn't cover the others.
    const heat = (cell) => {
      const r = run;
      if (cell === r.hot) return;
      if (r.hot) {
        r.hot.g.t = 0;
        r.hot.x.t = r.hot.hx;
        r.hot.y.t = r.hot.hy;
      }
      if (cell) {
        const dx = Math.sign(cell.i - r.center.i);
        const dy = Math.sign(cell.j - r.center.j);
        cell.g.t = 1;
        cell.x.t = cell.hx + dx * (HOT_R - R);
        cell.y.t = cell.hy + dy * (HOT_R - R);
        tune(cell.x, HOVER);
        tune(cell.y, HOVER);
      }
      r.hot = cell;
    };

    // The pointer moved to square (i, j). On a bubble, it grows and the group
    // holds still. On an empty square, the four around it come out and every
    // other bubble is drawn back in.
    const visit = (i, j) => {
      const r = run;
      const cell = r.shown.get(`${i},${j}`) ?? null;
      heat(cell);
      if (cell) return;
      r.center = { i, j };
      const keep = new Set(SIDES.map(([di, dj]) => `${i + di},${j + dj}`));
      for (const [key, other] of r.shown) {
        if (keep.has(key)) continue;
        r.shown.delete(key);
        leave(other);
      }
      let n = 0;
      for (const [di, dj] of SIDES) {
        if (!r.shown.has(`${i + di},${j + dj}`)) place(i + di, j + dj, n++ * STAGGER);
      }
    };

    const follow = () => {
      const r = run;
      // Anywhere on the grown bubble still counts as on it.
      const hot = r.hot;
      const dx = Math.abs(r.x - hot?.x.t);
      const dy = Math.abs(r.y - hot?.y.t);
      if (hot && Math.max(dx, dy) <= HOT_R) return;
      const i = Math.round((r.x - r.px) / PITCH);
      const j = Math.round((r.y - r.py) / PITCH);
      if (i === r.at.i && j === r.at.j) return;
      r.at = { i, j };
      visit(i, j);
    };

    // The bloom starts: the drop swells under the pointer, four come out of
    // it, and no text selection from here on.
    const begin = () => {
      const r = run;
      if (!setup()) {
        run = null;
        return;
      }
      r.free = measure();
      r.started = true;
      getSelection()?.removeAllRanges();
      html.dataset.blooming = '';
      // A drop still fading from the last bloom glides over; otherwise it starts here.
      drop.x.t = r.x;
      drop.y.t = r.y;
      if (drop.r.x < 0.5) {
        drop.x.x = r.x;
        drop.y.x = r.y;
        drop.x.v = drop.y.v = 0;
      }
      drop.wait = 0;
      tune(drop.r, OUT_SIZE);
      drop.r.t = DROP;
      visit(0, 0);
      follow();
      wake();
    };

    // Everything is drawn back into the release point, the nearest first, and
    // the drop goes last.
    const dismiss = (x, y) => {
      const r = run;
      if (!r) return;
      run = null;
      clearTimeout(r.timer);
      delete html.dataset.blooming;
      if (!r.started) return;
      drop.x.t = x;
      drop.y.t = y;
      const shown = [...r.shown.values()].sort((a, b) => Math.hypot(a.hx - x, a.hy - y) - Math.hypot(b.hx - x, b.hy - y));
      shown.forEach((cell, n) => leave(cell, Math.min(n, 4) * RELEASE_STAGGER, true));
      // Bubbles still leaving from earlier drags hurry up too.
      cells.forEach((cell) => cell.leaving && leave(cell, 0, true));
      drop.wait = reduce() ? 0 : 0.06 + Math.min(shown.length, 4) * RELEASE_STAGGER;
      tune(drop.r, RELEASE_SIZE);
      drop.r.t = 0;
      wake();
    };

    const down = (event) => {
      if (event.button !== 0 || !event.isPrimary || failed) return;
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      if (!scope.contains(event.target) || event.target.closest(IGNORE)) return;
      if (run) dismiss(event.clientX, event.clientY);
      const x = event.clientX;
      const y = event.clientY;
      run = {
        px: x,
        py: y,
        x,
        y,
        at: { i: 0, j: 0 },
        center: { i: 0, j: 0 },
        shown: new Map(),
        hot: null,
        started: false,
        free: null,
        timer: 0,
        deck: shuffle(photos.map((_, index) => index)),
        dealt: 0,
      };
      run.timer = setTimeout(begin, WAIT);
    };
    const move = (event) => {
      const r = run;
      if (!r) return;
      r.x = event.clientX;
      r.y = event.clientY;
      if (r.started) {
        drop.x.t = r.x;
        drop.y.t = r.y;
        follow();
        wake();
      }
      // Moved before the bloom began: a drag, most likely selecting text.
      else if (Math.hypot(r.x - r.px, r.y - r.py) > SLOP) dismiss(r.x, r.y);
    };
    const up = (event) => {
      const r = run;
      if (!r) return;
      const picked = event.type === 'pointerup' && r.hot ? photos[r.hot.index] : null;
      dismiss(event.clientX, event.clientY);
      if (picked) setOpen(picked);
    };
    const away = () => run && dismiss(run.x, run.y);

    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', away);
    // The bubbles are fixed to the screen, so a scroll would slide the content under them.
    window.addEventListener('scroll', away, { capture: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('blur', away);
      window.removeEventListener('scroll', away, { capture: true });
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      window.cancelIdleCallback?.(idle);
      clearTimeout(idle);
      if (run) clearTimeout(run.timer);
      cancelAnimationFrame(frame);
      run = null;
      cells = [];
      delete html.dataset.blooming;
      gl?.clear();
      releaseContext(gl?.gl);
    };
  }, [enabled, mounted]);

  return (
    <>
      <span ref={anchor} hidden />
      {mounted &&
        enabled &&
        createPortal(
          <canvas ref={surface} aria-hidden className="pointer-events-none fixed inset-0 z-[60] size-full" />,
          document.body,
        )}

      <Dialog.Root open={!!open} onOpenChange={(next) => !next && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ease-snappy data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-[70] flex -translate-1/2 flex-col gap-3 rounded-xl bg-paper p-2 pb-3 shadow-2xl outline-none transition-[opacity,scale] duration-200 ease-snappy data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0">
            {open && (
              <>
                <img
                  src={full(open.id)}
                  alt=""
                  width={open.width}
                  height={open.height}
                  className="block max-h-[calc(100dvh-8rem)] w-auto max-w-[calc(100vw-4rem)] rounded-md bg-body/[0.04] object-contain"
                  style={{ aspectRatio: `${open.width} / ${open.height}` }}
                />
                <div className="flex items-center justify-between gap-4 px-2">
                  <Dialog.Title className="text-base font-medium tracking-normal text-ink">Photography</Dialog.Title>
                  <Dialog.Close
                    aria-label="Close"
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-body/80 transition-colors outline-none hover:bg-ink/10 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <X weight="bold" aria-hidden className="size-4" />
                  </Dialog.Close>
                </div>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

const full = (id) => `/images/visuals/${id}.jpg`;

// The list, in a random order (Fisher–Yates).
function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
