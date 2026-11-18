import { bio, storybook } from '@/lib/content';
import HeroBook from '@/components/HeroBook';

// Hero: the storybook at the full column width (672px). My name and
// description are on its cover; the longer intro and the way into About are
// on its last page. All of it is repeated for search and screen readers.
export default function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <HeroBook book={storybook} />
      <div className="sr-only">
        <h1>Tony Sebastian</h1>
        <p>A generalist who designs, codes and tells stories.</p>
        <p>{bio.intro}</p>
      </div>
    </header>
  );
}
