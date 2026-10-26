'use client';

import { useEffect, useRef } from 'react';

// A muted, looping video that only plays while it is on screen (and not at
// all when the visitor prefers reduced motion). Until then only its metadata
// loads, so pages full of clips stay light.
export default function AutoVideo({ src, className, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduceMotion) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

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
