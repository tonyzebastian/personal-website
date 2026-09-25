'use client'

import Image from 'next/image';
import { memo, useMemo } from 'react';

export const isVideo = (src) => /\.(mp4|mov|webm|ogg|avi)$/i.test(src);
export const isGif = (src) => src.endsWith('.gif');

const MediaItem = memo(({ src, alt, width = 600, height = 300, onClick, className = "" }) => {
  const combinedClasses = useMemo(() =>
    `w-full h-auto rounded-xl border border-slate-100 ${className}`,
    [className]
  );

  if (isVideo(src)) {
    return (
      <video
        src={src}
        className={combinedClasses}
        autoPlay
        muted
        loop
        playsInline
        onClick={onClick}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={combinedClasses}
      unoptimized={isGif(src)}
      onClick={onClick}
    />
  );
});
MediaItem.displayName = 'MediaItem';

export default MediaItem;
