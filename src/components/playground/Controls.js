'use client';

import { DialRoot } from 'dialkit';
import 'dialkit/styles.css';

// Lightbox layout for pieces with DialKit controls: the piece on the left (or
// on top, on narrow screens) and its settings beside it. Pieces register
// their controls with useDialKit only in the lightbox, so this panel lists
// just the open piece.
export default function Controls({ children }) {
  return (
    <div className="absolute inset-0 flex flex-col md:flex-row">
      <div className="relative min-h-0 flex-1">{children}</div>
      <aside
        aria-label="Settings"
        className="max-h-[42%] shrink-0 overflow-y-auto border-t border-border bg-paper p-3 md:max-h-none md:w-80 md:border-t-0 md:border-l"
      >
        <DialRoot mode="inline" theme="light" productionEnabled />
      </aside>
    </div>
  );
}

// A DialKit config's default values, in the shape useDialKit returns, for
// rendering a piece without its controls.
export function dialDefaults(config) {
  const out = {};
  for (const [key, value] of Object.entries(config)) {
    if (key.startsWith('_')) continue;
    if (Array.isArray(value)) out[key] = value[0];
    else if (value && typeof value === 'object' && 'default' in value) out[key] = value.default;
    else if (value && typeof value === 'object') out[key] = dialDefaults(value);
    else out[key] = value;
  }
  return out;
}
