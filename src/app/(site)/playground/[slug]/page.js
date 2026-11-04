import { notFound } from 'next/navigation';
import PanelPage from '@/components/panel/PanelPage';
import GroupItem from '@/components/playground/GroupItem';
import LinkedText from '@/components/LinkedText';
import { findPlayground, playground } from '@/lib/playground';

// One page per Playground entry, opened in the panel from the home grid. A
// group lists its pieces one below the other, each live, each able to open on
// its own in a lightbox; a single piece fills the page; clips are short
// videos, one below the other.
export const dynamicParams = false;

export function generateStaticParams() {
  return playground.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = findPlayground(slug);
  if (!entry) return {};
  const title = `${entry.title} ✦ Tony Sebastian`;
  const url = `https://www.tonyzeb.com/playground/${slug}`;
  return {
    title,
    description: entry.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: entry.description,
      url,
      siteName: 'Tony Sebastian',
      images: [{ url: '/preview.png', width: 1200, height: 630, alt: entry.title }],
      locale: 'en_US',
      type: 'website',
    },
  };
}

export default async function PlaygroundEntry({ params }) {
  const { slug } = await params;
  const entry = findPlayground(slug);
  if (!entry) notFound();

  return (
    <PanelPage
      title={entry.title}
      description={<LinkedText text={entry.description} links={entry.links} />}
      wide
      compact
      fill={entry.fill}
    >
      {entry.type === 'clips' ? (
        <div className="flex flex-col gap-12">
          {entry.clips.map((clip) => (
            <GroupItem key={clip.src} video={clip.src} title={clip.title} hint={clip.hint} />
          ))}
        </div>
      ) : entry.type === 'group' ? (
        <div className="flex flex-col gap-12">
          {entry.items.map((item) => (
            <GroupItem key={item.id} id={item.id} title={item.title} hint={item.hint} description={item.description} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <GroupItem id={entry.piece} title={entry.title} fill={entry.fill} />
        </div>
      )}
    </PanelPage>
  );
}
