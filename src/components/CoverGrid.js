import { ArrowUpRight } from '@phosphor-icons/react/ssr';
import { PanelLink } from '@/components/panel/ActivePath';
import RevealGroup from '@/components/RevealGroup';
import AutoVideo from '@/components/ui/AutoVideo';

const SPAN = {
  tall: 'row-span-2',
  wide: 'col-span-2',
};

// The Playground bento, in the look of shahimim.com: two columns of warm grey
// tiles at the reading width, each cover filling its tile edge to edge with
// the name on a small white label in the bottom-left. Square cells
// (grid-auto-rows matches the column width), so a tall tile spans two rows and
// a wide one both columns; the order and sizes in playground.js are chosen so
// every row closes. The same two columns hold while a panel is open and on phones, only
// smaller. Styles are .bento-* in globals.css.
//   items   [{ href, title, external, size, cover }]
//           size: 'tall' | 'wide', square when left out
//           cover: { video } or { image }, with an optional `position`
//           (object-position) for the part the crop keeps and `zoom` (a
//           scale, anchored at `position`) to crop in further; or
//           { placeholder: true } for a plain card with the title
//           external: an outside link, opened in a new tab (↗ after the title)
export default function CoverGrid({ items }) {
  return (
    <RevealGroup className="bento @container">
      <div className="bento-grid grid grid-cols-2">
        {items.map((item) => {
          const Card = item.external ? 'a' : PanelLink;
          const outside = item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
          return (
            <Card
              key={item.href}
              href={item.href}
              {...outside}
              className={`bento-tile cover-reveal relative block min-w-0 overflow-hidden outline-none ${SPAN[item.size] ?? ''}`}
            >
              <span className="bento-cover" style={{ '--zoom': item.cover.zoom }}>
                {item.cover.placeholder ? (
                  <span aria-hidden className="flex size-full items-center justify-center p-[12%] pb-[20%] text-center text-[1.375rem] leading-[1.1] font-semibold tracking-[-0.03em] text-ink">
                    {item.title}
                  </span>
                ) : item.cover.video ? (
                  <AutoVideo
                    src={item.cover.video}
                    aria-hidden
                    className="size-full object-cover"
                    style={{ objectPosition: item.cover.position, transformOrigin: item.cover.position }}
                  />
                ) : (
                  <img
                    src={item.cover.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                    style={{ objectPosition: item.cover.position, transformOrigin: item.cover.position }}
                  />
                )}
              </span>
              <span className="bento-title flex items-center gap-1">
                <span data-morph="title" className="truncate">
                  {item.title}
                </span>
                {item.external && (
                  <>
                    <ArrowUpRight weight="bold" aria-hidden className="size-3 shrink-0" />
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
