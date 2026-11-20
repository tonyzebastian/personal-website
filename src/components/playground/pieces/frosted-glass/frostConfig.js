// DialKit controls for the rainy skywalk window. Numeric controls are [default, min, max, step].
// Positions and sizes are in stage units: the stage is 1 tall and FROST_ASPECT wide.

// The stage is always 4:5 (width / height).
export const FROST_ASPECT = 4 / 5;

// Colours of the street behind the glass: a teal night with amber windows and a yellow glow down the street.
export const FROST_COLORS = {
  skyTop: '#04090e', skyHorizon: '#163a40', ground: '#05090b', building: '#0a1216', haze: '#2a4a50',
  window: '#ffb35a', lamp: '#ff9a3c', glow: '#8a7a3a',
};

export const FROST_CONFIG = {
  street: {
    _collapsed: false,
    traffic: [2.65, 0, 3, 0.05],
    people: [3, 0, 3, 0.05],
    brightness: [2.31, 0.3, 3, 0.01],
    exposure: [1.71, 0.4, 2.5, 0.01],
    lightSize: [0.93, 0.5, 2, 0.01],
    windows: [0.34, 0, 2, 0.01],
    seed: [6, 1, 99, 1],
  },
  glass: {
    _collapsed: false,
    blur: [0.4, 0.4, 2, 0.01],
    mist: [0.32, 0, 1, 0.01],
    condensation: [1.2, 0, 1.5, 0.01],
    mistReturn: [0.6, 0, 2, 0.01],
    frostWarp: [2, 0, 3, 0.01],
  },
  // Thin, broken rays out of bright lights, from fine scratches and wipe marks on the glass.
  streaks: {
    _collapsed: false,
    amount: [0.64, 0, 3, 0.01],
    length: [0.37, 0.1, 1.2, 0.01],
    blur: [1.09, 0, 2, 0.01],
  },
  drops: {
    _collapsed: true,
    amount: [1.5, 0, 2, 0.01],
    dropSize: [0.4, 0.3, 2, 0.01],
    lens: [2.6, 0, 3, 0.01],
    slideRate: [2.8, 0, 4, 0.01],
    slideSpeed: [0.55, 0.2, 3, 0.01],
  },
  grain: {
    _collapsed: true,
    amount: [0.94, 0, 2, 0.01],
    size: [0.5, 0.5, 4, 0.1],
    chroma: [0.56, 0, 1, 0.01],
  },
  motion: {
    _collapsed: true,
    playing: true,
    speed: [0.47, 0, 3, 0.01],
  },
  quality: {
    _collapsed: true,
    pixelRatio: [1.5, 0.75, 2, 0.25],
    sceneScale: [1, 0.25, 1, 0.05],
  },
};

// Resolves the config's defaults into the same nested shape `useDialKit` returns,
// for callers (the gallery preview) that render without the panel.
const resolveDefaults = (config) => {
  const out = {};
  for (const [key, value] of Object.entries(config)) {
    if (key.startsWith('_')) continue;
    if (Array.isArray(value)) out[key] = value[0];
    else if (value && typeof value === 'object' && 'default' in value) out[key] = value.default;
    else if (value && typeof value === 'object') out[key] = resolveDefaults(value);
    else out[key] = value;
  }
  return out;
};

export const FROST_DEFAULTS = resolveDefaults(FROST_CONFIG);
