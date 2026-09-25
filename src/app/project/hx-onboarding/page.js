import { hxOnboardingData } from './content';
import { CaseStudyPage } from '@/components/CaseStudyTemplate';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'New Onboarding Experience - Hypersonix',
  description: 'Redesigning the onboarding flow at Hypersonix AI to improve user engagement, feature awareness, and reduce drop-off rates.',
  slug: 'hx-onboarding',
  keywords: 'product design, Hypersonix AI, onboarding, user experience, UX design',
});

export default function HxOnboardingPage() {
  const { page, projects } = hxOnboardingData;
  return <CaseStudyPage pageData={page} projects={projects} />;
}
