'use client';

import { useEffect, useRef } from 'react';
import { INTRO_MS } from '@/lib/intro';

// The home page's sections. Every direct child after the hero joins the first
// load automatically (see `.intro-flow` in globals.css), so a new section only
// has to be added here as a child. Sections that start below the fold skip the
// wait: nobody can see them arrive, and they should be ready when scrolled to.
export default function IntroFlow({ className, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('intro-play')) return undefined;
    for (const section of ref.current.children) {
      if (section.getBoundingClientRect().top >= window.innerHeight) section.classList.add('intro-skip');
    }
    const done = setTimeout(() => root.classList.remove('intro-play'), INTRO_MS);
    return () => clearTimeout(done);
  }, []);

  return (
    <div ref={ref} className={`intro-flow ${className}`}>
      {children}
    </div>
  );
}
