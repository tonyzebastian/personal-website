import { ArrowUpRight } from '@phosphor-icons/react/ssr';
import { PanelLink } from '@/components/panel/ActivePath';

// One list row for every section on the home page. Wide column: icon and title
// (plus an arrow on hover for external links) on the left, details on the
// right, all on one line; the dates show on hover. Narrow column
// (a container query, so it follows the list column, not the window): rows
// with an icon show it as a tile, with the title above the details, which
// read in reverse ("Lead Designer | Oct'25 - Oct'26"). Long titles are cut
// short with an ellipsis. Internal links open in the panel without scrolling
// the list, and the row whose page is open in the panel stays highlighted.
//   href      internal path, external URL, or nothing for a plain row
//   meta      strings shown on the right; the last one reads strongest
export default function Row({ href, icon, title, meta = [] }) {
  const isExternal = href?.startsWith('http');
  const details = meta.filter(Boolean);
  const hasIcon = icon !== undefined;

  const body = (
    <>
      {hasIcon && <RowIcon src={icon} title={title} />}
      <span
        className={`flex min-w-0 items-center ${hasIcon ? 'col-start-2 row-start-1 self-end @lg:self-center' : ''}`}
      >
        <span data-morph="title" className="truncate font-medium text-ink" title={title}>
          {title}
        </span>
        {isExternal && (
          <span className="w-0 shrink-0 overflow-hidden transition-[width] duration-200 ease-snappy md:group-hover:w-5 md:group-focus-visible:w-5">
            <ArrowUpRight size={14} weight="bold" className="ml-1 text-body/40" aria-hidden />
          </span>
        )}
      </span>
      {details.length > 0 && (
        <>
          {/* Narrow: second line, most important first, split by pipes. Each
              pipe travels with the item after it; the wrapper clips the
              pipe that would start a wrapped line. */}
          <span
            className={`overflow-hidden text-body/70 tabular-nums @lg:hidden ${hasIcon ? 'col-start-2 row-start-2 self-start' : ''}`}
          >
            <span className="-ml-[17px] flex flex-wrap">
              {[...details].reverse().map((text, index) => (
                <span
                  key={text}
                  data-morph={index === 0 ? 'date' : undefined}
                  className="relative pl-[17px] whitespace-nowrap"
                >
                  <span aria-hidden className="absolute left-[6px] text-body/25">
                    |
                  </span>
                  {text}
                </span>
              ))}
            </span>
          </span>
          {/* Wide: on the right of the same line, split by pipes. On links,
              everything before the last detail (the dates) fades in on hover,
              focus or while open; its space is kept so nothing shifts. Screens
              without hover always show it. */}
          <span
            className={`hidden shrink-0 items-center gap-3 tabular-nums @lg:row-start-1 @lg:flex ${hasIcon ? '@lg:col-start-3 @lg:pl-4' : '@lg:col-start-2 @lg:pl-6'}`}
          >
            {details.map((text, index) =>
              index === details.length - 1 ? (
                <span key={text} data-morph="date" className="text-body/70">
                  {text}
                </span>
              ) : (
                <span
                  key={text}
                  className={`flex items-center gap-3 text-body/70 ${href ? 'opacity-0 transition-opacity duration-150 ease-snappy group-hover:opacity-100 group-focus-visible:opacity-100 group-data-active:opacity-100 [@media(hover:none)]:opacity-100' : ''}`}
                >
                  {text}
                  <span aria-hidden className="text-body/25">
                    |
                  </span>
                </span>
              ),
            )}
          </span>
        </>
      )}
    </>
  );

  const layout = hasIcon
    ? 'grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 @lg:grid-cols-[auto_minmax(0,1fr)_auto] @lg:gap-x-2'
    : 'grid-cols-[minmax(0,1fr)] gap-y-1 @lg:grid-cols-[minmax(0,1fr)_auto]';
  const className = `-mx-3 grid items-center rounded-md px-3 py-2.5 ${layout}`;

  if (!href) return <div className={className}>{body}</div>;

  const linkClass = `group ${className} outline-none transition-colors hover:bg-body/[0.03] focus-visible:bg-body/[0.05] focus-visible:ring-2 focus-visible:ring-ring data-active:bg-body/[0.05]`;

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {body}
      </a>
    );
  }

  return (
    <PanelLink href={href} className={linkClass}>
      {body}
    </PanelLink>
  );
}

// A logo, or the first letter of the title when there is no logo yet. On a
// narrow column it sits in a soft tile spanning both lines; on a wide one it
// is a plain small logo.
function RowIcon({ src, title }) {
  return (
    <span
      aria-hidden
      className="row-span-2 flex size-12 shrink-0 items-center justify-center rounded-xl bg-body/[0.04] @lg:row-span-1 @lg:size-6 @lg:rounded-none @lg:bg-transparent"
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          className="size-7 object-contain drop-shadow-md @lg:size-6"
        />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-full bg-body/[0.06] text-xs font-medium text-body/70 @lg:size-6">
          {title.charAt(0)}
        </span>
      )}
    </span>
  );
}
