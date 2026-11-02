'use client';

import { ArrowsOutSimple, X } from '@phosphor-icons/react';
import { Button, buttonVariants } from '@/components/ui/button';

const iconButton = 'bg-body/5 hover:bg-body/10';

// The row at the top of the side panel: an expand link that opens the page in
// a new tab, then the close button. It sits above the scroll area rather than
// over it, so the content scrolls under nothing. (The sheet on smaller screens
// closes by dragging instead.)
export default function PanelHeader({ href, onClose }) {
  return (
    <div className="flex shrink-0 justify-end gap-2 p-3">
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in new tab"
          title="Open in new tab"
          className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: iconButton })}
        >
          <ArrowsOutSimple weight="bold" aria-hidden />
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
