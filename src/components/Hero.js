"use client"

import { bio } from '@/lib/content';
import { FlickeringGrid } from './ui/flickering-grid';
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        // Video autoplay failed - user interaction required
      });
    }
  };

  const handleVideoLoadedData = () => {
    // Fallback if canplaythrough doesn't fire
    setTimeout(() => {
      if (!videoLoaded) {
        handleVideoLoaded();
      }
    }, 1000);
  };

  useEffect(() => {
    // Check if video is already loaded when component mounts
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.readyState >= 3) { // HAVE_FUTURE_DATA or greater
        handleVideoLoaded();
      }
    }
  }, []);

  return (
    <div className="hero-gradient min-h-[754px] 2xl:min-h-[1000px] flex items-center justify-center relative">
      {/* FlickeringGrid Background */}
      <div className="absolute inset-0 z-0">
        <FlickeringGrid
          className="size-full"
          squareSize={4}
          gridGap={6}
          color="#92400E"
          maxOpacity={0.1}
          flickerChance={0.1}
        />
      </div>
      
      <div className="max-w-[862px] 2xl:max-w-[1200px] w-full flex flex-col items-center gap-12 2xl:gap-16 relative z-10">
        
        {/* Video/Image Container - 16:9 aspect ratio */}
        <div className="w-full aspect-video max-w-4xl 2xl:max-w-5xl bg-white/50 rounded-3xl p-2 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
            <div 
              className="relative w-full h-full rounded-2xl overflow-hidden group"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              {/* Hero Image - shows first */}
              <Image
                src="/hero_image.jpg"
                alt="Tony Sebastian"
                fill
                className={`object-cover rounded-xl transition-opacity duration-500 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 64rem"
              />
              
              {/* Hero Video - replaces image when loaded */}
              <video
                ref={videoRef}
                src="/hero_video.mp4"
                className={`w-full h-full object-cover rounded-xl transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                muted={isMuted}
                playsInline
                preload="auto"
                onCanPlayThrough={handleVideoLoaded}
                onLoadedData={handleVideoLoadedData}
                onClick={togglePlay}
              />
              
              
              {/* Play/Pause button - Center - Only when video is loaded */}
              {videoLoaded && (
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    onClick={togglePlay}
                    className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-xs"
                  >
                    {isPlaying ? (
                      <Pause size={32} className="text-white" />
                    ) : (
                      <Play size={32} className="text-white ml-1" />
                    )}
                  </button>
                </div>
              )}
              
              {/* Mute button - Bottom right - Only when video is loaded */}
              {videoLoaded && (
                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors backdrop-blur-xs group"
                  >
                    {isMuted ? (
                      <VolumeX size={20} className="text-slate-400 group-hover:text-slate-800" />
                    ) : (
                      <Volume2 size={20} className="text-slate-400 group-hover:text-slate-800" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-2 w-full">
          <h1 className="font-serif text-2xl 2xl:text-3xl text-center text-slate-900">
            Hello! I am Tony, a software designer.
          </h1>
          <div className="max-w-[500px] 2xl:max-w-[612px] w-full">
            <p className="font-sans text-sm 2xl:text-base text-slate-700 text-center leading-relaxed">
              {bio.intro}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}