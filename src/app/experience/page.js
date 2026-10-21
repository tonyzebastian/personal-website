import { experience } from '@/lib/content';
import CompanyHeader from '@/components/experience/CompanyHeader';
import ExperienceItem from '@/components/experience/ExperienceItem';
import { TimelineBranches } from '@/components/experience/TimelineDecor';
import { TimelineScrollProgress } from './TimelineScrollProgress';

export const metadata = {
  title: 'Experience ✦ Tony Sebastian',
  description: 'A timeline of the companies I have worked with and the projects I designed there.',
  robots: 'noindex,nofollow',
  alternates: { canonical: 'https://tonyzeb.design/experience' },
};

function CompanyGroup({ company, isLastCompany }) {
  // The timeline ends at the logo when the last company has a single item.
  const endsAtLogo = isLastCompany && company.items.length === 1;

  return (
    <article id={company.slug} className="scroll-mt-8 pt-10 first:pt-0">
      <CompanyHeader
        name={company.name}
        role={company.date}
        period={company.secondaryText}
        link={company.link}
        image={company.image}
        tail={endsAtLogo}
      />
      {company.items.length > 0 && (
        <div className="mt-4 space-y-10">
          {company.items.map((item) => (
            <ExperienceItem key={item.title} {...item} hideNode={endsAtLogo} />
          ))}
        </div>
      )}
    </article>
  );
}

export default function ExperiencePage() {
  return (
    <section className="relative isolate w-full overflow-hidden px-4 pt-24 pb-20 lg:px-10 lg:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[24rem] opacity-[0.06] lg:h-[26rem]"
        style={{
          backgroundImage: 'url(/noise.png)',
          backgroundSize: '220px',
          backgroundRepeat: 'repeat',
          maskImage: 'linear-gradient(180deg, black 0%, black 45%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 45%, transparent 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[756px] flex-col gap-12">
        <header className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-4 text-center">
          <h1 className="!text-5xl !mb-0">Experience</h1>
          <p className="max-w-[560px] text-slate-600">
            The companies I have worked with and the projects I designed along the way.
          </p>
        </header>

        <section aria-label="Experience timeline" className="relative mx-auto w-full max-w-[600px] lg:pb-[8rem]">
          <TimelineScrollProgress />
          <div className="exp-timeline relative" data-exp-timeline>
            <TimelineBranches />
            <div className="relative z-10">
              {experience.map((company, index) => (
                <CompanyGroup
                  key={company.slug}
                  company={company}
                  isLastCompany={index === experience.length - 1}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
