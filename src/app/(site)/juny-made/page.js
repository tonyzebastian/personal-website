import SideProject, { sideProjectMetadata } from '@/components/SideProject';

export const metadata = sideProjectMetadata('juny-made');

export default function Page() {
  return <SideProject slug="juny-made" />;
}
