import { bio, storybook } from '@/lib/content';
import HeroBook from '@/components/HeroBook';

// Hero: the storybook at the full column width (672px), then the name and a
// one-line description. The longer intro and the way into About live on the
// book's last page; the intro is repeated for search and screen readers.
export default function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <HeroBook book={storybook} />
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-1 text-center">
        <h1>Tony Sebastian</h1>
        <p className="text-body/70">A builder who designs, codes and tells stories.</p>
        <p className="sr-only">{bio.intro}</p>
      </div>
    </header>
  );
}
