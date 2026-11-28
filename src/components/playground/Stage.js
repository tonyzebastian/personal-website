'use client';

import { useEffect, useRef, useState } from 'react';
import { LazyMotion } from 'motion/react';
import { PIECES } from './pieces';

// Motion's features (with drag), loaded once before the first piece mounts so
// pieces never render before their animations can run.
let featuresPromise;
const loadFeatures = () => (featuresPromise ??= import('motion/react').then((mod) => mod.domMax));

// Hosts one live playground piece. The piece mounts only while its box is
// near the screen (and `active`), and unmounts again when it scrolls far away,
// so a page of pieces never runs them all at once (WebGL contexts are
// limited). Pieces use Motion's `m` components, so it brings its own
// LazyMotion with drag support, loaded before the piece mounts. Not strict:
// DialKit's panel uses Motion's full `motion` components.
//   id       piece id (pieces/index.js)
//   mode     'panel' or 'lightbox'; pieces show their controls in the lightbox
//   active   false pauses the piece (unmounts it), e.g. while the lightbox
//            shows the same piece
//   run      changing it mounts the piece afresh, which replays it
export default function Stage({ id, mode = 'panel', active = true, run = 0, className = '', style }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [features, setFeatures] = useState(null);
  const piece = PIECES[id];

  useEffect(() => {
    if (!near || features) return;
    loadFeatures().then(setFeatures);
  }, [near, features]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: '300px 0px',
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const Piece = piece?.Component;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={style}>
      {Piece && near && active && features && (
        <LazyMotion features={features}>
          <Piece key={run} mode={mode} />
        </LazyMotion>
      )}
    </div>
  );
}
