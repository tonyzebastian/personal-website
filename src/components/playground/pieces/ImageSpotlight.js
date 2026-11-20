'use client'
import { useState, useCallback, useRef } from 'react';
import Fit from '../Fit';

// Throttle utility function
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

export default function ImageSpotlight({
  src,
  alt,
  orientation = 'landscape',
  width,
  height,
  config = {}
}) {
  // Default configuration
  const defaultConfig = {
    spotlightSize: 80,
    overlayOpacity: 0.6,
    className: ''
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Component state
  const [isHovered, setIsHovered] = useState(false);
  const [perspective, setPerspective] = useState({ rotateX: 0, rotateY: 0 });

  const containerRef = useRef(null);

  // Mouse move handler
  const handleMouseMove = useCallback(
    throttle((event) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      // Update CSS variables for spotlight position
      containerRef.current.style.setProperty('--mouse-x', `${x}%`);
      containerRef.current.style.setProperty('--mouse-y', `${y}%`);

      // Calculate 3D perspective rotation
      // Map cursor position to rotation values (-8 to +8 degrees for subtle effect)
      const rotateY = ((x - 50) / 50) * 8; // Left-right tilt
      const rotateX = ((50 - y) / 50) * 8; // Up-down tilt (inverted for natural feel)

      setPerspective({ rotateX, rotateY });
    }, 16), // 60fps throttling
    []
  );

  // Mouse enter handler
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Mouse leave handler
  const handleMouseLeave = () => {
    setIsHovered(false);
    setPerspective({ rotateX: 0, rotateY: 0 }); // Reset perspective when leaving
  };

  // Container classes and inline styles
  const getContainerDimensions = () => {
    // Use provided width/height or fall back to defaults based on orientation
    if (width && height) {
      return {
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: '100%'
      };
    }

    // Default dimensions if no width/height provided
    if (orientation === 'landscape') {
      return {
        width: '800px',
        height: '450px', // 16:9 ratio
        maxWidth: '100%'
      };
    } else {
      return {
        width: '450px',
        height: '600px', // 3:4 ratio
        maxWidth: '100%'
      };
    }
  };

  const containerClasses = `
    relative overflow-hidden cursor-none rounded-lg shadow-md border border-black/5
    ${finalConfig.className}
  `.trim();

  return (
    <div className="flex items-center justify-center">
      <div
        ref={containerRef}
        className={containerClasses}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label={alt}
        
        tabIndex={0}
        style={{
          ...getContainerDimensions(),
          '--mouse-x': '50%',
          '--mouse-y': '50%',
          '--spotlight-size': `${finalConfig.spotlightSize}px`,
          '--overlay-opacity': finalConfig.overlayOpacity,
          transform: `perspective(1000px) rotateX(${perspective.rotateX}deg) rotateY(${perspective.rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.2s ease-out'
        }}
      >

        {/* Blurred Base Image - Always visible */}
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          style={{ filter: 'blur(5px)' }}
        />

        {/* Sharp Image - Only visible through spotlight */}
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          style={{
            maskImage: `radial-gradient(
              circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              black ${finalConfig.spotlightSize * 0.4}px,
              transparent ${finalConfig.spotlightSize * 1.6}px
            )`,
            WebkitMaskImage: `radial-gradient(
              circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              black ${finalConfig.spotlightSize * 0.4}px,
              transparent ${finalConfig.spotlightSize * 1.6}px
            )`,
            zIndex: 2
          }}
        />

        {/* Main Dark Overlay with Current Spotlight Position */}
        <div
          className="absolute inset-0 bg-black will-change-[mask-position] transition-all duration-100 ease-out"
          style={{
            opacity: finalConfig.overlayOpacity,
            maskImage: `radial-gradient(
              circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              transparent ${finalConfig.spotlightSize * 0.4}px,
              black ${finalConfig.spotlightSize * 1.6}px
            )`,
            WebkitMaskImage: `radial-gradient(
              circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              transparent ${finalConfig.spotlightSize * 0.4}px,
              black ${finalConfig.spotlightSize * 1.6}px
            )`,
            zIndex: 10
          }}
        />

      </div>
    </div>
  );
}

// Playground piece (from the playground repo's img-light page).
const LIGHT_IMAGES = [
  'https://images.unsplash.com/photo-1742201877377-03d18a323c18?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1757081791153-3f48cd8c67ac?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1757626961383-be254afee9a0?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
];

export function Piece() {
  return (
    <Fit width={960} height={480}>
      <div className="flex size-full items-center justify-center gap-2">
        {LIGHT_IMAGES.map((src) => (
          <ImageSpotlight key={src} src={src} alt="Photo lit by a cursor spotlight" orientation="portrait" width={300} height={400} />
        ))}
      </div>
    </Fit>
  );
}
