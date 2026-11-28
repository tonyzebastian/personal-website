// Placeholder drawings for the book's spreads, until real illustrations
// arrive (see `image` in storybook, content.js). Each motif is one SVG across
// the whole spread (200 x 125) plus a character icon.
import { Code, FilmSlate, Needle, PaintBrush, PenNib, PersonSimpleRun } from '@phosphor-icons/react';

export const MOTIF_ICON = {
  designer: PenNib,
  coder: Code,
  illustrator: PaintBrush,
  cinematographer: FilmSlate,
  maker: Needle,
  runner: PersonSimpleRun,
};

export function Motif({ motif, accent }) {
  const common = { fill: 'none', stroke: accent, strokeWidth: 1.2, strokeLinecap: 'round' };
  switch (motif) {
    case 'designer':
      // A pen-tool curve with its anchors and handles, over a dot grid.
      return (
        <>
          {Array.from({ length: 9 }, (_, x) =>
            Array.from({ length: 6 }, (_, y) => (
              <circle key={`${x}-${y}`} cx={12 + x * 22} cy={10 + y * 21} r={0.8} fill={accent} />
            ))
          )}
          <path d="M20 100 C 55 40, 95 115, 130 70 S 175 30, 185 95" {...common} strokeWidth={1.6} />
          <path d="M55 40 L20 100 M130 70 L95 115 M130 70 L165 25" {...common} strokeDasharray="2 2" />
          {[[20, 100], [130, 70], [185, 95]].map(([x, y]) => (
            <rect key={x} x={x - 2.5} y={y - 2.5} width={5} height={5} fill="#fff" stroke={accent} strokeWidth={1} />
          ))}
        </>
      );
    case 'coder':
      return (
        <>
          <text x={8} y={110} fontSize={70} fill={accent} opacity={0.5} fontFamily="ui-monospace, monospace">{'{'}</text>
          <text x={160} y={110} fontSize={70} fill={accent} opacity={0.5} fontFamily="ui-monospace, monospace">{'}'}</text>
          {[18, 26, 34, 92, 100, 108].map((y, i) => (
            <rect key={y} x={40 + (i % 3) * 8} y={y} width={30 + ((i * 17) % 40)} height={3} rx={1.5} fill={accent} opacity={0.55} />
          ))}
          {[22, 30, 96, 104].map((y, i) => (
            <rect key={y} x={120 + (i % 2) * 6} y={y} width={18 + ((i * 11) % 20)} height={3} rx={1.5} fill={accent} opacity={0.4} />
          ))}
        </>
      );
    case 'illustrator':
      // Loose sketchbook scribbles.
      return (
        <>
          <path d="M10 25 q 10 -12 20 0 t 20 0 t 20 0" {...common} strokeWidth={2} />
          <path d="M140 18 q 8 10 16 0 t 16 0 t 16 0" {...common} strokeWidth={2} />
          <path d="M150 110 c -10 -20, 30 -25, 20 -5 s -25 10, -10 -12" {...common} strokeWidth={1.6} />
          <circle cx={35} cy={100} r={9} {...common} strokeDasharray="3 2" />
          <path d="M70 112 l 6 -8 l 6 8 l 6 -8 l 6 8" {...common} />
        </>
      );
    case 'cinematographer':
      // A night sky, a moon and a strip of film.
      return (
        <>
          <circle cx={168} cy={24} r={11} fill={accent} opacity={0.9} />
          <circle cx={172} cy={21} r={10} fill="#26323f" />
          {[[20, 15], [48, 28], [80, 12], [110, 30], [140, 14], [30, 45], [125, 48], [190, 50]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} fill={accent} />
          ))}
          <rect x={0} y={104} width={200} height={16} fill={accent} opacity={0.12} />
          {Array.from({ length: 25 }, (_, i) => (
            <rect key={i} x={3 + i * 8} y={106} width={4} height={3} rx={0.6} fill={accent} opacity={0.5} />
          ))}
          {Array.from({ length: 25 }, (_, i) => (
            <rect key={i} x={3 + i * 8} y={115} width={4} height={3} rx={0.6} fill={accent} opacity={0.5} />
          ))}
        </>
      );
    case 'maker':
      // An embroidery hoop and running stitches.
      return (
        <>
          <circle cx={165} cy={35} r={22} {...common} strokeWidth={3} />
          <circle cx={165} cy={35} r={18} {...common} strokeWidth={0.8} />
          <path d="M150 35 q 15 -18 30 0 q -15 18 -30 0" {...common} strokeDasharray="2.5 2" />
          <path d="M5 20 C 40 5, 70 35, 110 15" {...common} strokeDasharray="4 3" strokeWidth={1.6} />
          <path d="M0 112 C 50 95, 110 125, 200 105" {...common} strokeDasharray="4 3" strokeWidth={1.6} />
        </>
      );
    case 'runner':
      // A sun and the lanes of a track.
      return (
        <>
          <circle cx={170} cy={28} r={14} fill={accent} opacity={0.6} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M-10 ${92 + i * 9} C 60 ${70 + i * 9}, 140 ${120 + i * 9}, 210 ${88 + i * 9}`} {...common} strokeDasharray={i === 3 ? '5 4' : undefined} />
          ))}
        </>
      );
    default:
      return null;
  }
}

