import { postminidata } from './content';
import { CaseStudyPage } from '@/components/CaseStudyTemplate';

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export const metadata = {
  title: 'Mini Projects',
  description: 'A collection of mini projects I worked on during my time at Postman that made a huge impact. Led by Tony Sebastian, Lead Product Designer.',
  keywords: 'product design, Postman, environment usage, design systems, UX improvement',
  author: 'Tony Sebastian',
  robots: 'index,follow',
  alternates: {
    canonical: 'https://www.tonyzeb.com/project/miniprojects',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tonyzebastian',
    creator: '@tonyzebastian',
    title: 'Mini Projects',
    description: 'A collection of mini projects I worked on during my time at Postman that made a huge impact.',
    image: 'https://www.tonyzeb.com/preview.png',
    imageAlt: 'Mini Projects Case Study',
  },
  openGraph: {
    title: 'Mini Projects',
    description: 'A collection of mini projects I worked on during my time at Postman that made a huge impact.',
    url: 'https://www.tonyzeb.com/project/miniprojects',
    siteName: 'Tony Sebastian',
    images: [{
      url: 'https://www.tonyzeb.com/preview.png',
      alt: 'Mini Projects Case Study',
      width: 1200,
      height: 630,
    }],
    locale: 'en_US',
    type: 'website',
  },
};

export default function MiniProjectsPage() {
  const { page, projects } = postminidata;

  return <CaseStudyPage pageData={page} projects={projects} />;
}