'use client';

import { useState } from 'react';
import { Play } from '@phosphor-icons/react';

// A YouTube video that shows only its thumbnail until it is played. YouTube's
// player (and its cookies) load on click, from the privacy-enhanced domain.
export default function YouTubeEmbed({ id, title }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-body/[0.06]">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${title}`}
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
