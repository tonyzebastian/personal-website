// A band of fine noise across the top of a page that fades out downward.
// The parent needs `relative isolate` (and usually `overflow-hidden`).
export default function NoiseBand({ className = 'h-96 lg:h-104' }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 z-0 opacity-[0.06] ${className}`}
      style={{
        backgroundImage: 'url(/noise.png)',
        backgroundSize: '220px',
        backgroundRepeat: 'repeat',
        maskImage: 'linear-gradient(180deg, black 0%, black 45%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 45%, transparent 100%)',
      }}
    />
  );
}
