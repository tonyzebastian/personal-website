export const sharedViewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export function generateProjectMetadata({ title, description, slug, keywords = '' }) {
  return {
    title,
    description,
    keywords,
    author: 'Tony Sebastian',
    robots: 'index,follow',
    alternates: {
      canonical: `https://tonyzeb.design/project/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@tonyzebastian',
      creator: '@tonyzebastian',
      title,
      description,
      image: 'https://tonyzeb.design/preview.png',
      imageAlt: `${title} Case Study`,
    },
    openGraph: {
      title,
      description,
      url: `https://tonyzeb.design/project/${slug}`,
      siteName: 'Tony Sebastian',
      images: [{
        url: 'https://tonyzeb.design/preview.png',
        alt: `${title} Case Study`,
        width: 1200,
        height: 630,
      }],
      locale: 'en_US',
      type: 'website',
    },
  };
}
