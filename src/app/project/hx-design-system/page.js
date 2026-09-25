import { hxDesignSystemData } from './content';
import { CaseStudyPage } from '@/components/CaseStudyTemplate';
import { sharedViewport, generateProjectMetadata } from '@/lib/metadata';

export const viewport = sharedViewport;

export const metadata = generateProjectMetadata({
  title: 'Sonic Design System - Hypersonix',
  description: 'Building Sonic, a unified design system at Hypersonix AI to align design and engineering, improve consistency, and speed up delivery.',
  slug: 'hx-design-system',
  keywords: 'design system, Hypersonix AI, Figma, design tokens, product design',
});

export default function HxDesignSystemPage() {
  const { page, projects } = hxDesignSystemData;
  return <CaseStudyPage pageData={page} projects={projects} />;
}
