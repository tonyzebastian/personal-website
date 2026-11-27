import SideProject, { sideProjectMetadata } from '@/components/SideProject';

export const metadata = sideProjectMetadata('tony-make-films');

export default function Page() {
  return <SideProject slug="tony-make-films" />;
}
