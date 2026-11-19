// The home page content. It lives in the (site) layout so it stays on screen
// while a panel is open beside it.
import Hero from '@/components/Hero';
import Row from '@/components/Row';
import ShowMore from '@/components/ShowMore';
import CoverGrid from '@/components/CoverGrid';
import IntroFlow from '@/components/IntroFlow';
import { musings } from '@/lib/content';
import { playground } from '@/lib/playground';

// Rows shown before "View more".
const MUSINGS_SHOWN = 3;

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="font-sans text-base font-semibold tracking-normal">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

const musingRow = (musing) => (
  <Row key={musing.link} href={musing.link} title={musing.name} meta={[musing.date]} />
);

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
        <Section id="musings" title="Musings">
          <ShowMore more={musings.slice(MUSINGS_SHOWN).map(musingRow)}>
            {musings.slice(0, MUSINGS_SHOWN).map(musingRow)}
          </ShowMore>
        </Section>
      </Column>

      {/* No visible heading: the covers speak for themselves. The extra top
          margin balances the Musings toggle, which pulls what follows up. */}
      <section aria-label="Playground" className="mt-4">
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
