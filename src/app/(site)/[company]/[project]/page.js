import { notFound } from 'next/navigation';
import { experience } from '@/lib/content';
import { postmanProjects } from '@/lib/case-studies/postman-projects';
import PanelPage from '@/components/panel/PanelPage';
import CaseStudy from '@/components/CaseStudy';

// A case study on its own page: /postman/new-trial-experiences,
// /postman/live-collections and /postman/pinned-environments. The Postman page
// links to each with a card, and they always show full width
// (`FULL_PAGE_PATHS` in the (site) layout). Hypersonix keeps all of its case
// studies on one page instead (/hypersonix/work).
export const dynamicParams = false;

const PROJECTS = { postman: postmanProjects };

export function generateStaticParams() {
  return Object.entries(PROJECTS).flatMap(([company, projects]) =>
    projects.map((item) => ({ company, project: item.slug }))
  );
}

function find(company, slug) {
  const job = experience.find((item) => item.slug === company);
  const study = PROJECTS[company]?.find((item) => item.slug === slug);
  return job && study ? { job, study } : null;
}

export async function generateMetadata({ params }) {
  const { company, project } = await params;
  const found = find(company, project);
  if (!found) return {};
  const { job, study } = found;
  const title = `${study.page.title} ✦ Tony Sebastian`;
  const { description } = study.page;
  const url = `https://www.tonyzeb.com/${job.slug}/${study.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: '/preview.png', width: 1200, height: 630, alt: 'Tony Sebastian, visual product designer' }],
    },
  };
}

export default async function CaseStudyPage({ params }) {
  const { company, project } = await params;
  const found = find(company, project);
  if (!found) notFound();
  const { job, study } = found;

  return (
    <PanelPage title={study.page.title} meta={[job.name, study.page.duration, study.page.role]}>
      {study.page.description && <p>{study.page.description}</p>}
      <div className="mt-8">
        <CaseStudy projects={study.projects} />
      </div>
    </PanelPage>
  );
}
