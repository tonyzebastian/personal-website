'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { HandGrabbing } from '@phosphor-icons/react';
import { Motif, MOTIF_ICON } from '@/components/book/Motifs';

// The storybook hero: a WebGL board book lying on the page, seen from above
// (see book/scene.js). It lies closed until opened; then each spread is one
// side of me. Dragging is the whole interface: drag left to open and turn
// forward, right to turn back, and flick right fast to close. Keyboard: the
// arrow keys turn pages, Enter opens and Escape closes.
//
// three.js and the page drawings load only after the page itself has loaded,
// so the book never holds up the first paint.

export default function HeroBook({ book }) {
  const { cover, chapters, end } = book;
  const reduceMotion = useReducedMotion();
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const sourcesRef = useRef(null);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const [spread, setSpread] = useState(0);
  const [dragged, setDragged] = useState(false);
  const lastSpread = chapters.length + 1;

  // The scene owns the reading position; it reports every change back.
  const go = useCallback((next) => sceneRef.current?.goTo(next), []);

  useEffect(() => {
    let cancelled = false;
    let scene = null;

    // The motif drawings and icons are rendered (hidden) by React below;
    // serialise them so the page canvases can draw them.
    const svgMarkup = (selector, color) => {
      const out = {};
      sourcesRef.current?.querySelectorAll(selector).forEach((node) => {
        const svg = (node.tagName.toLowerCase() === 'svg' ? node : node.querySelector('svg')).cloneNode(true);
        if (color) svg.setAttribute('color', color[node.dataset.motif] || '#000');
        out[node.dataset.motif] = new XMLSerializer().serializeToString(svg);
      });
      return out;
    };

    const start = async () => {
      try {
        const [{ createBookScene }, { drawPages }] = await Promise.all([
          import('@/components/book/scene'),
          import('@/components/book/textures'),
        ]);
        if (cancelled) return;
        const inks = Object.fromEntries(chapters.map((c) => [c.motif, c.ink]));
        const pages = await drawPages(book, {
          width: window.innerWidth < 640 ? 600 : 900,
          motifs: svgMarkup('svg[data-motif]'),
          icons: svgMarkup('span[data-motif]', inks),
        });
        if (cancelled) return;
        scene = createBookScene({
          canvas: canvasRef.current,
          frame: frameRef.current,
          eventTarget: frameRef.current,
          pages,
          reduceMotion,
          onSpread: setSpread,
        });
        sceneRef.current = scene;
        setStatus('ready');
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus('failed');
      }
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
      scene?.dispose();
      sceneRef.current = null;
    };
    // The book is built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (event) => {
    if (status !== 'ready') return;
    if (event.key === 'ArrowRight' || (spread === 0 && (event.key === 'Enter' || event.key === ' '))) {
      event.preventDefault();
      go(spread + 1);
    } else if (event.key === 'ArrowLeft' && spread > 1) {
      event.preventDefault();
      go(spread - 1);
    } else if (event.key === 'Escape' && spread > 0) {
      event.preventDefault(); // keep the side panel open
      go(0);
    }
  };

  const chapter = spread >= 1 && spread <= chapters.length ? chapters[spread - 1] : null;
  const open = spread > 0;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frameRef}
        role="region"
        aria-roledescription="book"
        aria-label={`${cover.title}, ${cover.subtitle}`}
        aria-describedby="book-help"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={() => open && setDragged(true)}
        className="group/book relative mb-5 aspect-[16/9] w-full touch-pan-y rounded-xl outline-none select-none focus-visible:outline-1 focus-visible:outline-offset-[12px] focus-visible:outline-ink/20"
      >
        {/* The canvas runs well past the frame, so the book's shadows are
            never cut off; it takes no clicks, the frame does. */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute -inset-x-[4%] -inset-y-[18%] h-[136%] w-[108%] sm:-inset-x-[14%] sm:w-[128%]"
        />
        {status === 'loading' && (
          <p className="absolute inset-0 flex items-center justify-center font-serif italic text-ink/40">Loading…</p>
        )}
        {status === 'failed' && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-ink/55">
            This browser can&apos;t show the book.
          </p>
        )}

        {/* With no buttons, say once how to turn pages; gone after the first drag. */}
        {status === 'ready' && open && (
          <span
            aria-hidden
            className={`pointer-events-none absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-xs text-ink/45 transition-opacity duration-500 ${
              dragged ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <HandGrabbing weight="bold" size={14} />
            Drag to turn the pages
          </span>
        )}
      </div>

      <p id="book-help" className="sr-only">
        Use the left and right arrow keys to turn pages, Enter to open the book and Escape to close it.
      </p>
      <p className="sr-only" aria-live="polite">
        {chapter ? `${chapter.title}. ${chapter.body}` : open ? end.word : 'The book is closed.'}
      </p>

      {/* Sources for the page drawings; serialised into the textures. */}
      <div ref={sourcesRef} hidden>
        {chapters.map((c) => {
          const Icon = MOTIF_ICON[c.motif];
          return (
            <div key={c.id}>
              <svg data-motif={c.motif} viewBox="0 0 200 125" width="200" height="125">
                <Motif motif={c.motif} accent={c.accent} />
              </svg>
              {Icon && (
                <span data-motif={c.motif}>
                  <Icon size={256} weight="duotone" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
