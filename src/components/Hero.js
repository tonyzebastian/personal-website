import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { bio } from '@/lib/content';
import { buttonVariants } from '@/components/ui/button';
import HeroVideo from '@/components/HeroVideo';

// Hero: the intro video at the full column width (672px) and the intro text
// at the reading width (512px).
export default function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <HeroVideo />
      {/* The text keeps the narrower reading width of the rest of the page. */}
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1>Tony Sebastian, a builder who designs, codes and tells stories.</h1>
          <p>{bio.intro}</p>
        </div>
        {/* Temporary way into the About panel until the hero expand is designed. */}
        <Link
          href="/about"
          scroll={false}
          className={buttonVariants({ variant: 'link', className: '-ml-2.5 self-start px-2.5 text-ink/80' })}
        >
          More about me
          <ArrowRight weight="bold" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
