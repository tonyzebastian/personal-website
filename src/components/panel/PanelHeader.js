'use client';

import { ArrowSquareOut, ArrowsOutSimple, X } from '@phosphor-icons/react';
import { Button, buttonVariants } from '@/components/ui/button';
import LinkedText from '@/components/LinkedText';

const iconButton = 'bg-body/5 hover:bg-body/10';

// The row at the top of the side panel: an optional title ({ title,
// tagline }; the tagline follows a pipe, fainter) on the left (pages
// that hide their own heading in the panel, see PanelPage `compact`), then an
// expand link that opens the page full width (in this tab; in a new tab with
// `newTab`, for the immersive Playground pieces), and the close button. It sits
// above the scroll area rather than over it, so the content scrolls under
// nothing. (The sheet on smaller screens closes by dragging instead.)
// The title is for sight only (the page keeps its h1 for screen readers);
// the tagline is read out, as it can hold links (LinkedText). The row is
// centred on the buttons, which puts its letters about 20px below the top
// edge; pl-2 gives the same 20px on the left.
export default function PanelHeader({ href, title, onClose, newTab = false }) {
  const label = newTab ? 'Open in new tab' : 'Open full page';
  return (
    <div className="flex shrink-0 items-center justify-end gap-2 p-3">
      {title && (
        <p className="mr-auto min-w-0 truncate pl-2 text-lg font-medium text-ink">
          <span aria-hidden>{title.title}</span>
          {title.tagline && (
            <>
              <span aria-hidden className="px-2.5 font-normal text-body/25">
                |
              </span>
              <span className="font-normal text-body/70">
                <LinkedText text={title.tagline} links={title.links} />
              </span>
            </>
          )}
        </p>
      )}
      {href && (
        <a
          href={href}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : { 'data-reload': '' })}
          aria-label={label}
          title={label}
          className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: iconButton })}
        >
          {newTab ? <ArrowSquareOut weight="bold" aria-hidden /> : <ArrowsOutSimple weight="bold" aria-hidden />}
        </a>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        aria-label="Close panel"
        title="Close (Esc)"
        className={iconButton}
      >
        <X weight="bold" aria-hidden />
      </Button>
    </div>
  );
}
