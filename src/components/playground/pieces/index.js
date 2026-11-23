'use client';

import dynamic from 'next/dynamic';
import Spinner from '../Spinner';

// Every live piece, by id (the ids used in src/lib/playground.js). Each loads
// on its own, in the browser only, when its stage first comes near the screen.
//   aspect   shape of its box in the panel (the lightbox fills the screen)
//   replay   shows a Replay action that mounts the piece afresh (for pieces
//            that animate as they arrive)
//   aspectClass  responsive shape as classes (container queries on the page),
//            in place of `aspect`
//   bare     no line below it (no name, hint or actions): the panel's own
//            expand opens it full size
const piece = (load, name = 'Piece') =>
  dynamic(() => load().then((mod) => mod[name]), { ssr: false, loading: Spinner });
const isometric = (name) => piece(() => import('./isometric/Isometric'), name);

export const PIECES = {
  'drawing-wall': { Component: piece(() => import('./drawings/DrawingWall')), aspectClass: 'aspect-[3/5] @xl:aspect-[4/3]', bare: true },
  'image-sphere': { Component: piece(() => import('./SphereImageGrid')), aspect: '16 / 10' },
  'image-goo': { Component: piece(() => import('./image-goo/ImageGoo')), aspect: '16 / 10' },
  'image-loading': { Component: piece(() => import('./ImageLoader')), aspect: '16 / 10', replay: true },
  'image-stack': { Component: piece(() => import('./ImgStack')), aspect: '16 / 10' },
  'image-tiles': { Component: piece(() => import('./ImgTiles')), aspect: '16 / 10', replay: true },
  'image-light': { Component: piece(() => import('./ImageSpotlight')), aspect: '16 / 10' },
  'vision-reveal': { Component: piece(() => import('./vision-reveal/VisionReveal')), aspect: '16 / 10' },

  'frosted-glass': { Component: piece(() => import('./frosted-glass/FrostedGlass')), aspect: '16 / 10' },
  'evening-window': { Component: piece(() => import('./evening-window/EveningWindow')), aspect: '16 / 10' },

  'swimming-pool': { Component: isometric('SwimmingPool'), aspect: '16 / 10' },
  'centre-court': { Component: isometric('CentreCourt'), aspect: '16 / 10' },
  'physio-studio': { Component: isometric('PhysioStudio'), aspect: '16 / 10' },

  'mosaic-image-lab': {
    Component: piece(() => import('./mosaic/ImageLabStudio')),
    aspectClass: 'aspect-[3/4] @xl:aspect-[4/3]',
    bare: true,
  },
  'flock-in-flight': { Component: piece(() => import('./flock/Flock')), aspect: '4 / 3', bare: true },
  'car-configuration': {
    Component: piece(() => import('./car/SlateCarAnimation')),
    aspectClass: 'aspect-[4/5] @xl:aspect-[4/3]',
    bare: true,
  },
  'school-of-fish': { Component: piece(() => import('./fish/Aquarium')), aspect: '4 / 3', bare: true },
};
