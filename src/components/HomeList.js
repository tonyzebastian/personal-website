// The home page content. It lives in the (site) layout so it stays on screen
// while a panel is open beside it.
import Hero from '@/components/Hero';
import Row from '@/components/Row';
import ShowMore from '@/components/ShowMore';
import Contact from '@/components/Contact';
import { experience, projects, musings } from '@/lib/content';

// Musings shown before "View more".
const MUSINGS_SHOWN = 3;

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

const musingRow = (musing) => (
  <Row key={musing.link} href={musing.link} title={musing.name} meta={[musing.date]} />
);

export default function HomeList() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-16 px-6 pt-8 pb-24 md:px-8">
      <Hero />

      <Section id="experience" title="Experience">
        {experience.map((job) => (
          <Row
            key={job.slug}
            href={job.link}
            icon={job.image}
            title={job.name}
            meta={[job.period, job.role]}
          />
        ))}
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

      <Contact />
    </div>
  );
}
