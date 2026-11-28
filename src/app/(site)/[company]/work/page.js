import { notFound } from 'next/navigation';
import { experience } from '@/lib/content';
import { hypersonixData } from '@/lib/case-studies/hypersonix';
import PanelPage from '@/components/panel/PanelPage';
import CaseStudy from '@/components/CaseStudy';

// Full-page case studies for roles whose work is too long for the company
// page: /hypersonix/work, all four of its case studies on one page. SiteShell
// always shows it full width (see `FULL_PAGE_PATHS` in the (site) layout).
// Postman's case studies each have their own page instead
// ((site)/[company]/[project]).
export const dynamicParams = false;

const WORK = {
  hypersonix: {
    title: 'My work at Hypersonix',
    projects: hypersonixData.projects,
    description:
      "Case studies from Tony Sebastian's time as Lead Product Designer at Hypersonix, covering Documents, onboarding, the Sonic design system, and explorations like App Studio and Hawkeye.",
  },
};

// Only companies with a work page get one built.
export function generateStaticParams() {
  return Object.keys(WORK).map((company) => ({ company }));
}


export async function generateMetadata({ params }) {
  const { company } = await params;
  const work = WORK[company];
  if (!work) return {};
  const url = `https://www.tonyzeb.com/${company}/work`;
  const title = `${work.title} ✦ Tony Sebastian`;
  const { description } = work;
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

export default async function WorkPage({ params }) {
  const { company } = await params;
  const job = experience.find((item) => item.slug === company);
  const work = WORK[company];
  if (!job || !work) notFound();

  return (
    <PanelPage title={work.title} href={job.link} meta={[job.period, job.role]}>
      <CaseStudy projects={work.projects} dividers />
    </PanelPage>
  );
}
