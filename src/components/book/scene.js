// The WebGL storybook, modelled on the board book at
// howtotalktowhitekidsaboutracism.com (rebuilt from its behaviour, not its
// code):
//
// - Every leaf is a board 1 x 1.14 and 0.005 thick (covers 0.008), with
//   rounded outer corners and solid edges, hinged at the spine. The covers
//   are rigid; a page flexes a little as it turns, its edge trailing behind
//   the spine and sagging under its own weight.
// - Reading is one timeline, `progress`: leaf k turns 0 -> 180 degrees as
//   progress runs from k to k + 1, so jumping several pages turns them one
//   after another. Progress always moves on a spring, so it keeps its speed
//   when interrupted: the keys ease it to a page, a drag pulls it along just
//   behind the hand (the width of the book's frame is one page), and letting
//   go carries that speed into the nearest page.
// - The book lives on a canvas over the whole window, so it can travel. At
//   rest it is hidden and the page shows my photo instead, which is the
//   book's first page. On hover the cover swings shut over that page; on click
//   the book flies to the middle of the window, opening and growing. The page
//   dims once it has landed, and brightens again before it leaves.
// - Paper is a slightly glossy standard material with roughness and normal
//   maps. A low light grazes from the top of the page and follows the
//   mouse, so the sheen moves. The book itself stays still.
// - Each illustration is layered; upper layers slide while their page
//   turns.
// - Dragging is the only control: drag left to open and turn forward, right
//   to turn back. On the first spread, the cover follows a drag to the
//   right, and a short pull or flick closes the book (and the dialog). From
//   later spreads a swipe back only turns pages, stopping on the first, so
//   the close button or the cover are the only ways to close. Hovering an
//   open page lifts its outer edge
//   towards the hand, and pressing lifts it further.
// - Nothing runs at rest: frames are drawn only while something moves.
//
// On top of that, for a light page: a soft contact shadow under the book
// (a pre-blurred texture that widens as the book opens) and a
// shadow-casting light, so a turning page shades the pages below it.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { COVER_OVERHANG, drawContactShadow, drawPaperMaps, PAGE_ASPECT } from './textures';

const W = 1; // page width
const D = PAGE_ASPECT; // page depth, along the spine
const PAGE_T = 0.005;
const COVER_T = 0.012;
const RADIUS = 0.07;
// Hard covers overhang the pages by this much on the three outer sides, so
// an open book shows a rim of cover around each page block.
const OVERHANG = COVER_OVERHANG;
const WC = W + OVERHANG; // cover board width
const DC = D + 2 * OVERHANG; // cover board depth
const PAPER_LIFT = 1.06; // inside pages, back towards their true colour; much more and the lit middle of a page clips to white
const LEATHER_TILES = 1.7; // the leather scan repeats this often across a cover, as in textures.js
const COVER_RADIUS = RADIUS * (WC / W);
// A long lens from far away: the book looks flat and top-down, and a page
// standing up mid-turn grows only a little, so it stays inside the canvas.
const FOV = 12;
const LAYER_DEPTH = [0, 0.5, 1.6]; // how far each art layer slides while turning
const PAGE_LIFT = 0.46; // radians an open page lifts at its outer edge
const PRESS_LIFT = 1.2; // how much further it lifts while pressed
// The pages under a lifted one follow it, each a little less, so their edges
// fan out. From straight above a page only shows its edge once it is well
// lifted, which is why these stay close together.
const PAGE_FAN = [1, 0.86, 0.7, 0.52];
const BEND_SPEED = 0.9; // radians a page's edge trails, per page per second
const BEND_SAG = 0.3; // radians it sags under its weight when half raised
const BEND_MAX = 1.2; // the most a page ever curves
const HOVER_GROW = 0.18; // how much bigger the closed book is than my photo
const HOVER_SPRING = 11;
const HOVER_OUT_SPRING = 24; // quicker on the way back to my photo
const MORPH_SPRING = 9; // how quickly the book becomes the dialog
const REVEAL_TIME = 0.2; // seconds the page behind takes to dim
const DIALOG_PAGE_MAX = 400; // the widest a page gets in the dialog, in pixels
const CLOSE_PULL = 0.88; // letting go of the cover below this closes the book
const CLOSE_NUDGE = 0.97; // below this, a light flick is enough
const CLOSE_NUDGE_SPEED = -0.6; // pages per second, rightwards
const TURN_SPRING = 10; // how quickly a page settles (higher is quicker)
const DRAG_SPRING = 28; // how closely a dragged page follows the hand
const MAX_TURN_SPEED = 3; // pages per second, when jumping several pages
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (lo, hi, v) => {
  const t = clamp((v - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
// Eases towards a value at the same pace at any frame rate.
const approach = (value, to, rate, dt) => {
  const next = value + (to - value) * (1 - Math.exp(-rate * dt));
  return Math.abs(to - next) < 0.0005 ? to : next;
};

// A board w x d: rounded on the outer (x = w) corners, square at the spine.
// Material slots: 0 back face (y = 0), 1 front face (y = t), 2 edges.
function boardGeometry(t, w = W, d = D, r = RADIUS) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -d / 2);
  shape.lineTo(w - r, -d / 2);
  shape.quadraticCurveTo(w, -d / 2, w, -d / 2 + r);
  shape.lineTo(w, d / 2 - r);
  shape.quadraticCurveTo(w, d / 2, w - r, d / 2);
  shape.lineTo(0, d / 2);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 10 });
  geometry.rotateX(-Math.PI / 2); // extrude upwards; the shape's y becomes -z

  const [caps, sides] = geometry.groups;
  const half = caps.count / 2; // bottom lid first, then top lid
  geometry.clearGroups();
  geometry.addGroup(caps.start, half, 0);
  geometry.addGroup(caps.start + half, half, 1);
  geometry.addGroup(sides.start, sides.count, 2);

  // Page UVs: u runs from the spine (0) out to the page edge (1); v from the
  // bottom of the art (near the reader) to the top. On a cover board the
  // overhang falls outside 0..1, which is how the shader finds the rim.
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W, (D / 2 - pos.getZ(i)) / D);
  uv.needsUpdate = true;
  return geometry;
}

// A page that can bend: the same outline as boardGeometry, cut into columns
// across its width. `bend(angle)` curls it along that width, by `angle`
// radians at the outer edge, without stretching it, so the art stays put.
function bendablePage(t) {
  const r = RADIUS;
  const columns = [];
  const plain = 18;
  for (let i = 0; i < plain; i++) columns.push(((W - r) * i) / plain);
  // Closer together around the corner, which follows the board's curve.
  const curve = 10;
  for (let i = 0; i <= curve; i++) columns.push(W - r * (1 - i / curve) ** 2);
  const halfDepth = (x) => {
    if (x <= W - r) return D / 2;
    const along = 1 - Math.sqrt((W - x) / r);
    return D / 2 - r * along * along;
  };

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const column = []; // which column each vertex belongs to
  const vertex = (c, y, z, nx, ny, nz) => {
    const x = columns[c];
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    uvs.push(x / W, (D / 2 - z) / D);
    column.push(c);
    return column.length - 1;
  };
  const geometry = new THREE.BufferGeometry();

  // The two faces: 0 the back (y = 0), 1 the front (y = t).
  [
    [0, -1],
    [t, 1],
  ].forEach(([y, ny], slot) => {
    const start = indices.length;
    const pairs = columns.map((x, c) => [vertex(c, y, -halfDepth(x), 0, ny, 0), vertex(c, y, halfDepth(x), 0, ny, 0)]);
    for (let c = 0; c < columns.length - 1; c++) {
      const [a, b] = pairs[c];
      const [d, e] = pairs[c + 1];
      if (ny > 0) indices.push(a, b, e, a, e, d);
      else indices.push(a, e, b, a, d, e);
    }
    geometry.addGroup(start, indices.length - start, slot);
  });

  // The edge, all the way round: along one long side, across the outer edge,
  // back along the other side and across the spine.
  const last = columns.length - 1;
  const outline = [];
  for (let c = 0; c <= last; c++) outline.push([c, -halfDepth(columns[c])]);
  for (let c = last; c >= 0; c--) outline.push([c, halfDepth(columns[c])]);
  const start = indices.length;
  outline.forEach(([c0, z0], i) => {
    const [c1, z1] = outline[(i + 1) % outline.length];
    const dx = columns[c1] - columns[c0];
    const dz = z1 - z0;
    const length = Math.hypot(dx, dz) || 1;
    const [nx, nz] = [dz / length, -dx / length]; // outwards, for this direction
    const a = vertex(c0, 0, z0, nx, 0, nz);
    const b = vertex(c0, t, z0, nx, 0, nz);
    const d = vertex(c1, t, z1, nx, 0, nz);
    const e = vertex(c1, 0, z1, nx, 0, nz);
    indices.push(a, d, b, a, e, d);
  });
  geometry.addGroup(start, indices.length - start, 2);

  geometry.setIndex(indices);
  const positionAttribute = new THREE.Float32BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  const normalAttribute = new THREE.Float32BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  // Each column's place along the curve, and the way it faces.
  const curveX = new Float32Array(columns.length);
  const curveY = new Float32Array(columns.length);
  const curveAngle = new Float32Array(columns.length);
  let current = 0;
  geometry.bend = (angle) => {
    if (angle === current) return;
    current = angle;
    // The spine stays stiff; most of the curve is towards the outer edge.
    const angleAt = (x) => angle * (x / W) ** 1.5;
    for (let c = 1; c < columns.length; c++) {
      const step = columns[c] - columns[c - 1];
      const middle = angleAt(columns[c] - step / 2);
      curveX[c] = curveX[c - 1] + step * Math.cos(middle);
      curveY[c] = curveY[c - 1] + step * Math.sin(middle);
      curveAngle[c] = angleAt(columns[c]);
    }
    for (let i = 0; i < column.length; i++) {
      const c = column[i];
      const cos = Math.cos(curveAngle[c]);
      const sin = Math.sin(curveAngle[c]);
      const y = positions[i * 3 + 1];
      positionAttribute.setXY(i, curveX[c] - y * sin, curveY[c] + y * cos);
      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      normalAttribute.setXY(i, nx * cos - ny * sin, nx * sin + ny * cos);
    }
    positionAttribute.needsUpdate = true;
    normalAttribute.needsUpdate = true;
  };
  return geometry;
}

// Splices code into one of three.js's own shaders at `find`. Each find is
// text from three's shader chunks, so if an update to three changes it, the
// splice would silently do nothing: say so instead. (three is pinned to an
// exact version in package.json for the same reason.)
function patch(source, find, replacement) {
  if (!source.includes(find)) console.error(`Book shader: "${find}" was not found, so that change is missing. Has three.js changed?`);
  return source.replace(find, replacement);
}

// A lifted page keeps the top sheet's outline, inset from the page block
// by the pile's band (`cut`: fore edge, head and tail; zero when flat).
// Positive outside that outline, where a lifted page is cut away: its face,
// its edges and its shadow alike.
const CUT_GLSL = `
float cutAway(vec2 uv, vec2 cut) {
  if (cut.x < 1e-4) return -1.0;
  float r = ${RADIUS.toFixed(5)};
  vec2 pw = vec2(uv.x * ${W.toFixed(5)}, (uv.y - 0.5) * ${D.toFixed(5)});
  float ends = cut.y * smoothstep(0.02, 0.2, pw.x);
  vec2 q = vec2(pw.x - (${W.toFixed(5)} - cut.x - r), abs(pw.y) - (${(D / 2).toFixed(5)} - ends - r));
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
`;

export function createBookScene({ canvas, anchor, backdrop, pages, reduceMotion = false, onSpread, onLayout, onReveal, onRequestClose }) {
  // Treat colours as the reference does: textures straight to screen, no
  // colour-space conversion, so pages print exactly as drawn.
  THREE.ColorManagement.enabled = false;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // redrawn only when a leaf moves

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 20);
  camera.up.set(0, 0, -1);

  // Lights, after the reference's rig (its intensities x PI for three's
  // current light units), with some ambient handed to the shadow light.
  scene.add(new THREE.AmbientLight(0xffffff, 1.65));
  const graze = new THREE.DirectionalLight(0xffffff, 0.88); // low, from the top of the page
  graze.position.set(0, 0.56, -5);
  scene.add(graze, graze.target);
  const front = new THREE.SpotLight(0xffffff, 0.38, 0, Math.PI / 3, 0, 0); // from the viewer
  front.position.set(0, 25, 0);
  scene.add(front, front.target);
  const sun = new THREE.DirectionalLight(0xfff6ec, 0.72); // casts the shadows
  sun.position.set(-2.4, 4.2, -1.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.003;
  Object.assign(sun.shadow.camera, { left: -1.9, right: 1.9, top: 1.5, bottom: -1.5, near: 1, far: 10 });
  scene.add(sun, sun.target);

  const disposables = [];
  const track = (thing) => {
    disposables.push(thing);
    return thing;
  };
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  // A soft room to reflect, for the leather's sheen and the gold foil. Only
  // the front cover uses it.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = track(pmrem.fromScene(room, 0.04).texture);
  room.dispose?.();
  pmrem.dispose();

  // Everything that travels together: the book and the shadow under it.
  const stage = new THREE.Group();
  scene.add(stage);

  const contact = drawContactShadow();
  const contactShadow = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1, 1)),
    track(
      new THREE.MeshBasicMaterial({
        map: track(new THREE.CanvasTexture(contact.canvas)),
        transparent: true,
        depthWrite: false,
        color: 0x2b1d10,
      })
    )
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.0005;
  contactShadow.renderOrder = -1;
  stage.add(contactShadow);

  // Paper surface, shared by every page.
  const paper = drawPaperMaps();
  const surface = (source) => {
    const texture = track(new THREE.CanvasTexture(source));
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.anisotropy = anisotropy;
    return texture;
  };
  const roughMap = surface(paper.rough);
  const normalMap = surface(paper.normal);
  // The covers are bookcloth: matte, with a finer, deeper weave.
  const clothNormal = surface(paper.normal);
  clothNormal.repeat.set(9, 9);
  // The leather scan's normal map, for the leather turned in round the endpapers.
  let leatherNormal = null;
  if (pages[0].leatherNormal) {
    leatherNormal = track(new THREE.Texture(pages[0].leatherNormal));
    leatherNormal.wrapS = leatherNormal.wrapT = THREE.RepeatWrapping;
    leatherNormal.anisotropy = anisotropy;
    leatherNormal.needsUpdate = true;
  }

  // Shared uniforms: the crease shade near the spine, and one parallax
  // offset per illustration.
  const crease = { value: 0 };
  // How much of the page block lies on each side, 0 to 1: it sets how thick
  // each pile looks (the band of page edges, its shadow on the cover rim,
  // and how deep the gutter runs).
  const pileL = { value: 0 };
  const pileR = { value: 1 };
  const offsets = new Map(); // layers array -> { value: Vector2 }

  const baseTextures = new Map();
  const canvasTexture = (source) => {
    let texture = baseTextures.get(source);
    if (!texture) {
      texture = track(new THREE.CanvasTexture(source));
      texture.anisotropy = anisotropy;
      texture.premultiplyAlpha = true;
      baseTextures.set(source, texture);
    }
    return texture;
  };

  // `board` is set for the two cover boards: { cloth, mirror } where cloth is
  // the cover's own texture, shown on the rim around the inside pages.
  // `rest.x` is how far in the top sheet's outline sits (1 on a pile, easing
  // to 0 as the leaf stands up); `rest.y` is 1 only while it lies flat.
  function pageMaterial(page, onBack, board = null, rest = { value: new THREE.Vector2(1, 1) }, cut = { value: new THREE.Vector2() }) {
    // The base layer carries this face's slice of the art: front faces run
    // from the spine outwards to the right; back faces end up mirrored on
    // the left, so their u runs right to left.
    const map = track(canvasTexture(page.layers[0]).clone());
    map.needsUpdate = true;
    if (page.part === 'whole') {
      // A cover face spans the whole board, overhang included.
      map.repeat.set(((onBack ? -1 : 1) * W) / WC, D / DC);
      map.offset.set(onBack ? 1 : 0, OVERHANG / DC);
    } else {
      map.repeat.set(onBack ? -0.5 : 0.5, 1);
      map.offset.set(0.5, 0);
    }
    const cloth = board && page.part === 'whole';
    // The front cover brings its own maps, laid over the board like its art.
    const coverMap = (source) => {
      const texture = track(new THREE.CanvasTexture(source));
      texture.anisotropy = anisotropy;
      texture.repeat.copy(map.repeat);
      texture.offset.copy(map.offset);
      return texture;
    };
    const leather = cloth && page.normal;
    const material = track(
      new THREE.MeshStandardMaterial(
        leather
          ? {
              map,
              roughness: 0.52,
              metalness: 1, // scaled by the foil map: only the foil is metal
              roughnessMap: roughMap,
              metalnessMap: coverMap(page.foil),
              normalMap: coverMap(page.normal),
              envMap: environment,
              envMapIntensity: 0.75,
            }
          : cloth
          ? {
              map,
              roughness: 0.9,
              metalness: 0,
              roughnessMap: roughMap,
              normalMap: clothNormal,
              normalScale: new THREE.Vector2(0.75, 0.75),
            }
          : {
              map,
              roughness: 0.45,
              metalness: 0.07,
              roughnessMap: roughMap,
              metalnessMap: roughMap,
              normalMap,
              normalScale: new THREE.Vector2(0.1, 0.1), // a smooth stock: the grain is barely felt
            }
      )
    );
    const layers = page.layers.slice(1).map(canvasTexture);
    if (!offsets.has(page.layers)) offsets.set(page.layers, { value: new THREE.Vector2() });
    const offset = offsets.get(page.layers);
    const spine = page.part !== 'whole';
    const insidePage = board && spine; // a page printed on a cover board, with a rim around it
    const f = (n) => n.toFixed(5);
    const boardCode = board
      ? `{
            vec2 pu = vPageUv;
            float cu = pu.x * ${f(W / WC)};
            if (uMirror > 0.5) cu = 1.0 - cu;
            vec2 clothUv = vec2(cu, pu.y * ${f(D / DC)} + ${f(OVERHANG / DC)});
            ${
              insidePage
                ? `// Outside the endpaper, show the cover leather turned in.
            if (pu.x > 1.0 || pu.y < 0.0 || pu.y > 1.0 || art.a < 0.5) {
              turnIn = 1.0;
              vec4 cloth = texture2D(uCloth, clothUv);
              art = vec4(cloth.rgb / max(cloth.a, 0.0001), 1.0);
              // The turn-in faces the room, so it reads lighter than the
              // outside of the cover, which lies in its own shade.
              art.rgb *= 1.7;

              // Board coordinates in world units: x from the spine, y from
              // the bottom edge of the board.
              vec2 bp = vec2(pu.x * ${f(W)}, (pu.y + ${f(OVERHANG / D)}) * ${f(D)});
              float toOuter = ${f(WC)} - bp.x;
              float toEnd = min(bp.y, ${f(DC)} - bp.y);
              leatherUv = bp * ${f(LEATHER_TILES / WC)};

              // Soft scuffs across the cloth.
              float blot = (texture2D(roughnessMap, vRoughnessMapUv * 0.35).g - 0.75) / 0.25;
              art.rgb *= 0.93 + 0.14 * smoothstep(0.55, 0.95, blot);

              // Fine wrinkles running along each edge of the turn-in.
              float alongX = texture2D(roughnessMap, vec2(bp.x * 1.3, bp.y * 26.0)).g;
              float alongY = texture2D(roughnessMap, vec2(bp.x * 26.0, bp.y * 1.3)).g;
              // (The map's green runs 0.75 to 1; spread it to 0..1.)
              float wrinkle = ((toEnd < toOuter ? alongX : alongY) - 0.75) / 0.25;
              art.rgb *= 1.0 + 0.16 * smoothstep(0.75, 0.95, wrinkle) - 0.14 * (1.0 - smoothstep(0.05, 0.2, wrinkle));

              // Mitre folds: where the cloth folds over each outer corner it
              // leaves a diagonal crease, light on one side and dark on the other.
              float mitre = toOuter - toEnd;
              float nearCorner = 1.0 - smoothstep(${f(OVERHANG * 0.9)}, ${f(OVERHANG * 1.6)}, min(toOuter, toEnd));
              art.rgb *= 1.0 - 0.32 * exp(-pow(mitre / 0.0028, 2.0)) * nearCorner;
              art.rgb *= 1.0 + 0.18 * exp(-pow((mitre - 0.0045) / 0.0025, 2.0)) * nearCorner;

              // The board's rounded outer edge catches the light.
              float rim = min(toOuter, toEnd);
              art.rgb *= 1.0 + 0.55 * exp(-pow((rim - 0.004) / 0.0035, 2.0));
              art.rgb *= 1.0 - 0.25 * exp(-pow(rim / 0.0012, 2.0));

              // No shadow along the endpaper's edge: it is pasted down flush,
              // part of the cover, not a sheet lying on it.

              // The pages stacked on this board cast a soft shadow on the
              // rim around them, more for a taller pile. The rim itself stays
              // the same width on both sides: the page edges show inside the
              // block (see the pages' own shader), not on the cover.
              float pile = ${page.part === 'left' ? 'uPileL' : 'uPileR'};
              vec2 pw = vec2(pu.x * ${f(W)}, (pu.y - 0.5) * ${f(D)});
              vec2 q = vec2(pw.x - ${f(W - RADIUS)}, abs(pw.y) - ${f(D / 2 - RADIUS)});
              float outside = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - ${f(RADIUS)};
              if (outside > 0.0) art.rgb *= 1.0 - 0.3 * pile * exp(-outside / (0.003 + 0.008 * pile));
            } else {
              // The pasted-down paper takes on the board under it: the cover's
              // broad unevenness comes through as a soft mottle.
              float mottle = (texture2D(roughnessMap, vRoughnessMapUv * 0.35).g - 0.75) / 0.25;
              art.rgb *= 0.985 + 0.03 * smoothstep(0.55, 0.95, mottle);
            }
            // The pile on the other side of the spine stands above this board
            // and shades it near the joint, paper and rim alike, so the two
            // sides meet in a soft valley rather than a step.
            {
              float across = ${page.part === 'left' ? 'uPileR' : 'uPileL'};
              art.rgb *= 1.0 - 0.2 * across * exp(-pu.x * ${f(W)} / 0.035);
            }`
                : ''
            }
            // Worn edges and corners: pale specks along the board's outer
            // edges and a soft fold line just inside them.
            float edgeDist = min((${f(WC / W)} - pu.x) * ${f(W)}, min((pu.y + ${f(OVERHANG / D)}) * ${f(D)}, (${f(1 + OVERHANG / D)} - pu.y) * ${f(D)}));
            vec2 fromEdge = vec2((${f(WC / W)} - pu.x) * ${f(W)}, min(pu.y + ${f(OVERHANG / D)}, ${f(1 + OVERHANG / D)} - pu.y) * ${f(D)});
            // Corners wear most: the outer ones, and (outside only) the ends
            // of the spine.
            float toEnds = min(pu.y + ${f(OVERHANG / D)}, ${f(1 + OVERHANG / D)} - pu.y) * ${f(D)};
            float corner = max(
              1.0 - smoothstep(0.0, 0.14, length(fromEdge)),
              ${cloth ? '1.0' : '0.0'} * (1.0 - smoothstep(0.0, 0.1, length(vec2(pu.x * ${f(W)}, toEnds))))
            );
            ${cloth ? `edgeDist = min(edgeDist, mix(1.0, length(vec2(pu.x * ${f(W)}, toEnds)), step(pu.x * ${f(W)}, 0.06)));` : ''}
            float grain = (texture2D(roughnessMap, vRoughnessMapUv * 2.7).g - 0.75) / 0.25;
            float wear = (1.0 - smoothstep(0.0, 0.02 + 0.02 * corner, edgeDist))
              * smoothstep(0.42 - 0.35 * corner, 0.8 - 0.35 * corner, grain);
            // Leather wears paler at the edges, towards its undyed grain.
            art.rgb = mix(art.rgb, min(art.rgb * 1.8 + 0.05, 1.0), wear * (0.5 + 0.3 * corner));
            art.rgb *= 1.0 - 0.18 * exp(-pow((edgeDist - 0.011) / 0.0035, 2.0));
            ${
              cloth
                ? `// The hinge: a groove pressed in beside the spine, a lit ridge
            // next to it, and the cloth turning away into the spine.
            float sx = pu.x * ${f(W)};
            art.rgb *= 1.0 - 0.34 * exp(-pow((sx - 0.034) / 0.0045, 2.0));
            art.rgb *= 1.0 + 0.16 * exp(-pow((sx - 0.045) / 0.0035, 2.0));
            art.rgb *= 0.82 + 0.18 * smoothstep(0.0, 0.026, sx);`
                : ''
            }
          }`
      : '';

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uCrease = crease;
      shader.uniforms.uPileL = pileL;
      shader.uniforms.uPileR = pileR;
      shader.uniforms.uRest = rest;
      shader.uniforms.uCut = cut;
      shader.uniforms.uOffset = offset;
      if (board) {
        shader.uniforms.uCloth = { value: board.cloth };
        shader.uniforms.uMirror = { value: board.mirror ? 1 : 0 };
        shader.uniforms.uLeatherN = { value: leatherNormal };
      }
      layers.forEach((texture, i) => {
        shader.uniforms[`uLayer${i}`] = { value: texture };
      });
      const vertex = patch(shader.vertexShader, '#include <common>', '#include <common>\nvarying vec2 vPageUv;');
      shader.vertexShader = patch(vertex, '#include <uv_vertex>', '#include <uv_vertex>\nvPageUv = uv;');
      let fragment = shader.fragmentShader;
      const samplers = layers.map((_, i) => `uniform sampler2D uLayer${i};`).join('\n');
      const mixes = layers
        .map(
          (_, i) => `{
            vec4 l = texture2D(uLayer${i}, vMapUv + uOffset * ${LAYER_DEPTH[i + 1].toFixed(2)});
            art.rgb = mix(art.rgb, l.rgb / max(l.a, 0.0001), l.a);
          }`
        )
        .join('\n');
      if (leather) {
        // Foil is smooth metal; pressed leather is burnished a little
        // smoother than the grain around it.
        fragment = patch(
          fragment,
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>
          roughnessFactor = mix(roughnessFactor * (1.0 - 0.3 * texelMetalness.g), 0.42, texelMetalness.b);`
        );
        // Flat ambient light ignores the grain; let the room's light,
        // which follows the surface, do more of the work here.
        fragment = patch(
          fragment,
          '#include <lights_fragment_begin>',
          patch(
            THREE.ShaderChunk.lights_fragment_begin,
            'getAmbientLightIrradiance( ambientLightColor )',
            'getAmbientLightIrradiance( ambientLightColor ) * 0.35'
          )
        );
      }
      if (!cloth) {
        // Paper is a smooth stock: its sheen barely varies from fleck to fleck.
        fragment = patch(
          fragment,
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>
          roughnessFactor = mix(roughness, roughnessFactor, 0.2);
          metalnessFactor *= 0.2;`
        );
      }
      if (insidePage) {
        // The turn-in is the cover leather, with its grain and sheen; the
        // endpaper is left as every other page.
        fragment = patch(
          fragment,
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>
          if (turnIn > 0.5) {
            metalnessFactor = 0.0;
            roughnessFactor = 0.4;
          }`
        );
        fragment = patch(
          fragment,
          '#include <normal_fragment_maps>',
          patch(
            THREE.ShaderChunk.normal_fragment_maps,
            'mapN.xy *= normalScale;',
            `mapN.xy *= normalScale;
          if (turnIn > 0.5) {
            ${leatherNormal ? 'mapN = texture2D(uLeatherN, leatherUv).xyz * 2.0 - 1.0; mapN.xy *= 0.8;' : 'mapN.xy *= 2.0;'}
          }`
          )
        );
      }
      fragment = patch(
          fragment,
          '#include <common>',
          `#include <common>\nvarying vec2 vPageUv;\nuniform float uCrease;\nuniform float uPileL;\nuniform float uPileR;\nuniform vec2 uRest;\nuniform vec2 uCut;\n${CUT_GLSL}\nuniform vec2 uOffset;\nuniform sampler2D uCloth;\nuniform float uMirror;\nuniform sampler2D uLeatherN;\n${samplers}`
        );
      fragment = patch(
          fragment,
          '#include <map_fragment>',
          `float turnIn = 0.0;
          vec2 leatherUv = vec2(0.0);
          #ifdef USE_MAP
            vec4 art = texture2D(map, vMapUv);
            art.rgb /= max(art.a, 0.0001);
            ${mixes}
            ${boardCode}
            diffuseColor *= art;
          #endif
          ${
            spine
              ? `${
                board
                  ? '' // The pages printed on the cover boards lie flat: no gutter, no fold.
                  : `// The gutter: the page curves down into the spine, into its own
          // shade. Its width stays put while pages turn (a band that grew and
          // shrank read as the page sliding), and it deepens only a little.
          // A thick pile curves down into the spine more steeply, so its
          // gutter runs wider and deeper; a thin one lies almost flat.
          float pile = ${page.part === 'left' ? 'uPileL' : 'uPileR'};
          float gutter = 1.0 - smoothstep(0.0, 0.08 + 0.08 * pile, vPageUv.x);
          diffuseColor.rgb *= 1.0 - (0.07 + 0.18 * pile + 0.06 * uCrease) * gutter * gutter;
          // The pile's top sheets curl in a little at their outer edges, so
          // from above the edges of the sheets below show as a band just
          // inside the page block: wide at the fore edge, thin at head and
          // tail, each sheet a hair further out and deeper in shade. A lifted
          // page keeps the same outline (so hovering doesn't change its
          // size), but the band is cut away from it: it is one sheet, and the
          // pile's edges show on the page below instead.
          if (cutAway(vPageUv, uCut) > 0.0) discard;
          {
            // The top sheet is its own rounded rectangle, set in from the page
            // block by the band on each side, so the band narrows smoothly
            // round the corners instead of stepping.
            float bandFore = pile * uRest.x * uRest.y * 0.022;
            float r = ${f(RADIUS)};
            vec2 pw = vec2(vPageUv.x * ${f(W)}, (vPageUv.y - 0.5) * ${f(D)});
            // At the spine the sheets are bound together, so no edges show
            // there: the head and tail bands taper away towards it.
            float bandEnds = pile * uRest.x * uRest.y * 0.007 * smoothstep(0.02, 0.2, pw.x);
            vec2 q = vec2(pw.x - (${f(W)} - bandFore - r), abs(pw.y) - (${f(D / 2)} - bandEnds - r));
            float below = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; // out from the top sheet's edge
            if (below > 0.0 && bandFore > 1e-4) {
              vec2 out2 = max(q, 0.0);
              float toFore = clamp(out2.x / (out2.x + out2.y + 1e-6), 0.0, 1.0);
              float depth = clamp(below / max(mix(bandEnds, bandFore, toFore), 1e-4), 0.0, 1.0);
              vec3 edges = vec3(0.95, 0.93, 0.885);
              edges *= 1.0 - 0.1 * (1.0 - smoothstep(0.0, 0.35, fract(below / 0.0016)));
              edges *= mix(0.97, 0.76, depth);
              // The top sheet's edge throws a hairline shadow onto the ones below.
              edges *= 1.0 - 0.25 * exp(-below / 0.0012);
              diffuseColor.rgb = edges;
            }
          }
          // The fold itself: a thin dark line where the two pages meet, and
          // a faint highlight where the paper rises out of it. Without it a
          // plain sky at the spine shows only the soft shade, no crease.
          float fold = 1.0 - smoothstep(0.0, 0.002, vPageUv.x);
          float ridge = smoothstep(0.002, 0.01, vPageUv.x) * (1.0 - smoothstep(0.01, 0.03, vPageUv.x));
          diffuseColor.rgb *= (1.0 - 0.1 * fold) * (1.0 + 0.03 * ridge);`
              }
          // The room light: brighter towards the top left where it comes
          // from, falling off to the bottom right and the outer corners.
          // The lift brings paper back towards its own colour.
          vec2 spread = vec2(${page.part === 'left' ? '-1.0' : '1.0'} * vPageUv.x, vPageUv.y - 0.5);
          // (Only ever darkens: the lit side is already at full strength.)
          float slope = max(0.0, 0.5 * spread.x - spread.y + 0.5);
          float corners = smoothstep(0.6, 1.25, length(spread * vec2(1.0, 1.5)));
          diffuseColor.rgb *= ${f(PAPER_LIFT)} * (1.0 - 0.06 * slope) * (1.0 - 0.1 * corners);`
              : ''
          }`
        );
      shader.fragmentShader = fragment;
    };
    material.customProgramCacheKey = () =>
      `page-${page.part}-${layers.length}-${spine}-${board ? 'board' : ''}-${cloth ? 'cloth' : ''}-${leather ? 'leather' : ''}`;
    return material;
  }

  // Leaves
  const leafCount = pages.length / 2;
  const lastSpread = leafCount - 1; // the last leaf is the back board; it never turns
  const thickness = (k) => (k === 0 || k === leafCount - 1 ? COVER_T : PAGE_T);
  const book = new THREE.Group();
  stage.add(book);

  const leaves = [];
  for (let k = 0; k < leafCount; k++) {
    const t = thickness(k);
    const isCover = k === 0 || k === leafCount - 1;
    const edge = track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(isCover ? '#183222' : pages[2 * k].edge).multiplyScalar(isCover ? 1 : 0.93),
        roughness: isCover ? 0.95 : 0.7,
        metalness: isCover ? 0 : 0.05,
        roughnessMap: isCover ? roughMap : null,
        normalMap: isCover ? clothNormal : null,
        normalScale: new THREE.Vector2(0.9, 0.9),
      })
    );
    const cut = { value: new THREE.Vector2() };
    let depthMaterial = null;
    if (!isCover) {
      // The page block's edges at the spine sit deep in the gutter: in shade,
      // so a turning cover uncovers a dark fold, not a lit white strip. The
      // top and bottom edges darken towards the spine the same way.
      // A lifted page's edges are cut away with its face (see CUT_GLSL).
      edge.onBeforeCompile = (shader) => {
        shader.uniforms.uCut = cut;
        const vertex = patch(shader.vertexShader, '#include <common>', '#include <common>\nvarying float vSpineX;\nvarying vec2 vCutUv;');
        shader.vertexShader = patch(vertex, '#include <begin_vertex>', '#include <begin_vertex>\nvSpineX = position.x;\nvCutUv = uv;');
        const fragment = patch(
          shader.fragmentShader,
          '#include <common>',
          `#include <common>\nvarying float vSpineX;\nvarying vec2 vCutUv;\nuniform vec2 uCut;\n${CUT_GLSL}`
        );
        shader.fragmentShader = patch(
          fragment,
          '#include <color_fragment>',
          '#include <color_fragment>\nif (cutAway(vCutUv, uCut) > 1e-4) discard;\ndiffuseColor.rgb *= mix(0.22, 1.0, smoothstep(0.0, 0.06, vSpineX));'
        );
      };
      // Its shadow too: the shadow pass draws the leaf with this instead.
      depthMaterial = track(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
      depthMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.uCut = cut;
        const vertex = patch(shader.vertexShader, '#include <common>', '#include <common>\nvarying vec2 vCutUv;');
        shader.vertexShader = patch(vertex, '#include <begin_vertex>', '#include <begin_vertex>\nvCutUv = uv;');
        const fragment = patch(shader.fragmentShader, '#include <common>', `#include <common>\nvarying vec2 vCutUv;\nuniform vec2 uCut;\n${CUT_GLSL}`);
        shader.fragmentShader = patch(fragment, 'void main() {', 'void main() {\nif (cutAway(vCutUv, uCut) > 1e-4) discard;');
      };
      edge.customProgramCacheKey = () => 'page-edge';
    }
    // Covers are bigger boards; their rim shows the cover's own texture.
    const board = isCover
      ? // Both turn-ins show the plain back cover leather (the front has the
        // pressed frame near its edges), mirrored so its outer edge is outermost.
        { cloth: canvasTexture(pages[pages.length - 1].layers[0]), mirror: true }
      : null;
    const geometry = isCover ? boardGeometry(t, WC, DC, COVER_RADIUS) : bendablePage(t);
    const rest = { value: new THREE.Vector2(1, 1) };
    const mesh = new THREE.Mesh(track(geometry), [
      pageMaterial(pages[2 * k + 1], true, board, rest, cut),
      pageMaterial(pages[2 * k], false, board, rest, cut),
      edge,
    ]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (depthMaterial) mesh.customDepthMaterial = depthMaterial;
    mesh.frustumCulled = false; // a bent page leaves its flat bounds
    const pivot = new THREE.Group();
    pivot.add(mesh);
    book.add(pivot);
    leaves.push({ pivot, mesh, t, theta: 0, flex: 0, geometry, rest, cut });
  }

  // The first page has two faces: the page itself, and my hero photo, which
  // is what the cover closes over beside my photo. They swap only while the
  // cover is shut, so the first page is seen only inside the dialog.
  const firstPage = leaves[1]?.mesh.material[1];
  let heroFace = null;
  if (firstPage && pages[2].hero) {
    const hero = track(new THREE.CanvasTexture(pages[2].hero));
    hero.anisotropy = anisotropy;
    hero.premultiplyAlpha = true;
    hero.repeat.copy(firstPage.map.repeat);
    hero.offset.copy(firstPage.map.offset);
    heroFace = { page: firstPage.map, hero, showing: 'hero' };
    firstPage.map = hero;
  }
  function swapFirstPage() {
    if (!heroFace) return;
    const inside = morph.to === 1 && !closing;
    const shut = leaves[0].theta < 0.15;
    // (If the cover never quite shuts on the way in, the page still arrives
    // before it is far open.)
    const want = inside ? (shut || progress > 0.3 ? 'page' : heroFace.showing) : shut ? 'hero' : heroFace.showing;
    if (want === heroFace.showing) return;
    heroFace.showing = want;
    firstPage.map = heroFace[want];
    renderer.shadowMap.needsUpdate = true;
  }

  // Spreads 1..N each use one layers array; find it for the parallax.
  const spreadLayers = [];
  for (let s = 1; s < leafCount; s++) spreadLayers[s] = pages[2 * s].layers;

  // State
  const startSpread = 0;
  let progress = startSpread; // the reading timeline: 0 closed, s = spread s open
  let velocity = 0; // of progress, in pages per second
  let target = startSpread; // the spread being turned to
  let goal = startSpread; // eases to the target, so a turn starts softly
  let drag = null;
  let pointer = null; // the mouse, while it is over the frame
  let hoverDirty = false;
  let hit = null; // where the mouse meets the book
  let eventTarget = null; // the dialog's book area, while it is open
  const hover = { x: 0, v: 0, to: 0 }; // 0 my photo, 1 the closed book
  const morph = { x: 0, v: 0, goal: 0, to: 0 }; // 0 by my photo, 1 the dialog
  let reveal = 0; // the dimmed page behind the book, 0 gone and 1 shown
  let revealed = false;
  let wantsHover = false;
  let closing = false; // waiting for the page to brighten before leaving
  let closedByHand = false; // the cover shuts where it is, then the book leaves
  let tie = 1; // how much of the opening the timeline follows
  let liftSpread = 1; // the spread whose pages are lifted
  const lift = { left: 0, right: 0 };
  const mouse = { x: 0, y: 0, ex: 0, ey: 0 };
  let view = null; // the window's measurements; see measureView
  let sized = false;
  let frameId = 0;
  let last = performance.now();
  let started = false;
  let disposed = false;
  let dirty = true;
  renderer.shadowMap.needsUpdate = true;

  // Runs the frame loop; it stops itself once everything has settled.
  function wake() {
    if (frameId || !started) return;
    last = performance.now();
    frameId = requestAnimationFrame(tick);
  }

  function goTo(next) {
    next = clamp(Math.round(next), 1, lastSpread);
    if (next === target && !drag) return;
    target = next;
    onSpread?.(next);
    wake();
  }

  // A critically damped spring: it reaches the value without bouncing, and
  // keeps its speed when the value changes under it.
  function springTo(to, stiffness, dt) {
    const offset = progress - to;
    const decay = Math.exp(-stiffness * dt);
    const push = (velocity + stiffness * offset) * dt;
    velocity = (velocity - stiffness * push) * decay;
    progress = to + (offset + push) * decay;
  }

  // The same spring, for any value.
  function springValue(value, to, stiffness, dt) {
    const offset = value.x - to;
    const decay = Math.exp(-stiffness * dt);
    const push = (value.v + stiffness * offset) * dt;
    value.v = (value.v - stiffness * push) * decay;
    value.x = to + (offset + push) * decay;
    if (Math.abs(value.x - to) < 0.0006 && Math.abs(value.v) < 0.01) {
      value.x = to;
      value.v = 0;
    }
  }

  // The hover and the journey to the dialog. The book opens as it travels:
  // while it does, the reading timeline simply follows the journey.
  function moveMorph(dt) {
    // The dimming waits for the book to land, and leaves before it does.
    const showBackground = morph.to === 1 && !closing && morph.x > 0.985;
    if (showBackground !== revealed) {
      revealed = showBackground;
      onReveal?.(revealed);
    }
    const revealStep = reduceMotion ? 1 : dt / REVEAL_TIME;
    reveal = clamp(reveal + (showBackground ? revealStep : -revealStep), 0, 1);
    if (closing && !drag && reveal === 0 && (!closedByHand || progress === 0)) {
      closing = false;
      closedByHand = false;
      tie = progress; // every turned page closes on the way back
      target = 0;
      goal = 0;
      morph.to = 0;
      onSpread?.(0);
    }
    const hoverTo = wantsHover || morph.to > 0 || morph.x > 0 || closing ? 1 : 0;
    if (reduceMotion) {
      hover.x = hoverTo;
      morph.x = morph.goal = morph.to;
      return;
    }
    springValue(hover, hoverTo, hoverTo ? HOVER_SPRING : HOVER_OUT_SPRING, dt);
    morph.goal += (morph.to - morph.goal) * (1 - Math.exp(-7 * dt));
    if (Math.abs(morph.to - morph.goal) < 0.001) morph.goal = morph.to;
    springValue(morph, morph.goal, MORPH_SPRING, dt);
  }

  function moveProgress(dt) {
    const journeying = morph.x !== morph.to || morph.goal !== morph.to;
    if (journeying && !drag && !closing) {
      // From a later spread the pages run back early, so the cover can close
      // while there is still some distance to travel.
      const next = tie * morph.x ** Math.min(2, 1 + 0.25 * Math.max(0, tie - 1));
      velocity = dt > 0 ? clamp((next - progress) / dt, -6, 6) : 0;
      progress = next;
      goal = progress;
      return;
    }
    if (reduceMotion) {
      progress = drag?.moved ? drag.to : target;
      goal = progress;
      velocity = 0;
      return;
    }
    if (drag) {
      springTo(drag.to, DRAG_SPRING, dt);
      if (Math.abs(progress - drag.to) < 0.0005 && Math.abs(velocity) < 0.01) {
        progress = drag.to;
        velocity = 0;
      }
    } else {
      const step = (target - goal) * (1 - Math.exp(-8 * dt));
      goal += clamp(step, -MAX_TURN_SPEED * dt, MAX_TURN_SPEED * dt);
      if (Math.abs(target - goal) < 0.001) goal = target;
      const side = Math.sign(progress - target);
      springTo(goal, TURN_SPRING, dt);
      // A board lands and stops; it never swings past flat.
      const landed = side !== 0 && Math.sign(progress - target) !== side;
      if (landed || (goal === target && Math.abs(progress - target) < 0.0008 && Math.abs(velocity) < 0.01)) {
        progress = target;
        velocity = 0;
      }
    }
    if (progress < 0 || progress > lastSpread) {
      progress = clamp(progress, 0, lastSpread);
      velocity = 0;
    }
  }

  // The page under the mouse lifts, more the nearer it is to the outer edge.
  function moveLifts(dt) {
    const still = !drag?.moved && target > 0 && Math.abs(progress - target) < 0.01;
    if (lift.left === 0 && lift.right === 0 && target > 0) liftSpread = target;
    const amount =
      hit && still && liftSpread === target && !reduceMotion
        ? PAGE_LIFT * smoothstep(0.3, 0.95, Math.abs(hit.x) / W) * (drag ? PRESS_LIFT : 1)
        : 0;
    // On the way down the last few hundredths of a radian are invisible on
    // the page but still darken the soft shadow under it. An easing alone
    // creeps over them, so a settling page also keeps a small minimum speed:
    // it lands in finite time and its shadow fades out with it, not after.
    const settle = (value, to) => {
      const next = approach(value, to, 11, dt);
      return to === 0 ? Math.max(0, next - 0.25 * dt) : next;
    };
    lift.right = settle(lift.right, hit?.x > 0 && target < lastSpread ? amount : 0);
    lift.left = settle(lift.left, hit?.x < 0 ? amount : 0);
  }

  // How far each page wants to curve: its edge trails the way it is turning,
  // and it sags while raised. Easing this gives the page a little follow-through.
  function moveBends(dt) {
    setLeafAngles();
    let moved = false;
    for (let i = 1; i < lastSpread; i++) {
      const leaf = leaves[i];
      const turning = progress > i && progress < i + 1;
      const trail = turning ? clamp(-velocity * BEND_SPEED, -BEND_MAX, BEND_MAX) : 0;
      const sag = -BEND_SAG * Math.sin(2 * leaf.theta);
      const flex = approach(leaf.flex, reduceMotion ? 0 : trail + sag, 12, dt);
      if (flex !== leaf.flex) moved = true;
      leaf.flex = flex;
    }
    return moved;
  }

  // Leaf angles from the timeline, plus whatever the mouse is lifting.
  function setLeafAngles() {
    leaves.forEach((leaf, i) => {
      leaf.theta = Math.PI * clamp(progress - i, 0, 1);
    });
    // Beside my photo the cover stands on its edge, unseen from above, and
    // swings down over the photo as the hover comes in.
    leaves[0].theta = Math.max(leaves[0].theta, (1 - hover.x) * (Math.PI / 2));
    PAGE_FAN.forEach((share, depth) => {
      const right = leaves[liftSpread + depth];
      if (right && liftSpread + depth < lastSpread) right.theta = clamp(right.theta + lift.right * share, 0, Math.PI);
      // The cover lifts only as the top leaf; it never follows a page.
      const k = liftSpread - 1 - depth;
      if (k > 0 || (k === 0 && depth === 0)) leaves[k].theta = clamp(leaves[k].theta - lift.left * share, 0, Math.PI);
    });
  }

  function layout() {
    setLeafAngles();
    swapFirstPage();
    const shown = Math.max(hover.x, morph.x);
    leaves[0].mesh.visible = shown > 0;
    // The back board tucks in behind my photo, then grows to its full size.
    const rim = smoothstep(0.1, 0.7, shown);
    const lastLeaf = leaves[lastSpread];
    lastLeaf.mesh.scale.set(W / WC + (1 - W / WC) * rim, 1, D / DC + (1 - D / DC) * rim);
    // A page can only curve as far as it has room to above the pile below.
    for (let i = 1; i < lastSpread; i++) {
      const leaf = leaves[i];
      const room = 1.5 * Math.sin(leaf.theta);
      leaf.geometry.bend(clamp(leaf.flex, -room, room) || 0);
    }

    // Stack heights: flat leaves rest on those below them on their side.
    // A turning leaf swings about its own spine edge, which rides from the
    // top of the right pile to the top of the left one as it turns, so the
    // leaf stays against the spine all the way over. (Swinging about a point
    // halfway between the piles moved its spine edge sideways, opening a
    // gap at the spine that was widest on the first spreads.)
    leaves.forEach((leaf, i) => {
      let right = 0;
      let left = 0;
      for (let j = i + 1; j < leafCount; j++) if (progress - j <= 0) right += leaves[j].t;
      for (let j = 0; j < i; j++) if (progress - j >= 1) left += leaves[j].t;
      const over = (1 - Math.cos(leaf.theta)) / 2;
      leaf.pivot.position.y = right + (left + leaf.t - right) * over;
      leaf.pivot.rotation.z = leaf.theta;
    });

    // How much of the page block has gone over to the left, counting the
    // turning leaf by how far over it is.
    const paper = leafCount - 2;
    let over = 0;
    for (let j = 1; j <= paper; j++) over += clamp(progress - j, 0, 1);
    pileL.value = over / paper;
    pileR.value = 1 - over / paper;
    // A leaf keeps its pile outline through a hover lift and loses it only
    // as it stands up to turn; it draws the pile's edges only while flat.
    for (const leaf of leaves) {
      const up = Math.sin(leaf.theta);
      const inset = 1 - smoothstep(0.5, 0.95, up);
      const flat = up < 0.003;
      leaf.rest.value.set(inset, flat ? 1 : 0);
      // Lifted, it is cut to the outline of the pile it lifted from.
      const pile = (leaf.theta < Math.PI / 2 ? pileR : pileL).value * inset;
      leaf.cut.value.set(flat ? 0 : 0.022 * pile, flat ? 0 : 0.007 * pile);
    }

    // The fold darkens while any page is in the air.
    crease.value = leaves.reduce((m, leaf, i) => (i === 0 ? m : Math.max(m, Math.sin(leaf.theta))), 0);

    // Art layers slide while their page turns.
    for (let s = 1; s < leafCount; s++) {
      // From the timeline alone, so the mouse lifting a page moves no art.
      const turning = Math.PI * (clamp(progress - s, 0, 1) + clamp(progress - s + 1, 0, 1) - 1);
      // Spreads glimpsed under a lifted page show their art at rest.
      const away = s - liftSpread;
      const lifted = away > 0 ? lift.right : lift.left;
      const glimpsed = away !== 0 && Math.abs(away) < PAGE_FAN.length ? smoothstep(0, 0.08, lifted) : 0;
      offsets
        .get(spreadLayers[s])
        ?.value.set(0.1 * turning * (1 - glimpsed), 0);
    }

    // My photo's page is centred while closed, the spine once open.
    const open = clamp(progress, 0, 1);
    book.position.x = (-W / 2) * (1 - open);
    // The shadow reaches left only as the cover comes down onto the table.
    const landed = Math.pow(clamp((open - 0.55) / 0.45, 0, 1), 2);
    contactShadow.scale.set(WC * (1 + landed) * contact.scaleX, DC * contact.scaleY, 1);
    contactShadow.position.x = book.position.x + (WC * (1 - landed)) / 2;
    contactShadow.material.opacity = smoothstep(0.2, 0.9, shown);

    // The sheen follows the mouse.
    graze.position.x = -0.2 * mouse.ex;

    // From my photo to the middle of the window, where the dialog is. World
    // units are page widths at the dialog's size, with the origin at the
    // window's centre.
    const { vw, vh, page } = view;
    const photo = anchor.getBoundingClientRect();
    const closedScale = (photo.width / (W * page)) * (1 + HOVER_GROW * hover.x);
    const closedW = WC * page * closedScale;
    const closedH = DC * page * closedScale;
    // The book grows up and to the right, keeping clear of my name below and
    // in line with the text on its left.
    const grownX = (hover.x * (closedW - photo.width)) / 2;
    const grownY = (hover.x * (closedH - photo.height)) / 2;
    const photoX = photo.left + photo.width / 2 + grownX - vw / 2;
    const photoY = photo.top + photo.height / 2 - grownY - vh / 2;
    const m = morph.x;
    const scale = closedScale + (1 - closedScale) * m;
    stage.scale.setScalar(scale);
    stage.position.set(((1 - m) * photoX) / page, 0, ((1 - m) * photoY) / page);
    // The light's shadow area goes with the book.
    sun.position.set(-2.4 + stage.position.x, 4.2, -1.8 + stage.position.z);
    sun.target.position.set(stage.position.x, 0, stage.position.z);
    sun.target.updateMatrixWorld();

    // Straight down at the whole window.
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const distance = vh / (2 * page * tan);
    camera.position.set(0, distance, 0);
    camera.lookAt(0, 0, 0);
    camera.aspect = vw / vh;
    camera.near = Math.max(0.05, distance - 4);
    camera.far = distance + 2;
    camera.updateProjectionMatrix();

    // The canvas and my photo trade places while the cover is still on edge.
    canvas.style.visibility = shown > 0 ? 'visible' : 'hidden';
    canvas.style.opacity = String(smoothstep(0, 0.16, shown));
    // (Only the picture hides: the button must stay focusable.)
    anchor.firstElementChild.style.visibility = shown > 0.16 ? 'hidden' : '';

    // The page behind blurs.
    backdrop.style.visibility = reveal > 0 ? 'visible' : 'hidden';
    backdrop.style.opacity = String(1 - (1 - reveal) ** 3);
  }

  function draw() {
    // The full-window drawing surface is only made once it is needed.
    if (!sized) {
      renderer.setSize(view.vw, view.vh);
      sized = true;
    }
    layout();
    renderer.render(scene, camera);
    dirty = false;
  }

  function tick() {
    frameId = 0;
    const now = performance.now();
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    if (hoverDirty) {
      hoverDirty = false;
      updateHover();
    }
    const before = [progress, hover.x, morph.x, reveal, lift.left, lift.right];
    moveMorph(dt);
    moveProgress(dt);
    moveLifts(dt);
    const bent = moveBends(dt);
    const sheen = mouse.ex;
    // Mouse, eased: it only moves the light's sheen across the paper.
    mouse.ex = approach(mouse.ex, mouse.x, 3, dt);
    if (Math.abs(mouse.x - mouse.ex) < 0.005) mouse.ex = mouse.x;
    const leavesMoved = bent || [progress, hover.x, morph.x, reveal, lift.left, lift.right].some((v, i) => v !== before[i]);
    if (leavesMoved) renderer.shadowMap.needsUpdate = true;
    const moving = leavesMoved || mouse.ex !== sheen;
    if (moving || dirty) draw();
    const waiting = !drag && (closing || progress !== target || goal !== target || morph.goal !== morph.to);
    if (moving || waiting) frameId = requestAnimationFrame(tick);
  }

  // Pointer
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function hitsBook(event) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const found = raycaster.intersectObjects(leaves.map((l) => l.mesh), false)[0];
    return found ? found.point.clone() : null;
  }

  function updateHover() {
    if (drag) return;
    const point = pointer ? hitsBook(pointer) : null;
    hit = point;
    if (eventTarget) eventTarget.style.cursor = point ? 'grab' : '';
  }

  function onPointerDown(event) {
    if (event.button !== 0 || event.target.closest('a, button') || morph.x < 0.98) return;
    // A touch has no hover, so its page lifts from here.
    hit = hitsBook(event);
    drag = { startX: event.clientX, startProgress: progress, to: progress, moved: false, samples: [[performance.now(), progress]] };
    if (hit) eventTarget.style.cursor = 'grabbing';
    try {
      eventTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic or already-released pointers cannot be captured.
    }
    wake();
  }

  function onPointerMove(event) {
    if (!eventTarget || !view) return;
    const rect = frameRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1.5, 1.5);
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    // The sheen only follows a mouse near the book.
    if (Math.abs(y) <= 1.5 && x !== mouse.x) {
      mouse.x = x;
      wake();
    }

    if (drag) {
      const dx = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > 6) drag.moved = true;
      if (drag.moved) {
        const raw = drag.startProgress - dx / rect.width;
        drag.to = clamp(raw, 0, lastSpread);
        // Speed comes from the hand, not the clamped page, so a flick on the
        // first spread still registers.
        drag.samples.push([performance.now(), raw]);
        if (drag.samples.length > 6) drag.samples.shift();
        wake();
      }
      return;
    }

    if (event.pointerType === 'touch') return;
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    const next = inside && !event.target.closest?.('a, button') ? { clientX: event.clientX, clientY: event.clientY } : null;
    if (next || pointer) {
      pointer = next;
      hoverDirty = true;
      wake();
    }
  }

  function onPointerUp(event) {
    const d = drag;
    drag = null;
    if (!d) return;
    goal = progress;
    if (event.pointerType === 'touch') hit = null;
    if (eventTarget) eventTarget.style.cursor = hit ? 'grab' : '';
    hoverDirty = true;
    wake();
    if (!d.moved) return;
    // Let go: carry on with the drag's speed, then settle on a page. Only the
    // last moments count, so a hand that stopped before letting go has no speed.
    const now = performance.now();
    const samples = d.samples.filter(([t]) => now - t < 120);
    const [t0, p0] = samples[0] ?? [now, progress];
    const [t1, p1] = samples[samples.length - 1] ?? [now, progress];
    const handSpeed = t1 > t0 ? ((p1 - p0) / (t1 - t0)) * 1000 : 0;
    // Only the cover closes the book: a drag that started on the first
    // spread and pulled it most of the way shut (or nearly shut, with a light
    // flick). Swiping back from a later spread never closes it, however fast;
    // it stops on the first spread.
    const onFirstSpread = d.startProgress >= 0.99 && d.startProgress < 1.5;
    const closing = onFirstSpread && (d.to < CLOSE_PULL || (d.to < CLOSE_NUDGE && handSpeed < CLOSE_NUDGE_SPEED));
    if (closing) {
      hit = null;
      closedByHand = progress <= 1;
      onRequestClose?.();
      return;
    }
    const next = clamp(Math.round(progress + handSpeed * 0.25), 1, lastSpread);
    target = next;
    goal = next;
    onSpread?.(next);
  }

  function onPointerLeave() {
    if (!pointer && !hit) return;
    pointer = null;
    hoverDirty = true;
    wake();
  }

  function attachFrame(element) {
    if (eventTarget) {
      eventTarget.removeEventListener('pointerdown', onPointerDown);
      eventTarget.removeEventListener('pointerup', onPointerUp);
      eventTarget.removeEventListener('pointercancel', onPointerUp);
      eventTarget.removeEventListener('pointerleave', onPointerLeave);
    }
    eventTarget = element;
    if (!element) return;
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);
    element.addEventListener('pointerleave', onPointerLeave);
  }
  window.addEventListener('pointermove', onPointerMove);

  // The dialog is the open book, as big as the window allows, with room above
  // and below it (the close button sits below).
  function measureView() {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const margin = vw < 640 ? 12 : 24;
    const pad = 56;
    const page = Math.max(60, Math.min(DIALOG_PAGE_MAX, (vw - 2 * margin) / (2 * WC), (vh - 2 * (margin + pad)) / DC));
    const width = 2 * WC * page;
    const height = DC * page + 2 * pad;
    const dialog = { left: (vw - width) / 2, top: (vh - height) / 2, width, height };
    view = { vw, vh, page, pad, dialog };
  }
  const frameRect = () => {
    const { dialog, pad } = view;
    const { left, width } = dialog;
    const top = dialog.top + pad;
    const height = dialog.height - 2 * pad;
    return { left, top, width, height, right: left + width, bottom: top + height };
  };

  const onResize = () => {
    measureView();
    sized = false;
    onLayout?.(view.dialog, view.pad);
    if (started && Math.max(hover.x, morph.x) > 0) draw();
  };
  window.addEventListener('resize', onResize);

  // While the closed book sits by my photo, it scrolls with the page.
  const onScroll = () => {
    if (started && hover.x > 0 && morph.x < 1) {
      dirty = true;
      wake();
    }
  };
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });

  const onContextRestored = () => {
    dirty = true;
    renderer.shadowMap.needsUpdate = true;
    wake();
  };
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  // Gets everything onto the graphics card a little at a time, so the first
  // frame does not hold the page up: shaders compile in the background, then
  // each picture uploads, handing back to the browser between them.
  async function prepare() {
    layout();
    await renderer.compileAsync(scene, camera).catch(() => {});
    const uploaded = new Set();
    let sliceStart = performance.now();
    for (const thing of disposables) {
      if (disposed) return;
      if (!thing.isTexture || uploaded.has(thing.source)) continue;
      uploaded.add(thing.source);
      renderer.initTexture(thing);
      if (performance.now() - sliceStart > 6) {
        await new Promise((resolve) => setTimeout(resolve));
        sliceStart = performance.now();
      }
    }
    if (disposed) return;
    started = true;
    if (wantsHover || morph.to) wake();
  }

  measureView();
  onLayout?.(view.dialog, view.pad);
  onSpread?.(startSpread);
  const ready = prepare();

  return {
    goTo,
    attachFrame,
    ready, // resolves once everything is on the graphics card
    setHover(on) {
      wantsHover = on;
      wake();
    },
    // The closed book, at once (no swing), over my photo; it stays until
    // setHover(false) lets the cover lift away again. On arrival it takes
    // over from a picture of itself (HeroBook), so the swap is unseen.
    peek() {
      wantsHover = true;
      hover.x = 1;
      hover.v = 0;
      dirty = true;
      wake();
    },
    open() {
      closing = false;
      closedByHand = false;
      tie = 1;
      morph.to = 1;
      target = 1;
      onSpread?.(1);
      wake();
    },
    close() {
      hit = null;
      pointer = null;
      drag = null;
      // Once the page has brightened, the book closes on its way home. A
      // cover pulled shut by hand finishes closing first, carrying the hand's
      // speed, and only then does the book shrink.
      closing = true;
      if (closedByHand) {
        target = 0;
        goal = 0;
      }
      wake();
    },
    // Where the printed link on the last page appears, as percentages of
    // the book's area in the dialog.
    linkRect() {
      const page = pages.find((p) => p.link);
      if (!page) return null;
      camera.updateMatrixWorld();
      const c = canvas.getBoundingClientRect();
      const f = frameRect();
      const toFrame = (u, v) => {
        // Spread canvas fraction -> the open book's top surface.
        const point = new THREE.Vector3((u * 2 - 1) * W, COVER_T + PAGE_T, -D / 2 + v * D).project(camera);
        const px = c.left + ((point.x + 1) / 2) * c.width;
        const py = c.top + ((1 - point.y) / 2) * c.height;
        return [((px - f.left) / f.width) * 100, ((py - f.top) / f.height) * 100];
      };
      const [left, top] = toFrame(page.link.left, page.link.top);
      const [right, bottom] = toFrame(page.link.right, page.link.bottom);
      return { left, top, width: right - left, height: bottom - top };
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      attachFrame(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, { capture: true });
      for (const thing of disposables) thing.dispose();
      renderer.dispose();
    },
  };
}
