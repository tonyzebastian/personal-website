// The home page's first-load sequence. The motion itself is CSS (`.intro-*` in
// globals.css), so it starts with the first paint, before any JavaScript.

// How long the whole sequence runs, in ms.
export const INTRO_MS = 2500;

// Runs before the page paints: plays the intro on the first visit to the home
// page in a tab, and never for people who prefer reduced motion.
export const INTRO_SCRIPT = `try{var k='intro-seen';if(location.pathname==='/'&&!sessionStorage.getItem(k)&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('intro-play');sessionStorage.setItem(k,'1')}catch(e){}`;
