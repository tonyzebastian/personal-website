import { hxInteractionsData } from './content';
import { CaseStudyPage } from '@/components/CaseStudyTemplate';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'Interaction Designs - Hypersonix',
  description: 'Exploring new interaction patterns and product concepts at Hypersonix AI, including No Code App Studio and Hawkeye insights platform.',
  slug: 'hx-interactions',
  keywords: 'interaction design, Hypersonix AI, no-code, data visualization, product design',
});

export default function HxInteractionsPage() {
  const { page, projects } = hxInteractionsData;
  return <CaseStudyPage pageData={page} projects={projects} />;
}
