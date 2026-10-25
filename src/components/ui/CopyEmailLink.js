'use client';

import { useState } from 'react';
import HighlightLink from './HighlightLink';

const EMAIL = 'tonyzeb.design@gmail.com';

// Copies the email address and shows "Copied!" above the link for a moment.
export default function CopyEmailLink() {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="relative inline-block">
      <HighlightLink href={`mailto:${EMAIL}`} onClick={handleCopy}>
        email
      </HighlightLink>
      <span
        role="status"
        className={`pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-sm text-white transition duration-200 ${
          copied ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        }`}
      >
        {copied ? 'Copied!' : ''}
      </span>
    </span>
  );
}
