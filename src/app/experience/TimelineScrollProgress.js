'use client';

import { useEffect } from 'react';

const clamp = (value) => Math.min(Math.max(value, 0), 1);

// Sizes the timeline line to run from the first to the last node, fills it
// down to the reading position, and marks passed item dots as reached.
// Ported from the Sundial "What's New" page.
export function TimelineScrollProgress() {
  useEffect(() => {
    const timeline = document.querySelector('[data-exp-timeline]');
    const nodes = Array.from(document.querySelectorAll('[data-exp-node]'));
    if (!timeline || nodes.length < 2) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const anchorY = window.innerHeight * 0.44;
      const timelineTop = timeline.getBoundingClientRect().top;
      const centers = nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      const first = centers[0];
      const last = centers[centers.length - 1];

      timeline.style.setProperty('--line-top', `${(first - timelineTop).toFixed(1)}px`);
      timeline.style.setProperty('--line-height', `${(last - first).toFixed(1)}px`);
      timeline.style.setProperty(
        '--timeline-progress',
        clamp((anchorY - first) / (last - first)).toFixed(3),
      );

      nodes.forEach((node, index) => {
        if (!node.classList.contains('exp-timeline-dot')) return;
        if (centers[index] <= anchorY) {
          node.dataset.reached = 'true';
        } else {
          delete node.dataset.reached;
        }
      });
    };

    const scheduleUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    // Images and videos load after mount and change item heights.
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(timeline);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      observer.disconnect();
    };
  }, []);

  return null;
}
