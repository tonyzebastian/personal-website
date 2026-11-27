'use client';

import { useState } from 'react';
import { Play } from '@phosphor-icons/react';

// A YouTube video that shows only a cover until it is played. YouTube's
// player (and its cookies) load on click, from the privacy-enhanced domain.
//   poster   optional still (an image path) used as the cover in place of
//            YouTube's thumbnail, filling the frame edge to edge under a grain
//            (`.poster-grain`), with a small play button: a dark green arrow on
//            a 40% white disc that turns 80% on hover.
export default function YouTubeEmbed({ id, title, poster }) {
  const [playing, setPlaying] = useState(false);

  const player = (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className="absolute inset-0 size-full"
    />
  );

  if (poster) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-body/[0.06]">
        {playing ? (
          player
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
            data-cursor="Play"
            className="group absolute inset-0 size-full"
          >
            <span className="relative block size-full">
              <img
                src={poster}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-[scale] duration-300 ease-snappy group-hover:scale-[1.02]"
              />
              <span aria-hidden className="poster-grain" />
              <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/40 text-green-900 shadow-[0_6px_16px_-6px_rgb(0_0_0/0.3)] backdrop-blur-sm transition-[scale,background-color] duration-200 ease-snappy group-hover:scale-105 group-hover:bg-white/80 group-focus-visible:bg-white/80 group-active:scale-95">
                <Play size={18} weight="fill" aria-hidden />
              </span>
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-body/[0.06]">
      {playing ? (
        player
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${title}`}
          data-cursor="Play"
          className="group absolute inset-0 size-full"
        >
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
          <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-white backdrop-blur-sm transition-colors group-hover:bg-ink/85">
            <Play size={24} weight="fill" className="ml-0.5" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}
