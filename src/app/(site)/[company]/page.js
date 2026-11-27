import { notFound } from 'next/navigation';
import { experience } from '@/lib/content';
import { hypersonixData } from '@/lib/case-studies/hypersonix';
import PanelPage from '@/components/panel/PanelPage';
import RelatedCard from '@/components/RelatedCard';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import MediaGrid from '@/components/experience/MediaGrid';

// One page per experience entry: /sundial, /postman, /hypersonix, /avrl and
// /infosys. Each starts with the written overview. Below a wavy rule, cards
// lead on: Postman to each of its case studies (their own pages under
// /project, from the job's `items`), Hypersonix to the one page holding all
// of its case studies (/hypersonix/work), and AVRL and Infosys to related
// musings. Only these are built; any other path is a 404.
export const dynamicParams = false;

// Roles whose case studies share one full page.
const WORK_PAGES = {
  hypersonix: {
    href: '/hypersonix/work',
    projects: hypersonixData.projects,
    summary: 'Documents, onboarding, the Sonic design system and a few early explorations.',
  },
};


export function generateStaticParams() {
  return experience.map((job) => ({ company: job.slug }));
}

const findJob = (slug) => experience.find((job) => job.slug === slug);

export async function generateMetadata({ params }) {
  const { company } = await params;
  const job = findJob(company);
  if (!job) return {};

  const title = `${job.name} ✦ Tony Sebastian`;
  return {
    title,
    description: job.description,
    alternates: { canonical: `https://www.tonyzeb.com/${job.slug}` },
    openGraph: {
      title,
      description: job.description,
      url: `https://www.tonyzeb.com/${job.slug}`,
      // Setting openGraph here replaces the inherited preview image, so name it.
      images: [{ url: '/preview.png', width: 1200, height: 630, alt: 'Tony Sebastian, visual product designer' }],
    },
  };
}

export default async function CompanyPage({ params }) {
  const { company } = await params;
  const job = findJob(company);
  if (!job) notFound();

  const workPage = WORK_PAGES[job.slug];
  // Case studies with a write-up of their own (Postman's).
  const caseStudies = job.items?.filter((item) => item.link) ?? [];

  return (
    <PanelPage
      title={job.name}
      href={job.link}
      meta={[job.period, job.role]}
    >
      {(job.overview ?? [job.description]).map((block, index) =>
        typeof block === 'string' ? (
          <p key={index} className="text-[18px]">{block}</p>
        ) : (
          <figure key={index} className="flex flex-col gap-2">
            {block.youtube ? (
              <YouTubeEmbed id={block.youtube} title={block.title} poster={block.poster} />
            ) : (
              <MediaGrid items={block.media} alt={block.alt} />
            )}
            {block.caption && <figcaption className="text-body/70">{block.caption}</figcaption>}
          </figure>
        )
      )}

      {(workPage || caseStudies.length > 0 || job.related?.length > 0) && (
        <>
          <div aria-hidden className="squiggle my-6" />
          <div className="flex flex-col gap-5">
            {workPage && (
              <RelatedCard
                href={workPage.href}
                title="A closer look at the work"
                meta={`${job.period} · ${workPage.projects.length} case studies`}
                excerpt={workPage.summary}
              />
            )}
            {caseStudies.map((item) => (
              <RelatedCard
                key={item.link}
                href={item.link}
                title={item.title}
                meta={item.meta ?? 'Case study'}
                excerpt={item.summary ?? item.description}
              />
            ))}
            {job.related?.map((item) => (
              <RelatedCard key={item.href} {...item} />
            ))}
          </div>
        </>
      )}
    </PanelPage>
  );
}
