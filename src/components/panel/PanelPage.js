import { Fragment } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/ssr';
import BackLink from '@/components/panel/BackLink';

// The frame for every page shown in the panel: a header (the title in
// the sans at 24px, then a details line split by pipes) and the body
// below. Shown full width on its own, a Back link sits above the title.
//   href          optional website, shown at the end of the details line as
//                 a link that opens in a new tab
//   linkLabel     that link's text ("Website" unless set, e.g. "Instagram")
//   description   optional intro shown under the title in place of the
//                 details line (Playground pages)
//   wide          lets the body run wider than the reading width (Playground
//                 pages, whose pieces want room); the text stays narrow
//   compact       in the side panel, hides the header from sight (it stays
//                 for screen readers, minus the description, which the
//                 top row already reads out with its links): the panel's
//                 top row shows the title instead (`panelTitles` in the (site) layout). The sheet and
//                 the full-page view still show it.
//   fill          wherever it fills (the side panel, or a full page that
//                 fills, both marked data-fills), the body takes the whole
//                 height and width with no page padding and the heading is
//                 hidden from sight (a tool like Mosaic Image Lab)
//   stretch       in the side panel (data-fills), the page is at least as
//                 tall as the panel and its last block grows to take the
//                 space left (give it in-data-fills:flex-1), so a box at the
//                 end reaches the bottom edge; the header stays (Dalal
//                 Prints). There the page runs the panel's full width with
//                 no side padding: the header keeps the reading width, and
//                 the body's children centre themselves with STRETCH_TEXT,
//                 so a last box can run edge to edge.
//   heading       false hides the title and description from sight
//                 everywhere (kept for screen readers)
// With `stretch`, in the side panel: back to the reading width, centred.
export const STRETCH_TEXT =
  'in-data-fills:mx-auto in-data-fills:w-full in-data-fills:max-w-2xl in-data-fills:px-6 md:in-data-fills:px-10';

export default function PanelPage({
  title,
  href,
  linkLabel = 'Website',
  meta = [],
  description,
  wide = false,
  compact = false,
  fill = false,
  stretch = false,
  heading = true,
  children,
}) {
  const details = meta.filter(Boolean);
  const items = [
    ...details.map((text) => <span key={text}>{text}</span>),
    href && (
      <a
        key="website"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-sm text-body/70 underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:underline focus-visible:outline-none"
      >
        {linkLabel}
        <ArrowUpRight weight="bold" aria-hidden className="size-3.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    ),
  ].filter(Boolean);

  return (
    <article
      className={`@container mx-auto w-full px-6 pb-20 in-data-full-view:pt-8 md:px-10 md:in-data-full-view:pt-12 ${wide ? 'max-w-5xl' : 'max-w-2xl'} ${compact ? 'in-[aside]:pt-6' : ''} ${fill ? 'in-data-fills:flex in-data-fills:h-full in-data-fills:max-w-none in-data-fills:flex-col in-data-fills:p-0!' : ''} ${stretch ? 'in-data-fills:flex in-data-fills:min-h-full in-data-fills:max-w-none in-data-fills:flex-col in-data-fills:px-0! in-data-fills:pb-0' : ''}`}
    >
      <header
        className={`mb-10 flex max-w-2xl flex-col items-start gap-1 ${compact ? 'in-[aside]:sr-only' : ''} ${fill ? 'in-data-fills:sr-only' : ''} ${stretch ? STRETCH_TEXT : ''} ${heading ? '' : 'sr-only'}`}
      >
        {/* Only on a page shown full width on its own: the way home. Pages
            that fill get theirs from the shell instead (or none, immersive). */}
        <BackLink className="mb-5 hidden in-data-full-view:inline-flex in-data-fills:hidden!" />
        <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        {items.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2.5 font-medium text-body/70 tabular-nums">
            {items.map((item, index) => (
              <Fragment key={item.key}>
                {index > 0 && (
                  <span aria-hidden className="text-body/25">
                    |
                  </span>
                )}
                {item}
              </Fragment>
            ))}
          </p>
        )}
        {description && <p className={`text-body/70 ${compact ? 'in-[aside]:hidden' : ''}`}>{description}</p>}
      </header>
      <div className={`flex flex-col gap-6 [&_li]:leading-[1.6] [&_p]:leading-[1.6] ${fill ? 'in-data-fills:min-h-0 in-data-fills:flex-1' : ''} ${stretch ? 'in-data-fills:flex-1' : ''}`}>{children}</div>
    </article>
  );
}
