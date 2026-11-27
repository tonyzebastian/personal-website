'use client';

import Wall from '@/components/wall/Wall';
import drawings from '@/lib/drawings.json';

// 365 Days of Drawing: the endless drag wall (components/wall/Wall.js) of all
// 365 drawings, 160px columns, each column running through every 23rd
// drawing. Images are built by scripts/import-drawings.mjs.

const label = (day) => String(day).padStart(3, '0');

const ITEMS = drawings.map((drawing) => ({
  key: drawing.day,
  thumb: `/playground/drawings/thumbs/${label(drawing.day)}.webp`,
  large: `/playground/drawings/large/${label(drawing.day)}.webp`,
  width: drawing.width,
  height: drawing.height,
  title: `Day ${label(drawing.day)}`,
  alt: `Drawing from day ${drawing.day}`,
}));

export function Piece() {
  return (
    <Wall
      items={ITEMS}
      collection="365 Days of Drawing"
      label="365 drawings. Drag, scroll or use the arrow keys to move around; choose a drawing to open it."
      card={
        <>
          <span className="text-[10px] tracking-[0.08em] text-body/70 uppercase">May 2020 to May 2021</span>
          <h2 className="mt-4 mb-3 text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-ink">
            365 days
            <br />
            of drawing
          </h2>
          <p className="text-[13px] leading-normal text-body">
            One illustration, every day, for a year. A collection of experiments in colour, places and little stories.
          </p>
          <span className="mt-5 text-[11px] text-body/70">Drag around to explore</span>
        </>
      }
    />
  );
}
