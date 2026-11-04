export const IMAGE_LAB_SAMPLES = {
  mosaic: {
    label: 'Color portrait',
    src: '/playground/mosaic/mosaic.webp',
    aspect: 'landscape',
  },
  reflection: {
    label: 'Water portrait',
    src: '/playground/mosaic/water-reflection.webp',
    aspect: 'portrait',
  },
  drawing: {
    label: 'Landscape',
    src: '/playground/mosaic/drawing-canvas.webp',
    aspect: 'landscape',
  },
};

export const IMAGE_LAB_PALETTES = {
  pool: {
    label: 'Pool violet',
    colors: ['#230c25', '#543063', '#7772ad', '#eadde9'],
  },
  dusk: {
    label: 'Blue dusk',
    colors: ['#10152d', '#384776', '#7891b6', '#e5dfd3'],
  },
  rose: {
    label: 'Rose water',
    colors: ['#35101f', '#8a334d', '#d87882', '#f4dfd4'],
  },
  ink: {
    label: 'Ink on paper',
    colors: ['#111218', '#444856', '#9699a2', '#eeeae0'],
  },
};

export const IMAGE_LAB_CONFIG = {
  image: {
    sample: {
      type: 'select',
      options: Object.entries(IMAGE_LAB_SAMPLES).map(([value, sample]) => ({
        value,
        label: sample.label,
      })),
      default: 'mosaic',
    },
    chooseImage: { type: 'action', label: 'Choose image' },
  },
  output: {
    aspect: {
      type: 'select',
      options: [
        { value: 'portrait', label: 'Portrait · 4:5' },
        { value: 'square', label: 'Square · 1:1' },
        { value: 'landscape', label: 'Landscape · 16:9' },
      ],
      default: 'landscape',
    },
    fit: {
      type: 'select',
      options: [
        { value: 'cover', label: 'Cover' },
        { value: 'contain', label: 'Contain' },
      ],
      default: 'cover',
    },
    zoom: [100, 100, 250],
    positionX: [50, 0, 100],
    positionY: [50, 0, 100],
    previewQuality: {
      type: 'select',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'high', label: 'High' },
      ],
      default: 'standard',
    },
    showOriginal: false,
    backgroundColor: '#ffffff',
  },
  brush: {
    enabled: false,
    style: {
      type: 'select',
      options: [
        { value: 'painterly', label: 'Painterly pastel' },
        { value: 'watercolor', label: 'Transparent wash' },
        { value: 'graphite', label: 'Graphite study' },
        { value: 'ink', label: 'Illustrated ink' },
      ],
      default: 'painterly',
    },
    seed: [42, 1, 999],
    detail: [58, 10, 100],
    strokeSize: [9, 3, 24, 0.5],
    edgeFollow: [82, 0, 100],
    colorFidelity: [88, 0, 100],
    originalBlend: [6, 0, 100],
    paperColor: '#f2ede3',
  },
  mosaic: {
    enabled: true,
    tileSize: [6, 3, 64],
    neighborBlend: [61, 0, 100],
    saturation: [23, 0, 100],
    tileBorder: [66, 0, 100],
    grain: [62, 0, 100],
  },
  dither: {
    enabled: false,
    dotSize: [4, 1, 12, 0.5],
    spacing: [10, 4, 24, 0.5],
    edgeScatter: [80, 0, 100],
    interpretation: {
      type: 'select',
      options: [
        { value: 'dark', label: 'Dark details' },
        { value: 'light', label: 'Light details' },
      ],
      default: 'dark',
    },
    inkColor: '#005987',
  },
  cursor: {
    enabled: true,
    radius: [240, 40, 600],
    erasure: [80, 0, 100],
    velocitySpread: [20, 0, 60],
    meshPush: [3, 0, 12, 0.5],
    lag: [15, 1, 40],
  },
  water: {
    enabled: false,
    displacement: [8, 0, 100],
    bandDetail: [140, 22, 150],
    edgeRoughness: [75, 0, 100],
    ambientStrength: [0, 0, 300],
    ambientSpeed: [0, 0, 300],
  },
  print: {
    contrast: [55, 0, 100],
    midtoneBalance: [50, 0, 100],
    edgeInk: [56, 0, 100],
    inkBleed: [61, 0, 100],
    texture: {
      type: 'select',
      options: [
        { value: 'stipple', label: 'Stippled ink' },
        { value: 'halftone', label: 'Halftone dots' },
        { value: 'clean', label: 'Clean color plates' },
      ],
      default: 'halftone',
    },
    screenSize: [5.9, 2, 12, 0.1],
    dryInk: [85, 0, 100],
    paperGrain: [71, 0, 100],
    plateOffset: [54, 0, 100],
  },
  palette: {
    preset: {
      type: 'select',
      options: Object.entries(IMAGE_LAB_PALETTES).map(([value, palette]) => ({
        value,
        label: palette.label,
      })),
      default: 'rose',
    },
    inkOne: IMAGE_LAB_PALETTES.rose.colors[0],
    inkTwo: IMAGE_LAB_PALETTES.rose.colors[1],
    inkThree: IMAGE_LAB_PALETTES.rose.colors[2],
    inkFour: IMAGE_LAB_PALETTES.rose.colors[3],
  },
};

export const IMAGE_LAB_ASPECTS = {
  portrait: 4 / 5,
  square: 1,
  landscape: 16 / 9,
};
