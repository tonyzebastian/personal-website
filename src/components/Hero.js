import { bio, storybook } from '@/lib/content';
import HeroBook from '@/components/HeroBook';

// Hero: the storybook at the full column width (672px). The intro text and
// the way into About now live on the book's last page.
export default function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <HeroBook book={storybook} />
      {/* The cover and last page carry these; kept for search and screen readers. */}
      <div className="sr-only">
        <h1>Tony Sebastian, a builder who designs, codes and tells stories.</h1>
        <p>{bio.intro}</p>
      </div>
    </header>
  );
}
