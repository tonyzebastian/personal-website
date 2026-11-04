import { Fragment } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/ssr';

// The frame for every page shown in the panel: a header (optional logo and
// title on one line, then a details line split by pipes) and the body below.
//   href          optional website, shown at the end of the details line as
//                 a "Website" link that opens in a new tab
//   description   optional intro shown under the title in place of the
//                 details line (Playground pages)
//   wide          lets the body run wider than the reading width (Playground
//                 pages, whose pieces want room); the text stays narrow
//   compact       in the side panel, hides the header from sight (it stays
//                 for screen readers, minus the description, which the
//                 top row already reads out with its links): the panel's
//                 top row shows the title instead (`panelTitles` in the (site) layout). The sheet and
//                 the full-page view still show it.
//   fill          in the side panel, the body fills the panel's height and
//                 width with no page padding (a tool like Mosaic Image Lab)
export default function PanelPage({
  icon,
  title,
  href,
  meta = [],
  description,
  wide = false,
  compact = false,
  fill = false,
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
        Website
        <ArrowUpRight weight="bold" aria-hidden className="size-3.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    ),
  ].filter(Boolean);

  return (
    <article
      className={`@container mx-auto w-full px-6 pb-20 md:px-10 ${wide ? 'max-w-5xl' : 'max-w-2xl'} ${compact ? 'in-[aside]:pt-6' : ''} ${fill ? 'in-[aside]:flex in-[aside]:h-full in-[aside]:max-w-none in-[aside]:flex-col in-[aside]:p-0!' : ''}`}
    >
      <header className={`mb-10 flex max-w-2xl flex-col items-start gap-3 ${compact ? 'in-[aside]:sr-only' : ''}`}>
        <div className="flex items-center gap-3">
          {icon && (
            <img
              src={icon}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 object-contain drop-shadow-md"
            />
          )}
          <h1>{title}</h1>
        </div>
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
      <div className={`flex flex-col gap-6 ${fill ? 'in-[aside]:min-h-0 in-[aside]:flex-1' : ''}`}>{children}</div>
    </article>
  );
}
