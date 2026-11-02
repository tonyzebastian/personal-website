'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, LazyMotion, MotionConfig, m, useReducedMotion } from 'motion/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui/button';
import { ActivePathContext } from './ActivePath';
import FrozenRouter from './FrozenRouter';
import PanelBlur from './PanelBlur';
import PanelHeader from './PanelHeader';
import PanelSkeleton from './PanelSkeleton';
import { CONTENT_FADE, PANEL_SHARE, PANEL_SPRING, SPLIT_FROM } from './config';

// The sheet (and its dialog code) is only needed on narrow screens.
const PanelSheet = dynamic(() => import('./PanelSheet'), { ssr: false });

const loadFeatures = () => import('@/lib/motion-features').then((mod) => mod.default);

const DESKTOP_QUERY = `(min-width: ${SPLIT_FROM}px)`;

function subscribeToWidth(onChange) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const isWide = () => window.matchMedia(DESKTOP_QUERY).matches;
const unknownWidth = () => null;

// true / false on the client; null while rendering on the server.
function useIsDesktop() {
  return useSyncExternalStore(subscribeToWidth, isWide, unknownWidth);
}

// The site layout: the home list, plus a panel for whatever route is open.
// Every route other than "/" opens in the panel, so the URL always matches
// what is on screen. The panel is one layer over home: switching from one
// panel page to another replaces the history entry, so Back (or closing)
// always returns home rather than stepping through every page opened.
//
// Wide screens: the list sits centred; opening a panel pushes it into the
// left share of the screen while the panel slides in on the right.
// Narrow screens: the list stays put and the panel is a sheet over it.
//
// The panel reacts to a click straight away: it opens (or closes) and shows a
// placeholder while the page loads, instead of waiting for the route.
// Arriving straight on a page (a shared link, a new tab, the panel's expand
// button) shows that page on its own, full width, with a link home. Once the
// visitor reaches "/", the list and panel take over for the rest of the visit.
// `panelPaths` lists the routes that open in the panel.
export default function SiteShell({ list, panelPaths, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
  const asideRef = useRef(null);

  // Whether the panel was opened from home in this tab, so closing can step
  // back instead of adding another history entry.
  const fromHome = useRef(false);
  // Move focus into the panel once the clicked page has loaded.
  const focusPanel = useRef(false);
  // In the full-page view, start the next page at the top (set on link clicks,
  // so Back and Forward keep their scroll position).
  const scrollToTop = useRef(false);

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

  // Full-page view: on when the visit starts on a page, off for good once the
  // visitor reaches home.
  const [fullPage, setFullPage] = useState(pathname !== '/');
  if (fullPage && pathname === '/') setFullPage(false);

  const loading = pendingPath !== null;
  const open = loading || (pathname !== '/' && !closing);
  const contentKey = loading ? `loading:${pendingPath}` : pathname;
  const activePath = open ? (pendingPath ?? pathname) : null;

  useEffect(() => {
    if (pathname === '/') fromHome.current = false;
  }, [pathname]);

  const close = useCallback(() => {
    // Give focus back to the row that opened the panel, if focus was inside it.
    if (asideRef.current?.contains(document.activeElement)) {
      document.querySelector('a[aria-current="page"]')?.focus({ preventScroll: true });
    }
    setPendingPath(null);
    setClosing(true);
    if (fromHome.current) router.back();
    else router.push('/', { scroll: false });
  }, [router]);

  // Catch clicks on links (in the list, the panel or the sheet) before Next
  // starts loading the route, so the panel can respond in the same frame.
  const onClickCapture = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === pathname) {
      // Back on the page already open: drop any open or close still under way.
      setPendingPath(null);
      setClosing(false);
      return;
    }
    if (url.pathname === '/') {
      setPendingPath(null);
      setClosing(true);
    } else if (panelPaths.includes(url.pathname)) {
      setPendingPath(url.pathname);
      focusPanel.current = true;
      if (pathname === '/') {
        fromHome.current = true;
      } else {
        // Panel to panel: replace the entry instead of adding one.
        event.preventDefault();
        router.replace(url.pathname + url.search + url.hash, { scroll: false });
      }
    }
  };

  const panelContent = loading ? <PanelSkeleton /> : <FrozenRouter>{children}</FrozenRouter>;

  // Esc closes the side panel (the sheet gets this from its dialog).
  useEffect(() => {
    if (!open || !isDesktop || fullPage) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isDesktop, fullPage, close]);

  // Full-page view: a clicked link starts the next page at the top (list links
  // ask Next not to scroll, which suits the panel but not a full page).
  useEffect(() => {
    if (!scrollToTop.current) return;
    scrollToTop.current = false;
    window.scrollTo(0, 0);
  }, [pathname]);

  const onFullPageClick = (event) => {
    if (event.target.closest?.('a[href^="/"]:not([target])')) scrollToTop.current = true;
  };

  // When a link opened the panel, focus the page once it arrives (not the
  // placeholder, which is about to go away).
  const focusOnMount = useCallback((node) => {
    if (!node || node.dataset.loading !== undefined || !focusPanel.current) return;
    focusPanel.current = false;
    node.focus({ preventScroll: true });
  }, []);

  if (fullPage) {
    return (
      <div className="min-h-dvh bg-paper" onClickCapture={onFullPageClick}>
        <div className="mx-auto max-w-2xl px-6 pt-6 pb-10 md:px-10">
          <Link
            href="/"
            className={buttonVariants({ variant: 'ghost', className: '-ml-[13px] text-body/80' })}
          >
            <ArrowLeft weight="bold" data-icon="inline-start" aria-hidden />
            Tony Sebastian
          </Link>
        </div>
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className="surface-canvas min-h-dvh lg:flex lg:h-dvh lg:overflow-hidden" onClickCapture={onClickCapture}>
          {/* The list carries the surface itself: as a container it is its own
              layer, so the hero image can only blend with what is inside it.
              On wide screens it sits 16px in from the top and bottom, like the
              panel, so its scrollbar spans the same height. */}
          <div className="@container surface-canvas scrollbar-minimal min-w-0 flex-1 lg:my-4 lg:overflow-y-auto">
            <ActivePathContext value={activePath}>{list}</ActivePathContext>
          </div>

          {/* Side panel. Also rendered while the screen size is still unknown
              (server and first paint), hidden below lg by CSS, so wide screens
              don't flash. While closed it is inert: nothing in it can be
              focused or read out. */}
          {isDesktop !== false && (
            <m.aside
              ref={asideRef}
              aria-label="Details"
              inert={!open}
              initial={false}
              animate={{ width: open ? `${PANEL_SHARE}%` : '0%' }}
              transition={reduceMotion ? { duration: 0 } : PANEL_SPRING}
              className="relative hidden h-full shrink-0 overflow-hidden lg:block"
            >
              {/* Fixed at its open width and pinned to the left edge of its slot,
                  so as the slot grows the whole card moves in from the right
                  (and moves back out on close) instead of being uncovered. */}
              <div className="absolute inset-y-0 left-0 py-4 pr-4" style={{ width: `${PANEL_SHARE}vw` }}>
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-paper">
                  <PanelHeader href={open ? pendingPath ?? pathname : null} onClose={close} />
                  <div className="relative min-h-0 flex-1">
                    <AnimatePresence initial={false}>
                      {open && (
                        <m.div
                          key={contentKey}
                          ref={focusOnMount}
                          data-loading={loading ? '' : undefined}
                          tabIndex={-1}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={CONTENT_FADE}
                          className="scrollbar-minimal absolute inset-0 overflow-y-auto outline-none"
                        >
                          {panelContent}
                        </m.div>
                      )}
                    </AnimatePresence>
                    <PanelBlur />
                  </div>
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
      </MotionConfig>
    </LazyMotion>
  );
}
