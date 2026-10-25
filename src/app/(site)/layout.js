import HomeList from '@/components/HomeList';
import SiteShell from '@/components/panel/SiteShell';

// Home and every page that opens in the side panel share this layout, so the
// list stays mounted (and keeps its scroll) while panels open and close.
export default function SiteLayout({ children }) {
  return <SiteShell list={<HomeList />}>{children}</SiteShell>;
}
