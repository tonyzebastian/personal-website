import { notFound } from 'next/navigation';
import { sideProjects, junyMadePage, dalalPrintsPage, tonyMakeFilmsPage } from '@/lib/content';
import PanelPage from '@/components/panel/PanelPage';
import PhotoGrid from '@/components/PhotoGrid';
import PosterWall from '@/components/PosterWall';

// One side project, opened from the home "Side projects" list: Dalal Prints
// (/dalal-prints), Tony Make Films (/film) and Juny Made (/juny-made). Each
// route is a thin page that renders `SideProject` with its slug. Dalal Prints and Juny Made are set like the
// job pages (18px text, their link in the details line) with their images
// below (`dalalPrintsPage`, `junyMadePage`); Tony Make Films the same way,
// with its films (`tonyMakeFilmsPage`).
const find = (slug) => sideProjects.find((item) => item.slug === slug);

export function sideProjectMetadata(slug) {
  const item = find(slug);
  if (!item) return {};
  const title = `${item.title} ✦ Tony Sebastian`;
  const url = `https://www.tonyzeb.com${item.path}`;
  return {
    title,
    description: item.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: item.description,
      url,
      images: [{ url: '/preview.png', width: 1200, height: 630, alt: 'Tony Sebastian, visual product designer' }],
    },
  };
}

export default function SideProject({ slug }) {
  const item = find(slug);
  if (!item) notFound();

  if (slug === 'dalal-prints') {
    return (
      <PanelPage title={item.title} meta={[item.kind]} href={dalalPrintsPage.x} linkLabel="@dalalprints on X" stretch>
        {dalalPrintsPage.paragraphs.map((text) => (
          <p key={text} className="text-[18px]">
            {text}
          </p>
        ))}
        {/* In the side panel the box runs to the bottom of the panel (at least
            420px); elsewhere it keeps a tall shape. */}
        <div className="group/wall relative mt-2 aspect-[3/5] overflow-hidden rounded-xl @xl:aspect-[4/5] in-data-fills:aspect-auto! in-data-fills:min-h-[420px] in-data-fills:flex-1">
          <PosterWall />
          {/* A hint that fades in while the pointer is over the wall (always
              shown on touch screens). */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-paper/90 px-3 py-1 text-[13px] text-body/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-150 ease-snappy group-hover/wall:opacity-100 [@media(hover:none)]:opacity-100"
          >
            Drag to explore, click a poster to open it
          </span>
        </div>
      </PanelPage>
    );
  }

  return (
    <PanelPage
      title={item.title}
      meta={[item.kind]}
      {...(slug === 'juny-made' && { href: junyMadePage.instagram, linkLabel: 'Instagram' })}
      {...(slug === 'tony-make-films' && { href: tonyMakeFilmsPage.instagram, linkLabel: '@tony.make.films on Instagram' })}
    >
      {slug === 'juny-made' ? (
        <JunyMade />
      ) : slug === 'tony-make-films' ? (
        <TonyMakeFilms />
      ) : (
        <p className="text-body/70">{item.description}</p>
      )}
    </PanelPage>
  );
}

// Juny Made, set like the job pages (18px text, its Instagram in the
// details line): the story, one piece from photo to finished embroidery and
// a few finished pieces.
function JunyMade() {
  const { paragraphs, steps, gallery } = junyMadePage;
  return (
    <>
      {paragraphs.map((text) => (
        <p key={text} className="text-[18px]">{text}</p>
      ))}

      <section aria-labelledby="juny-process" className="mt-4 flex flex-col gap-4">
        <h2 id="juny-process">From photo to finished piece</h2>
        <ol className="grid grid-cols-2 gap-x-3 gap-y-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-body/[0.04]">
                {step.image ? (
                  <img src={step.image} alt={step.alt ?? step.title} loading="lazy" decoding="async" className="size-full object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-body/40">Image coming soon</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-ink">
                  <span className="text-body/40 tabular-nums">{index + 1}.</span> {step.title}
                </span>
                <span className="text-body/70">{step.caption}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="juny-pieces" className="mt-4 flex flex-col gap-4">
        <h2 id="juny-pieces">A few pieces</h2>
        <PhotoGrid images={gallery} />
      </section>
    </>
  );
}

// Tony Make Films: why I make films, then the films so far. Each plays in
// place with the browser's controls and loads nothing until played.
function TonyMakeFilms() {
  const { paragraphs, films } = tonyMakeFilmsPage;
  return (
    <>
      {paragraphs.map((text) => (
        <p key={text} className="text-[18px]">{text}</p>
      ))}

      <section aria-labelledby="films-so-far" className="mt-4 flex flex-col gap-4">
        <h2 id="films-so-far">Films so far</h2>
        <ul className="flex flex-col gap-8">
          {films.map((film) => (
            <li key={film.src} className="flex flex-col gap-2">
              <video
                src={film.src}
                poster={film.poster}
                controls
                playsInline
                preload="none"
                aria-label={film.title}
                className="aspect-video w-full rounded-xl bg-body/[0.04] object-cover"
              />
              <div className="flex flex-col">
                <span className="font-medium text-ink">{film.title}</span>
                <span className="text-body/70">{film.caption}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
