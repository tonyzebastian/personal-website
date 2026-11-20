"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Spinner from "../../Spinner";
import { useInView } from "motion/react";
import { REVEAL_DEFAULTS, RevealRenderer } from "./reveal-renderer";

const SCROLL_ORBIT = true;
const ORBIT_START_AT = 0.5;
const REVEAL_IMAGE = "/playground/vision-reveal/vision_02.webp";

function useMatchMedia(query) {
  const subscribe = useMemo(
    () => (callback) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    [query],
  );
  const getSnapshot = useMemo(() => () => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function RevealField({ children, className }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [ready, setReady] = useState(false);

  const hasHover = useMatchMedia("(hover: hover) and (pointer: fine)");
  const reduced = useMatchMedia("(prefers-reduced-motion: reduce)");
  const inView = useInView(containerRef, { amount: 0.2, once: false });

  const webgl2Supported = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      // A throwaway context just to test support: release it straight away.
      const probe = document.createElement("canvas").getContext("webgl2");
      probe?.getExtension("WEBGL_lose_context")?.loseContext();
      return Boolean(probe);
    } catch {
      return false;
    }
  }, []);

  // Gate on input capability, not viewport width: it also runs inside the
  // narrow side panel.
  const canvasActive = hasHover && webgl2Supported && !reduced;

  useEffect(() => {
    if (!canvasActive || !canvasRef.current) return undefined;
    let renderer;
    try {
      renderer = new RevealRenderer(canvasRef.current, { ...REVEAL_DEFAULTS }, REVEAL_IMAGE);
    } catch {
      return undefined;
    }
    rendererRef.current = renderer;
    const onReady = () => setReady(true);
    const canvas = canvasRef.current;
    canvas.addEventListener("ready", onReady, { once: true });
    return () => {
      canvas.removeEventListener("ready", onReady);
      setReady(false);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [canvasActive]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (inView) renderer.start();
    else renderer.stop();
  }, [inView, canvasActive]);

  // Orbit with scroll progress ("start end" to "end 0.9"), measured against
  // whichever element scrolls it: the panel on this site, else the window.
  useEffect(() => {
    if (!canvasActive || !SCROLL_ORBIT) return undefined;
    const container = containerRef.current;
    let scroller = container.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const target = scroller ?? window;
    const apply = () => {
      const view = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      const rect = container.getBoundingClientRect();
      const progress = (view.top + view.height - rect.top) / (0.1 * view.height + rect.height);
      const phase = (progress - ORBIT_START_AT) / (1 - ORBIT_START_AT);
      rendererRef.current?.setPhase(Math.max(0, Math.min(1, phase)));
    };
    apply();
    target.addEventListener("scroll", apply, { passive: true });
    return () => target.removeEventListener("scroll", apply);
  }, [canvasActive, ready]);

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    rendererRef.current?.setMouse(event.clientX - bounds.left, event.clientY - bounds.top, true);
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-white ${className ?? ""}`}>
      {canvasActive ? (
        <canvas
          ref={canvasRef}
          aria-hidden
          onPointerMove={handlePointerMove}
          onPointerLeave={() => rendererRef.current?.setMouse(0, 0, false)}
          className="absolute inset-0 block h-full w-full opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100"
        />
      ) : null}
      {canvasActive && !ready ? <Spinner /> : null}
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
