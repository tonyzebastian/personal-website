'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, LazyMotion, m } from 'motion/react';
import FrozenRouter from './FrozenRouter';
import PanelHeader from './PanelHeader';
import PanelSkeleton from './PanelSkeleton';
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
//
// The panel reacts to a click straight away: it opens (or closes) and shows a
// placeholder while the page loads, instead of waiting for the route.
// `panelPaths` lists the routes that open in the panel.
export default function SiteShell({ list, panelPaths, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  // A panel link that was clicked but has not loaded yet, and whether a close
  // is on its way. Both reset as soon as the route actually changes.
  const [pendingPath, setPendingPath] = useState(null);
  const [closing, setClosing] = useState(false);
  const [shownPath, setShownPath] = useState(pathname);
  if (pathname !== shownPath) {
    setShownPath(pathname);
    setPendingPath(null);
    setClosing(false);
  }

  const loading = pendingPath !== null;
  const open = loading || (pathname !== '/' && !closing);
  const contentKey = loading ? `loading:${pendingPath}` : pathname;

  const close = useCallback(() => {
    setPendingPath(null);
    setClosing(true);
    router.push('/', { scroll: false });
  }, [router]);

  // Catch clicks on links (in the list, the panel or the sheet) before Next
  // starts loading the route, so the panel can respond in the same frame.
  const onClickCapture = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin || url.pathname === pathname) return;
    if (url.pathname === '/') {
      setPendingPath(null);
      setClosing(true);
    } else if (panelPaths.includes(url.pathname)) {
      setPendingPath(url.pathname);
    }
  };

  const panelContent = loading ? <PanelSkeleton /> : <FrozenRouter>{children}</FrozenRouter>;

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
      <div className="surface-canvas min-h-dvh xl:flex xl:h-dvh xl:overflow-hidden" onClickCapture={onClickCapture}>
        {/* The list carries the surface itself: as a container it is its own
            layer, so the hero image can only blend with what is inside it. */}
        <div className="@container surface-canvas scrollbar-minimal min-w-0 flex-1 xl:h-full xl:overflow-y-auto">{list}</div>

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
            <div className="absolute inset-y-0 right-0 py-4 pr-4" style={{ width: `${PANEL_SHARE}vw` }}>
              <div className="relative h-full overflow-hidden rounded-xl border border-border bg-paper">
                <AnimatePresence initial={false}>
                  {open && (
                    <m.div
                      key={contentKey}
                      ref={focusOnMount}
                      tabIndex={-1}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={CONTENT_FADE}
                      className="scrollbar-minimal absolute inset-0 overflow-y-auto outline-none"
                    >
                      <PanelHeader onClose={close} />
                      {panelContent}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </m.aside>
        )}

        {isDesktop === false && (
          <PanelSheet open={open} contentKey={contentKey} onClose={close}>
            {panelContent}
          </PanelSheet>
        )}
      </div>
    </LazyMotion>
  );
}
