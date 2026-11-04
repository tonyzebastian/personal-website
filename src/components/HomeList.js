// The home page content. It lives in the (site) layout so it stays on screen
// while a panel is open beside it.
import Hero from '@/components/Hero';
import Row from '@/components/Row';
import ShowMore from '@/components/ShowMore';
import CoverGrid from '@/components/CoverGrid';
import { experience, musings } from '@/lib/content';
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

const jobRow = (job) => (
  <Row
    key={job.slug}
    href={`/${job.slug}`}
    icon={job.image}
    title={job.name}
    meta={[job.period, job.role]}
  />
);

const musingRow = (musing) => (
  <Row key={musing.link} href={musing.link} title={musing.name} meta={[musing.date]} />
);

export default function HomeList() {
  return (
    // The column is 672px so the hero image can run wider; everything else
    // sits at a 512px reading width (max-w-lg) centred inside it. The
    // Playground grid below breaks out of the column so it can grow to four
    // covers across.
    <div className="flex flex-col gap-16 pt-8 pb-24 lg:pt-4 lg:pb-20">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 md:px-8">
        <Hero />

        <div className="mx-auto flex w-full max-w-lg flex-col gap-16">
          <Section id="experience" title="Experience">
            {experience.map(jobRow)}
          </Section>

          <Section id="musings" title="Musings">
            <ShowMore more={musings.slice(MUSINGS_SHOWN).map(musingRow)}>
              {musings.slice(0, MUSINGS_SHOWN).map(musingRow)}
            </ShowMore>
          </Section>
        </div>
      </div>

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
    </div>
  );
}
