'use client';

import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { X } from '@phosphor-icons/react';

// A 2×2 grid of photos at 4:5 that open large in a lightbox (Base UI
// Dialog), for a few pieces that should be seen properly (Juny Made).
//   images   [{ src, alt }]
export default function PhotoGrid({ images }) {
  const [open, setOpen] = useState(null);
  const shown = images[open];

  return (
    <Dialog.Root open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
      <div className="grid grid-cols-2 gap-3">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setOpen(index)}
            aria-label={`View ${image.alt}`}
            data-cursor="View"
            className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-body/[0.04] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <img
              src={image.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-[scale] duration-300 ease-snappy group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ease-snappy data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-3 z-[70] flex items-center justify-center outline-none transition-[opacity,scale] duration-200 ease-snappy data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 md:inset-8">
          <Dialog.Title className="sr-only">{shown?.alt}</Dialog.Title>
          {shown && (
            <img src={shown.src} alt={shown.alt} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
          )}
          <Dialog.Close
            aria-label="Close"
            className="absolute top-0 right-0 grid size-9 place-items-center rounded-lg bg-paper text-body/80 shadow-md transition-colors outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X weight="bold" aria-hidden className="size-4" />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
