'use client';

import { useContext, useRef } from 'react';
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Keeps rendering the page that was showing when this mounted, even after the
// route changes. That lets an outgoing panel fade out (or the panel close)
// with its own content instead of flashing to the next page.
// Note: relies on a Next.js internal; recheck after Next upgrades.
export default function FrozenRouter({ children }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;

  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}
