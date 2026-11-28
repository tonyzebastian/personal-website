'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Dialog } from '@base-ui/react/dialog';
import { useReducedMotion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { Motif, MOTIF_ICON } from '@/components/book/Motifs';
import { INTRO_MS } from '@/lib/intro';

// My photo, which is secretly the first page of a book (see book/scene.js).
// Hovering it swings the leather cover shut over it. Clicking sends the book to
// the middle of the window, opening and growing; the page dims and a close
// button appears below it, and both leave first on the way back. In the dialog it reads as before: drag
// or use the arrow keys to turn pages; a short pull right on the first spread,
// Escape or the close button send it back.
//
// three.js and the page drawings load once the page is idle, or at the first
// touch on devices that cannot hover, so the book never holds up first paint.

// The arrival hint: on the first visit, the page loads with the closed book
// where my photo is (html.book-peek, set before paint by INTRO_SCRIPT). Until
// the 3D book is ready that is a picture of it (public/book/closed-book.webp, a CSS background,
// captured from the scene at the same size and place, shadow included); the
// live book takes over on the frame it first draws, then the cover lifts
// away to show the photo this long after load, or a moment after it is in.
const PEEK_UNTIL = 800; // ms after load
const PEEK_MIN_SHOWN = 500; // ms the live book shows, at least, before lifting
const PEEK_GIVE_UP = 6000; // ms: no book by then, show the photo

export default function HeroBook({ book }) {
  const { cover, intro, chapters, end } = book;
  const reduceMotion = useReducedMotion();
  const anchorRef = useRef(null);
  const canvasRef = useRef(null);
  const backdropRef = useRef(null);
  const frameRef = useRef(null);
  const sourcesRef = useRef(null);
  const sceneRef = useRef(null);
  const startRef = useRef(null);
  const wantsOpenRef = useRef(false);
  const wantsHoverRef = useRef(false);
  const peekRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | ready | failed
  const [open, setOpen] = useState(false);
  const [spread, setSpread] = useState(0);
  const [revealed, setRevealed] = useState(false); // the book has landed
  const [box, setBox] = useState(null); // the dialog's place on screen
  const [linkRect, setLinkRect] = useState(null);
  // Spreads: 0 closed, then the intro (my photo), the chapters, the end.
  const firstChapter = intro ? 2 : 1;
  const lastSpread = chapters.length + firstChapter;

  useEffect(() => setMounted(true), []);

  const closeBook = useCallback(() => {
    setOpen(false);
    sceneRef.current?.close();
  }, []);

  const openBook = useCallback(() => {
    const scene = sceneRef.current;
    setOpen(true);
    scene?.open();
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;
    let cancelled = false;
    let scene = null;
    let idleId = 0;
    let peekTimer = 0;
    let giveUpTimer = 0;
    const root = document.documentElement;
    const loadedAt = performance.now();
    peekRef.current = root.classList.contains('book-peek');
    const endStandIn = () => root.classList.remove('book-peek');
    if (peekRef.current) giveUpTimer = window.setTimeout(endStandIn, PEEK_GIVE_UP);

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

    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      try {
        const [{ createBookScene }, { drawPages }] = await Promise.all([
          import('@/components/book/scene'),
          import('@/components/book/textures'),
        ]);
        if (cancelled) return;
        const inks = Object.fromEntries(chapters.filter((c) => c.motif).map((c) => [c.motif, c.ink]));
        // Page drawings at about the resolution they show at: the dialog's
        // pages are at most 400px wide, so 900px suits 2x screens and 600px
        // phones and 1x screens (less than half the memory).
        const pages = await drawPages(book, {
          width: window.innerWidth >= 640 && window.devicePixelRatio >= 1.5 ? 900 : 600,
          motifs: svgMarkup('svg[data-motif]'),
          icons: svgMarkup('span[data-motif]', inks),
        });
        if (cancelled) return;
        scene = createBookScene({
          canvas: canvasRef.current,
          anchor: anchorRef.current,
          backdrop: backdropRef.current,
          pages,
          reduceMotion,
          onSpread: setSpread,
          onReveal: setRevealed,
          onLayout: (rect, pad) => setBox({ ...rect, pad }),
          onRequestClose: closeBook,
          onContextLost: rebuild,
        });
        sceneRef.current = scene;
        await scene.ready;
        if (cancelled) return;
        setStatus('ready');
        if (peekRef.current && root.classList.contains('book-peek')) {
          // The live closed book draws over its picture, which goes once that
          // frame is up; later the cover lifts away to show the photo,
          // unless the visitor is hovering it or has clicked it by then.
          window.clearTimeout(giveUpTimer);
          scene.peek();
          requestAnimationFrame(() => requestAnimationFrame(endStandIn));
          const now = performance.now();
          const lift = Math.max(loadedAt + PEEK_UNTIL, now + PEEK_MIN_SHOWN) - now;
          peekTimer = window.setTimeout(() => {
            if (!cancelled && !wantsOpenRef.current) scene.setHover(wantsHoverRef.current);
          }, lift);
        } else if (wantsHoverRef.current) scene.setHover(true);
        if (wantsOpenRef.current) openBook();
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus('failed');
      }
    };
    startRef.current = start;

    // The browser dropped the book's graphics context (it does under memory
    // pressure) and has given it back: the scene let its page drawings go
    // once they were uploaded, so it is built again from the start.
    const rebuild = () => {
      if (cancelled) return;
      closeBook();
      scene?.dispose();
      scene = null;
      sceneRef.current = null;
      started = false;
      setStatus('idle');
      start();
    };

    let introTimer = 0;
    const whenIdle = () => {
      // Heavy setup waits for the first-load animation to finish.
      if (document.documentElement.classList.contains('intro-play') && !introTimer) {
        introTimer = window.setTimeout(whenIdle, INTRO_MS);
        return;
      }
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(start, { timeout: 2500 });
      else idleId = window.setTimeout(start, 400);
    };
    const canHover = window.matchMedia('(hover: hover)').matches;
    // On arrival the book is shown at once, so it starts loading at once.
    if (peekRef.current) start();
    else if (canHover) {
      if (document.readyState === 'complete') whenIdle();
      else window.addEventListener('load', whenIdle, { once: true });
    }
    return () => {
      cancelled = true;
      window.removeEventListener('load', whenIdle);
      window.clearTimeout(introTimer);
      window.clearTimeout(peekTimer);
      window.clearTimeout(giveUpTimer);
      endStandIn();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      window.clearTimeout(idleId);
      scene?.dispose();
      sceneRef.current = null;
    };
    // The book is built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const setHover = (on) => {
    wantsHoverRef.current = on;
    if (on) startRef.current?.();
    sceneRef.current?.setHover(on);
  };

  const onPhotoClick = () => {
    if (status === 'failed') return;
    if (status === 'ready') {
      openBook();
      return;
    }
    wantsOpenRef.current = true;
    startRef.current?.();
  };

  const attachFrame = useCallback((element) => {
    frameRef.current = element;
    sceneRef.current?.attachFrame(element);
  }, []);

  // Where the link printed on the last page sits, so a real link can lie over it.
  useEffect(() => {
    if (!open || spread !== lastSpread) return undefined;
    const frame = requestAnimationFrame(() => setLinkRect(sceneRef.current?.linkRect() ?? null));
    return () => cancelAnimationFrame(frame);
  }, [open, spread, lastSpread, box]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      sceneRef.current?.goTo(spread + 1);
    } else if (event.key === 'ArrowLeft' && spread > 1) {
      event.preventDefault();
      sceneRef.current?.goTo(spread - 1);
    }
  };

  const chapter = chapters[spread - firstChapter] ?? null;
  const onIntro = intro && spread === 1;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) closeBook();
      }}
    >
      <button
        ref={anchorRef}
        type="button"
        aria-haspopup="dialog"
        aria-label={`Open ${cover.title}`}
        disabled={status === 'failed'}
        onClick={onPhotoClick}
        onPointerEnter={(event) => event.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={(event) => event.pointerType === 'mouse' && setHover(false)}
        onPointerDown={() => startRef.current?.()}
        onFocus={(event) => event.target.matches(':focus-visible') && setHover(true)}
        onBlur={() => setHover(false)}
        className="block aspect-[1.05/1.2] w-24 cursor-pointer overflow-hidden rounded-[7px] outline-none focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink/30 disabled:cursor-default"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, sized by hand */}
        <img src={intro.thumb ?? intro.photo} alt="" fetchPriority="high" className="book-peek-photo size-full object-cover" />
      </button>
      {/* On arrival, a picture of the closed book until the live one is ready.
          It is a CSS background (see .book-standin), so it downloads only on
          visits that show it. */}
      <span aria-hidden className="book-standin" />

      {mounted &&
        createPortal(
          <>
            <div
              ref={backdropRef}
              aria-hidden
              style={{ visibility: 'hidden', opacity: 0 }}
              className="book-backdrop pointer-events-none fixed inset-0 z-[80] bg-canvas/20 backdrop-blur-[6px]"
            />
            <canvas
              ref={canvasRef}
              aria-hidden
              style={{ visibility: 'hidden' }}
              className="pointer-events-none fixed top-0 left-0 z-[82]"
            />
          </>,
          document.body
        )}

      <Dialog.Portal>
        <Dialog.Popup
          initialFocus={frameRef}
          finalFocus={anchorRef}
          style={box ? { left: box.left, top: box.top, width: box.width, height: box.height } : undefined}
          className="pointer-events-none fixed z-[83] outline-none"
        >
          <Dialog.Title className="sr-only">{cover.title}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Use the left and right arrow keys to turn pages. Press Escape to close the book.
          </Dialog.Description>
          <div
            ref={attachFrame}
            role="region"
            aria-roledescription="book"
            aria-label={cover.title}
            tabIndex={0}
            onKeyDown={onKeyDown}
            style={box ? { inset: `${box.pad}px 0` } : undefined}
            className="pointer-events-auto absolute touch-pan-y rounded-lg outline-none select-none focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink/20"
          >
            {/* The "More about me" link printed on the last page: a real link
                laid over the print. */}
            {spread === lastSpread && linkRect && (
              <Link
                href={end.link.href}
                scroll={false}
                onClick={closeBook}
                className="absolute rounded-sm transition-colors hover:bg-highlight/50 focus-visible:bg-highlight/50 focus-visible:outline-none"
                style={{ left: `${linkRect.left}%`, top: `${linkRect.top}%`, width: `${linkRect.width}%`, height: `${linkRect.height}%` }}
              >
                <span className="sr-only">{end.link.label}</span>
              </Link>
            )}
          </div>
          <Dialog.Close
            aria-label="Close the book"
            tabIndex={revealed ? 0 : -1}
            className={`absolute bottom-1 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full bg-white/30 text-ink/55 transition-[color,background-color,opacity] duration-200 ease-snappy hover:bg-white/55 hover:text-ink/80 ${revealed ? 'pointer-events-auto opacity-100' : 'opacity-0'}`}
          >
            <X weight="bold" aria-hidden className="size-3.5" />
          </Dialog.Close>
          <p className="sr-only" aria-live="polite">
            {onIntro ? intro.label : chapter ? `${chapter.title}. ${chapter.paragraphs?.map((p) => (typeof p === 'string' ? p : p.text)).join(' ') ?? chapter.body}` : spread > 1 ? `${end.word}. ${end.intro}` : ''}
          </p>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Sources for the page drawings; serialised into the textures. */}
      <div ref={sourcesRef} hidden>
        {chapters.filter((c) => c.motif).map((c) => {
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
    </Dialog.Root>
  );
}
