"use client";

import { useDialKit } from "dialkit";
import Controls, { dialDefaults } from "../../Controls";
import WebGLBackground from "./WebGLBackground";
import WallBackground from "./WallBackground";
import styles from "./EveningWindow.module.css";

// Evening Window, July 2026 (from the playground repo's feelings/window-01):
// late light and leaf shadows drifting over a wall. Its art-direction
// controls show in the lightbox.
const CONFIG = {
  master: {
    enabled: true,
    artworkOpacity: [1, 0, 1, .01],
    projectionScale: [1.4, .5, 2, .01],
  },
  light: {
    _collapsed: false,
    enabled: true,
    intensity: [2.4, 0, 2.4, .01],
    coreDefinition: [1, 0, 1, .01],
    coreFeather: [6.85, 0, 8, .05],
    warmth: [.38, 0, 1.5, .01],
    textureRelief: [2, 0, 2, .01],
  },
  shadows: {
    _collapsed: true,
    branches: [.5, 0, 1, .01],
    branchCoreFeather: [4.65, 0, 8, .05],
    leavesBehind: [.85, 0, 1, .01],
    leavesInFront: [.7, 0, 1, .01],
    leafCoreFeather: [5.75, 0, 8, .05],
    secondShadow: true,
    secondShadowOpacity: [.39, 0, .6, .01],
    secondShadowPanels: true,
    secondShadowPanelOpacity: [.3, 0, .6, .01],
    secondShadowX: [8, -30, 30, 1],
    secondShadowY: [-10, -30, 30, 1],
  },
  wall: {
    _collapsed: true,
    exposure: [.91, .35, 1.25, .01],
    texture: [2, 0, 2, .01],
    pores: [1.57, 0, 2, .01],
    roomVariation: [.67, 0, 2, .01],
    cornerShadow: [2, 0, 2, .01],
    wallWarmth: [.20, 0, 1.5, .01],
  },
  ambientCanopy: {
    _collapsed: true,
    enabled: true,
    intensity: [1, 0, 1, .01],
    movement: [1, 0, 1, .01],
    scale: [.59, .5, 2.5, .01],
    horizontalSpread: [1.5, .15, 1.5, .01],
    verticalReach: [1, .12, 1, .01],
    softness: [1, 0, 1, .01],
  },
  reflectedFlecks: {
    _collapsed: true,
    enabled: true,
    intensity: [.5, 0, 1, .01],
    movement: [.59, 0, 1, .01],
    size: [1.1, .5, 2, .01],
    spread: [.69, 0, 1, .01],
  },
  postProduction: {
    _collapsed: true,
    kuwahara: true,
    kuwaharaStrength: [3, 0, 3, .01],
    grain: [3, 0, 3, .01],
    warmWash: [3, 0, 3, .01],
  },
  animation: {
    _collapsed: true,
    enabled: true,
    branchSway: [2, 0, 2, .01],
    lightDrift: [.98, 0, 2, .01],
  },
};

const DEFAULTS = dialDefaults(CONFIG);

function Scene({ controls }) {
  return (
    <section className={styles.stage} aria-label="Evening Window shadow study">
      <WallBackground
        controls={controls.wall}
        canopyControls={controls.ambientCanopy}
        reflectedFlecksControls={controls.reflectedFlecks}
      />
      <div className={styles.artworkColumn}>
        <div
          className={styles.artwork}
          style={{
            opacity: controls.master.enabled ? controls.master.artworkOpacity : 0,
            transform: `scale(${controls.master.projectionScale})`,
          }}
        >
          <WebGLBackground controls={controls} />
        </div>
      </div>
    </section>
  );
}

function WithControls() {
  const controls = useDialKit("Evening Window", CONFIG);
  return (
    <Controls>
      <Scene controls={controls} />
    </Controls>
  );
}

export function Piece({ mode }) {
  return mode === "lightbox" ? <WithControls /> : <Scene controls={DEFAULTS} />;
}
