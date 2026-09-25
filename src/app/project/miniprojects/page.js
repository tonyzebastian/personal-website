import { miniProjectsData } from './content';
import { CaseStudyPage } from '@/components/CaseStudyTemplate';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'Improving Environment Usage Experience',
  description: 'Improving environment management workflows and enhancing the user experience across different parts of the Postman product. Led by Tony Sebastian, Senior Product Designer.',
  slug: 'miniprojects',
  keywords: 'product design, Postman, environment usage, design systems, UX improvement',
});

export default function MiniProjectsPage() {
  const { page, projects } = miniProjectsData;
  return <CaseStudyPage pageData={page} projects={projects} />;
}
