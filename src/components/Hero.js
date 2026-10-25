import { bio } from '@/lib/content';

// Placeholder hero: one image at the content width and the intro.
// The final hero is still being designed.
export default function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <img
        src="/hero_image.jpg"
        alt="Tony Sebastian"
        width={1920}
        height={1080}
        fetchPriority="high"
        decoding="async"
        className="aspect-video w-full rounded-xl object-cover"
      />
      <div className="flex flex-col gap-2">
        <h1>Hello! I am Tony, a software designer.</h1>
        <p>{bio.intro}</p>
      </div>
    </header>
  );
}
