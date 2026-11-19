// The home page content. It lives in the (site) layout so it stays on screen
// while a panel is open beside it.
import Hero from '@/components/Hero';
import Musings from '@/components/Musings';
import CoverGrid from '@/components/CoverGrid';
import IntroFlow from '@/components/IntroFlow';
import { musings } from '@/lib/content';
import { playground } from '@/lib/playground';

// The reading column: 512px, centred, with the page gutters.
function Column({ className = '', children }) {
  return (
    <div className={`px-6 md:px-8 ${className}`}>
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </div>
  );
}

export default function HomeList() {
  return (
    // Each direct child of IntroFlow is one section of the page, and appears in
    // turn on the first load. Add new sections here. The Playground grid is
    // outside the reading column so it can grow to four covers across.
    <IntroFlow className="flex flex-col gap-16 pt-16 pb-24 lg:pt-24 lg:pb-20">
      <Column className="intro-hero">
        <Hero />
      </Column>

      <Column>
        <Musings items={musings} />
      </Column>

      {/* No visible heading: the covers speak for themselves. */}
      <section aria-label="Playground">
        <CoverGrid
          items={playground.map((item) => ({
            href: item.type === 'link' ? item.href : `/playground/${item.slug}`,
            external: item.type === 'link',
            title: item.title,
            cover: item.cover,
          }))}
        />
      </section>
    </IntroFlow>
  );
}
