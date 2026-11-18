'use client';

import { useEffect, useRef } from 'react';

// How long the page must be still before paused clips play again.
const RESUME_AFTER = 150;

// The element that scrolls this one: the nearest scrolling ancestor (the side
// panel, the sheet), or the window (a full page).
function scrollParent(el) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node;
  }
  return window;
}

// A muted, looping video that only plays while it is on screen (and not at
// all when the visitor prefers reduced motion). Until then only its metadata
// loads, so pages full of clips stay light.
//   pauseOnScroll  also pause while the page scrolls, playing again once it
//                  has been still for RESUME_AFTER ms. For pages with several
//                  clips on screen: with two or more videos playing, Chromium
//                  drops the page to the videos' frame rate (about 30fps), so
//                  scrolling past them judders. Paused, scrolling stays at the
//                  display's full rate.
export default function AutoVideo({ src, className, pauseOnScroll = false, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let near = false;
    let scrolling = false;
    let timer;
    const update = () => {
      if (near && !scrolling) video.play().catch(() => {});
      else video.pause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        update();
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(video);

    const scroller = pauseOnScroll ? scrollParent(video) : null;
    const onScroll = () => {
      if (!scrolling) {
        scrolling = true;
        update();
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        scrolling = false;
        update();
      }, RESUME_AFTER);
    };
    scroller?.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      scroller?.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [pauseOnScroll]);

  return (
    <video
      ref={ref}
      src={src}
      className={className}
      muted
      loop
      playsInline
      preload="metadata"
      {...props}
    />
  );
}
