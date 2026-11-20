'use client';

import { createContext, useContext } from 'react';
import Link from 'next/link';

// The path open in the panel (or about to open), so the list can mark the
// row that belongs to it. null when no panel is open.
export const ActivePathContext = createContext(null);

// An internal list link that knows whether its page is the one open in the
// panel. It sets aria-current and data-active, so its row can style itself.
export function PanelLink({ href, ...props }) {
  const active = useContext(ActivePathContext) === href;
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      data-active={active ? '' : undefined}
      {...props}
    />
  );
}
