'use client';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

// A button that unfolds a section below it. The section is rendered on the
// server and passed in, so only the toggle is client code.
export default function Expandable({ label, lessLabel = 'Show less', children }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger render={<Button variant="outline" />}>
        {open ? lessLabel : label}
        <CaretDown
          weight="bold"
          aria-hidden
          className={`transition-transform duration-300 ease-snappy ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-300 ease-snappy data-[ending-style]:h-0 data-[ending-style]:duration-200 data-[starting-style]:h-0">
        <div className="pt-10">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
