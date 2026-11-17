'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSelectedLayoutSegments } from 'next/navigation';
import { AnimatePresence, LazyMotion, MotionConfig, m, useReducedMotion } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ActivePathContext } from './ActivePath';
import FrozenRouter from './FrozenRouter';
import PanelBlur from './PanelBlur';
import PanelHeader from './PanelHeader';
import PanelSkeleton from './PanelSkeleton';
import { CONTENT_EXIT, CONTENT_FADE, PANEL_SHARE, PANEL_SLIDE, SKELETON_DELAY, SPLIT_FROM } from './config';

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
// Every route other than "/" opens in the panel. The panel still opens pages
// through the router, but the address bar stays on "/": once a page is open
// it is set back to "/", so a refresh always lands on home. Which page is
// open comes from the router's own tree (useSelectedLayoutSegments), which
// keeps the page even though the URL says "/". The panel is one layer over
// home: switching from one panel page to another replaces the history entry,
// so Back (or closing) always returns home rather than stepping through
// every page opened.
//
// Wide screens: the list sits centred; opening a panel pushes it into the
// left share of the screen while the panel slides in on the right.
// Narrow screens: the list stays put and the panel is a sheet over it.
//
// The panel reacts to a click straight away: it opens (or closes) at once,
// and shows a placeholder if the page takes longer than SKELETON_DELAY to load,
// instead of waiting for the route.
// Arriving straight on a page (a typed link, a new tab, the panel's expand
// button) shows that page on its own, full width, with a link home, and keeps
// its URL. Once the
// visitor reaches "/", the list and panel take over for the rest of the visit.
// `panelPaths` lists the routes that open in the panel; `fullPagePaths` lists
// routes that always show full width; `panelTitles` maps routes whose title
// shows in the panel's top row (their page hides its own heading there);
// `fillPaths` lists routes that fill their container edge to edge (no bottom
// blur in the panel, the whole screen below the breadcrumb on a full page);
// `pageTitles` names each route for the full-page view's breadcrumb.
// Both the panel and a full page carry data-fills: pages with `fill` stretch
// to fill whatever carries it (Tailwind `in-data-fills:`).
export default function SiteShell({
  list,
  panelPaths,
  fullPagePaths = [],
  panelTitles = {},
  fillPaths = [],
  pageTitles = {},
  children,
}) {
  // The page the router is showing (not the address bar, which stays on "/"
  // while a panel is open).
  const segments = useSelectedLayoutSegments();
  const pathname = `/${segments.filter((segment) => !segment.startsWith('(')).join('/')}`;
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
  const asideRef = useRef(null);
  const cardRef = useRef(null);

  // Whether the open panel's history entry sits right after home's, so
  // closing can step back instead of adding another entry. Set once the
  // panel's page has loaded (not on the click), so closing before then never
  // steps back past home; Back then Forward also counts.
  const fromHome = useRef(false);
  const previousPath = useRef(pathname);
  // The page last open in the panel, to give focus back to its row on close.
  const lastActive = useRef(null);
  const listRef = useRef(null);
  // Move focus into the panel once the clicked page has loaded.
  const focusPanel = useRef(false);
  // In the full-page view, start the next page at the top (set on link clicks,
  // so Back and Forward keep their scroll position).
  const scrollToTop = useRef(false);

  // A panel link that was clicked but has not loaded yet, and whether a close
  // is on its way. Both reset as soon as the route actually changes.
  const [pendingPath, setPendingPath] = useState(null);
  const [closing, setClosing] = useState(false);
  // The pending link whose placeholder is due (it has been loading for longer
  // than SKELETON_DELAY).
  const [skeletonFor, setSkeletonFor] = useState(null);
  const [shownPath, setShownPath] = useState(pathname);
  if (pathname !== shownPath) {
    setShownPath(pathname);
    setPendingPath(null);
    setSkeletonFor(null);
    setClosing(false);
  }
  useEffect(() => {
    if (pendingPath === null) return undefined;
    const timer = setTimeout(() => setSkeletonFor(pendingPath), SKELETON_DELAY);
    return () => clearTimeout(timer);
  }, [pendingPath]);

  // Full-page view: on when the visit starts on a page, off for good once the
  // visitor reaches home.
  const [fullPage, setFullPage] = useState(pathname !== '/');
  if (fullPage && pathname === '/') setFullPage(false);
  const showFullPage = fullPage || fullPagePaths.includes(pathname);

  // Panel pages keep the address bar on "/". Next sets the page's URL as the
  // route commits; this puts "/" back before the browser paints. Next follows
  // the change (it patches history.replaceState) and keeps the page's tree
  // on the entry, so Back and Forward still close and reopen the panel.
  // It also reruns when Next's own URL changes (`addressBar`): on a slow
  // first load Next can set the page's URL a commit after the page shows.
  const addressBar = usePathname();
  useLayoutEffect(() => {
    if (showFullPage || pathname === '/' || window.location.pathname === '/') return;
    window.history.replaceState(null, '', '/');
  }, [pathname, showFullPage, addressBar]);

  const loading = pendingPath !== null;
  const open = loading || (pathname !== '/' && !closing);
  // While a page loads, the panel keeps what it showed (the previous page, or
  // nothing when opening from home) until the placeholder is due.
  const skeleton = loading && skeletonFor === pendingPath;
  const contentKey = skeleton ? `loading:${pendingPath}` : pathname;
  const hasContent = !loading || skeleton || pathname !== '/';
  const activePath = open ? (pendingPath ?? pathname) : null;

  // Opening or closing the side panel. The panel's slot takes its new width in
  // one step (so the list re-wraps once, not on every frame), then the list
  // and the panel card slide from where they were to where they now sit,
  // animating only transforms (FLIP). Interrupting a slide starts the next
  // one from wherever things are on screen.
  const wasOpenForSlide = useRef(open);
  useLayoutEffect(() => {
    if (wasOpenForSlide.current === open) return;
    wasOpenForSlide.current = open;
    const list = listRef.current;
    const card = cardRef.current;
    if (!isDesktop || reduceMotion || !list || !card) return;
    // How far the slot moved: the panel's share of the shell.
    const slot = (list.parentElement.clientWidth * PANEL_SHARE) / 100;
    const sign = open ? 1 : -1;
    // The list's centre moves by half the slot, the card by all of it.
    for (const [el, distance] of [
      [list, (sign * slot) / 2],
      [card, sign * slot],
    ]) {
      const current = new DOMMatrix(getComputedStyle(el).transform).m41;
      el.getAnimations().forEach((animation) => animation.cancel());
      el.animate([{ transform: `translateX(${distance + current}px)` }, { transform: 'translateX(0)' }], PANEL_SLIDE);
    }
  }, [open, isDesktop, reduceMotion]);

  useEffect(() => {
    if (pathname === '/') fromHome.current = false;
    else if (previousPath.current === '/') fromHome.current = true;
    previousPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (activePath) lastActive.current = activePath;
  }, [activePath]);

  // However the panel closes (close button, Esc, Back, a home link), focus
  // inside it would be lost as it turns inert: give it to the row that opened
  // it, or to the list.
  const wasOpen = useRef(open);
  useLayoutEffect(() => {
    const justClosed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!justClosed) return;
    const focused = document.activeElement;
    if (focused && focused !== document.body && !asideRef.current?.contains(focused)) return;
    const row = lastActive.current && listRef.current?.querySelector(`a[href="${lastActive.current}"]`);
    (row || listRef.current)?.focus({ preventScroll: true });
  }, [open]);

  const close = useCallback(() => {
    setClosing(true);
    if (pendingPath !== null && pathname === '/') {
      // Still loading from home: there is no panel entry to step back over,
      // so cancel the navigation instead (the newer one wins).
      setPendingPath(null);
      router.replace('/', { scroll: false });
      return;
    }
    setPendingPath(null);
    if (fromHome.current) router.back();
    else router.push('/', { scroll: false });
  }, [router, pendingPath, pathname]);

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
      if (pathname !== '/') {
        // Panel to panel: replace the entry instead of adding one.
        event.preventDefault();
        router.replace(url.pathname + url.search + url.hash, { scroll: false });
      }
    }
  };

  const panelContent = skeleton ? <PanelSkeleton /> : hasContent ? <FrozenRouter>{children}</FrozenRouter> : null;

  // Esc closes the side panel (the sheet gets this from its dialog).
  useEffect(() => {
    if (!open || !isDesktop || showFullPage) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isDesktop, showFullPage, close]);

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

  if (showFullPage) {
    const title = pageTitles[pathname];
    // Pages that fill (tools like the drawing wall) take the whole screen
    // below the breadcrumb; the rest scroll as a normal page.
    const fills = fillPaths.includes(pathname);
    return (
      <div
        data-fills={fills ? '' : undefined}
        className={`bg-paper ${fills ? 'flex h-dvh flex-col' : 'min-h-dvh'}`}
        onClickCapture={onFullPageClick}
      >
        <Breadcrumb className="shrink-0 px-6 pt-3.5 pb-2.5 md:px-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Tony Sebastian</BreadcrumbLink>
            </BreadcrumbItem>
            {title && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        {fills ? <div className="relative min-h-0 flex-1">{children}</div> : children}
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
          <div
            ref={listRef}
            tabIndex={-1}
            data-panel-open={open ? '' : undefined}
            className="@container surface-canvas scrollbar-minimal min-w-0 flex-1 overflow-x-clip outline-none lg:my-4 lg:overflow-y-auto"
          >
            <ActivePathContext value={activePath}>{list}</ActivePathContext>
          </div>

          {/* Side panel. Also rendered while the screen size is still unknown
              (server and first paint), hidden below lg by CSS, so wide screens
              don't flash. While closed it is inert: nothing in it can be
              focused or read out. */}
          {isDesktop !== false && (
            <aside
              ref={asideRef}
              data-fills=""
              aria-label="Details"
              inert={!open}
              style={{ width: open ? `${PANEL_SHARE}%` : '0%' }}
              className="relative z-10 hidden h-full shrink-0 lg:block"
            >
              {/* Fixed at its open width and pinned to the left edge of its slot.
                  With the slot closed it sits just past the right edge of the
                  screen (the shell clips it); the slide above moves it in and out. */}
              <div ref={cardRef} className="absolute inset-y-0 left-0 py-4 pr-4" style={{ width: `${PANEL_SHARE}vw` }}>
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-paper">
                  <PanelHeader
                    href={open ? pendingPath ?? pathname : null}
                    title={open ? panelTitles[pendingPath ?? pathname] : null}
                    onClose={close}
                  />
                  <div className="relative min-h-0 flex-1">
                    <AnimatePresence initial={false}>
                      {open && hasContent && (
                        <m.div
                          key={contentKey}
                          ref={focusOnMount}
                          data-loading={skeleton ? '' : undefined}
                          tabIndex={-1}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: CONTENT_EXIT }}
                          transition={CONTENT_FADE}
                          className="scrollbar-minimal absolute inset-0 overflow-y-auto outline-none"
                        >
                          {panelContent}
                        </m.div>
                      )}
                    </AnimatePresence>
                    {!fillPaths.includes(pendingPath ?? pathname) && <PanelBlur />}
                  </div>
                </div>
              </div>
            </aside>
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
