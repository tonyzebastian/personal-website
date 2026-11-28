// Shared render loop for canvas experiments: runs `onFrame(dt, now)` once per
// animation frame, and pauses while the element is off-screen or the tab is
// hidden. `dt` is in seconds, clamped so a stalled tab doesn't jump on resume.
// Returns a `stop()` for the effect cleanup.
export function createFrameLoop(element, onFrame, { maxDt = 0.05 } = {}) {
  let raf = 0;
  let visible = true;
  let last = performance.now();

  const tick = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(Math.max((now - last) / 1000, 0), maxDt);
    last = now;
    onFrame(dt, now);
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (!raf && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  });
  observer.observe(element);
  document.addEventListener("visibilitychange", start);
  start();

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    document.removeEventListener("visibilitychange", start);
  };
}
