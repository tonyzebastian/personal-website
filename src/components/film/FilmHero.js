"use client";

import Image from "next/image";
import { useState } from "react";

export default function FilmHero({ src, poster }) {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <section
      aria-label="Featured film"
      className="relative h-[78svh] w-full overflow-hidden bg-slate-950 md:h-auto md:min-h-svh"
    >
      <Image
        src={poster}
        alt="A cyclist overlooking the Golden Gate Bridge"
        fill
        priority
        sizes="100vw"
        className={`object-cover object-top transition-opacity duration-1000 md:object-center ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      <video
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={() => setVideoReady(true)}
        className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-1000 md:object-center ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      />
    </section>
  );
}
