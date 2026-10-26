'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'motion/react';
import { ArrowCounterClockwise, ArrowRight, BookOpen, CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Motif, MOTIF_ICON } from '@/components/book/Motifs';

// The storybook hero: a WebGL board book lying on the page, seen from above
// (see book/scene.js). It lies closed until opened; then each spread is one
// side of me. Turn pages by clicking or dragging them, with the controller
// below the book, or the arrow keys while the book has focus.
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
  const [hover, setHover] = useState(false);
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
          onHover: setHover,
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
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="group/book relative aspect-[16/9] w-full touch-pan-y rounded-xl outline-none select-none focus-visible:ring-2 focus-visible:ring-ink/20"
      >
        {/* The canvas runs well past the frame, so the book's shadows are
            never cut off; it takes no clicks, the frame does. */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute -inset-x-[4%] -inset-y-[12%] h-[124%] w-[108%] sm:-inset-x-[14%] sm:w-[128%]"
        />
        {status === 'loading' && (
          <p className="absolute inset-0 flex items-center justify-center font-serif italic text-ink/40">Loading…</p>
        )}
        {status === 'failed' && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-ink/55">
            This browser can&apos;t show the book.
          </p>
        )}

        {/* Hovering the closed book shows how to open it (always shown on
            touch screens, which cannot hover). */}
        {status === 'ready' && !open && (
          <span
            aria-hidden
            className={`pointer-events-none absolute bottom-[9%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-paper shadow-sm backdrop-blur-sm transition-all duration-300 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 ${
              hover ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            }`}
          >
            <BookOpen weight="bold" size={14} />
            Open book
          </span>
        )}
      </div>

      {/* The controller: the only controls, below the book once it is open. */}
      <div className="relative flex h-8 items-center justify-center">
        {status === 'ready' && open && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => go(spread - 1)} disabled={spread <= 1} aria-label="Previous page" className="text-ink/55">
              <CaretLeft weight="bold" />
            </Button>

            {spread === lastSpread ? (
              <div className="flex items-center gap-1 px-1">
                <Button variant="ghost" size="sm" onClick={() => go(1)} className="text-ink/55 hover:text-ink">
                  <ArrowCounterClockwise weight="bold" aria-hidden /> Read again
                </Button>
                <Link href="/about" scroll={false} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'text-ink/80' })}>
                  More about me <ArrowRight weight="bold" aria-hidden />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-2">
                {chapters.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => go(i + 1)}
                    aria-label={c.title}
                    aria-current={spread === i + 1 ? 'page' : undefined}
                    className={`size-2 rounded-full transition-transform hover:scale-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
                      spread === i + 1 ? 'scale-150 ring-1 ring-ink/30 ring-offset-2 ring-offset-canvas' : ''
                    }`}
                    style={{ background: c.accent }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => go(lastSpread)}
                  aria-label={end.word}
                  className="size-2 rounded-full bg-ink/25 transition-transform hover:scale-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                />
              </div>
            )}

            <Button variant="ghost" size="icon-sm" onClick={() => go(spread + 1)} disabled={spread >= lastSpread} aria-label="Next page" className="text-ink/55">
              <CaretRight weight="bold" />
            </Button>
            <span aria-hidden className="mx-1 h-4 w-px bg-ink/15" />
            <Button variant="ghost" size="icon-sm" onClick={() => go(0)} aria-label="Close book" className="text-ink/55">
              <X weight="bold" />
            </Button>
          </div>
        )}
      </div>

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
