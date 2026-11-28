'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Row from '@/components/Row';
import { ActivePathContext, PanelLink } from '@/components/panel/ActivePath';
import ViewToggle from '@/components/ViewToggle';
import { MORPH, STAGGER, cloneBox, cloneLayer, cloneText, finishMorph, flipBox, flipText, measure } from '@/lib/morph';
import { VIEW_KEYS } from '@/lib/views';

// The Musings section of the home page, after the Thoughts rail on
// justinschueler.com. Two views of the same pieces, switched from the header:
//   cards  a rail of paper cards, each a miniature of the article (title, date
//          and its opening paragraphs, fading out). It snaps to the column's
//          left edge and runs out to the edge of the list area; cards that are
//          not current shrink and fade. Swipe, scroll or drag it; click a side
//          card to bring it forward, the front one to read it
//   list   the plain rows
// The view lives on <html data-musings> (set before paint by
// VIEW_SCRIPT in lib/views.js for returning visitors), so the server renders both and
// CSS shows one: no flash, nothing to hydrate first. globals.css has the styles
// (.musings-*).
//
// Switching morphs one view into the other (a FLIP done with Web Animations):
// each title and date flies to its new place while a copy of the old one fades
// out over it, the paper grows out of its row or shrinks back into it, and the
// section's height eases to fit.

const getView = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.musings === 'list' ? 'list' : 'cards';

export default function Musings({ items }) {
  const [view, setView] = useState('cards');
  const sectionRef = useRef(null);
  const railRef = useRef(null);
  const busy = useRef(null); // the morph under way: { animations, clones }

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

    document.documentElement.dataset.musings = next;
    setView(next);
    try {
      localStorage.setItem(VIEW_KEYS.musings, next);
    } catch {}

    const toHeight = panes.getBoundingClientRect().height;
    const animations = [];
    const clones = [];
    busy.current = { animations, clones };

    if (reduce) {
      animations.push(panes.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: MORPH.easing }));
      return;
    }

    // The section grows or shrinks to the new view, clipping what is in flight.
    panes.style.overflowY = 'clip';
    animations.push(
      panes.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], MORPH),
    );

    if (next === 'cards') section.querySelector('.musings-rail')?.syncPosition?.();
    const after = snapshot(section, next);
    const layer = cloneLayer(section);
    clones.push(layer);

    after.forEach((b, i) => {
      const a = before[i];
      if (!a) return;
      const timing = { ...MORPH, delay: i * STAGGER, fill: 'backwards' };

      // Titles and dates: the new one flies in from the old one's spot while a
      // copy of the old one flies with it and fades, so the change of font
      // and line breaks reads as one piece of text.
      for (const part of ['title', 'date']) {
        if (!a[part] || !b[part]) continue;
        const old = cloneText(a[part], layer);
        animations.push(
          old.animate(
            [
              { transform: `scale(${a[part].k})`, opacity: 1 },
              {
                transform: `translate(${b[part].left - a[part].left}px, ${b[part].top - a[part].top}px) scale(${(b[part].font / a[part].font) * a[part].k})`,
                opacity: 0,
              },
            ],
            { ...timing, duration: MORPH.duration * 0.6, fill: 'both' },
          ),
          b[part].el.animate(
            [
              { transform: flipText(a[part], b[part]), opacity: 0 },
              { transform: 'none', opacity: 1 },
            ],
            timing,
          ),
        );
      }

      if (next === 'cards') {
        // The paper grows out of the row; the opening lines fade in once it
        // has mostly landed.
        animations.push(
          b.paper.el.animate([{ transform: flipBox(a.row, b.paper), opacity: 0 }, { transform: 'none', opacity: 1 }], timing),
        );
        for (const el of b.fades) {
          animations.push(
            el.animate([{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], {
              duration: 300,
              easing: MORPH.easing,
              delay: 180 + i * STAGGER,
              fill: 'backwards',
            }),
          );
        }
      } else {
        // The old card, copied, shrinks into its row and fades as it goes.
        const card = a.paper.el.closest('[data-doc]');
        const old = cloneBox(card, a.paper, layer);
        animations.push(
          old.animate(
            [
              { transform: `scale(${a.paper.k})`, opacity: 1 },
              { opacity: 0.6, offset: 0.35 },
              {
                transform: `translate(${b.row.left - a.paper.left}px, ${b.row.top - a.paper.top}px) scale(${b.row.width / (a.paper.width / a.paper.k)}, ${b.row.height / (a.paper.height / a.paper.k)})`,
                opacity: 0,
              },
            ],
            { ...timing, fill: 'both' },
          ),
        );
      }
    });

    Promise.all(animations.map((anim) => anim.finished)).then(
      () => finishMorph(busy),
      () => {},
    );
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="musings" className="relative flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 id="musings" className="font-sans text-base font-semibold tracking-normal">
          Musings
        </h2>
        <ViewToggle
          name="musings"
          view={view}
          onChange={switchTo}
          options={[
            { value: 'list', label: 'List' },
            { value: 'cards', label: 'Tile' },
          ]}
        />
      </div>

      <div data-panes>
        <div className="musings-list">
          {items.map((musing) => (
            <div key={musing.link} data-item className="relative">
              <Row href={musing.link} title={musing.name} meta={[musing.date]} />
            </div>
          ))}
        </div>
        <div className="musings-cards">
          <Rail items={items} railRef={railRef} />
        </div>
      </div>
    </section>
  );
}

// The rail moves only under our control: no native scroll snapping, which
// overshoots a card on a trackpad fling and then pulls back. Its position
// (x, the scrollLeft) is driven by a critically damped spring, so it settles
// on a card without overshooting and carries the speed of a throw. Each frame,
// every card's size and fade come from its distance to the front slot, so a
// card grows smoothly as it slides forward instead of jumping when it becomes
// current.
//   drag (mouse, pen or touch; vertical page scroll stays native) follows the
//        pointer and is thrown towards the next card on release
//   wheel a horizontal trackpad swipe moves one card per gesture
//   keys  left and right arrows
const SPRING = 320; // stiffness; damping is critical (2√k), so no overshoot (~97% there in 300ms)
const THROW = 0.22; // seconds a drag's release speed is projected forward to pick the card
const SIDE = { scale: 0.88, opacity: 0.65 }; // a card one slot or more away
const SIDE_NARROW = { scale: 0.94, opacity: 0.65 }; // below 768px

function Rail({ items, railRef }) {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const motion = useRef({ x: 0, v: 0, target: 0, frame: 0, k: SPRING });
  const drag = useRef(null);
  const swiping = useRef(false); // a trackpad gesture is still sending events
  const count = items.length;

  // While a musing is open in the panel, the rail and the panel move
  // together: settling on a card opens it, and opening a musing some other
  // way brings its card to the front. Pages that are not musings are left
  // alone, so browsing the rail never replaces, say, a job page.
  const activePath = useContext(ActivePathContext);
  const activeRef = useRef(activePath);
  activeRef.current = activePath;
  const followPanel = () => items.some((item) => item.link === activeRef.current);
  // Open a card's musing through the panel shell, like a click on its link.
  // keepFocus leaves focus on the rail (when the panel follows a swipe).
  const open = (index, keepFocus) => {
    const link = railRef.current?.querySelectorAll('[data-card] a')[index];
    if (!link || items[index].link === activeRef.current) return;
    if (keepFocus) link.setAttribute('data-keep-focus', '');
    link.click();
    link.removeAttribute('data-keep-focus');
  };
  const openCurrent = () => {
    if (followPanel()) open(currentRef.current, true);
  };
  const openCurrentRef = useRef(openCurrent);
  openCurrentRef.current = openCurrent;

  // Draw the rail at motion.x: scroll there and size every card by its
  // distance from the front.
  const render = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const gap = step(rail);
    rail.scrollLeft = motion.current.x;
    const side = matchMedia('(min-width: 768px)').matches ? SIDE : SIDE_NARROW;
    rail.querySelectorAll('[data-card]').forEach((card, index) => {
      const d = Math.min(1, Math.abs(index * gap - motion.current.x) / gap);
      card.style.scale = String(1 - (1 - side.scale) * d);
      card.style.opacity = String(1 - (1 - side.opacity) * d);
    });
    const nearest = Math.max(0, Math.min(count - 1, Math.round(motion.current.x / gap)));
    if (nearest !== currentRef.current) {
      currentRef.current = nearest;
      setCurrent(nearest);
    }
  }, [count, railRef]);

  // Spring towards motion.target, one frame at a time.
  const settle = useCallback(() => {
    const m = motion.current;
    cancelAnimationFrame(m.frame);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      m.x = m.target;
      m.v = 0;
      render();
      openCurrentRef.current();
      return;
    }
    // A critically damped spring cannot overshoot unless it starts moving
    // towards its target faster than ω × distance; cap a fast throw there.
    const omega = Math.sqrt(m.k);
    const e = m.x - m.target;
    if (m.v * e < 0 && Math.abs(m.v) > omega * Math.abs(e)) m.v = -omega * e;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      m.v += (-m.k * (m.x - m.target) - 2 * omega * m.v) * dt;
      m.x += m.v * dt;
      if (Math.abs(m.x - m.target) < 0.3 && Math.abs(m.v) < 8) {
        m.running = false;
        m.x = m.target;
        m.v = 0;
        render();
        // The panel follows once the rail has landed (and a swipe has ended).
        if (!swiping.current) openCurrentRef.current();
        return;
      }
      render();
      m.frame = requestAnimationFrame(tick);
    };
    m.running = true;
    m.frame = requestAnimationFrame(tick);
  }, [render]);

  // stiffness: SPRING for everything but a throw, which brings its own.
  const goTo = useCallback(
    (index, focus = false, stiffness = SPRING) => {
      const rail = railRef.current;
      const target = Math.max(0, Math.min(count - 1, index));
      motion.current.gap = step(rail);
      motion.current.target = target * motion.current.gap;
      motion.current.index = target;
      motion.current.k = stiffness;
      settle();
      if (focus) rail.querySelectorAll('[data-card] a')[target]?.focus({ preventScroll: true });
    },
    [count, railRef, settle],
  );

  // The rail bleeds to the edges of the list area. CSS gets close with cqw,
  // but that counts the list's scrollbar, so the real edges are measured here.
  // On any resize (and when the rail comes back from the list view) it jumps
  // to its card again, since the distance between cards may have changed.
  useEffect(() => {
    const rail = railRef.current;
    const area = rail.closest('.\\@container');
    const column = rail.parentElement;
    const fit = () => {
      const c = column.getBoundingClientRect();
      if (!c.width) return; // hidden (list view): keep the last values
      if (area) {
        const a = area.getBoundingClientRect();
        rail.style.setProperty('--full', `${area.clientWidth}px`);
        rail.style.setProperty('--edge', `${c.left - a.left - area.clientLeft}px`);
      }
      const m = motion.current;
      const gap = step(rail);
      const index = m.index ?? currentRef.current;
      if (m.running && m.gap) {
        // Mid-glide (the panel opening narrows the list while a clicked card
        // slides forward): carry the glide over to the new spacing and keep
        // going, so card and panel move together.
        const ratio = gap / m.gap;
        m.x *= ratio;
        m.v *= ratio;
        m.target = index * gap;
      } else {
        m.x = m.target = index * gap;
        m.v = 0;
      }
      m.index = index;
      m.gap = gap;
      render();
    };
    // The morph calls this right after showing the cards, before measuring.
    rail.syncPosition = fit;
    const m = motion.current;
    fit();
    const observer = new ResizeObserver(fit);
    if (area) observer.observe(area);
    observer.observe(column);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(m.frame);
    };
  }, [railRef, render]);

  // A musing opened some other way (the list, Back, a link) brings its card
  // to the front.
  useEffect(() => {
    const index = items.findIndex((item) => item.link === activePath);
    if (index < 0 || index === currentRef.current || drag.current) return;
    if (!railRef.current?.getClientRects().length) {
      currentRef.current = index; // cards hidden: they show there when back
      setCurrent(index);
      return;
    }
    goTo(index);
  }, [activePath, items, goTo, railRef]);

  // Horizontal wheel (a trackpad swipe, momentum included). The gesture's
  // distance is counted in cards as it arrives, so a fast swipe glides across
  // several; the rail always heads for a whole card, never past one. About a fifth
  // of a card (18%) is enough to move on. The gesture ends once events pause.
  useEffect(() => {
    const rail = railRef.current;
    let gesture = null;
    let idle = 0;
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const gap = step(rail);
      if (!gesture) {
        gesture = { start: Math.round(motion.current.target / gap), sum: 0 };
        swiping.current = true;
      }
      gesture.sum += event.deltaX * (event.deltaMode === 1 ? 40 : 1);
      const cards = Math.sign(gesture.sum) * Math.floor(Math.abs(gesture.sum) / gap + 0.82);
      const index = Math.max(0, Math.min(count - 1, gesture.start + cards));
      if (index * gap !== motion.current.target) {
        motion.current.target = index * gap;
        motion.current.index = index;
        motion.current.k = SPRING;
        settle();
      }
      clearTimeout(idle);
      idle = setTimeout(() => {
        gesture = null;
        swiping.current = false;
        const m = motion.current;
        if (m.x === m.target) openCurrentRef.current(); // already landed
      }, 140);
    };
    rail.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      rail.removeEventListener('wheel', onWheel);
      clearTimeout(idle);
    };
  }, [count, railRef, settle]);

  // Drag with any pointer. The rail follows 1:1 (with resistance past either
  // end); on release the throw is projected forward (THROW) and the rail
  // glides to the card nearest where it would come to rest, so a harder
  // flick travels further. A flick always moves at least one card.
  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    const m = motion.current;
    drag.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      from: m.x,
      index: currentRef.current,
      moved: false,
      v: 0,
      lastX: event.clientX,
      lastT: event.timeStamp,
    };
  };
  const onPointerMove = (event) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    const rail = railRef.current;
    const dx = event.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(event.clientY - d.startY) > Math.abs(dx)) {
        drag.current = null; // a vertical move: leave it to the page
        return;
      }
      d.moved = true;
      try {
        rail.setPointerCapture(event.pointerId); // keeps the drag (and the click after it) on the rail
      } catch {}
      rail.dataset.dragging = '';
      cancelAnimationFrame(motion.current.frame);
      motion.current.running = false;
    }
    const dt = Math.max(1, event.timeStamp - d.lastT);
    d.v = 0.6 * d.v + 0.4 * ((event.clientX - d.lastX) / dt); // smoothed px/ms
    d.lastX = event.clientX;
    d.lastT = event.timeStamp;
    const max = (count - 1) * step(rail);
    let x = d.from - dx;
    if (x < 0) x *= 0.35;
    else if (x > max) x = max + (x - max) * 0.35;
    motion.current.x = x;
    motion.current.v = 0;
    render();
  };
  const onPointerUp = (event) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    const rail = railRef.current;
    delete rail.dataset.dragging;
    if (event.type === 'pointercancel') d.v = 0;
    const gap = step(rail);
    const speed = -d.v * 1000; // px/s in the rail's direction
    const rest = motion.current.x + speed * THROW;
    let index = Math.round(rest / gap);
    if (Math.abs(speed) > 300 && index === d.index) index += Math.sign(speed);
    index = Math.max(0, Math.min(count - 1, index));
    // Glide from the hand's speed: a critically damped spring with
    // ω = speed / distance moves as a pure exponential decay, so it starts at
    // exactly the release speed and only ever slows down. Kept between a
    // floaty and a snappy limit; a slow release gets the usual spring.
    const distance = Math.abs(index * gap - motion.current.x);
    const towards = speed * (index * gap - motion.current.x) > 0;
    let stiffness = SPRING;
    if (towards && distance > 1) {
      const omega = Math.max(9, Math.min(24, Math.abs(speed) / distance));
      stiffness = omega * omega;
    }
    motion.current.v = towards ? speed : 0;
    goTo(index, false, stiffness);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(currentRef.current + (event.key === 'ArrowRight' ? 1 : -1), true);
    }
  };

  return (
    <>
      <div
        ref={railRef}
        role="region"
        aria-label="Musings"
        className="musings-rail"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {items.map((musing, index) => (
          <div
            key={musing.link}
            data-card
            data-item
            data-current={index === current ? '' : undefined}
            className="musings-card relative"
            style={index === 0 ? undefined : { scale: 'var(--side-scale)', opacity: 0.65 }}
          >
            <PanelLink href={musing.link} draggable={false} className="group/card block rounded-[6px] outline-none" onFocus={() => index !== current && goTo(index)}>
              <span data-doc className="musings-doc relative block aspect-[1/1.15]">
                <span data-morph="paper" aria-hidden className="musings-paper absolute inset-0 rounded-[6px] bg-paper" />
                <span aria-hidden className="musings-page relative flex h-full flex-col">
                  <span data-morph="title" className="musings-page-title block font-serif text-ink">
                    {musing.name}
                  </span>
                  <span data-morph="date" className="musings-page-date block text-body/70">
                    {musing.date}
                  </span>
                  <span data-fade className="musings-page-body block min-h-0 flex-1 overflow-hidden text-body">
                    {musing.excerpt?.map((text) => (
                      <span key={text} className="block">
                        {text}
                      </span>
                    ))}
                  </span>
                </span>
              </span>
              {/* For screen readers only (hidden in globals.css): the card
                  already shows the title and date. */}
              <span data-fade className="musings-caption mt-3 flex items-baseline justify-between gap-3">
                <span className="truncate font-medium text-ink">{musing.name}</span>
                <span className="shrink-0 text-body/70 tabular-nums">{musing.date}</span>
              </span>
            </PanelLink>
            {/* A side card comes forward on click instead of opening. This sits
                outside the link so the panel shell never sees a link click. */}
            {index !== current && (
              <span aria-hidden className="absolute inset-0 cursor-pointer" onClick={() => {
                  // Slide forward and open at once: the panel comes in while
                  // the card is still on its way.
                  goTo(index);
                  open(index, false);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// One card's width plus the gap: the distance between snap points.
function step(rail) {
  const cards = rail.querySelectorAll('[data-card]');
  return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
}

// ——— The morph ———

// Where each piece of each item sits in a view, in screen pixels. `k` is the
// scale the element is drawn at (a side card is shrunk), so text can be sized
// against what is actually on screen.
function snapshot(section, view) {
  const pane = section.querySelector(view === 'list' ? '.musings-list' : '.musings-cards');
  return [...pane.querySelectorAll('[data-item]')].map((item) => {
    const visible = (el) => el && el.getClientRects().length > 0;
    const pick = (selector) => [...item.querySelectorAll(selector)].find(visible);
    const row = item.querySelector('a');
    return {
      row: row && measure(row, false),
      paper: measure(item.querySelector('[data-morph="paper"]')),
      title: measure(pick('[data-morph="title"]')),
      date: measure(pick('[data-morph="date"]')),
      fades: [...item.querySelectorAll('[data-fade]')],
    };
  });
}
