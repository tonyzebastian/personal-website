'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CoverGrid from '@/components/CoverGrid';
import Row from '@/components/Row';
import ViewToggle from '@/components/ViewToggle';
import { MORPH, STAGGER, cloneBox, cloneLayer, cloneText, finishMorph, flipText, measure } from '@/lib/morph';
import { VIEW_KEYS } from '@/lib/views';

// The Playground section of the home page. Two views of the same entries,
// switched from the header like Musings:
//   grid   the bento (CoverGrid), the default
//   list   plain rows (title, and its `kind` on the right); hovering one floats
//          a preview of its cover beside the pointer (Peek)
// The view lives on <html data-playground> (set before paint by VIEW_SCRIPT in
// lib/views.js), so both are rendered and CSS shows one (.playground-* in
// globals.css).
//
// Switching morphs one view into the other (lib/morph.js): each tile folds
// into its row (a copy, still on its current frame, slides onto the row while
// its clip closes down to the row's height, and fades) or opens out of it the
// same way in reverse; titles fly between the tile's label and the row.

const getView = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.playground === 'list' ? 'list' : 'grid';

export default function Playground({ items }) {
  const [view, setView] = useState('grid');
  const sectionRef = useRef(null);
  const busy = useRef(null);

  useEffect(() => {
    setView(getView());
    return () => finishMorph(busy);
  }, []);

  const switchTo = useCallback((next) => {
    const section = sectionRef.current;
    if (!section || getView() === next) return;
    finishMorph(busy);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = getView();
    const panes = section.querySelector('[data-panes]');
    const before = reduce ? null : snapshot(section, from);
    const fromHeight = panes.getBoundingClientRect().height;

    document.documentElement.dataset.playground = next;
    setView(next);
    try {
      localStorage.setItem(VIEW_KEYS.playground, next);
    } catch {}
    // Tiles kept out of sight in the list have not faded in yet; the morph
    // brings them in itself.
    if (next === 'grid') section.querySelectorAll('.cover-reveal').forEach((tile) => tile.classList.add('is-in'));

    const toHeight = panes.getBoundingClientRect().height;
    const animations = [];
    const clones = [];
    busy.current = { animations, clones };

    if (reduce) {
      animations.push(panes.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: MORPH.easing }));
      return;
    }

    panes.style.overflowY = 'clip';
    animations.push(panes.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], MORPH));

    const after = snapshot(section, next);
    const layer = cloneLayer(section);
    clones.push(layer);

    after.forEach((b, i) => {
      const a = before[i];
      if (!a?.box || !b?.box) return;
      const timing = { ...MORPH, delay: i * STAGGER, fill: 'backwards' };

      if (next === 'list') {
        const tile = a;
        const row = b;
        // The tile, copied, slides onto its row and closes down to it.
        const copy = cloneBox(tile.box.el, tile.box, layer);
        animations.push(
          copy.animate(
            [
              { transform: 'none', clipPath: 'inset(0 round 16px)', opacity: 1 },
              { opacity: 0.5, offset: 0.4 },
              {
                transform: `translate(${row.box.left - tile.box.left}px, ${row.box.top - tile.box.top}px)`,
                clipPath: fold(tile.box, row.box),
                opacity: 0,
              },
            ],
            { ...timing, fill: 'both' },
          ),
        );
        // Its name flies from the label into the row; the kind fades in.
        if (tile.title && row.title) {
          animations.push(
            row.title.el.animate(
              [
                { transform: flipText(tile.title, row.title), opacity: 0 },
                { transform: 'none', opacity: 1 },
              ],
              timing,
            ),
          );
        }
        if (row.date) {
          animations.push(
            row.date.el.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: 300,
              easing: MORPH.easing,
              delay: 160 + i * STAGGER,
              fill: 'backwards',
            }),
          );
        }
      } else {
        const row = a;
        const tile = b;
        // The tile opens out of its row, the reverse of the fold.
        animations.push(
          tile.box.el.animate(
            [
              {
                transform: `translate(${row.box.left - tile.box.left}px, ${row.box.top - tile.box.top}px)`,
                clipPath: fold(tile.box, row.box),
                opacity: 0,
              },
              { opacity: 1, offset: 0.5 },
              { transform: 'none', clipPath: 'inset(0 round 16px)', opacity: 1 },
            ],
            timing,
          ),
        );
        // The row's name, copied, flies down to the label and fades.
        if (row.title && tile.title) {
          const old = cloneText(row.title, layer);
          animations.push(
            old.animate(
              [
                { transform: 'none', opacity: 1 },
                {
                  transform: `translate(${tile.title.left - row.title.left}px, ${tile.title.top - row.title.top}px) scale(${tile.title.font / row.title.font})`,
                  opacity: 0,
                },
              ],
              { ...timing, duration: MORPH.duration * 0.6, fill: 'both' },
            ),
          );
        }
      }
    });

    Promise.all(animations.map((anim) => anim.finished)).then(
      () => finishMorph(busy),
      () => {},
    );
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="playground" className="relative flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 id="playground" className="font-sans text-base font-semibold tracking-normal">
          Playground
        </h2>
        <ViewToggle
          name="playground"
          view={view}
          onChange={switchTo}
          options={[
            { value: 'list', label: 'List' },
            { value: 'grid', label: 'Tile' },
          ]}
        />
      </div>

      <div data-panes>
        <div className="playground-list">
          <PeekList items={items} />
        </div>
        <div className="playground-grid">
          <CoverGrid items={items} />
        </div>
      </div>
    </section>
  );
}

// The clip that shows only the row's footprint of a tile placed on the row's
// top left: as wide as the row (or the whole tile, if narrower) and the row's
// height.
function fold(tile, row) {
  const right = Math.max(0, tile.width - row.width);
  const bottom = Math.max(0, tile.height - row.height);
  return `inset(0 ${right}px ${bottom}px 0 round 6px)`;
}

// Where each entry's pieces sit in a view, in screen pixels.
function snapshot(section, view) {
  if (view === 'grid') {
    return [...section.querySelectorAll('.playground-grid .bento-tile')].map((tile) => ({
      box: measure(tile, false),
      title: measure(tile.querySelector('[data-morph="title"]')),
    }));
  }
  return [...section.querySelectorAll('.playground-list [data-item]')].map((item) => {
    const visible = (el) => el && el.getClientRects().length > 0;
    const pick = (selector) => [...item.querySelectorAll(selector)].find(visible);
    return {
      box: measure(item.querySelector('a'), false),
      title: measure(pick('[data-morph="title"]')),
      date: measure(pick('[data-morph="date"]')),
    };
  });
}

// ——— The list and its hover preview ———

// The rows, after the hero links on justinschueler.com: hovering one floats
// its cover (the clip, or the still) in a card beside the pointer. One card
// serves every row. It trails the pointer (it moves FOLLOW of the way there
// each frame), sits OFFSET px below and to the right, and flips to the other
// side near the window's edges. It comes in by growing from 94% at its top
// left corner, sharpening out of a blur and fading (.playground-peek in
// globals.css); moving to the next row swaps the cover without replaying
// that. It leaves when the pointer leaves the rows (after a 60ms grace, so
// gaps between rows don't flicker it) and on scroll. Pointer devices only.
const OFFSET = 20;
const FOLLOW = 0.16;

function PeekList({ items }) {
  const [active, setActive] = useState(null); // the entry shown (kept while fading out)
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const card = useRef(null);
  const motion = useRef({ x: 0, y: 0, tx: 0, ty: 0, frame: 0, hide: 0 });

  useEffect(() => {
    setMounted(true);
    const m = motion.current;
    const away = () => setVisible(false);
    window.addEventListener('scroll', away, { passive: true });
    return () => {
      window.removeEventListener('scroll', away);
      cancelAnimationFrame(m.frame);
      clearTimeout(m.hide);
    };
  }, []);

  const canPeek = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

  // The card's top left for the pointer at (tx, ty), kept on screen.
  const place = () => {
    const m = motion.current;
    const el = card.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    let x = m.tx + OFFSET;
    let y = m.ty + OFFSET;
    if (x + w > innerWidth - 12) x = m.tx - OFFSET - w;
    if (y + h > innerHeight - 12) y = m.ty - OFFSET - h;
    return [x, y];
  };

  const draw = () => {
    const m = motion.current;
    if (card.current) card.current.style.translate = `${m.x.toFixed(1)}px ${m.y.toFixed(1)}px`;
  };

  const tick = () => {
    const m = motion.current;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const [x, y] = place();
    const follow = reduce ? 1 : FOLLOW;
    m.x += (x - m.x) * follow;
    m.y += (y - m.y) * follow;
    draw();
    m.frame = Math.abs(x - m.x) + Math.abs(y - m.y) > 0.2 ? requestAnimationFrame(tick) : 0;
  };

  const track = (event) => {
    const m = motion.current;
    m.tx = event.clientX;
    m.ty = event.clientY;
    if (!m.frame) m.frame = requestAnimationFrame(tick);
  };

  const show = (item, event) => {
    if (!canPeek() || item.cover.placeholder) return;
    const m = motion.current;
    clearTimeout(m.hide);
    m.tx = event.clientX;
    m.ty = event.clientY;
    if (!visible) {
      // Start at the pointer, so it doesn't fly in from where it last was.
      card.current?.style.setProperty('--r', item.cover.aspect);
      [m.x, m.y] = place();
      draw();
    }
    setActive(item);
    setVisible(true);
  };

  const hide = () => {
    const m = motion.current;
    // The cover stays while the card fades, and is swapped on the next show.
    m.hide = setTimeout(() => setVisible(false), 60);
  };

  return (
    <>
      {items.map((item) => (
        <div
          key={item.href}
          data-item
          className="relative"
          onPointerEnter={(event) => show(item, event)}
          onPointerMove={track}
          onPointerLeave={hide}
        >
          <Row href={item.href} title={item.title} meta={[item.kind]} />
        </div>
      ))}
      {mounted &&
        createPortal(
          <div
            ref={card}
            aria-hidden
            className="playground-peek"
            data-visible={visible ? '' : undefined}
            style={{ '--r': active?.cover.aspect }}
          >
            {active && <PeekMedia cover={active.cover} />}
          </div>,
          document.body,
        )}
    </>
  );
}

function PeekMedia({ cover }) {
  const video = useRef(null);
  useEffect(() => {
    video.current?.play().catch(() => {});
  }, [cover.video]);
  return cover.video ? (
    <video key={cover.video} ref={video} src={cover.video} muted loop playsInline preload="auto" />
  ) : (
    <img key={cover.image} src={cover.image} alt="" decoding="async" />
  );
}
