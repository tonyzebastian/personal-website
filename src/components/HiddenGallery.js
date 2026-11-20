'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { X } from '@phosphor-icons/react';
import photos from '@/lib/photos.json';

// A hidden gallery behind the home page. The list area is split into an
// invisible grid of CELL px squares; a few squares, in two bands at the top
// and bottom of the page (layout), hold one of my photographs (the About page's
// photography set; small square thumbnails in public/images/visuals/thumbs). They
// can't be seen until the pointer comes near: each one fades and grows in as
// the pointer approaches (fully shown within NEAR px, gone beyond FAR) and
// fades away again as it leaves. Click one to see the photo in a dialog.
//
// The layer covers the whole home list behind its content and scrolls with
// it, narrowing with the list when the side panel opens. Content sits above it
// (.home-flow in globals.css lets pointer events through everywhere but the
// column). Pointer devices from 1024px wide only: on touch there's nothing to
// come near with.

const CELL = 16; // px, one square
const COUNT = 50; // squares that hold a photo
const NEAR = 56; // px from a square's centre at which it is fully shown
const FAR = 190; // px beyond which it is hidden
const LOAD = 420; // px: a square's image starts loading once the pointer is this close
const MARGIN = 24; // px kept clear around the content the photos avoid
const GAP_NEAR = 44; // px between photo centres at the page's edge (an empty square between)
const GAP_FAR = 88; // px between photo centres at a band's inner side

export default function HiddenGallery() {
  const [enabled, setEnabled] = useState(false);
  const [cells, setCells] = useState([]);
  const [open, setOpen] = useState(null); // the photo in the dialog
  const layer = useRef(null);

  useEffect(() => {
    // Pointer devices with room beside the column (lg and up) only.
    const query = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Lay the squares out for the layer's size and the column's place.
  useEffect(() => {
    if (!enabled) return;
    const el = layer.current;
    const lay = () => setCells(layout(el));
    lay();
    const observer = new ResizeObserver(lay);
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  // Show each square by how near the pointer is.
  useEffect(() => {
    if (!enabled || !cells.length) return;
    const el = layer.current;
    const squares = [...el.querySelectorAll('[data-square]')];
    let frame = 0;
    let px = -1e4;
    let py = -1e4;

    const draw = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      squares.forEach((square, i) => {
        const cell = cells[i];
        const cx = box.left + cell.x + CELL / 2;
        const cy = box.top + cell.y + CELL / 2;
        const d = Math.hypot(px - cx, py - cy);
        const t = 1 - smoothstep(NEAR, FAR, d);
        square.style.opacity = t.toFixed(3);
        square.style.scale = (0.85 + 0.15 * t).toFixed(3);
        square.style.pointerEvents = t > 0.2 ? 'auto' : 'none';
        if (d < LOAD) {
          const img = square.firstElementChild;
          if (!img.getAttribute('src')) img.setAttribute('src', img.dataset.src);
        }
      });
    };
    const move = (event) => {
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const away = () => {
      px = py = -1e4;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    // Scrolling moves the page over the squares, so look again.
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', scroll, { capture: true, passive: true });
    document.documentElement.addEventListener('pointerleave', away);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scroll, { capture: true });
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', away);
    };
  }, [enabled, cells]);

  return (
    <>
      <div
        ref={layer}
        className="hidden-gallery pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {enabled &&
          cells.map((cell) => (
            <button
              key={`${cell.x},${cell.y}`}
              type="button"
              data-square
              data-cursor="View"
              tabIndex={-1}
              aria-label="Open photo"
              onClick={() => setOpen(cell.photo)}
              className="hidden-gallery-square"
              style={{ left: cell.x, top: cell.y, width: CELL, height: CELL }}
            >
              <img data-src={thumb(cell.photo.id)} alt="" decoding="async" />
            </button>
          ))}
      </div>

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

const thumb = (id) => `/images/visuals/thumbs/${id}.webp`;
const full = (id) => `/images/visuals/${id}.jpg`;

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// The COUNT squares that hold a photo, for the layer's current size. Photos
// go in two bands of the page:
//   top     from the top of the page down to the hero's name and tagline
//           ([data-gallery-top]), from just left of the reading column to the
//           right edge
//   bottom  from the end of Playground ([data-gallery-bottom]) to the bottom
//           of the page, the full width, around the footer
// keeping clear of anything marked [data-gallery-avoid] (my photo, the name,
// the footer links). In each band photos are packed at the page's edge and
// thin out towards the content: they are spaced evenly (blue noise, so none
// touch or clump), GAP_NEAR px between centres at the edge widening to GAP_FAR
// at the band's inner side. Candidates are tried in a fixed random order (a
// hash of each square's place, weighted towards the edge), so a resize keeps
// most of the layout. Neighbouring photos are never the same picture.
function layout(el) {
  const width = el.clientWidth;
  const height = el.clientHeight;
  const box = el.getBoundingClientRect();
  const local = (rect) => ({
    left: rect.left - box.left,
    right: rect.right - box.left,
    top: rect.top - box.top,
    bottom: rect.bottom - box.top,
  });
  const find = (selector) => {
    const node = el.parentElement.querySelector(selector);
    return node ? local(node.getBoundingClientRect()) : null;
  };
  const column = find('[data-reading-column]');
  const top = find('[data-gallery-top]');
  const bottom = find('[data-gallery-bottom]');
  const avoid = [...el.parentElement.querySelectorAll('[data-gallery-avoid]')].map((node) =>
    local(node.getBoundingClientRect()),
  );

  const bands = [];
  if (top) bands.push({ from: 0, to: top.bottom + MARGIN, left: column ? column.left - 96 : 0, edge: 'top' });
  if (bottom) bands.push({ from: bottom.bottom + MARGIN, to: height, left: 0, edge: 'bottom' });

  const cols = Math.floor(width / CELL);
  const x0 = (width - cols * CELL) / 2;
  const candidates = [];
  for (const band of bands) {
    const size = band.to - band.from;
    if (size < CELL) continue;
    for (let y = band.from; y + CELL <= band.to; y += CELL) {
      for (let col = 0; col < cols; col++) {
        const x = x0 + col * CELL;
        if (x < band.left) continue;
        const clash = avoid.some(
          (r) => x + CELL > r.left - MARGIN && x < r.right + MARGIN && y + CELL > r.top - MARGIN && y < r.bottom + MARGIN,
        );
        if (clash) continue;
        const cx = x + CELL / 2;
        const cy = y + CELL / 2;
        // 0 at the page's edge, 1 at the band's inner side.
        const t = Math.min(1, (band.edge === 'top' ? cy - band.from : band.to - cy) / size);
        // Keyed by column and distance from the band's edge, so photos stay
        // put as the page grows or shrinks.
        const key = `${band.edge}:${col}:${Math.round((band.edge === 'top' ? y - band.from : band.to - y) / CELL)}`;
        const weight = 1 + 3 * (1 - t) ** 2;
        candidates.push({ x, y, cx, cy, key, gap: GAP_NEAR + (GAP_FAR - GAP_NEAR) * t, score: hash(key) ** (1 / weight) });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const cells = [];
  for (const c of candidates) {
    if (cells.length === COUNT) break;
    if (cells.some((o) => Math.hypot(o.cx - c.cx, o.cy - c.cy) < Math.max(c.gap, o.gap))) continue;
    // A picture, but not one already used close by.
    const near = new Set(cells.filter((o) => Math.hypot(o.cx - c.cx, o.cy - c.cy) < 6 * CELL).map((o) => o.photo));
    let index = Math.floor(hash(`${c.key}#`) * photos.length);
    for (let i = 0; i < photos.length && near.has(photos[index]); i++) index = (index + 1) % photos.length;
    cells.push({ ...c, photo: photos[index] });
  }
  return cells;
}

// A stable number in [0, 1) for a string.
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
