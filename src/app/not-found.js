import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ssr';
import { buttonVariants } from '@/components/ui/button';

export const metadata = {
  title: 'Page not found ✦ Tony Sebastian',
  robots: { index: false },
};

// Shown for any address that does not exist (exported as 404.html).
export default function NotFound() {
  return (
    <div className="surface-canvas flex min-h-dvh items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-start gap-4">
        <p className="text-body/80 tabular-nums">404</p>
        <h1>This page wandered off.</h1>
        <p className="text-body/80">The link may be old, or the page has moved.</p>
        <Link
          href="/"
          className={buttonVariants({ variant: 'outline', className: 'mt-2' })}
        >
          <ArrowLeft weight="bold" data-icon="inline-start" aria-hidden />
          Back to home
        </Link>
      </div>
    </div>
  );
}
