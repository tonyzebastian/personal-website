'use client';

import { LinearBlur } from 'progressive-blur';

// A soft blur along the bottom edge of a panel, so content fades out as it
// scrolls past instead of being cut off.
export default function PanelBlur() {
  return (
    <LinearBlur
      side="bottom"
      steps={8}
      strength={64}
      falloffPercentage={100}
      className="absolute inset-x-0 bottom-0 z-10 h-16"
    />
  );
}
