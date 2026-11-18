import Link from 'next/link';
import { homeAbout, storybook } from '@/lib/content';
import HeroBook from '@/components/HeroBook';

const LINK = 'rounded-sm bg-highlight px-1 text-ink transition-colors hover:bg-highlight-strong';

// Hero: my photo (which turns into the storybook, see HeroBook), my name and
// what I do, then a little more about me.
export default function Hero() {
  return (
    <header className="flex flex-col gap-5">
      <HeroBook book={storybook} />
      <div className="flex flex-col gap-0.5">
        <h1>Tony Sebastian</h1>
        <p className="text-body/70">A generalist who designs, codes and tells stories.</p>
      </div>
      <div className="flex flex-col gap-3">
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
