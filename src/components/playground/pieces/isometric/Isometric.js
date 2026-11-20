"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDialKitController } from "dialkit";
import Controls from "../../Controls";

// Isometric Animations (from the playground repo): hand-inked isometric scenes
// made with Colorfigures. Each is a standalone page in
// public/playground/isometric, shown in an iframe with its own chrome hidden
// (?embed=1). In the lightbox, DialKit drives it through the page's
// `figure-controls` message.
//   paper   the scene's background, set on the page once it loads (its own
//           pages differ: one white, one beige), so each scene gets a soft
//           tint of its own
const SCENES = {
  "physio-studio": {
    src: "/playground/isometric/physiotherapy-studio.html",
    title: "Physiotherapy Studio",
    paper: "#edf0ea",
  },
  "swimming-pool": { src: "/playground/isometric/swimming-pool.html", title: "Swimming Pool", paper: "#f2eaf0" },
  "centre-court": { src: "/playground/isometric/tennis-stadium.html", title: "Centre Court", paper: "#f7f5f0" },
};

// Sets the scene's background inside its page (same origin), keeping the
// page's grain texture where it has one.
function applyPaper(frame, paper) {
  const doc = frame?.contentDocument;
  if (!doc?.body) return;
  // !important: some pages force their own background in embed mode.
  doc.documentElement.style.setProperty("--paper", paper);
  doc.documentElement.style.setProperty("background-color", paper, "important");
  doc.body.style.setProperty("background-color", paper, "important");
}

const CONFIG = {
  playback: {
    playing: true,
    speed: [1, 0.25, 3, 0.25],
    restart: { type: "action", label: "Restart" },
  },
  look: {
    wobble: [2.4, 0, 7, 0.1],
    colour: {
      type: "select",
      options: [
        { value: "default", label: "Per animation" },
        { value: "mustard", label: "Yellow" },
        { value: "tomato", label: "Red" },
        { value: "mint", label: "Green" },
        { value: "cobalt", label: "Blue" },
        { value: "blush", label: "Pink" },
      ],
      default: "default",
    },
  },
};

function Frame({ scene, frameRef, onLoad }) {
  return (
    <iframe
      ref={frameRef}
      src={`${scene.src}?embed=1`}
      title={scene.title}
      onLoad={(event) => {
        applyPaper(event.currentTarget, scene.paper);
        onLoad?.(event);
      }}
      className="absolute inset-0 size-full border-0"
      style={{ backgroundColor: scene.paper }}
    />
  );
}

function WithControls({ scene }) {
  const frame = useRef(null);
  const send = useCallback((message) => {
    frame.current?.contentWindow?.postMessage({ type: "figure-controls", ...message }, "*");
  }, []);

  const dial = useDialKitController(scene.title, CONFIG, {
    onAction: (path) => {
      if (path === "playback.restart") send({ restart: true });
    },
  });
  const { playback, look } = dial.values;
  const state = { paused: !playback.playing, speed: playback.speed, wobble: look.wobble, pal: look.colour };
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    send(stateRef.current);
  }, [send, playback.playing, playback.speed, look.wobble, look.colour]);

  return (
    <Controls>
      <Frame scene={scene} frameRef={frame} onLoad={() => send(stateRef.current)} />
    </Controls>
  );
}

const sceneFor = (id) =>
  function IsometricScene({ mode }) {
    const scene = SCENES[id];
    return mode === "lightbox" ? <WithControls scene={scene} /> : <Frame scene={scene} />;
  };

export const PhysioStudio = sceneFor("physio-studio");
export const SwimmingPool = sceneFor("swimming-pool");
export const CentreCourt = sceneFor("centre-court");
