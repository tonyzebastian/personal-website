'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, LazyMotion, m } from 'motion/react';
import FrozenRouter from './FrozenRouter';
import PanelHeader from './PanelHeader';
import { CONTENT_FADE, PANEL_SHARE, PANEL_SPRING, SPLIT_FROM } from './config';

// The sheet (and its dialog code) is only needed on narrow screens.
const PanelSheet = dynamic(() => import('./PanelSheet'), { ssr: false });

const loadFeatures = () => import('@/lib/motion-features').then((mod) => mod.default);

// true / false on the client; null while rendering on the server.
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(`(min-width: ${SPLIT_FROM}px)`);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(`(min-width: ${SPLIT_FROM}px)`).matches,
    () => null
  );
}

// The site layout: the home list, plus a panel for whatever route is open.
// Every route other than "/" opens in the panel, so the URL always matches
// what is on screen and the back button closes or steps through panels.
//
// Wide screens: the list sits centred; opening a panel pushes it into the
// left share of the screen while the panel slides in on the right.
// Narrow screens: the list stays put and the panel is a sheet over it.
export default function SiteShell({ list, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const open = pathname !== '/';

  const close = useCallback(() => router.push('/', { scroll: false }), [router]);

  // Esc closes the side panel (the sheet gets this from its dialog).
  useEffect(() => {
    if (!open || !isDesktop) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isDesktop, close]);

  // When a link opened the panel, move keyboard focus into it.
  const focusOnMount = useCallback((node) => {
    if (node && document.activeElement?.closest('a')) node.focus({ preventScroll: true });
  }, []);

  return (
    <LazyMotion features={loadFeatures} strict>
      <div className="xl:flex xl:h-dvh xl:overflow-hidden">
        <div className="@container min-w-0 flex-1 xl:h-full xl:overflow-y-auto">{list}</div>

        {/* Side panel. Rendered on the server too (hidden below xl by CSS), so
            each page's HTML carries its content. */}
        {isDesktop !== false && (
          <m.aside
            aria-label="Details"
            initial={false}
            animate={{ width: open ? `${PANEL_SHARE}%` : '0%' }}
            transition={PANEL_SPRING}
            className="relative hidden h-full shrink-0 overflow-hidden xl:block"
          >
            {/* Fixed at its open width and pinned right, so while the panel
                grows or shrinks it slides rather than squashing its text. */}
            <div className="absolute inset-y-0 right-0 py-2 pr-2" style={{ width: `${PANEL_SHARE}vw` }}>
              <div className="relative h-full overflow-hidden rounded-xl border border-border bg-paper shadow-[0_8px_30px_-8px_rgba(50,64,79,0.18)]">
                <AnimatePresence initial={false}>
                  {open && (
                    <m.div
                      key={pathname}
                      ref={focusOnMount}
                      tabIndex={-1}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={CONTENT_FADE}
                      className="absolute inset-0 overflow-y-auto outline-none"
                    >
                      <PanelHeader onClose={close} />
                      <FrozenRouter>{children}</FrozenRouter>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </m.aside>
        )}

        {isDesktop === false && (
          <PanelSheet open={open} pathname={pathname} onClose={close}>
            {children}
          </PanelSheet>
        )}
      </div>
    </LazyMotion>
  );
}
