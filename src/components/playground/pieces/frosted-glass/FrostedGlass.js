"use client";

import { useDialKit } from "dialkit";
import Controls from "../../Controls";
import Frost from "./Frost";
import { FROST_CONFIG, FROST_DEFAULTS } from "./frostConfig";

// Frosted Glass, November 2026 (from the playground repo): a wet night seen
// through a fogged skywalk window, rendered live in WebGL. Its settings show
// in the lightbox.
function WithControls() {
  const values = useDialKit("Frosted Glass", FROST_CONFIG);
  return (
    <Controls>
      <Frost values={values} />
    </Controls>
  );
}

export function Piece({ mode }) {
  if (mode === "lightbox") return <WithControls />;
  return (
    <div className="absolute inset-0">
      <Frost values={FROST_DEFAULTS} />
    </div>
  );
}
