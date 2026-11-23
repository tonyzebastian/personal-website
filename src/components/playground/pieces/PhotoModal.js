'use client';

import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'motion/react';

// The photo card the image pieces open when a photo is clicked: the photo
// square on top, its title and description below, over a dark backdrop.
// Clicking the backdrop or the close button closes it. Shared by Image Sphere
// and Image Goo. image: { src, alt, title, description } or null.
export default function PhotoModal({ image, onClose }) {
  return createPortal(
    <AnimatePresence>
      {image && (
        <m.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <m.div
            className="w-full max-w-md overflow-hidden rounded-xl bg-white"
            onClick={(event) => event.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          >
            <div className="relative aspect-square">
              <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Close photo"
                onClick={onClose}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <h3 className="mb-2 text-xl font-bold">{image.title}</h3>
              <p className="text-gray-600">{image.description}</p>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
