import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ssr';

// "← Back" to home, for a page shown full width on its own (arrived at
// directly). Sits above the page's title in PanelPage, or in the top left of
// pages that fill the screen. `className` sets its display (inline-flex
// unless given), so a caller can hide it.
export default function BackLink({ className = 'inline-flex' }) {
  return (
    <Link
      href="/"
      className={`group items-center gap-1.5 rounded-sm text-body/70 transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <ArrowLeft
        weight="bold"
        aria-hidden
        className="size-3.5 transition-transform duration-150 ease-snappy group-hover:-translate-x-0.5"
      />
      Back
    </Link>
  );
}
