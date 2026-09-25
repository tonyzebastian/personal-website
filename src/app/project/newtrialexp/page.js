import { newTrialData } from './content';
import { CaseStudyPage } from '@/components/CaseStudyTemplate';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'New Trial Experiences',
  description: 'Redesigning trial experiences at Postman to make them more timely, contextual, and value-driven. Led by Tony Sebastian, Lead Product Designer.',
  slug: 'newtrialexp',
  keywords: 'trial design, user experience, growth design, Postman, product design',
});

export default function NewTrialExpPage() {
  const { page, projects } = newTrialData;
  return <CaseStudyPage pageData={page} projects={projects} />;
}
