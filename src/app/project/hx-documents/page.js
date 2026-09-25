import { hxDocumentsData } from './content';
import { CaseStudyPage } from '@/components/CaseStudyTemplate';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'Documents 2.0 - Hypersonix',
  description: 'Redesigning the Documents experience at Hypersonix AI to improve data consumption, card management, and report creation workflows.',
  slug: 'hx-documents',
  keywords: 'product design, Hypersonix AI, documents, data analytics, UX design',
});

export default function HxDocumentsPage() {
  const { page, projects } = hxDocumentsData;
  return <CaseStudyPage pageData={page} projects={projects} />;
}
