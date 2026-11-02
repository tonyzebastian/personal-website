import { Fragment } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/ssr';

// The frame for every page shown in the panel: a header (optional logo and
// title on one line, then a details line split by pipes) and the body below.
//   href   optional website, shown at the end of the details line as a
//          "Website" link that opens in a new tab
export default function PanelPage({ icon, title, href, meta = [], children }) {
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
    <article className="@container mx-auto w-full max-w-2xl px-6 pb-20 md:px-10">
      <header className="mb-10 flex flex-col items-start gap-3">
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
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </article>
  );
}
