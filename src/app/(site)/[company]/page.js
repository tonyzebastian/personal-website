import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { experience } from '@/lib/content';
import { postmanData } from '@/lib/case-studies/postman';
import { hypersonixData } from '@/lib/case-studies/hypersonix';
import PanelPage from '@/components/panel/PanelPage';
import CaseStudy from '@/components/CaseStudy';
import Row from '@/components/Row';
import Expandable from '@/components/Expandable';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import { buttonVariants } from '@/components/ui/button';

// One page per experience entry: /sundial, /postman, /hypersonix, /avrl and
// /infosys. Each starts with the written overview. Hypersonix folds its case
// studies behind "More about my work here"; Postman's are long enough to get
// their own full page (/postman/work). Only these are built; any other path
// is a 404.
export const dynamicParams = false;

const CASE_STUDIES = {
  postman: postmanData.projects,
  hypersonix: hypersonixData.projects,
};

// Pages whose case studies live on a separate full page instead of in a fold.
const WORK_PAGES = { postman: { href: '/postman/work', label: 'See my work at Postman' } };

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

  const projects = CASE_STUDIES[job.slug];
  const workPage = WORK_PAGES[job.slug];

  return (
    <PanelPage
      icon={job.image}
      title={job.name}
      href={job.link}
      meta={[job.role, job.period]}
    >
      {(job.overview ?? [job.description]).map((block, index) =>
        typeof block === 'string' ? (
          <p key={index}>{block}</p>
        ) : (
          <YouTubeEmbed key={block.youtube} id={block.youtube} title={block.title} />
        )
      )}

      {workPage ? (
        <Link
          href={workPage.href}
          className={buttonVariants({ variant: 'outline', className: 'mt-4 self-start' })}
        >
          {workPage.label}
          <ArrowRight weight="bold" data-icon="inline-end" aria-hidden />
        </Link>
      ) : (
        projects && (
          <div className="mt-4">
            <Expandable label="More about my work here">
              <CaseStudy projects={projects} />
            </Expandable>
          </div>
        )
      )}

      {job.related?.length > 0 && (
        <section className="mt-6 flex flex-col gap-2">
          <h3>Read more</h3>
          <div>
            {job.related.map((item) => (
              <Row key={item.href} href={item.href} title={item.title} />
            ))}
          </div>
        </section>
      )}
    </PanelPage>
  );
}
