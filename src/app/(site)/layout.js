import HomeList from '@/components/HomeList';
import SiteShell from '@/components/panel/SiteShell';
import { experience, musings } from '@/lib/content';
import { playgroundPages } from '@/lib/playground';

// Routes that open in the panel. The shell uses this to open the panel the
// moment one of these links is clicked.
const PANEL_PATHS = [
  '/about',
  ...experience.map((job) => `/${job.slug}`),
  ...musings.map((musing) => musing.link),
  ...playgroundPages.map((item) => `/playground/${item.slug}`),
];
// Routes that always show full width, never in the panel.
const FULL_PAGE_PATHS = ['/postman/work'];
// Pages whose title (and optional tagline) sits in the side panel's top row,
// beside its buttons, instead of in the page (Playground pages).
// Pages that fill the panel edge to edge (`fill` in playground.js) skip its
// bottom blur, which would sit over their content.
const NO_BLUR_PATHS = playgroundPages.filter((item) => item.fill).map((item) => `/playground/${item.slug}`);
const PANEL_TITLES = Object.fromEntries(
  playgroundPages.map((item) => [`/playground/${item.slug}`, { title: item.title, tagline: item.tagline, links: item.links }]),
);

// Home and every page that opens in the side panel share this layout, so the
// list stays mounted (and keeps its scroll) while panels open and close.
export default function SiteLayout({ children }) {
  return (
    <SiteShell
      list={<HomeList />}
      panelPaths={PANEL_PATHS}
      fullPagePaths={FULL_PAGE_PATHS}
      panelTitles={PANEL_TITLES}
      noBlurPaths={NO_BLUR_PATHS}
    >
      {children}
    </SiteShell>
  );
}
