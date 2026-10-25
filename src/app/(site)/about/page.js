import HighlightLink from '@/components/ui/HighlightLink';
import PanelPage from '@/components/panel/PanelPage';
import { aboutBio, aboutFunThings, aboutPrinciples, now, animation, photography, junymade } from '@/lib/content';
import { galleryImages } from './config';
import MasonryGridLightbox from '@/components/ui/MasonryGridLigthbox';

export const metadata = {
  title: 'About ✦ Tony Sebastian',
  description: 'Learn more about Tony Sebastian - visual product designer, photographer, animator, and creative storyteller with a passion for craftsmanship',
  keywords: 'about tony sebastian, product designer, photographer, animator, creative process, design philosophy, juny made, visual storytelling',
  author: 'Tony Sebastian',
  robots: 'index,follow',
  alternates: {
    canonical: 'https://tonyzeb.design/about',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tonyzebastian',
    creator: '@tonyzebastian',
    title: 'About ✦ Tony Sebastian',
    description: 'Learn more about Tony Sebastian - visual product designer, photographer, animator, and creative storyteller with a passion for craftsmanship',
    image: 'https://tonyzeb.design/preview.png',
    imageAlt: 'About Tony Sebastian - Designer, Photographer, and Creative Storyteller',
  },
  openGraph: {
    title: 'About ✦ Tony Sebastian',
    description: 'Learn more about Tony Sebastian - visual product designer, photographer, animator, and creative storyteller with a passion for craftsmanship',
    url: 'https://tonyzeb.design/about',
    siteName: 'Tony Sebastian',
    images: [{
      url: 'https://tonyzeb.design/preview.png',
      alt: 'About Tony Sebastian - Designer, Photographer, and Creative Storyteller',
      width: 1200,
      height: 630,
    }],
    locale: 'en_US',
    type: 'website',
  },
};

// Turns the `links` listed on a content item into green highlight links.
const renderTextWithLinks = (item) => {
  if (!item.links) return item.text;

  let result = item.text;
  item.links.forEach(link => {
    result = result.replace(link.text, `<LINK>${link.text}<LINK>`);
  });

  const parts = result.split('<LINK>');
  return parts.map((part, index) => {
    const link = item.links.find(l => l.text === part);
    return link ? (
      <HighlightLink key={index} href={link.href}>
        {link.text}
      </HighlightLink>
    ) : part;
  });
};

// Plain paragraphs from content items that may carry links.
const Paragraphs = ({ items }) => items.map((item, index) => <p key={index}>{renderTextWithLinks(item)}</p>);

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

const List = ({ items }) => (
  <ul className="list-disc space-y-1.5 pl-5 marker:text-ink/40">
    {items.map((item, index) => (
      <li key={index}>{typeof item === 'string' ? item : renderTextWithLinks(item)}</li>
    ))}
  </ul>
);

export default function About() {
  return (
    <PanelPage title="About me">
      <div className="flex flex-col gap-3">
        <Paragraphs items={aboutBio} />
      </div>

      <div className="mt-6 flex flex-col gap-10">
        <Section title="What I do for fun">
          <List items={aboutFunThings} />
        </Section>

        <Section title="Personal principles">
          <List items={aboutPrinciples} />
        </Section>

        <Section title="Now">
          {now.map((item, index) => (
            <p key={index}>
              {Array.isArray(item.description)
                ? item.description.map((part, i) =>
                    typeof part === 'string' ? part : (
                      <HighlightLink key={i} href={part.href}>{part.text}</HighlightLink>
                    ))
                : item.description}
            </p>
          ))}
        </Section>

        <Section title="Animation">
          <Paragraphs items={animation} />
          <MasonryGridLightbox lightboxImages={galleryImages.animation.lightbox} />
        </Section>

        <Section title="Juny Made, art studio">
          <Paragraphs items={junymade} />
          <MasonryGridLightbox lightboxImages={galleryImages.junyMade.lightbox} />
        </Section>

        <Section title="Photography">
          <Paragraphs items={photography} />
          <MasonryGridLightbox lightboxImages={galleryImages.photography.lightbox} height={580} />
        </Section>
      </div>

      <footer className="mt-10 border-t border-border pt-4 text-center">
        <p className="text-ink/55">Built with Next.js and Motion · Typefaces: Libre Caslon Condensed and Figtree</p>
        <p className="text-ink/40">© Tony Sebastian, 2026</p>
      </footer>
    </PanelPage>
  );
}
