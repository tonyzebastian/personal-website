import { sundialData } from './content';
import CompanyLandingPage from '@/components/CompanyLandingPage';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'Sundial Experience',
  description: 'Summary of my experience at Sundial as Design Engineer, building and shipping product experiences.',
  slug: 'sundial',
  keywords: 'design engineering, Sundial, product design, frontend development',
});

export default function SundialPage() {
  return <CompanyLandingPage data={sundialData} />;
}
