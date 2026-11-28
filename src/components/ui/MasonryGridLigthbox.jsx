'use client';

import { useEffect, useState } from 'react';
import MasonryGrid from './MasonryGrid';
import { X } from "@phosphor-icons/react";

export default function MasonryGridLightbox({lightboxImages = [], height}) {
    const [showMasonryLightbox, setShowMasonryLightbox] = useState(false);

    // Esc closes the lightbox only. Marking the key as handled stops the
    // panel behind it from closing too.
    useEffect(() => {
        if (!showMasonryLightbox) return undefined;
        const onKey = (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            setShowMasonryLightbox(false);
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [showMasonryLightbox]);


    return (
        <>
            {/* Main Grid */}
                <div
                    className={'relative rounded-xl overflow-hidden bg-slate-50 border border-transparent transition-[scale,border-color] duration-200 ease-snappy hover:scale-[99%] hover:border-border group cursor-pointer p-2'}
                    onClick={() => setShowMasonryLightbox(true)}
                >
                        <div 
                            className="w-full h-full overflow-y-auto scrollbar-hide rounded-xl"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                maxHeight: `${height}px`
                            }}
                        >
                            <MasonryGrid 
                                items={lightboxImages.map(src => ({ src }))} 
                                spotlight={{ enabled: false }}
                                className=""
                            />
                        </div>
                </div>

            {/* Masonry Lightbox */}
            {showMasonryLightbox && (
                <div
                    className="fixed inset-0 bg-black/25 backdrop-blur-xs flex flex-col items-center justify-center z-50"
                    onClick={() => setShowMasonryLightbox(false)}
                >
                    <div
                        className="relative max-w-7xl w-full max-h-[85vh] bg-white rounded-xl p-2 mb-16 2xl:mb-0 2xl:max-w-(--breakpoint-2xl)"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button - Top right side */}
                        <button
                            className="absolute top-0 -right-16 p-2 hover:bg-slate-900 bg-slate-600 rounded-full transition-colors z-10"
                            onClick={() => setShowMasonryLightbox(false)}
                        >
                            <X size={24} weight="bold" className="text-white" />
                        </button>
                        <div 
                            className="w-full h-full overflow-y-auto scrollbar-hide rounded-xl"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}
                        >
                            <MasonryGrid 
                                items={lightboxImages.map(src => ({ src }))} 
                                spotlight={{ enabled: false }}
                                className=""
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}