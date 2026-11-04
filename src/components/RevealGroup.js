'use client';

import { useEffect, useRef } from 'react';

// Fades its `.cover-reveal` children up into view as they scroll in, the way
// officecommun.com does it: cards that arrive together start 60ms apart (at
// most 8 steps), and each waits for its image (up to 700ms) so it never fades
// in empty. The motion itself is CSS (.cover-reveal in globals.css).
export default function RevealGroup({ className, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const items = [...ref.current.querySelectorAll('.cover-reveal')];
    const show = (el) => el.classList.add('is-in');

    if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(show);
      return;
    }

    const ready = (el) =>
      Promise.race([
        Promise.all(
          [...el.querySelectorAll('img')].map((img) => (img.complete ? null : img.decode().catch(() => {}))),
        ),
        new Promise((resolve) => setTimeout(resolve, 700)),
      ]);

    const observer = new IntersectionObserver(
      (entries) => {
        let step = 0;
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) continue;
          observer.unobserve(target);
          const delay = `${Math.min(step++, 8) * 60}ms`;
          ready(target).then(() => {
            target.style.setProperty('--d', delay);
            show(target);
          });
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    items.forEach((el) => observer.observe(el));
    // Safety net: anything already on screen after 1.2s shows regardless.
    const fallback = setTimeout(
      () => items.forEach((el) => el.getBoundingClientRect().top < innerHeight && show(el)),
      1200,
    );
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
