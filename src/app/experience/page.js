import { experience } from '@/lib/content';
import CompanyHeader from '@/components/experience/CompanyHeader';
import ExperienceItem from '@/components/experience/ExperienceItem';
import { TimelineBranches } from '@/components/experience/TimelineDecor';
import NoiseBand from '@/components/NoiseBand';

export const metadata = {
  title: 'Case Studies ✦ Tony Sebastian',
  description: 'Case studies from my design work at Sundial, Postman and Hypersonix.',
  robots: 'noindex,nofollow',
  alternates: { canonical: 'https://www.tonyzeb.com/experience' },
};

function CompanyGroup({ company, isLastCompany }) {
  // The timeline ends at the logo when the last company has no separate items.
  const endsAtLogo = isLastCompany && company.items.length === 0;

  return (
    <article id={company.slug} className="exp-segment relative scroll-mt-8">
      <CompanyHeader
        name={company.name}
        description={company.description}
        image={company.image}
        tail={endsAtLogo}
        href={company.caseStudy?.link}
        images={company.caseStudy?.images}
        alt={`${company.name} preview`}
      />
      {company.items.length > 0 && (
        <div className="mt-6 space-y-10">
          {company.items.map((item) => (
            <ExperienceItem key={item.title} {...item} />
          ))}
        </div>
      )}
    </article>
  );
}

export default function ExperiencePage() {
  return (
    <section className="relative isolate w-full overflow-hidden px-4 pt-24 pb-20 lg:px-10 lg:pt-48">
      <NoiseBand />

      <div className="relative z-10 mx-auto flex w-full max-w-[756px] flex-col gap-12">
        <header className="mx-auto w-full max-w-[600px] pl-8">
          <h1 className="text-5xl! mb-0!">Case Studies</h1>
        </header>

        <section aria-label="Case studies timeline" className="relative mx-auto w-full max-w-[600px] lg:pb-32">
          <div className="relative">
            <TimelineBranches />
            <div className="relative z-10 flex flex-col gap-16">
              {experience.filter((company) => company.timeline !== false).map((company, index, list) => (
                <CompanyGroup
                  key={company.slug}
                  company={company}
                  isLastCompany={index === list.length - 1}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
