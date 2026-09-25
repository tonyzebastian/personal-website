import { apiObservabilityData } from './content';
import { CaseStudyPage } from '@/components/CaseStudyTemplate';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'Live Collections',
  description: 'First observability feature in Postman. Turning static API documentation into living entities that stayed in sync with real API traffic.',
  slug: 'api-observability',
  keywords: 'observability, API documentation, live collections, Postman, product design',
});

export default function ApiObservabilityPage() {
  const { page, projects } = apiObservabilityData;
  return <CaseStudyPage pageData={page} projects={projects} />;
}
