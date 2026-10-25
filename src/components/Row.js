import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/ssr';

// One list row for every section on the home page: an optional icon, the
// title and an arrow on the left, the details on the right.
//   href      internal path, external URL, or nothing for a plain row
//   meta      strings shown on the right; the last one reads strongest
export default function Row({ href, icon, title, meta = [] }) {
  const isExternal = href?.startsWith('http');
  const Arrow = isExternal ? ArrowUpRight : ArrowRight;
  const details = meta.filter(Boolean);

  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {icon !== undefined && <RowIcon src={icon} title={title} />}
        <span className="font-medium text-ink">{title}</span>
        {href && (
          <span className="w-0 overflow-hidden transition-[width] duration-200 ease-out md:group-hover:w-5 md:group-focus-visible:w-5">
            <Arrow size={14} weight="bold" className="ml-1 text-ink/40" aria-hidden />
          </span>
        )}
      </span>
      {details.length > 0 && (
        <span className="flex shrink-0 items-center gap-3 tabular-nums">
          {details.map((text, index) => (
            <span
              key={text}
              className={index === details.length - 1 ? 'text-ink/55' : 'text-ink/40'}
            >
              {text}
            </span>
          ))}
        </span>
      )}
    </>
  );

  const className =
    '-mx-3 flex flex-col items-start gap-1 rounded-md px-3 py-2.5 md:flex-row md:items-center md:justify-between md:gap-6';

  if (!href) return <div className={className}>{body}</div>;

  return (
    <Link
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`group ${className} outline-none transition-colors hover:bg-ink/[0.03] focus-visible:bg-ink/[0.05]`}
    >
      {body}
    </Link>
  );
}

// A logo, or the first letter of the title when there is no logo yet.
function RowIcon({ src, title }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={24}
        height={24}
        loading="lazy"
        decoding="async"
        className="size-6 shrink-0 object-contain drop-shadow-md"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-xs font-medium text-ink/55"
    >
      {title.charAt(0)}
    </span>
  );
}
