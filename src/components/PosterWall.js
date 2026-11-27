'use client';

import Wall from '@/components/wall/Wall';
import posters from '@/lib/dalal-prints.json';

// Dalal Prints' finished posters on the endless drag wall
// (components/wall/Wall.js), in a box below the page's text: 220px columns,
// staggered so the posters (all close to 4:5) don't line up in rows, and no
// intro card (the page above says what it is). Images are the final exports
// from the Dalal Prints folder, as WebP in public/side-projects/dalal-prints
// (thumbs 600px wide, large 1600px).

const ITEMS = posters.map((poster) => ({
  key: poster.slug,
  thumb: `/side-projects/dalal-prints/thumbs/${poster.slug}.webp`,
  large: `/side-projects/dalal-prints/large/${poster.slug}.webp`,
  width: poster.width,
  height: poster.height,
  title: `${poster.company}, ${poster.season}`,
  alt: `Dalal Prints poster for ${poster.company}'s ${poster.season} earnings call`,
}));

export default function PosterWall() {
  return (
    <Wall
      items={ITEMS}
      collection="Dalal Prints"
      width={220}
      step={5}
      spread={5}
      stagger
      label={`${ITEMS.length} posters. Drag, scroll or use the arrow keys to move around; choose a poster to open it.`}
    />
  );
}
