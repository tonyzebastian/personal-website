"use client";

import { useEffect, useRef, useState } from "react";
import Spinner from "../../Spinner";
import { FROST_DEFAULTS } from "./frostConfig";
import { createFrost } from "./frost-renderer";

// Fills its container. `values` is the DialKit shape from frostConfig.js; the renderer reads
// the latest value every frame, so changing it never restarts the scene.
export default function Frost({ values = FROST_DEFAULTS }) {
  const canvasRef = useRef(null);
  const valuesRef = useRef(values);
  const [ready, setReady] = useState(false);

  valuesRef.current = values;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const lite = window.matchMedia("(pointer: coarse)").matches || Math.min(window.innerWidth, window.innerHeight) < 600;
    return createFrost(canvas, () => valuesRef.current, { lite, onReady: () => setReady(true) });
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0d141c]">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full transition-opacity duration-700"
        style={{ opacity: ready ? 1 : 0 }}
      />
      {!ready ? <Spinner className="text-white/50" /> : null}
    </div>
  );
}
