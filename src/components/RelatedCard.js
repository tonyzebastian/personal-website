import { PanelLink } from '@/components/panel/ActivePath';
import { musings } from '@/lib/content';

// A quiet, wide card linking on from a page: the job pages' case-study page
// and related musings. A sibling of the home Musings cards (the same white
// paper, title and a short summary) laid out sideways, with a space on
// the left for an illustration (`illustration`, an image path; an empty
// tinted panel until there is one). It sits almost flat and lifts slightly on
// hover. Styles are `.related-card-*` in globals.css.
//   href       the page it opens. For a musing, its name, date, reading
//              time and summary come from `musings` in content.js
//   title, meta, excerpt
//              set them directly for any other page (or to override)
// The excerpt is a short summary written to fit two lines, so nothing is cut
// mid-sentence; line-clamp-2 only guards against a long one.
// A click always opens the page in the full-page view, even from the side
// panel (data-full-page, handled by SiteShell).


export default function RelatedCard({ href, title, meta, excerpt, illustration }) {
  const musing = musings.find((item) => item.link === href);
  const name = title ?? musing?.name;
  const details = meta ?? [musing?.date, musing?.readTime].filter(Boolean).join(' · ');
  const opening = excerpt ?? musing?.summary;

  return (
    <PanelLink href={href} data-full-page className="related-card group/related block rounded-[6px] outline-none">
      <span className="related-card-paper grid grid-cols-[6.5rem_1fr] overflow-hidden rounded-[6px] bg-paper @md:grid-cols-[9rem_1fr]">
        <span aria-hidden className="related-card-art relative block bg-body/[0.035]">
          {illustration && (
            <img src={illustration} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-1 p-4 @md:p-5">
          <span className="text-lg leading-tight font-semibold tracking-[-0.02em] text-ink">{name}</span>
          {details && <span className="text-body/70 tabular-nums">{details}</span>}
          {opening && <span className="mt-2 line-clamp-2 text-body/80">{opening}</span>}
        </span>
      </span>
    </PanelLink>
  );
}
