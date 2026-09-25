import { hypersonixData } from './content';
import CompanyLandingPage from '@/components/CompanyLandingPage';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'Hypersonix Experience',
  description: 'Summary of my experience at Hypersonix AI as Lead Product Designer. Led 0 to 1 explorations, scaled design systems, and improved core product experiences.',
  slug: 'hypersonix',
  keywords: 'product design, Hypersonix AI, design system, documents, onboarding, UX leadership',
});

export default function HypersonixPage() {
  return <CompanyLandingPage data={hypersonixData} />;
}
