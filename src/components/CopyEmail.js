'use client';

import { useEffect, useRef, useState } from 'react';

// "Email" in the home footer: a click copies the address instead of opening a
// mail app, and "Copied" rises above it for a moment (a small green-900 pill,
// like the tooltips). The square cursor says Copy over it. If the clipboard
// can't be reached, it falls back to opening a mail to the address.
export default function CopyEmail({ email, className = '' }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      location.href = `mailto:${email}`;
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="relative inline-block">
      <button type="button" data-cursor="Copy" onClick={copy} className={className} aria-label={`Copy email address, ${email}`}>
        Email
      </button>
      <span role="status" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md bg-green-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-sm transition-[opacity,translate] duration-200 ease-snappy ${
          copied ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        }`}
      >
        Copied
      </span>
    </span>
  );
}
