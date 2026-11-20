"use client";

import { Pause, Play, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const controlClassName =
  "flex size-10 items-center justify-center rounded-full bg-slate-100 text-black transition-colors hover:bg-slate-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export default function FilmLightbox({
  work,
  isOpen,
  isMuted,
  onMutedChange,
  onClose,
}) {
  const videoRef = useRef(null);
  const closeButtonRef = useRef(null);
  const hideControlTimeoutRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaybackControl, setShowPlaybackControl] = useState(true);
  const [isPlaybackHovered, setIsPlaybackHovered] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    setShowPlaybackControl(true);
    hideControlTimeoutRef.current = window.setTimeout(() => {
      setShowPlaybackControl(false);
    }, 300);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(hideControlTimeoutRef.current);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    onMutedChange(!isMuted);
  };

  const showPlaybackTemporarily = () => {
    setShowPlaybackControl(true);
    window.clearTimeout(hideControlTimeoutRef.current);
    hideControlTimeoutRef.current = window.setTimeout(() => {
      setShowPlaybackControl(false);
    }, 300);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`lightbox-title-${work.id}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-100 bg-white p-3 sm:p-6 lg:p-8"
    >
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col">
        <div
          onMouseMove={showPlaybackTemporarily}
          onMouseLeave={() => {
            window.clearTimeout(hideControlTimeoutRef.current);
            if (!isPlaybackHovered) setShowPlaybackControl(false);
          }}
          className="group relative min-h-0 flex-1 overflow-hidden bg-white"
        >
          <video
            ref={videoRef}
            src={work.src}
            poster={work.poster}
            autoPlay
            muted={isMuted}
            playsInline
            preload="auto"
            onClick={togglePlayback}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="h-full w-full cursor-pointer object-contain"
          />

          <button
            type="button"
            onClick={togglePlayback}
            onMouseEnter={() => {
              window.clearTimeout(hideControlTimeoutRef.current);
              setIsPlaybackHovered(true);
              setShowPlaybackControl(true);
            }}
            onMouseLeave={() => {
              setIsPlaybackHovered(false);
              showPlaybackTemporarily();
            }}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className={`absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-black transition-[background-color,opacity] duration-150 hover:bg-white/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:size-16 ${
              showPlaybackControl || isPlaybackHovered
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            {isPlaying ? (
              <Pause size={24} weight="fill" />
            ) : (
              <Play
                size={24}
                weight="fill"
                className="ml-0.5"
              />
            )}
          </button>

          <div className="absolute right-3 top-3 flex gap-1.5 sm:right-4 sm:top-4">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              title={isMuted ? "Unmute" : "Mute"}
              className={controlClassName}
            >
              {isMuted ? (
                <SpeakerSlash size={18} />
              ) : (
                <SpeakerHigh size={18} />
              )}
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close video"
              title="Close"
              className={controlClassName}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="shrink-0 bg-white px-4 py-4 text-center sm:px-6 sm:py-5">
          <h2
            id={`lightbox-title-${work.id}`}
            className="text-xl! font-normal! tracking-tight! text-black!"
          >
            {work.title}
          </h2>
          <p className="mt-1! text-sm! leading-snug! tracking-normal! text-black/65!">
            {work.description}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
