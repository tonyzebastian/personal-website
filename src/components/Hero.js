import { PanelLink } from '@/components/panel/ActivePath';
import { homeAbout, storybook } from '@/lib/content';
import HeroBook from '@/components/HeroBook';

// Green highlight links. The one whose page is open in the panel (PanelLink
// marks it data-active) turns solid green-700 with white text.
const LINK =
  'rounded-sm bg-highlight px-1 text-[length:inherit] text-highlight-ink transition-colors hover:bg-highlight-strong data-active:bg-green-700 data-active:text-white';

const NAME = 'Tony Sebastian';
const DESCRIPTION = 'A generalist who designs, codes and tells stories.';

// Words that blur into view one after another on the first load. `from` is
// where this run sits in the overall order.
function Words({ text, from = 0 }) {
  return text.split(' ').map((word, i) => (
    <span key={i}>
      <span className="intro-word" style={{ '--i': from + i }}>
        {word}
      </span>{' '}
    </span>
  ));
}

// Hero: my photo (which turns into the storybook, see HeroBook), my name and
// what I do, then a little more about me. On the first load these appear one
// at a time from the top (see the `.intro-*` styles in globals.css).
export default function Hero() {
  return (
    <header className="flex flex-col gap-5">
      <div className="intro-photo relative w-fit">
        <HeroBook book={storybook} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif font-normal">
          <Words text={NAME} />
        </h1>
        <p className="text-[20px] leading-snug text-body/90">
          <Words text={DESCRIPTION} from={NAME.split(' ').length} />
        </p>
      </div>
      <div className="intro-after mt-3 flex flex-col gap-3">
        {homeAbout.map((paragraph, i) => (
          <p key={i} className="text-[18px] leading-[1.6]">
            {paragraph.map((part, j) =>
              typeof part === 'string' ? (
                part
              ) : (
                <PanelLink key={j} href={part.href} className={LINK}>
                  {part.label}
                </PanelLink>
              )
            )}
          </p>
        ))}
      </div>
    </header>
  );
}
