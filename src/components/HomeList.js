// The home page content. It lives in the (site) layout so it stays on screen
// while a panel is open beside it.
import Hero from '@/components/Hero';
import Row from '@/components/Row';
import ShowMore from '@/components/ShowMore';
import CoverGrid from '@/components/CoverGrid';
import { experience, projects, musings } from '@/lib/content';
import { playground } from '@/lib/playground';

// Rows shown before "View more".
const EXPERIENCE_SHOWN = 3;
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-6 md:px-8">
        <Hero />

        <div className="mx-auto flex w-full max-w-lg flex-col gap-16">
          <Section id="experience" title="Experience">
            <ShowMore more={experience.slice(EXPERIENCE_SHOWN).map(jobRow)}>
              {experience.slice(0, EXPERIENCE_SHOWN).map(jobRow)}
            </ShowMore>
          </Section>

          <Section id="projects" title="Pet Projects">
            {projects.map((project) => (
              <Row
                key={project.name}
                href={project.link}
                icon={project.image}
                title={project.name}
                meta={[project.description]}
              />
            ))}
          </Section>

          <Section id="musings" title="Musings">
            <ShowMore more={musings.slice(MUSINGS_SHOWN).map(musingRow)}>
              {musings.slice(0, MUSINGS_SHOWN).map(musingRow)}
            </ShowMore>
          </Section>
        </div>
      </div>

      <section aria-labelledby="playground" className="flex flex-col gap-4">
        <div className="mx-auto w-full max-w-2xl px-6 md:px-8">
          <h2 id="playground" className="mx-auto max-w-lg font-sans text-base font-semibold tracking-normal">
            Playground
          </h2>
        </div>
        <CoverGrid
          items={playground.map((item) => ({
            href: `/playground/${item.slug}`,
            title: item.title,
            cover: item.cover,
          }))}
        />
      </section>
    </div>
  );
}
