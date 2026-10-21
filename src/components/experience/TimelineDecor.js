const PURPLE = '#875e8c';

// Offset so each SVG meets the timeline line, which sits at x=12 of the column.

// Branches that fan out above the first company.
export function TimelineBranches() {
  return (
    <svg
      className="pointer-events-none absolute left-[-253px] top-[-370px] z-0 hidden h-[24rem] w-[430px] lg:block"
      viewBox="-260 0 430 384"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="exp-branch-fade" x1="0" y1="0" x2="0" y2="384" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={PURPLE} stopOpacity="0" />
          <stop offset="32%" stopColor={PURPLE} stopOpacity="0.1" />
          <stop offset="72%" stopColor={PURPLE} stopOpacity="0.26" />
          <stop offset="100%" stopColor={PURPLE} stopOpacity="0.38" />
        </linearGradient>
      </defs>
      <g stroke="url(#exp-branch-fade)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 382 C5 354 5 330 3 300 C1 262 0 224 4 184 C8 126 20 72 38 2" />
        <path d="M5 344 C5 333 -3 321 -18 309 C-62 276 -100 242 -130 202 C-162 160 -194 80 -236 6" />
        <path d="M3 306 C3 296 -1 287 -8 278 C-34 246 -50 210 -58 176 C-66 122 -78 66 -112 4" />
        <path d="M2 258 C2 246 9 234 20 222 C45 194 60 169 72 142 C90 94 103 51 122 6" />
        <path d="M2 220 C2 210 11 202 26 194 C58 177 84 160 106 142 C132 110 146 82 164 52" />
        <path d="M4 184 C4 174 -6 164 -21 154 C-48 136 -65 113 -78 92 C-96 58 -112 28 -134 4" />
        <path d="M8 138 C8 128 14 119 24 110 C44 92 60 70 78 34" />
        <path d="M14 104 C13 94 8 84 -1 75 C-18 58 -36 36 -52 8" />
        <path d="M24 64 C24 56 30 49 40 42 C58 30 72 17 86 2" />
      </g>
    </svg>
  );
}

// Curls out of the last logo like the original What's New tail. The loops stay
// left of the item below the logo (its left edge is 12px right of the line);
// the path only swings right once it is below that item. Drawn around x=0 (the
// line), so the svg is offset to meet it.
export function TimelineTail() {
  return (
    <svg
      className="pointer-events-none absolute left-[-108px] top-[12px] z-0 hidden h-[340px] w-[220px] lg:block"
      viewBox="-120 0 220 340"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="exp-tail-fade" x1="0" y1="0" x2="0" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={PURPLE} stopOpacity="0.38" />
          <stop offset="60%" stopColor={PURPLE} stopOpacity="0.28" />
          <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 0 C0 14 -7 28 -21 37 C-39 49 -64 53 -81 44 C-101 34 -104 18 -91 9 C-74 0 -47 8 -24 33 C8 68 -26 101 -62 130 C-99 161 -106 213 -67 250 C-40 276 -5 282 30 285 C60 288 80 296 90 340"
        stroke="url(#exp-tail-fade)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
