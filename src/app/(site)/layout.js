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
// whole screen below the breadcrumb.
const FILL_PATHS = playgroundPages.filter((item) => item.fill).map((item) => `/playground/${item.slug}`);
// Other pages whose side panel skips the bottom blur: Dalal Prints ends in a
// poster wall that runs to the panel's bottom edge.
const NO_BLUR_PATHS = ['/dalal-prints'];
// Every page's short title, for the full-page view's breadcrumb.
const PAGE_TITLES = {
  '/about': 'About',
  '/hypersonix/work': 'Work at Hypersonix',
  ...Object.fromEntries(postmanProjects.map((item) => [`/postman/${item.slug}`, item.page.title])),
  ...Object.fromEntries(experience.map((job) => [`/${job.slug}`, job.name])),
  ...Object.fromEntries(musings.map((musing) => [musing.link, musing.name])),
  ...Object.fromEntries(sideProjects.map((item) => [item.path, item.title])),
  ...Object.fromEntries(playgroundPages.map((item) => [`/playground/${item.slug}`, item.title])),
};
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
      fillPaths={FILL_PATHS}
      noBlurPaths={NO_BLUR_PATHS}
      pageTitles={PAGE_TITLES}
    >
      {children}
    </SiteShell>
  );
}
