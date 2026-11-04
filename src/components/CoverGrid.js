import { ArrowUpRight } from '@phosphor-icons/react/ssr';
import { PanelLink } from '@/components/panel/ActivePath';
import RevealGroup from '@/components/RevealGroup';
import AutoVideo from '@/components/ui/AutoVideo';

// How many columns to use when `fit` would fit, balanced so the last row is
// not left nearly empty (8 items in 3 columns stay 3 + 3 + 2; 7 in 4 become
// 4 + 3). Same rule as officecommun.com.
const balanced = (count, fit) => Math.ceil(count / Math.ceil(count / fit));

// A grid of covers that open in the panel, after officecommun.com. It follows
// the list column's width (container queries), not the window's:
//   under 792px   two fluid columns at the reading width
//   792px         three 232px columns, centred and wider than the text
//   1040px        four 232px columns
// (each step is the width those columns need, plus the column's padding).
// While a panel is open (data-panel-open on the list column) it stays at two
// fluid columns, so the slide changes the layout once rather than stepping
// through 4, 3 and 2. Column rules are .cover-grid in globals.css.
//   items   [{ href, title, external, cover }]
//           cover: { video } or { image }, plus an optional `position` (CSS
//           object-position) for which part the crop keeps; or
//           { placeholder: true } for a plain tile with the title
//           external: an outside link, opened in a new tab (↗ after the title)
export default function CoverGrid({ items }) {
  const style = { '--cols-3': balanced(items.length, 3), '--cols-4': balanced(items.length, 4) };

  return (
    <RevealGroup className="px-6 md:px-8">
      <div
        style={style}
        className="cover-grid mx-auto grid gap-x-4 gap-y-8"
      >
        {items.map((item) => {
          const Card = item.external ? 'a' : PanelLink;
          const outside = item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
          return (
            <Card
              key={item.href}
              href={item.href}
              {...outside}
              className="cover cover-reveal corners flex min-w-0 flex-col items-start gap-2 rounded-sm outline-none [--corner-from:1.04] [--corner-inset:-6px]"
            >
              <span className="block aspect-[232/261] w-full overflow-hidden rounded-sm bg-body/[0.04]">
                {item.cover.placeholder ? (
                  <span aria-hidden className="cover-img flex size-full items-center justify-center bg-[#ede9df] p-6 text-center font-serif text-[1.75rem] leading-[1.05] tracking-[-0.03em] text-ink">
                    {item.title}
                  </span>
                ) : item.cover.video ? (
                  <AutoVideo
                    src={item.cover.video}
                    aria-hidden
                    className="cover-img size-full object-cover"
                    style={{ objectPosition: item.cover.position }}
                  />
                ) : (
                  <img
                    src={item.cover.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="cover-img size-full object-cover"
                    style={{ objectPosition: item.cover.position }}
                  />
                )}
              </span>
              <span className="flex max-w-full items-center gap-1 text-ink">
                <span className="truncate">{item.title}</span>
                {item.external && (
                  <>
                    <ArrowUpRight weight="bold" aria-hidden className="size-3.5 shrink-0 text-body/70" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </>
                )}
              </span>
            </Card>
          );
        })}
      </div>
    </RevealGroup>
  );
}
