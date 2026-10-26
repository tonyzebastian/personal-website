"use client";

import { Masonry } from "react-plock";
import { useState, useCallback } from "react";
import { X } from "@phosphor-icons/react";
import AutoVideo from '@/components/ui/AutoVideo';

// Move outside component to prevent recreation
const isVideo = (src) => {
  return /\.(mp4|mov|webm|ogg|avi)$/i.test(src);
};

export default function MasonryGrid({ items, spotlight = { enabled: true }, className = "m-2", hoverEffects = true, config = { columns: [1, 2, 3], gap: [24, 12, 6], media: [640, 768, 1024] } }) {
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = useCallback((item) => {
    if (spotlight.enabled) {
      setSelectedItem(item);
    }
  }, [spotlight.enabled]);

  const handleClose = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const renderMediaItem = useCallback((item, idx) => {
    const hoverClassName = hoverEffects ? "hover:scale-[99%] hover:rounded-3xl cursor-pointer" : "";
    const baseClassName = `rounded transition-all ease-in-out ${hoverClassName}`;
    const specialClassName = item.specialStyling ? "p-2 shadow-sm" : "";

    const commonProps = {
      className: `${baseClassName} ${specialClassName}`,
      style: { width: "100%", height: "auto" },
      onClick: () => handleItemClick(item)
    };

    if (isVideo(item.src)) {
      return (
        <AutoVideo key={idx} {...commonProps} src={item.src} />
      );
    }

    return (
      <img
        key={idx}
        {...commonProps}
        src={item.src}
        alt={item.alt}
        loading="lazy"
        decoding="async"
      />
    );
  }, [hoverEffects, handleItemClick]);

  return (
    <>
      <div className={className}>
        <Masonry
          items={items}
          config={config}
          render={renderMediaItem}
        />
      </div>

      {/* Spotlight Overlay */}
      {spotlight.enabled && selectedItem && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <div
            className="max-w-5xl w-full p-4 relative flex flex-col md:flex-row gap-4 bg-white rounded-xl items-start"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Container */}
            <div className="flex-1 flex justify-center">
              {isVideo(selectedItem.src) ? (
                <video
                  src={selectedItem.src}
                  className="rounded-xl bg-slate-50 max-w-full"
                  style={{ maxHeight: "90vh", objectFit: "contain" }}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img 
                  src={selectedItem.src} 
                  alt={selectedItem.alt}
                  className="rounded-xl bg-slate-50 max-w-full"
                  style={{ maxHeight: "90vh", objectFit: "contain" }}
                />
              )}
            </div>

            {/* Content Container */}
            <div className="w-full md:w-96 flex flex-col shrink-0">
              <div className="flex items-center justify-between mb-1">
                <h2>{selectedItem.alt}</h2>
                <button
                  className="p-2 hover:bg-slate-100 bg-slate-50 rounded-full transition-colors"
                  onClick={handleClose}
                >
                  <X size={20} weight="bold" className="text-slate-600" />
                </button>
              </div>
              
              {selectedItem.description && (
                <p className="mb-8">
                  {selectedItem.description}
                </p>
              )}

              {selectedItem.projectLink && (
                <div>
                  <a
                    href={selectedItem.projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 font-sans text-sm inline-flex items-center tracking-wide bg-zinc-900 rounded hover:bg-zinc-800 text-slate-50 transition-colors w-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Project
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}