import { ArrowUpRight } from '@phosphor-icons/react/ssr';
import MediaGrid from '@/components/experience/MediaGrid';
import { buttonVariants } from '@/components/ui/button';

// Renders case study projects from src/lib/case-studies. Each project has a
// title, an optional link to its full write-up, and sections that may hold a
// heading, a description, bullet points, media, cards or subsections.
export default function CaseStudy({ projects }) {
  return (
    <div className="flex flex-col gap-16">
      {projects.map((project) => (
        <article key={project.title} className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2>{project.title}</h2>
            {project.link && (
              // Full write-ups live outside the panel, so they open in a new tab.
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                View details
                <ArrowUpRight weight="bold" aria-hidden />
              </a>
            )}
          </div>
          {project.sections.map((section, index) => (
            <Section key={section.heading || index} section={section} title={project.title} />
          ))}
        </article>
      ))}
    </div>
  );
}

function Section({ section, title }) {
  const { heading, description, bulletPoints, images, cards, subsections } = section;

  return (
    <section className="flex flex-col gap-3">
      {heading && <h3>{heading}</h3>}
      {description && <p>{description}</p>}
      {bulletPoints?.length > 0 && (
        <ul className="list-disc space-y-1.5 pl-5 marker:text-ink/40">
          {bulletPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      {images?.length > 0 && <Media items={images} alt={`${heading || title} illustration`} />}
      {cards?.length > 0 && (
        <div className="grid gap-3 @lg:grid-cols-2">
          {cards.map((card) => (
            <div key={card.title} className="rounded-lg bg-muted p-5">
              <h4 className="mb-1">{card.title}</h4>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      )}
      {subsections?.map((sub) => {
        const media = sub.images || (sub.media ? [sub.media] : []);
        return (
          <div key={sub.title} className="flex flex-col gap-2">
            <h4>{sub.title}</h4>
            <p>{sub.description}</p>
            {media.length > 0 && <Media items={media} alt={sub.title} />}
          </div>
        );
      })}
    </section>
  );
}

// Up to two media side by side; longer lists wrap into rows of two.
function Media({ items, alt }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <MediaGrid key={row.join()} items={row} alt={alt} />
      ))}
    </div>
  );
}
