import { notFound } from 'next/navigation';
import { ArrowUpRight } from '@phosphor-icons/react/ssr';
import { experience } from '@/lib/content';
import { postmanData } from '@/lib/case-studies/postman';
import { hypersonixData } from '@/lib/case-studies/hypersonix';
import PanelPage from '@/components/panel/PanelPage';
import CaseStudy from '@/components/CaseStudy';
import Row from '@/components/Row';
import { buttonVariants } from '@/components/ui/button';

// One summary page per experience entry: /sundial, /postman, /hypersonix,
// /avrl and /infosys. Only those are built; any other path is a 404.
export const dynamicParams = false;

const CASE_STUDIES = {
  postman: postmanData.projects,
  hypersonix: hypersonixData.projects,
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
    alternates: { canonical: `https://tonyzeb.design/${job.slug}` },
    openGraph: { title, description: job.description, url: `https://tonyzeb.design/${job.slug}` },
  };
}

export default async function CompanyPage({ params }) {
  const { company } = await params;
  const job = findJob(company);
  if (!job) notFound();

  const projects = CASE_STUDIES[job.slug];

  return (
    <PanelPage
      icon={job.image}
      title={job.name}
      meta={[job.role, job.period]}
      actions={
        job.link && (
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Visit website
            <ArrowUpRight weight="bold" aria-hidden />
          </a>
        )
      }
    >
      {job.description && <p>{job.description}</p>}

      {projects && (
        <div className="mt-6">
          <CaseStudy projects={projects} />
        </div>
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
