'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, SpeakerSimpleHigh, SpeakerSimpleSlash } from '@phosphor-icons/react';

const VIDEO = '/hero_video.mp4';
const POSTER = '/hero_image.jpg';

const controlClass =
  'flex items-center justify-center rounded-full backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40';

// The hero video. The still image shows first (it is the page's main image,
// so it loads with priority); the video only starts downloading once the page
// has finished loading, then fades in and plays muted. Hover shows play and
// pause in the centre; the sound toggle sits in the corner.
export default function HeroVideo() {
  const videoRef = useRef(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  // Wait for the page load so the video never competes with the first paint.
  useEffect(() => {
    const start = () => setLoad(true);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, []);

  const handleReady = () => {
    setReady(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    videoRef.current?.play().catch(() => {});
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-xl">
      <img
        src={POSTER}
        alt="Tony Sebastian"
        width={1920}
        height={1080}
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 size-full object-cover mix-blend-multiply transition-opacity duration-500 ${
          ready ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <video
        ref={videoRef}
        src={load ? VIDEO : undefined}
        poster={POSTER}
        muted
        playsInline
        preload={load ? 'auto' : 'none'}
        onCanPlay={handleReady}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        aria-label="Introduction video"
        className={`absolute inset-0 size-full cursor-pointer object-cover mix-blend-multiply transition-opacity duration-500 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {ready && (
        <>
          {/* Shown on hover, and always while paused on touch screens. */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause video' : 'Play video'}
            className={`${controlClass} absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 bg-white/20 text-white opacity-0 hover:bg-white/30 focus-visible:opacity-100 group-hover:opacity-100 ${
              playing ? '' : '[@media(hover:none)]:opacity-100'
            }`}
          >
            {playing ? <Pause size={28} weight="fill" /> : <Play size={28} weight="fill" className="ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
            className={`${controlClass} absolute right-2 bottom-2 size-9 bg-paper/80 text-ink/55 hover:bg-paper hover:text-ink`}
          >
            {muted ? <SpeakerSimpleSlash size={18} weight="bold" /> : <SpeakerSimpleHigh size={18} weight="bold" />}
          </button>
        </>
      )}
    </div>
  );
}
