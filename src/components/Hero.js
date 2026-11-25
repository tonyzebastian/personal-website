import Link from 'next/link';
import { homeAbout, storybook } from '@/lib/content';
import HeroBook from '@/components/HeroBook';

const LINK = 'rounded-sm bg-highlight px-1 text-highlight-ink transition-colors hover:bg-highlight-strong';

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
        <h1>
          <Words text={NAME} />
        </h1>
        <p className="text-[17px] leading-snug text-body/90">
          <Words text={DESCRIPTION} from={NAME.split(' ').length} />
        </p>
      </div>
      <div className="intro-after mt-3 flex flex-col gap-3">
        {homeAbout.map((paragraph, i) => (
          <p key={i}>
            {paragraph.map((part, j) =>
              typeof part === 'string' ? (
                part
              ) : (
                <Link key={j} href={part.href} scroll={false} className={LINK}>
                  {part.label}
                </Link>
              )
            )}
          </p>
        ))}
      </div>
    </header>
  );
}
