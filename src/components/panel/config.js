// Panel settings in one place, so the split and the feel are easy to tune.

// From this width the panel opens beside the list; below it, as a sheet.
export const SPLIT_FROM = 1280;

// Share of the screen the panel takes when open (the list keeps the rest).
export const PANEL_SHARE = 70;

// Opening and closing. No bounce, so the push reads as one smooth glide.
export const PANEL_SPRING = { type: 'spring', visualDuration: 0.5, bounce: 0 };

// Swapping one panel's content for another.
export const CONTENT_FADE = { duration: 0.2, ease: 'easeOut' };
