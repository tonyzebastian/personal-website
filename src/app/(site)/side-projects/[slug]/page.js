import { notFound } from 'next/navigation';
import { sideProjects, junymade } from '@/lib/content';
import PanelPage from '@/components/panel/PanelPage';
import HighlightLink from '@/components/ui/HighlightLink';
import MasonryGridLightbox from '@/components/ui/MasonryGridLigthbox';
import { galleryImages } from '../../about/config';

// One side project, opened from the home "Side projects" list: Dalal Prints,
// Tony Make Films and Juny Made. Placeholders for now; Juny Made reuses the
// About page's text and gallery.
export const dynamicParams = false;

export function generateStaticParams() {
  return sideProjects.map((item) => ({ slug: item.slug }));
}

const find = (slug) => sideProjects.find((item) => item.slug === slug);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = find(slug);
  if (!item) return {};
  const title = `${item.title} ✦ Tony Sebastian`;
  const url = `https://www.tonyzeb.com/side-projects/${slug}`;
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

export default async function SideProjectPage({ params }) {
  const { slug } = await params;
  const item = find(slug);
  if (!item) notFound();

  return (
    <PanelPage title={item.title} meta={[item.kind]}>
      {slug === 'juny-made' ? (
        <>
          {junymade.map((block) => (
            <p key={block.text}>
              {/* The text ends with the link's own words ("…on Instagram."),
                  so drop them there and let the link say them. */}
              {block.links?.reduce((text, link) => text.trimEnd().replace(new RegExp(`${link.text.replace('.', '\\.')}$`), ''), block.text) ?? block.text}
              {block.links?.map((link) => (
                <HighlightLink key={link.href} href={link.href}>
                  {link.text}
                </HighlightLink>
              ))}
            </p>
          ))}
          <MasonryGridLightbox lightboxImages={galleryImages.junyMade.lightbox} />
        </>
      ) : (
        <p className="text-body/70">{item.description}</p>
      )}
    </PanelPage>
  );
}
