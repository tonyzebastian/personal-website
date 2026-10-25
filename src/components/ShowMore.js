'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { CaretDown } from '@phosphor-icons/react';

// Shows `children`, keeps `more` folded away behind a "View more" button.
// Both are rendered on the server and passed in, so only the toggle is client code.
export default function ShowMore({ children, more, moreLabel = 'View more', lessLabel = 'View less' }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {children}
      <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-300 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
        {more}
      </CollapsibleContent>
      <CollapsibleTrigger
        render={<Button variant="ghost" size="sm" className="-ml-2.5 mt-2 text-ink/55 hover:text-ink" />}
      >
        {open ? lessLabel : moreLabel}
        <CaretDown
          weight="bold"
          aria-hidden
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
    </Collapsible>
  );
}
