'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'motion/react';
import { Pause, Play, SpeakerSimpleHigh, SpeakerSimpleSlash } from '@phosphor-icons/react';
import { Motif, MOTIF_ICON } from '@/components/book/Motifs';

// The storybook hero: a WebGL board book lying on the page, seen from above
// (see book/scene.js). It lies closed until opened; then each spread is one
// side of me. Dragging is the whole interface: drag left to open and turn
// forward, right to turn back, and flick right fast to close. Keyboard: the
// arrow keys turn pages, Enter opens and Escape closes.
//
// three.js and the page drawings load only after the page itself has loaded,
// so the book never holds up the first paint.

// Soft, frosted buttons that sit on the page without shouting.
const videoButton =
  'flex items-center justify-center rounded-full bg-paper/55 text-ink/50 ring-1 ring-ink/5 backdrop-blur-md transition-[opacity,color,background-color] duration-200 hover:bg-paper/75 hover:text-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25';

export default function HeroBook({ book }) {
  const { cover, intro, chapters, end } = book;
  const reduceMotion = useReducedMotion();
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const sourcesRef = useRef(null);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const [spread, setSpread] = useState(0);
  const [video, setVideo] = useState({ playing: false, muted: true });
  // Spreads: 0 closed, then the intro video (if any), the chapters, the end.
  const firstChapter = intro ? 2 : 1;
  const lastSpread = chapters.length + firstChapter;

  // Where the link printed on the last page sits, so a real link can lie
  // over it. Measured once the book is drawn, and again on resize.
  const [linkRect, setLinkRect] = useState(null);
  useEffect(() => {
    if (status !== 'ready') return undefined;
    let frame = requestAnimationFrame(() => setLinkRect(sceneRef.current?.linkRect() ?? null));
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => requestAnimationFrame(() => setLinkRect(sceneRef.current?.linkRect() ?? null)));
    });
    observer.observe(frameRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [status]);

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
          onVideo: setVideo,
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

  const chapter = chapters[spread - firstChapter] ?? null;
  const onIntro = intro && spread === 1;
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
        className="group/book relative mb-5 aspect-[16/9] w-full touch-pan-y rounded-xl outline-none select-none focus-visible:outline-1 focus-visible:outline-offset-[12px] focus-visible:outline-ink/20"
      >
        {/* The canvas runs well past the frame, most of all below it where
            the shadow falls, so shadows are never cut off. It takes no
            clicks; the frame does. */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute -top-[18%] -left-[7%] h-[156%] w-[114%] sm:-left-[14%] sm:w-[128%]"
        />
        {status === 'loading' && (
          <p className="absolute inset-0 flex items-center justify-center font-serif italic text-ink/40">Loading…</p>
        )}
        {status === 'failed' && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-ink/55">
            This browser can&apos;t show the book.
          </p>
        )}

        {/* Video controls, on the page itself: play / pause in the middle
            (on hover, always while paused, always on touch screens), sound
            in the corner. */}
        {status === 'ready' && onIntro && (
          <>
            <button
              type="button"
              onClick={() => sceneRef.current?.toggleVideo()}
              aria-label={video.playing ? 'Pause video' : 'Play video'}
              className={`${videoButton} absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 ${
                video.playing
                  ? 'opacity-0 group-hover/book:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
                  : 'opacity-100'
              }`}
            >
              {video.playing ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => sceneRef.current?.toggleSound()}
              aria-label={video.muted ? 'Turn sound on' : 'Turn sound off'}
              className={`${videoButton} absolute right-[8%] bottom-[8%] size-9`}
            >
              {video.muted ? <SpeakerSimpleSlash size={17} weight="bold" /> : <SpeakerSimpleHigh size={17} weight="bold" />}
            </button>
          </>
        )}

        {/* The "More about me" link printed on the last page: a real link
            laid over the print, with the site's green highlight on hover. */}
        {status === 'ready' && spread === lastSpread && linkRect && (
          <Link
            href={end.link.href}
            scroll={false}
            className="absolute rounded-sm mix-blend-multiply transition-colors hover:bg-highlight focus-visible:bg-highlight focus-visible:outline-none"
            style={{ left: `${linkRect.left}%`, top: `${linkRect.top}%`, width: `${linkRect.width}%`, height: `${linkRect.height}%` }}
          >
            <span className="sr-only">{end.link.label}</span>
          </Link>
        )}

      </div>

      <p id="book-help" className="sr-only">
        Use the left and right arrow keys to turn pages, Enter to open the book and Escape to close it.
      </p>
      <p className="sr-only" aria-live="polite">
        {onIntro
          ? intro.label
          : chapter
            ? `${chapter.title}. ${chapter.body}`
            : open
              ? `${end.word}. ${end.intro}`
              : 'The book is closed.'}
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
