'use client';

import { useLayoutEffect, useRef, useState } from 'react';

// Scales a piece that was designed at a fixed size (width × height) down to
// fit its box, centred, never above `max`. Pieces from the playground were
// built for a full page; this lets them sit in the panel or the lightbox
// without rewriting their layout. `pad` keeps a margin around it, as a share
// of the box on each side, so it never touches the box's edges.
export default function Fit({ width, height, max = 1, pad = 0.08, children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const box = ref.current;
    const update = () => {
      const { width: w, height: h } = box.getBoundingClientRect();
      const room = 1 - pad * 2;
      setScale(Math.min(max, (w * room) / width, (h * room) / height));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width, height, max, pad]);

  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="shrink-0"
        style={{ width, height, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}
      >
        {children}
      </div>
    </div>
  );
}
