'use client';

import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

// Sticky bar at the top of a panel with the close button.
export default function PanelHeader({ onClose }) {
  return (
    <div className="sticky top-0 z-10 flex justify-end bg-paper/80 p-3 backdrop-blur-sm">
      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel" title="Close (Esc)">
        <X weight="bold" aria-hidden />
      </Button>
    </div>
  );
}
