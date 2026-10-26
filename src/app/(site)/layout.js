import HomeList from '@/components/HomeList';
import SiteShell from '@/components/panel/SiteShell';
import { experience, musings } from '@/lib/content';

// Routes that open in the panel. The shell uses this to open the panel the
// moment one of these links is clicked.
const PANEL_PATHS = ['/about', ...experience.map((job) => `/${job.slug}`), ...musings.map((musing) => musing.link)];

// Home and every page that opens in the side panel share this layout, so the
// list stays mounted (and keeps its scroll) while panels open and close.
export default function SiteLayout({ children }) {
  return (
    <SiteShell list={<HomeList />} panelPaths={PANEL_PATHS}>
      {children}
    </SiteShell>
  );
}
