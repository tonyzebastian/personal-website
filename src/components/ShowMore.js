'use client';

import { useState } from 'react';
import { CaretUp, DotsThree } from '@phosphor-icons/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Shows `children`, keeps `more` folded away behind a small pill below them.
// Both are rendered on the server and passed in, so only the toggle is client code.
//
// Closed, the button shows "•••"; open, an up caret (labels are for screen
// readers only). The extra rows grow in
// with the panel's height and fade in one after another (.reveal-rows in
// globals.css).
export default function ShowMore({ children, more, moreLabel = 'View more', lessLabel = 'View less' }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {children}
      <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-300 ease-snappy data-[ending-style]:h-0 data-[ending-style]:duration-200 data-[starting-style]:h-0">
        <div className="reveal-rows">{more}</div>
      </CollapsibleContent>
      {/* -mb-8 pulls the next section up so the button does not add a full gap below it */}
      <div className="mt-3 -mb-8 flex justify-center">
        <CollapsibleTrigger
          aria-label={open ? lessLabel : moreLabel}
          className="group/more relative grid h-6 w-9 place-items-center rounded-md bg-body/5 text-body/80 outline-none transition-colors duration-200 hover:bg-body/10 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <DotsThree
            weight="bold"
            aria-hidden
            className="absolute size-5 transition-[opacity,scale] duration-200 ease-snappy group-aria-expanded/more:scale-50 group-aria-expanded/more:opacity-0"
          />
          <CaretUp
            weight="bold"
            aria-hidden
            className="absolute size-4 scale-50 opacity-0 transition-[opacity,scale] duration-200 ease-snappy group-aria-expanded/more:scale-100 group-aria-expanded/more:opacity-100"
          />
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}
