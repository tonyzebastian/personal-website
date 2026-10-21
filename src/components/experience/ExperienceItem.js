import Link from 'next/link';
import MediaGrid from './MediaGrid';

// A dot on the timeline with a curved branch into the content (omitted when
// hideNode is set, e.g. a company's only item at the end of the timeline).
// The whole block is one link that opens the case study as a dialog.
export default function ExperienceItem({ title, description, images = [], link, hideNode = false }) {
  const body = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm text-slate-900 group-hover:font-semibold transition-all">{title}</h3>
        <p className="text-slate-600 mt-1 text-xs">{description}</p>
      </div>
      {images.length > 0 && <MediaGrid items={images} alt={`${title} preview`} />}
    </div>
  );

  // The tail of the timeline passes behind the last item, so it needs a fill.
  const className = `group relative z-10 block ${hideNode ? 'bg-white' : ''}`;

  return (
    <div className="relative pl-8 pt-1.5">
      {!hideNode && (
        <>
          <span
            className="exp-timeline-dot absolute left-[7px] top-[11px] z-10 h-2.5 w-2.5 rounded-full"
            data-exp-node
            aria-hidden
          />
          <svg
            className="absolute left-[16px] top-[10px]"
            width="16"
            height="6"
            viewBox="0 0 16 6"
            fill="none"
            aria-hidden
          >
            <path
              d="M0.5 5.5 H15.5"
              stroke="#e3ded6"
              strokeLinecap="round"
            />
          </svg>
        </>
      )}
      {link ? (
        <Link href={`${link}?dialog=true`} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </div>
  );
}
