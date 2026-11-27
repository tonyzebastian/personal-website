'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowLeft, ArrowRight, X } from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// An endless masonry wall of images you drag around, after thiings.co. Laid out like the About galleries
// (react-plock): fixed-width columns, each image at its own proportions, one
// even gap, so differently sized images pack without leftover space.
// react-plock lays out a finite list once, so the same rule runs here
// endlessly: every column is its own never-ending stack of all the images (in
// a fixed order, starting at a different point per column), so any image's
// position is arithmetic and only the ones near the screen are rendered. The
// visible area holds one layer moved with a single translate; React
// re-renders only when the set of visible images changes. Released, the wall
// glides on and slows with friction (about 5% a frame at 60fps, scaled by
// the time that passed). A wheel or trackpad pans it too; a click opens the
// image in a viewer that steps through them all (365 Days of Drawing).
//   items        [{ key, thumb, large, width, height, title, alt }]
//   collection   the name shown beside an item's title in the viewer
//   card         optional intro card's content: a square two columns wide
//                that the wall starts centred on (without one, the wall
//                starts at its top left)
//   cardClass    its background and padding
//   label        the wall's accessible name (how to move around)
//   width        column width
//   step         the order each column runs through: every step-th image
//                (moved on until it shares no factor with the count, so every
//                image appears once per lap)
//   spread       how far apart neighbouring columns start in that order
//   stagger      shifts columns down by different amounts, so a wall of
//                same-sized images doesn't line up in rows

const GAP = 12; // between columns and between images
const FRICTION = 0.95; // velocity kept per 60fps frame while gliding
const FRAME = 1000 / 60;
const OVERSCAN = 240; // px drawn beyond each edge
const MAX_SPEED = 3; // px per ms, so a flick can't fling the wall miles

const mod = (n, m) => ((n % m) + m) % m;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function makeLayout(items, width, preferredStep, spread, stagger, hasCard) {
  const count = items.length;
  const pitch = width + GAP;
  let step = preferredStep;
  while (gcd(step, count) !== 1) step++;
  const sequence = Array.from({ length: count }, (_, k) => mod(k * step, count));
  const heightOf = (index) => Math.round((width * items[index].height) / items[index].width);
  // starts[n]: where the nth image of a lap begins; lap: one lap's height.
  const starts = [0];
  for (const index of sequence) starts.push(starts[starts.length - 1] + heightOf(index) + GAP);
  const lap = starts[count];
  const top = (n) => Math.floor(n / count) * lap + starts[mod(n, count)];
  const offset = (column) => mod(column * spread, count);
  // How far each column is shifted down (never the two under the card).
  const average = lap / count;
  const shiftOf = (column) =>
    !stagger || (hasCard && (column === 0 || column === 1)) ? 0 : Math.round(mod(column * 0.618, 1) * average);

  // The intro card: a square two columns wide over columns 0 and 1. It sits
  // where both columns' images end almost level (the closest pair of
  // boundaries in the middle of a lap), so no gap shows above it; below it
  // both columns carry on after one GAP. split: each column's first position
  // below the card; push: how far that and the rest move down.
  const size = width * 2 + GAP;
  const height = size;
  const card = (() => {
    if (!hasCard) return { y: 0, size: 0, height: 0, split: {}, push: {} };
    const ends = [0, 1].map((column) => {
      const shift = offset(column);
      const base = top(shift);
      return Array.from({ length: count }, (_, k) => [top(shift + k) - base, shift + k]);
    });
    let best = null;
    let j = 0;
    for (const [ya, na] of ends[0]) {
      if (ya < lap * 0.3 || ya > lap * 0.7) continue;
      while (j < count - 1 && ends[1][j + 1][0] <= ya) j++;
      for (const [yb, nb] of [ends[1][j], ends[1][j + 1]].filter(Boolean)) {
        const d = Math.abs(ya - yb);
        if (!best || d < best.d) best = { d, ya, na, yb, nb };
      }
    }
    const y = Math.max(best.ya, best.yb);
    return {
      y,
      size,
      height,
      split: { 0: best.na, 1: best.nb },
      push: { 0: y - best.ya + height + GAP, 1: y - best.yb + height + GAP },
    };
  })();

  // The last position n whose image starts at or above y.
  const positionAt = (y) => {
    const laps = Math.floor(y / lap);
    const within = y - laps * lap;
    let lo = 0;
    let hi = count - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= within) lo = mid;
      else hi = mid - 1;
    }
    return laps * count + lo;
  };

  // Images that overlap the area [x0, x1] × [y0, y1] of the wall.
  const visible = (x0, x1, y0, y1) => {
    const shown = [];
    for (let column = Math.floor(x0 / pitch); column <= Math.floor(x1 / pitch); column++) {
      const shift = offset(column);
      const base = top(shift);
      const down = shiftOf(column);
      // Columns under the card move everything from its split down past it.
      const split = card.split[column];
      const push = split === undefined ? 0 : card.push[column];
      const yOf = (n) => top(n) - base + down + (split !== undefined && n >= split ? push : 0);
      let n = positionAt(y0 - down + base);
      if (split !== undefined && n >= split) n = Math.max(split, positionAt(y0 - down - push + base));
      for (; yOf(n) <= y1; n++) {
        const index = sequence[mod(n, count)];
        shown.push({ key: `${column}:${n - shift}`, column, y: yOf(n), index, height: heightOf(index) });
      }
    }
    return shown;
  };

  return { pitch, card, visible };
}

const ACTION = cn(
  buttonVariants({ variant: 'outline', size: 'icon-sm' }),
  'border-body/15 bg-transparent text-body/80 hover:border-body/30 hover:bg-transparent hover:text-ink',
);

export default function Wall({
  items,
  collection,
  card: cardContent,
  cardClass = 'bg-[#ede9df] p-7',
  label,
  width = 160,
  step = 23,
  spread = 157,
  stagger = false,
}) {
  const hasCard = Boolean(cardContent);
  const layout = useMemo(
    () => makeLayout(items, width, step, spread, stagger, hasCard),
    [items, width, step, spread, stagger, hasCard],
  );
  const { pitch, card, visible } = layout;
  const viewRef = useRef(null);
  const worldRef = useRef(null);
  // Pan offset and motion live in a ref; only the visible images are state.
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0, drag: null, moved: false, frame: 0, last: 0, width: 0, height: 0 });
  const [shown, setShown] = useState([]);
  const [open, setOpen] = useState(null); // index into items, or null

  useLayoutEffect(() => {
    const view = viewRef.current;
    const state = motion.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Moves the layer and, when the set of visible images changes, updates
    // it (compared by key, so most frames cause no render).
    let keys = '';
    const apply = () => {
      worldRef.current.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
      const next = visible(
        -state.x - OVERSCAN,
        state.width - state.x + OVERSCAN,
        -state.y - OVERSCAN,
        state.height - state.y + OVERSCAN,
      );
      const nextKeys = next.map((item) => item.key).join();
      if (nextKeys !== keys) {
        keys = nextKeys;
        setShown(next);
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

    // Start centred on the intro card, or a little in from the top left.
    const box = view.getBoundingClientRect();
    state.width = box.width;
    state.height = box.height;
    state.x = card.size ? Math.round(box.width / 2 - card.size / 2) : -Math.round(pitch / 3);
    state.y = card.size ? Math.round(box.height / 2 - card.y - card.height / 2) : -Math.round(pitch / 4);
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
    // Clicks that ended a drag don't open an image.
    const onClick = (event) => {
      if (state.moved) {
        event.stopPropagation();
        event.preventDefault();
        state.moved = false;
      }
    };
    const onKey = (event) => {
      const move = { ArrowLeft: [pitch, 0], ArrowRight: [-pitch, 0], ArrowUp: [0, pitch], ArrowDown: [0, -pitch] }[event.key];
      if (!move || event.target !== view) return;
      event.preventDefault();
      stopGlide();
      state.x += move[0];
      state.y += move[1];
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
  }, [card, pitch, visible]);

  const cells = shown.map(({ key, column, y, index, height }) => {
    const item = items[index];
    return (
      <button
        key={key}
        type="button"
        onClick={() => setOpen(index)}
        aria-label={`Open ${item.title}`}
        className="group absolute top-0 left-0 overflow-hidden rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ width, height, transform: `translate(${column * pitch}px, ${y}px)` }}
      >
        <img
          src={item.thumb}
          alt=""
          width={width}
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
        aria-label={label}
        className="absolute inset-0 cursor-grab touch-none overflow-hidden bg-canvas outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-dragging:cursor-grabbing"
      >
        <div ref={worldRef} className="absolute top-0 left-0 will-change-transform">
          {cardContent && (
          <section
            aria-label="About this project"
            className={`absolute top-0 left-0 flex flex-col justify-center rounded-[3px] text-ink ${cardClass}`}
            style={{ width: card.size, height: card.height, transform: `translateY(${card.y}px)` }}
          >
            {cardContent}
          </section>
          )}
          {cells}
        </div>
      </div>
      <Viewer items={items} collection={collection} index={open} onIndex={setOpen} />
    </>
  );
}

// One image at a time, in the Playground's lightbox style: a top bar with
// "Title | Collection", previous and next, and close.
function Viewer({ items, collection, index, onIndex }) {
  const isOpen = index !== null;
  const item = isOpen ? items[index] : null;
  const step = (direction) => onIndex((current) => mod(current + direction, items.length));

  // Esc closes the viewer only (marked handled so the panel stays open);
  // the arrow keys step through the images.
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
              <Dialog.Title render={<span />}>{item?.title ?? ''}</Dialog.Title>
              <span aria-hidden className="px-2.5 font-normal text-body/25">
                |
              </span>
              <Dialog.Description render={<span />} className="font-normal text-body/70">
                {collection}
              </Dialog.Description>
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={() => step(-1)} aria-label="Previous" className={ACTION}>
                <ArrowLeft weight="bold" aria-hidden />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next" className={ACTION}>
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
            {item && (
              <img
                key={item.key}
                src={item.large}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="size-full object-contain"
              />
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
