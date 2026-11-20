// Playground: visuals and explorations brought over from the playground repo,
// shown as a cover grid below Musings. Each entry opens /playground/<slug> in
// the panel.
//   group    several live pieces shown one below the other; each also opens on
//            its own in a lightbox, with its controls
//   single   one live piece filling the page
//   clips    short videos one below the other, each with its name and hint
//   note     a plain page in the panel: the description, nothing live yet
//   link     an outside project: the card opens `href` in a new tab and has
//            no page here
// `cover` is a short clip (`video`) or a still (`image`) in public/playground,
// with an optional `position` for the part the tile's crop keeps (CSS
// object-position), `zoom` to crop in further, anchored at that position, and
// `aspect` (width / height) for the hover preview in the home list; or
// `{ placeholder: true }` for a plain card with the title until there's art.
// `size` sets the tile in the home bento: 'tall' (one column, two rows),
// 'wide' (both columns, one row), or square when left out. Tiles fill the two
// columns in this order, so a tall tile needs two squares beside it and the
// rows must close; reorder or resize entries together (see CoverGrid).
// `kind` is the one or two words on the right of its row in the home list.
// `tagline` (optional) follows the title in the panel's top row, after a pipe.
// `links` (optional) { phrase: url } turns those words in the tagline and
// description into highlight links (LinkedText).
// `fill` (singles) lets the piece fill the side panel, edge to edge.
// `hint` is the short line shown beside a piece's name on hover: what it is,
// or how to play with it. `description` is the longer text in the lightbox.
// Piece ids map to components in src/components/playground/pieces/index.js.
export const playground = [
  {
    slug: 'flock-in-flight',
    title: 'Flock in Flight',
    kind: 'Interactive',
    tagline: 'Press and hold to fly faster',
    type: 'single',
    piece: 'flock-in-flight',
    fill: true,
    size: 'wide',
    cover: { image: '/playground/covers/flock-in-flight.webp', aspect: '350 / 394' },
    description: 'A flock of birds gliding over landscapes that slowly change beneath them. Press and hold to fly faster.',
  },
  {
    slug: 'in-motion',
    title: 'In Motion',
    kind: 'Animation',
    tagline: 'Animation work for clients, and some just for fun',
    type: 'clips',
    cover: { video: '/playground/animation/1.mp4', aspect: '400 / 300' },
    description: "Animation lets me express emotions and ideas uniquely. I'm particularly fond of frame-by-frame animation, playful logo reveals, and creating small moments that connect with people.",
    clips: [
      {
        src: '/playground/animation/olympiade.mp4',
        title: 'Sterrenkunde Olympiade',
        hint: 'Official logo and animation for the 2019 Sterrenkunde Olympiade',
      },
      { src: '/playground/animation/chatwoot.mp4', title: 'Chatwoot', hint: 'Logo animation for Chatwoot' },
      { src: '/playground/animation/5.mp4', title: 'Postman', hint: 'A logo animation I made when I joined Postman' },
      { src: '/playground/animation/1.mp4', title: 'Slow Burn', hint: 'A frame-by-frame study, hand-drawn in Procreate' },
      { src: '/playground/animation/polaroid.mp4', title: 'Polaroid', hint: 'Official logo and animation for a design studio' },
      { src: '/playground/animation/wind.mp4', title: 'Wind', hint: 'A study' },
    ],
  },
  {
    slug: 'light-and-shadow',
    title: 'Light and Shadow',
    kind: 'Shaders',
    tagline: 'Shaders that recreate real scenes I loved',
    type: 'group',
    size: 'tall',
    cover: { video: '/playground/covers/light-and-shadow.mp4', aspect: '600 / 748' },
    description: 'Two moods painted live in WebGL, one for a summer evening and one for a rainy night.',
    items: [
      {
        id: 'evening-window',
        title: 'Evening Window',
        hint: 'Late sun and leaf shadows drifting across a wall',
        description: 'Late light and leaf shadows on a wall, with a painterly Kuwahara finish.',
      },
      {
        id: 'frosted-glass',
        title: 'Frosted Glass',
        hint: 'Rain on a fogged window above a night street',
        description: 'A fogged skywalk window where every raindrop holds a tiny upside-down street.',
      },
    ],
  },
  {
    slug: 'gallery-pieces',
    title: 'Gallery Pieces',
    kind: 'Components',
    tagline: 'Interactive components for showing images',
    type: 'group',
    cover: { video: '/playground/covers/gallery-pieces.mp4', aspect: '800 / 534' },
    description: 'Small interactions for showing images: spin them, stack them, fan them out, light them up.',
    items: [
      {
        id: 'image-sphere',
        title: 'Image Sphere',
        hint: 'Drag to spin it, click a photo to see it full size',
        description: 'Images spread over a sphere. Drag to spin it; it keeps some momentum, then drifts on its own. Click an image to see it larger.',
      },
      {
        id: 'vision-reveal',
        title: 'Vision Reveal',
        hint: 'A shader that brings the photo through wherever your cursor wanders',
        description: 'A WebGL field that clears where the cursor passes, revealing the image underneath. Needs a mouse or trackpad.',
      },
      {
        id: 'image-loading',
        title: 'Image Loading',
        hint: 'A placeholder that takes on the photo’s colours while it loads',
        description: 'A grid of blinking dots stands in while the image loads, then takes on its colours and fades away to reveal it.',
      },
      {
        id: 'image-stack',
        title: 'Image Stack',
        hint: 'Drag the top photo away to send it to the back',
        description: 'A tilted stack of photos. Drag the top one away and it goes to the back.',
      },
      {
        id: 'image-tiles',
        title: 'Image Tiles',
        hint: 'Fanned photos that straighten up when you hover them',
        description: 'Three photos fan out as they arrive and straighten up when you hover them.',
      },
      {
        id: 'image-light',
        title: 'Image Light',
        hint: 'Move your cursor to light the photos and tilt the cards',
        description: 'The photos sit in the dark and blurred. Your cursor is a spotlight that shows them sharp, and the card tilts towards it.',
      },
    ],
  },
  {
    slug: 'pocket-worlds',
    title: 'Pocket Worlds',
    kind: 'Illustration',
    tagline: 'Little isometric scenes, mostly made with the Colorfigures skill',
    links: { Colorfigures: 'https://april-zhu.com/colorfigures' },
    type: 'group',
    cover: { image: '/playground/covers/pocket-worlds.webp', aspect: '560 / 630' },
    description: 'Hand-inked isometric scenes where everyone is mid-motion, made mostly with the Colorfigures skill for Claude.',
    items: [
      {
        id: 'swimming-pool',
        title: 'Swimming Pool',
        hint: 'A busy pool, everyone mid-stroke',
        description: 'An isometric pool where everyone is mid-stroke.',
      },
      {
        id: 'centre-court',
        title: 'Centre Court',
        hint: 'A rally in full swing, crowd and all',
        description: 'A tennis stadium mid-rally, crowd and all.',
      },
      {
        id: 'physio-studio',
        title: 'Physiotherapy Studio',
        hint: 'A busy session at the studio',
        description: 'A physiotherapy studio in the middle of a busy session.',
      },
    ],
  },
  {
    slug: 'mosaic-image-lab',
    title: 'Mosaic Image Lab',
    kind: 'Tool',
    tagline: 'Turn a photo into mosaic, dither or reflection art and download it',
    type: 'single',
    piece: 'mosaic-image-lab',
    fill: true,
    cover: { image: '/playground/covers/mosaic.webp', aspect: '800 / 420' },
    description: 'An image editor for mosaic, dither and water-reflection treatments. Pick a sample or add your own photo, then download the result as a PNG.',
  },
  {
    slug: 'school-of-fish',
    title: 'A School of Fish',
    kind: 'Interactive',
    tagline: 'The fish follow your cursor; click to scatter them',
    type: 'single',
    piece: 'school-of-fish',
    fill: true,
    size: 'wide',
    cover: { video: '/playground/covers/fish.mp4', aspect: '960 / 636' },
    description: 'Fish that follow your cursor around the pond and scatter when you click.',
  },
  {
    slug: '365-days-of-drawing',
    title: '365 Days of Drawing',
    kind: 'Illustration',
    tagline: 'One drawing a day, for a year',
    type: 'single',
    piece: 'drawing-wall',
    fill: true,
    cover: { image: '/playground/covers/365-days-of-drawing.webp', aspect: '1 / 1' },
    description: '365 illustrations from a year of drawing every day. Drag or scroll to explore, and click a drawing to take a closer look.',
  },
  {
    slug: 'build-your-truck',
    title: 'Build Your Truck',
    kind: 'Interactive',
    tagline: 'Pick a build and watch the truck turn to show it',
    type: 'single',
    piece: 'car-configuration',
    fill: true,
    cover: { video: '/playground/covers/build-your-truck.mp4', position: 'left top', zoom: 1.12, aspect: '800 / 502' },
    description: 'A configurator modelled on Slate’s: pick a build and the truck turns to show it, frame by frame.',
  },
  {
    slug: 'ux-nudges',
    title: 'UX Nudges',
    kind: 'Collection',
    type: 'link',
    href: 'https://ux-nudge.web.app/',
    cover: { image: '/playground/covers/ux-nudges.webp', aspect: '464 / 522' },
    description: 'A collection of nudges from apps.',
  },
  {
    slug: 'dalal-prints',
    title: 'Dalal Prints',
    kind: 'Coming soon',
    type: 'note',
    cover: { placeholder: true },
    description: 'Details coming soon.',
  },
];

// Entries with a page of their own (everything but outside links).
export const playgroundPages = playground.filter((entry) => entry.type !== 'link');
export const findPlayground = (slug) => playgroundPages.find((entry) => entry.slug === slug);
