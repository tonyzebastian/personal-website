"use client";

import { Maximize2, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useState } from "react";
import FilmLightbox from "./FilmLightbox";

const controlClassName =
  "flex size-9 items-center justify-center rounded-full bg-white/70 text-black transition-colors hover:bg-white/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export default function FilmWorkCard({ work, index }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const toggleMute = () => {
    setIsMuted((muted) => !muted);
  };

  const openLightbox = useCallback(() => setIsLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setIsLightboxOpen(false), []);

  return (
    <>
      <article className="min-w-0">
        <div className="group relative aspect-video w-full overflow-hidden bg-slate-200">
          {work.available ? (
            <>
              <video
                src={work.src}
                poster={work.poster}
                muted
                playsInline
                preload="metadata"
                aria-label={`${work.title}. Open video`}
                onClick={openLightbox}
                className="h-full w-full cursor-pointer object-cover"
              />

              <button
                type="button"
                onClick={openLightbox}
                aria-label="Open video"
                title="Play video"
                className="absolute left-1/2 top-1/2 z-20 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-black opacity-100 transition-[background-color,opacity] duration-300 hover:bg-white/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:size-16 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              >
                <Play
                  size={23}
                  strokeWidth={1.5}
                  className="ml-0.5 fill-current sm:size-6"
                />
              </button>

              <div className="absolute right-3 top-3 z-20 flex gap-1.5 opacity-100 transition-opacity duration-300 sm:right-4 sm:top-4 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                  title={isMuted ? "Unmute" : "Mute"}
                  className={controlClassName}
                >
                  {isMuted ? (
                    <VolumeX size={17} strokeWidth={1.75} />
                  ) : (
                    <Volume2 size={17} strokeWidth={1.75} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={openLightbox}
                  aria-label="Open video lightbox"
                  title="Expand video"
                  className={controlClassName}
                >
                  <Maximize2 size={17} strokeWidth={1.75} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_45%,#f8fafa_0%,#dde5e5_100%)]">
              <span className="font-serif text-[clamp(3rem,8vw,7rem)] tracking-[-0.04em] text-slate-400">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden min-h-[72%] items-end bg-[linear-gradient(to_top,rgba(255,255,255,1)_0%,rgba(255,255,255,0.82)_30%,rgba(255,255,255,0.35)_65%,rgba(255,255,255,0)_100%)] px-5 pb-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100 md:flex lg:px-7 lg:pb-7">
            <FilmCaption work={work} />
          </div>
        </div>

        <div className="px-4 pb-10 pt-4 md:hidden">
          <FilmCaption work={work} />
        </div>
      </article>

      {work.available && (
        <FilmLightbox
          work={work}
          isOpen={isLightboxOpen}
          isMuted={isMuted}
          onMutedChange={setIsMuted}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}

function FilmCaption({ work }) {
  return (
    <div>
      <h2 className="text-xl! font-normal! tracking-tight! text-black!">
        {work.title}
      </h2>
      <p className="mt-1! max-w-md text-sm! leading-snug! tracking-normal! text-black/65!">
        {work.description}
      </p>
    </div>
  );
}
