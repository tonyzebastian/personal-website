import Link from 'next/link';
import MediaGrid from './MediaGrid';
import ViewLine from './ViewLine';

// A curved branch from the timeline into the heading, as on the home page
// (omitted when hideNode is set, e.g. a company's only item at the end of the
// timeline).
// The whole block is one link that opens the case study as a dialog.
export default function ExperienceItem({ title, description, images = [], link, hideNode = false }) {
  const body = (
    <div className="space-y-4">
      <div>
        {/* On hover the heading expands, then the line draws out to the right
            edge and "View project" appears. Touch screens show it always. */}
        <div className="flex items-center gap-3">
          <h3 className="shrink-0 text-sm text-slate-900 transition-all group-hover:font-semibold group-focus-visible:font-semibold">
            {title}
          </h3>
          <ViewLine />
        </div>
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
        <svg
          className="absolute left-[11px] top-[3px]"
          width="14"
          height="13"
          viewBox="0 0 14 13"
          fill="none"
          aria-hidden
        >
          <path
            d="M13 12.5C11.4241 12.5 9.8637 12.1896 8.4078 11.5866C6.95189 10.9835 5.62902 10.0996 4.51472 8.98528C3.40041 7.87098 2.5165 6.54811 1.91344 5.0922C1.31039 3.63629 0.999999 2.07586 1 0.5"
            stroke="#c8c0cc"
            strokeLinecap="round"
          />
        </svg>
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
