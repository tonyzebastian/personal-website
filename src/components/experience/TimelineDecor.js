const PURPLE = '#875e8c';
// A tiny outlined leaf, about 8px long, pointing along +x.
const LEAF = 'M0 0 C1.5 -3 5 -4.5 8 -2.2 C6.5 1.5 3 3 0 0Z';

// Tiny outlined leaves placed clear of the branch lines, each other and the
// heading, with more toward the faded top: [x, y, rotation, scale]
const LEAVES = [
  [66.0, 21.8, 18.1, 1.05], [-113.7, 29.9, -64.2, 1.05], [-213.8, 47.0, -177.4, 1.3], [69.1, 50.9, -109.0, 1.05],
  [-89.5, 70.5, -178.6, 1.05], [146.7, 81.6, 0.3, 1.3], [22.5, 111.4, 4.8, 1.3], [-165.7, 142.6, -177.5, 0.85],
  [91.1, 153.6, -71.5, 1.3], [-59.7, 165.2, -134.0, 1.3], [2.1, 209.7, -147.0, 1.3], [-109.4, 227.2, -71.6, 1.3],
];

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
          <stop offset="32%" stopColor={PURPLE} stopOpacity="0.16" />
          <stop offset="72%" stopColor={PURPLE} stopOpacity="0.4" />
          <stop offset="100%" stopColor={PURPLE} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="exp-leaf-grad" x1="0" y1="0" x2="0" y2="384" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="65%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="exp-leaf-mask" maskUnits="userSpaceOnUse" x="-260" y="0" width="430" height="384">
          <rect x="-260" y="0" width="430" height="384" fill="url(#exp-leaf-grad)" />
        </mask>
      </defs>
      <g stroke="url(#exp-branch-fade)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 382 C5 354 5 330 3 300 C1 262 0 224 4 184 C8 126 20 72 38 2" />
        <path d="M4.8 344.4 C5 333 -3 321 -18 309 C-62 276 -100 242 -130 202 C-162 160 -194 80 -236 6" />
        <path d="M3.4 305.9 C3 296 -1 287 -8 278 C-34 246 -50 210 -58 176 C-66 122 -78 66 -112 4" />
        <path d="M1.4 258.1 C2 246 9 234 20 222 C45 194 60 169 72 142 C90 94 103 51 122 6" />
        <path d="M1.6 219.5 C2 210 11 202 26 194 C58 177 84 160 106 142 C132 110 146 82 164 52" />
        <path d="M4.0 184.0 C4 174 -6 164 -21 154 C-48 136 -65 113 -78 92 C-96 58 -112 28 -134 4" />
        <path d="M8.9 138.1 C8 128 14 119 24 110 C44 92 60 70 78 34" />
        <path d="M14.6 103.4 C13 94 8 84 -1 75 C-18 58 -36 36 -52 8" />
        <path d="M22.8 64.3 C24 56 30 49 40 42 C58 30 72 17 86 2" />
      </g>
      <g mask="url(#exp-leaf-mask)" fill="none" stroke={PURPLE} strokeOpacity="0.6" strokeWidth="0.9" strokeLinejoin="round">
        {LEAVES.map(([x, y, r, s]) => (
          <path key={`${x}-${y}`} d={LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} />
        ))}
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
          <stop offset="0%" stopColor={PURPLE} stopOpacity="0.55" />
          <stop offset="60%" stopColor={PURPLE} stopOpacity="0.42" />
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
