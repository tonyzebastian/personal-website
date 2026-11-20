import { notFound } from 'next/navigation';
import { experience } from '@/lib/content';
import { postmanData } from '@/lib/case-studies/postman';
import PanelPage from '@/components/panel/PanelPage';
import CaseStudy from '@/components/CaseStudy';

// Full-page case studies for roles whose work is too long for the company
// page. Only Postman has one, at /postman/work. SiteShell always shows this
// route full width (see `FULL_PAGE_PATHS` in the (site) layout).
export const dynamicParams = false;

const WORK = { postman: postmanData.projects };

// Only companies with a work page get one built.
export function generateStaticParams() {
  return Object.keys(WORK).map((company) => ({ company }));
}

const description =
  "Case studies from Tony Sebastian's three years as a Senior Product Designer at Postman, covering trial experiences, API observability with Live Collections, and smaller workflow improvements.";

export async function generateMetadata({ params }) {
  const { company } = await params;
  if (!WORK[company]) return {};
  const url = `https://www.tonyzeb.com/${company}/work`;
  return {
    title: 'My work at Postman ✦ Tony Sebastian',
    description,
    alternates: { canonical: url },
    openGraph: {
      title: 'My work at Postman ✦ Tony Sebastian',
      description,
      url,
      images: [{ url: '/preview.png', width: 1200, height: 630, alt: 'Tony Sebastian, visual product designer' }],
    },
  };
}

export default async function WorkPage({ params }) {
  const { company } = await params;
  const job = experience.find((item) => item.slug === company);
  if (!job || !WORK[company]) notFound();

  return (
    <PanelPage icon={job.image} title="My work at Postman" href={job.link} meta={[job.role, job.period]}>
      <CaseStudy projects={WORK[company]} />
    </PanelPage>
  );
}
