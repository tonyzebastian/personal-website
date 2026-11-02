'use client';

import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, LazyMotion, domMax, m, useDragControls } from 'motion/react';
import PanelBlur from './PanelBlur';
import { CONTENT_FADE, PANEL_SPRING } from './config';

// Pulled down this far, or flicked this fast, the sheet closes.
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 600;

// The panel on narrow screens: a sheet that slides up over the list. Base UI
// handles focus, Esc and scroll locking; Motion handles the slide and the
// drag-to-close on the handle.
// `children` is the panel content (the page, or a placeholder while it loads).
export default function PanelSheet({ open, contentKey, onClose, children }) {
  const drag = useDragControls();

  return (
    // Dragging needs Motion's full feature set; this file only loads on small
    // screens, so the extra code does too.
    <LazyMotion features={domMax} strict>
      <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
        <AnimatePresence initial={false}>
          {open && (
            <Dialog.Portal keepMounted>
              <Dialog.Backdrop
                render={
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={CONTENT_FADE}
                  />
                }
                className="fixed inset-0 z-50 bg-body/30"
              />
              <Dialog.Popup
                aria-label="Details"
                render={
                  <m.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={PANEL_SPRING}
                    drag="y"
                    dragControls={drag}
                    dragListener={false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.5 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.y > CLOSE_DISTANCE || info.velocity.y > CLOSE_VELOCITY) onClose();
                    }}
                  />
                }
                className="fixed inset-x-0 top-3 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl bg-paper shadow-[0_-8px_30px_rgba(50,64,79,0.18)] outline-none"
              >
                <div
                  className="flex h-8 shrink-0 cursor-grab touch-none items-end justify-center pb-1 active:cursor-grabbing"
                  onPointerDown={(event) => drag.start(event)}
                >
                  <span className="h-1 w-9 rounded-full bg-body/20" />
                </div>
                {/* No visible close button: the sheet closes by dragging the
                    handle down (or Esc). This one is for screen readers. */}
                <Dialog.Close className="sr-only">Close</Dialog.Close>
                <div className="relative min-h-0 flex-1">
                  <AnimatePresence initial={false}>
                    <m.div
                      key={contentKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={CONTENT_FADE}
                      className="scrollbar-minimal absolute inset-0 overflow-y-auto overscroll-contain"
                    >
                      {children}
                    </m.div>
                  </AnimatePresence>
                  <PanelBlur />
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </LazyMotion>
  );
}
