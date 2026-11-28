import HomeList from '@/components/HomeList';
import SiteShell from '@/components/panel/SiteShell';
import { experience, musings, sideProjects } from '@/lib/content';
import { playgroundPages } from '@/lib/playground';
import { postmanProjects } from '@/lib/case-studies/postman-projects';

// Routes that open in the panel. The shell uses this to open the panel the
// moment one of these links is clicked.
const PANEL_PATHS = [
  '/about',
  ...experience.map((job) => `/${job.slug}`),
  ...musings.map((musing) => musing.link),
  ...sideProjects.map((item) => item.path),
  ...playgroundPages.map((item) => `/playground/${item.slug}`),
];
// Routes that always show full width, never in the panel.
const FULL_PAGE_PATHS = ['/hypersonix/work', ...postmanProjects.map((item) => `/postman/${item.slug}`)];
// Pages whose title (and optional tagline) sits in the side panel's top row,
// beside its buttons, instead of in the page (Playground pages).
// Pages that fill their container edge to edge (`fill` in playground.js):
// the side panel skips its bottom blur, and the full-page view gives them the
// whole screen below a Back link.
const FILL_PATHS = playgroundPages.filter((item) => item.fill).map((item) => `/playground/${item.slug}`);
// Fill pages that are experiences on their own (`immersive`): opened in a new
// tab, full screen, with no Back link.
const IMMERSIVE_PATHS = playgroundPages.filter((item) => item.immersive).map((item) => `/playground/${item.slug}`);
// Other pages whose side panel skips the bottom blur: Dalal Prints ends in a
// poster wall that runs to the panel's bottom edge.
const NO_BLUR_PATHS = ['/dalal-prints'];
// Groups and clips show their own full header instead.
const PANEL_TITLES = Object.fromEntries(
  playgroundPages.filter((item) => !['group', 'clips'].includes(item.type)).map((item) => [`/playground/${item.slug}`, { title: item.title, tagline: item.tagline, links: item.links }]),
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
      fillPaths={FILL_PATHS}
      noBlurPaths={NO_BLUR_PATHS}
      immersivePaths={IMMERSIVE_PATHS}
    >
      {children}
    </SiteShell>
  );
}
