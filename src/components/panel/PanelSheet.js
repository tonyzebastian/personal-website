'use client';

import { Dialog } from '@base-ui/react/dialog';
import { useCallback, useRef } from 'react';
import { AnimatePresence, LazyMotion, animate, domMax, m, useDragControls, useMotionValue } from 'motion/react';
import PanelBlur from './PanelBlur';
import { CONTENT_EXIT, CONTENT_FADE, PANEL_SPRING } from './config';

// Pulled down this far, or flicked this fast, the sheet closes.
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 600;

// The panel on narrow screens: a sheet that slides up over the list. Base UI
// handles focus, Esc and scroll locking; Motion handles the slide and the
// drag-to-close on the handle. The content can close it too: a touch that
// starts while the page is scrolled to the top and pulls down moves the sheet
// with the finger instead of scrolling (as in iOS sheets), and lets go the
// same way as the handle. Anything that handles its own touches (touch-action
// none, like the drag walls) and sideways swipes are left alone.
// `children` is the panel content (the page, or a placeholder while it loads).
export default function PanelSheet({ open, contentKey, onClose, children }) {
  const drag = useDragControls();
  const y = useMotionValue(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Pull-to-close on the content. Touch events, not pointer events: once the
  // browser starts a native scroll it cancels the pointer, so the pull has to
  // claim the gesture itself (preventDefault on a non-passive touchmove).
  const content = useCallback(
    (node) => {
      if (!node) return undefined;
      let pull = null; // { start, x, base, pulling, samples }
      const onStart = (event) => {
        const touch = event.touches[0];
        const scroller = event.target.closest?.('[data-sheet-scroll]');
        const ownsTouches = event.target.closest?.('[class*="touch-none"]');
        pull =
          event.touches.length === 1 && scroller && scroller.scrollTop <= 0 && !ownsTouches
            ? { start: touch.clientY, x: touch.clientX, base: 0, pulling: false, samples: [] }
            : null;
      };
      const onMove = (event) => {
        if (!pull) return;
        const touch = event.touches[0];
        const dy = touch.clientY - pull.start;
        if (!pull.pulling) {
          if (Math.abs(dy) < 6 && Math.abs(touch.clientX - pull.x) < 6) return;
          // Up or sideways first: an ordinary scroll, leave it.
          if (dy <= 0 || Math.abs(touch.clientX - pull.x) > dy) {
            pull = null;
            return;
          }
          pull.pulling = true;
          pull.base = touch.clientY;
        }
        event.preventDefault();
        const offset = Math.max(0, touch.clientY - pull.base);
        y.set(offset);
        pull.samples.push([event.timeStamp, offset]);
        if (pull.samples.length > 5) pull.samples.shift();
      };
      const onEnd = () => {
        if (!pull?.pulling) {
          pull = null;
          return;
        }
        const samples = pull.samples;
        const [t0, y0] = samples[0] ?? [0, 0];
        const [t1, y1] = samples[samples.length - 1] ?? [0, 0];
        const velocity = t1 > t0 ? ((y1 - y0) / (t1 - t0)) * 1000 : 0;
        pull = null;
        if (y.get() > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) closeRef.current();
        else animate(y, 0, PANEL_SPRING);
      };
      node.addEventListener('touchstart', onStart, { passive: true });
      node.addEventListener('touchmove', onMove, { passive: false });
      node.addEventListener('touchend', onEnd);
      node.addEventListener('touchcancel', onEnd);
      return () => {
        node.removeEventListener('touchstart', onStart);
        node.removeEventListener('touchmove', onMove);
        node.removeEventListener('touchend', onEnd);
        node.removeEventListener('touchcancel', onEnd);
      };
    },
    [y],
  );

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
                    style={{ y }}
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
                    handle down, pulling the content down from the top, or
                    Esc. This one is for screen readers. */}
                <Dialog.Close className="sr-only">Close</Dialog.Close>
                <div ref={content} className="relative min-h-0 flex-1">
                  <AnimatePresence initial={false}>
                    <m.div
                      key={contentKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: CONTENT_EXIT }}
                      transition={CONTENT_FADE}
                      data-sheet-scroll
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
