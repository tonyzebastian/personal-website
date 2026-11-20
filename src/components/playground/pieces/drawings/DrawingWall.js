'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowLeft, ArrowRight, X } from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import drawings from '@/lib/drawings.json';

// 365 Days of Drawing: an endless masonry wall of the drawings you drag
// around, after thiings.co. Laid out like the About galleries (react-plock):
// fixed-width columns, each drawing at its own proportions, one even gap, so
// differently sized drawings pack without leftover space. react-plock itself
// lays out a finite list once, so the same rule runs here endlessly: every
// column is its own never-ending stack of all 365 drawings (in a fixed order,
// starting at a different point per column), so any drawing's position is
// arithmetic and only the ones near the screen are rendered. The visible area
// holds one layer moved with a single translate; React re-renders only when
// the set of visible drawings changes. Released, the wall glides on and
// slows with friction (about 5% a frame at 60fps, scaled by the time that
// passed). A wheel or trackpad pans it too; a click opens the drawing.

const WIDTH = 160; // column width
const GAP = 12; // between columns and between drawings
const PITCH = WIDTH + GAP;
const FRICTION = 0.95; // velocity kept per 60fps frame while gliding
const FRAME = 1000 / 60;
const OVERSCAN = 240; // px drawn beyond each edge
const MAX_SPEED = 3; // px per ms, so a flick can't fling the wall miles

const count = drawings.length;
const label = (day) => String(day).padStart(3, '0');
const thumb = (day) => `/playground/drawings/thumbs/${label(day)}.webp`;
const large = (day) => `/playground/drawings/large/${label(day)}.webp`;
const mod = (n, m) => ((n % m) + m) % m;

// The order every column runs through: every 23rd drawing (23 and 365 share
// no factor, so all 365 appear once per lap). Heights at the column width.
const STEP = 23;
const sequence = Array.from({ length: count }, (_, k) => mod(k * STEP, count));
const heightOf = (index) => Math.round((WIDTH * drawings[index].height) / drawings[index].width);
// starts[n]: where the nth drawing of a lap begins; LAP: one lap's height.
const starts = [0];
for (const index of sequence) starts.push(starts[starts.length - 1] + heightOf(index) + GAP);
const LAP = starts[count];
const top = (n) => Math.floor(n / count) * LAP + starts[mod(n, count)];
// Where each column starts in the order, spread so neighbours differ.
const offset = (column) => mod(column * 157, count);

// The intro card: a square two columns wide over columns 0 and 1. It sits
// where both columns' drawings end almost level (the closest pair of
// boundaries in the middle of a lap, found once here), so no gap shows above
// it; below it both columns carry on after one GAP. split: each column's
// first position below the card; push: how far that and the rest move down.
const CARD = WIDTH * 2 + GAP;
const card = (() => {
  const ends = [0, 1].map((column) => {
    const shift = offset(column);
    const base = top(shift);
    return Array.from({ length: count }, (_, k) => [top(shift + k) - base, shift + k]);
  });
  let best = null;
  let j = 0;
  for (const [ya, na] of ends[0]) {
    if (ya < LAP * 0.3 || ya > LAP * 0.7) continue;
    while (j < count - 1 && ends[1][j + 1][0] <= ya) j++;
    for (const [yb, nb] of [ends[1][j], ends[1][j + 1]].filter(Boolean)) {
      const d = Math.abs(ya - yb);
      if (!best || d < best.d) best = { d, ya, na, yb, nb };
    }
  }
  const y = Math.max(best.ya, best.yb);
  return {
    y,
    split: { 0: best.na, 1: best.nb },
    push: { 0: y - best.ya + CARD + GAP, 1: y - best.yb + CARD + GAP },
  };
})();

// The last position n whose drawing starts at or above y.
function positionAt(y) {
  const lap = Math.floor(y / LAP);
  const within = y - lap * LAP;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= within) lo = mid;
    else hi = mid - 1;
  }
  return lap * count + lo;
}

// Drawings that overlap the area [x0, x1] × [y0, y1] of the wall.
function visible(x0, x1, y0, y1) {
  const items = [];
  for (let column = Math.floor(x0 / PITCH); column <= Math.floor(x1 / PITCH); column++) {
    const shift = offset(column);
    const base = top(shift);
    // Columns under the card move everything from its split down past it.
    const split = card.split[column];
    const push = split === undefined ? 0 : card.push[column];
    const yOf = (n) => top(n) - base + (split !== undefined && n >= split ? push : 0);
    let n = positionAt(y0 + base);
    if (split !== undefined && n >= split) n = Math.max(split, positionAt(y0 - push + base));
    for (; yOf(n) <= y1; n++) {
      const index = sequence[mod(n, count)];
      items.push({ key: `${column}:${n - shift}`, column, y: yOf(n), index, height: heightOf(index) });
    }
  }
  return items;
}

const ACTION = cn(
  buttonVariants({ variant: 'outline', size: 'icon-sm' }),
  'border-body/15 bg-transparent text-body/80 hover:border-body/30 hover:bg-transparent hover:text-ink',
);

export function Piece() {
  const viewRef = useRef(null);
  const worldRef = useRef(null);
  // Pan offset and motion live in a ref; only the visible drawings are state.
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0, drag: null, moved: false, frame: 0, last: 0, width: 0, height: 0 });
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(null); // index into drawings, or null

  useLayoutEffect(() => {
    const view = viewRef.current;
    const state = motion.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Moves the layer and, when the set of visible drawings changes, updates
    // it (compared by key, so most frames cause no render).
    let shown = '';
    const apply = () => {
      worldRef.current.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
      const next = visible(
        -state.x - OVERSCAN,
        state.width - state.x + OVERSCAN,
        -state.y - OVERSCAN,
        state.height - state.y + OVERSCAN,
      );
      const keys = next.map((item) => item.key).join();
      if (keys !== shown) {
        shown = keys;
        setItems(next);
      }
    };

    const glide = (now) => {
      const dt = Math.min(now - state.last, 64);
      state.last = now;
      state.x += state.vx * dt;
      state.y += state.vy * dt;
      const keep = FRICTION ** (dt / FRAME);
      state.vx *= keep;
      state.vy *= keep;
      apply();
      if (Math.hypot(state.vx, state.vy) > 0.01) state.frame = requestAnimationFrame(glide);
      else state.frame = 0;
    };
    const stopGlide = () => {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    };

    // Start centred on the intro card.
    const { width, height } = view.getBoundingClientRect();
    state.width = width;
    state.height = height;
    state.x = Math.round(width / 2 - CARD / 2);
    state.y = Math.round(height / 2 - card.y - CARD / 2);
    apply();

    const onDown = (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      stopGlide();
      state.vx = 0;
      state.vy = 0;
      state.moved = false;
      state.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: state.x, oy: state.y, t: performance.now() };
    };
    const onMove = (event) => {
      const drag = state.drag;
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!state.moved) {
        if (Math.hypot(dx, dy) < 4) return;
        state.moved = true;
        view.setPointerCapture(event.pointerId);
        view.dataset.dragging = '';
      }
      const now = performance.now();
      const dt = Math.max(now - drag.t, 1);
      const nx = drag.ox + dx;
      const ny = drag.oy + dy;
      // Smoothed release velocity, in px per ms.
      state.vx = state.vx * 0.2 + ((nx - state.x) / dt) * 0.8;
      state.vy = state.vy * 0.2 + ((ny - state.y) / dt) * 0.8;
      drag.t = now;
      state.x = nx;
      state.y = ny;
      apply();
    };
    const onUp = (event) => {
      const drag = state.drag;
      if (!drag || drag.id !== event.pointerId) return;
      state.drag = null;
      delete view.dataset.dragging;
      // A pause before letting go means no throw.
      if (performance.now() - drag.t > 80 || reduceMotion) {
        state.vx = 0;
        state.vy = 0;
      }
      const speed = Math.hypot(state.vx, state.vy);
      if (speed > MAX_SPEED) {
        state.vx *= MAX_SPEED / speed;
        state.vy *= MAX_SPEED / speed;
      }
      if (state.moved && (state.vx || state.vy)) {
        state.last = performance.now();
        state.frame = requestAnimationFrame(glide);
      }
    };
    const onWheel = (event) => {
      event.preventDefault();
      stopGlide();
      state.x -= event.deltaX;
      state.y -= event.deltaY;
      apply();
    };
    // Clicks that ended a drag don't open a drawing.
    const onClick = (event) => {
      if (state.moved) {
        event.stopPropagation();
        event.preventDefault();
        state.moved = false;
      }
    };
    const onKey = (event) => {
      const step = { ArrowLeft: [PITCH, 0], ArrowRight: [-PITCH, 0], ArrowUp: [0, PITCH], ArrowDown: [0, -PITCH] }[event.key];
      if (!step || event.target !== view) return;
      event.preventDefault();
      stopGlide();
      state.x += step[0];
      state.y += step[1];
      apply();
    };

    view.addEventListener('pointerdown', onDown);
    view.addEventListener('pointermove', onMove);
    view.addEventListener('pointerup', onUp);
    view.addEventListener('pointercancel', onUp);
    view.addEventListener('wheel', onWheel, { passive: false });
    view.addEventListener('click', onClick, true);
    view.addEventListener('keydown', onKey);
    const resize = new ResizeObserver(([entry]) => {
      state.width = entry.contentRect.width;
      state.height = entry.contentRect.height;
      apply();
    });
    resize.observe(view);
    return () => {
      stopGlide();
      resize.disconnect();
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onUp);
      view.removeEventListener('wheel', onWheel);
      view.removeEventListener('click', onClick, true);
      view.removeEventListener('keydown', onKey);
    };
  }, []);

  const cells = items.map(({ key, column, y, index, height }) => {
    const drawing = drawings[index];
    return (
      <button
        key={key}
        type="button"
        onClick={() => setOpen(index)}
        aria-label={`Open the drawing from day ${drawing.day}`}
        className="group absolute top-0 left-0 overflow-hidden rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ width: WIDTH, height, transform: `translate(${column * PITCH}px, ${y}px)` }}
      >
        <img
          src={thumb(drawing.day)}
          alt=""
          width={WIDTH}
          height={height}
          decoding="async"
          draggable={false}
          className="size-full object-cover transition-transform duration-200 ease-snappy [@media(hover:hover)]:group-hover:scale-105"
        />
      </button>
    );
  });

  return (
    <>
      <div
        ref={viewRef}
        tabIndex={0}
        aria-label="365 drawings. Drag, scroll or use the arrow keys to move around; choose a drawing to open it."
        className="absolute inset-0 cursor-grab touch-none overflow-hidden bg-canvas outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-dragging:cursor-grabbing"
      >
        <div ref={worldRef} className="absolute top-0 left-0 will-change-transform">
          <section
            aria-label="About this project"
            className="absolute top-0 left-0 flex flex-col justify-center rounded-[3px] bg-[#ede9df] p-7 text-ink"
            style={{ width: CARD, height: CARD, transform: `translateY(${card.y}px)` }}
          >
            <span className="text-[10px] tracking-[0.08em] text-body/70 uppercase">May 2020 to May 2021</span>
            <h2 className="mt-4 mb-3 font-serif text-[2rem] leading-[1.05] tracking-[-0.035em] text-ink">
              365 days
              <br />
              of drawing
            </h2>
            <p className="text-[13px] leading-normal text-body">
              One illustration, every day, for a year. A collection of experiments in colour, places and little stories.
            </p>
            <span className="mt-5 text-[11px] text-body/70">Drag around to explore</span>
          </section>
          {cells}
        </div>
      </div>
      <Viewer index={open} onIndex={setOpen} />
    </>
  );
}

// One drawing at a time, in the Playground's lightbox style: a top bar with
// "Day 001 | 365 Days of Drawing", previous and next, and close.
function Viewer({ index, onIndex }) {
  const isOpen = index !== null;
  const drawing = isOpen ? drawings[index] : null;
  const step = (direction) => onIndex((current) => mod(current + direction, count));

  // Esc closes the viewer only (marked handled so the panel stays open);
  // the arrow keys step through the days.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onIndex(null);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        step(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(next) => !next && onIndex(null)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ease-snappy data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-3 z-[70] flex flex-col overflow-hidden rounded-xl bg-paper shadow-2xl outline-none transition-[opacity,scale] duration-200 ease-snappy data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 md:inset-8">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-3 pl-5 md:pl-6">
            <p className="min-w-0 truncate text-lg font-medium text-ink">
              <Dialog.Title render={<span />}>Day {drawing ? label(drawing.day) : ''}</Dialog.Title>
              <span aria-hidden className="px-2.5 font-normal text-body/25">
                |
              </span>
              <Dialog.Description render={<span />} className="font-normal text-body/70">
                365 Days of Drawing
              </Dialog.Description>
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={() => step(-1)} aria-label="Previous day" className={ACTION}>
                <ArrowLeft weight="bold" aria-hidden />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next day" className={ACTION}>
                <ArrowRight weight="bold" aria-hidden />
              </button>
              <Dialog.Close
                aria-label="Close"
                className="ml-1.5 grid size-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-body/80 transition-colors outline-none hover:bg-ink/10 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X weight="bold" aria-hidden className="size-4" />
              </Dialog.Close>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 bg-body/[0.03] p-4 md:p-8">
            {drawing && (
              <img
                key={drawing.day}
                src={large(drawing.day)}
                alt={`Drawing from day ${drawing.day}`}
                width={drawing.width}
                height={drawing.height}
                className="size-full object-contain"
              />
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
