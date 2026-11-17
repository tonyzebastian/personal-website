// Panel settings in one place, so the split and the feel are easy to tune.

// From this width the panel opens beside the list; below it, as a sheet.
export const SPLIT_FROM = 1024; // Tailwind lg: keep the lg: classes in SiteShell in step

// Share of the screen the panel takes when open (the list keeps the rest).
export const PANEL_SHARE = 60;

// Side panel opening and closing (wide screens). The layout jumps to its new
// shape at once; the list and the panel card then slide there with transforms
// only (Web Animations, so it runs off the main thread while the page loads).
// The curve is an iOS-like drawer: quick to start, long soft landing.
export const PANEL_SLIDE = { duration: 500, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' };

// The sheet on small screens. No bounce, so it reads as one smooth glide.
export const PANEL_SPRING = { type: 'spring', visualDuration: 0.5, bounce: 0 };

// A page that loads within this many ms replaces the panel's content straight
// away; the loading placeholder only shows when it takes longer, so fast
// loads never flash it.
export const SKELETON_DELAY = 150;

// The site's strong ease-out (--ease-snappy in globals.css), for Motion.
export const EASE_SNAPPY = [0.23, 1, 0.32, 1];

// Swapping one panel's content for another: the old page clears out quickly
// (CONTENT_EXIT) while the new one fades in a little slower (CONTENT_FADE),
// so the two barely show at once. CONTENT_FADE also fades the sheet's backdrop.
export const CONTENT_FADE = { duration: 0.2, ease: EASE_SNAPPY };
export const CONTENT_EXIT = { duration: 0.12, ease: EASE_SNAPPY };
