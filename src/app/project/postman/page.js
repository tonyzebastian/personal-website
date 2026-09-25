import { postmanData } from './content';
import CompanyLandingPage from '@/components/CompanyLandingPage';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'Postman Experience',
  description: 'Summary of my experience at Postman as Senior Product Designer. Improved trial experiences, built observability features, and enhanced core product interactions.',
  slug: 'postman',
  keywords: 'product design, Postman, API, trial design, observability, UX design',
});

export default function PostmanPage() {
  return <CompanyLandingPage data={postmanData} />;
}
