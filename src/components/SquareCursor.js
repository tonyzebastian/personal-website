'use client';

import { useEffect, useRef } from 'react';

// The pointer drawn as a small green square, after shahimim.com. It sits
// exactly on the pointer (no trailing), shrinks over anything clickable and
// while pressed, and hides when the pointer leaves the window. Over a link a
// small green label slides out beside it saying what a click does (labelFor);
// any element can name its own with data-cursor="…". Fine pointers from
// 768px wide only: on touch or a narrow window it never shows and the native
// cursor is untouched. Styles are .square-cursor in globals.css.
const CLICKABLE = 'a, button, [role="button"], label, select, summary, input, textarea, [data-cursor]';

// What a click on this element does, or nothing for no label.
function labelFor(el) {
  const named = el.closest('[data-cursor]');
  if (named) return named.dataset.cursor;
  const link = el.closest('a[href]');
  if (!link) return '';
  const href = link.getAttribute('href');
  if (href.startsWith('mailto:')) return 'Email';
  if (link.target === '_blank' || /^https?:/.test(href)) return 'Visit ↗';
  // Playground pieces are things to open and play with; every other page
  // (jobs, musings, About) is something to read.
  if (href.startsWith('/playground/')) return 'Open';
  return 'Read';
}

export default function SquareCursor() {
  const ref = useRef(null);

  useEffect(() => {
    const query = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');
    const root = document.documentElement;
    const el = ref.current;
    const text = el.querySelector('.square-cursor-label');
    let off = () => {};

    const start = () => {
      off();
      if (!query.matches) {
        delete root.dataset.squareCursor;
        return;
      }
      root.dataset.squareCursor = '';
      let over = null;
      const move = (event) => {
        el.style.translate = `${event.clientX}px ${event.clientY}px`;
        el.toggleAttribute('data-shown', true);
        if (event.target === over) return;
        over = event.target;
        el.toggleAttribute('data-over', !!over.closest?.(CLICKABLE));
        const label = over.closest ? labelFor(over) : '';
        // Keep the old words while the label fades out.
        if (label) text.textContent = label;
        el.toggleAttribute('data-label', !!label);
      };
      const down = () => el.toggleAttribute('data-down', true);
      const up = () => el.toggleAttribute('data-down', false);
      const leave = () => el.toggleAttribute('data-shown', false);
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerdown', down);
      window.addEventListener('pointerup', up);
      root.addEventListener('pointerleave', leave);
      off = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerdown', down);
        window.removeEventListener('pointerup', up);
        root.removeEventListener('pointerleave', leave);
        el.toggleAttribute('data-shown', false);
      };
    };

    start();
    query.addEventListener('change', start);
    return () => {
      query.removeEventListener('change', start);
      off();
      delete root.dataset.squareCursor;
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="square-cursor">
      <span className="square-cursor-mark" />
      <span className="square-cursor-label" />
    </div>
  );
}
