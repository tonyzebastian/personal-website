import Hero from '@/components/Hero';
import Row from '@/components/Row';
import ShowMore from '@/components/ShowMore';
import Contact from '@/components/Contact';
import { experience, projects, musings } from '@/lib/content';

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export const metadata = {
  title: 'Tony Sebastian ✦ designer',
  description: 'A visual product designer | Love to code | always tinkering with a side project',
  keywords: 'design, art, cinematography, photography, travel',
  author: 'Tony Sebastian',
  robots: 'index,follow',
  'mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-title': 'Tony Sebastian',
  'apple-mobile-web-app-status-bar-style': 'black-translucent',
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://tonyzeb.design',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tonyzebastian',
    creator: '@tonyzebastian',
    title: 'Tony Sebastian ✦ designer',
    description: 'A visual product designer | Love to code | always tinkering with a side project',
    image: 'https://tonyzeb.design/preview.png',
    imageAlt: 'Tony Sebastian - Visual Product Designer',
  },
  openGraph: {
    title: 'Tony Sebastian ✦ designer',
    description: 'A visual product designer | Love to code | always tinkering with a side project',
    url: 'https://tonyzeb.design/',
    siteName: 'Tony Sebastian',
    images: [{
      url: 'https://tonyzeb.design/preview.png',
      alt: 'Tony Sebastian - Visual Product Designer',
      width: 1200,
      height: 630,
    }],
    locale: 'en_US',
    type: 'website',
  },

};

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

export default function HomePage() {
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
