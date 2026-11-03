// The WebGL storybook, modelled on the board book at
// howtotalktowhitekidsaboutracism.com (rebuilt from its behaviour, not its
// code):
//
// - Every leaf is a stiff board 1 x 1.14 and 0.005 thick (covers 0.008),
//   with rounded outer corners and solid edges, hinged at the spine.
// - Reading is one timeline, `progress`: leaf k turns 0 -> 180 degrees as
//   progress runs from k to k + 1, so jumping several pages turns them one
//   after another. Buttons ease progress to a page over 1.5s; dragging
//   scrubs it directly (the width of the book's frame is one page) and
//   snaps to the nearest page with a little inertia.
// - While the cover opens, the book slides from cover-centred to
//   spread-centred.
// - Paper is a slightly glossy standard material with roughness and normal
//   maps. A low light grazes from the top of the page and follows the
//   mouse, so the sheen moves. The book itself stays still.
// - Each illustration is layered; upper layers slide while their page
//   turns.
// - Dragging is the only control: drag left to open and turn forward, right
//   to turn back. A fast flick to the right closes the book. Hovering the
//   closed book opens the cover a little, showing the first page.
//
// On top of that, for a light page: a soft contact shadow under the book
// (a pre-blurred texture that widens as the book opens) and a
// shadow-casting light, so a turning page shades the pages below it.
import * as THREE from 'three';
import { drawContactShadow, drawPaperMaps, PAGE_ASPECT } from './textures';

const W = 1; // page width
const D = PAGE_ASPECT; // page depth, along the spine
const PAGE_T = 0.005;
const COVER_T = 0.008;
const RADIUS = 0.07;
// Hard covers overhang the pages by this much on the three outer sides, so
// an open book shows a rim of cover around each page block.
const OVERHANG = 0.035;
const WC = W + OVERHANG; // cover board width
const DC = D + 2 * OVERHANG; // cover board depth
const COVER_RADIUS = RADIUS * (WC / W);
// A long lens from far away: the book looks flat and top-down, and a page
// standing up mid-turn grows only a little, so it stays inside the canvas.
const FOV = 12;
const LAYER_DEPTH = [0, 0.5, 1.6]; // how far each art layer slides while turning
const HOVER_LIFT = 0.42; // radians the cover opens while hovered
const CLOSE_FLICK = -3.5; // pages per second, rightwards, that close the book

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

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

export function createBookScene({ canvas, frame, eventTarget, pages, reduceMotion = false, onSpread, onHover, onVideo }) {
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
  scene.add(contactShadow);

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

  // The intro video, shared by both pages of the first spread. It loads
  // only once that spread is on screen, and plays only while it is.
  const videoPage = pages.find((page) => page.video);
  const videoMix = { value: 0 }; // 0 shows the printed poster, 1 the moving video
  let video = null;
  let videoTexture = null;
  let videoReady = false;
  let playPending = false;
  // Paused with the button. Leaving the intro clears it, so the video plays
  // again on the way back. With reduced motion it starts paused.
  let userPaused = reduceMotion;
  if (videoPage) {
    video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('playsinline', '');
    video.addEventListener('playing', () => {
      videoReady = true;
    });
    // Report playing and muted to the page, for its buttons.
    const report = () => onVideo?.({ playing: !video.paused, muted: video.muted });
    video.addEventListener('play', report);
    video.addEventListener('pause', report);
    video.addEventListener('volumechange', report);
    videoTexture = track(new THREE.VideoTexture(video));
  }

  // Shared uniforms: the crease shade near the spine, and one parallax
  // offset per illustration.
  const crease = { value: 0 };
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
  function pageMaterial(page, onBack, board = null) {
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
    const material = track(
      new THREE.MeshStandardMaterial(
        cloth
          ? {
              map,
              roughness: 0.92,
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
              normalScale: new THREE.Vector2(0.3, 0.3),
            }
      )
    );
    const layers = page.layers.slice(1).map(canvasTexture);
    if (!offsets.has(page.layers)) offsets.set(page.layers, { value: new THREE.Vector2() });
    const offset = offsets.get(page.layers);
    const spine = page.part !== 'whole';
    const insidePage = board && spine; // a page printed on a cover board, with a rim around it
    const f = (n) => n.toFixed(5);
    // The video fills the spread like the art does, cropped to fit, and is
    // multiplied onto the paper so its white backdrop becomes the page.
    const videoCode = page.video
      ? `{
            vec2 videoUv = vec2(0.5 + (vMapUv.x - 0.5) * ${f((2 * W) / D / (16 / 9))}, vMapUv.y);
            vec3 footage = texture2D(uVideo, videoUv).rgb;
            art.rgb = mix(art.rgb, uPaper * footage, uVideoMix * step(0.5, art.a));
          }`
      : '';
    const boardCode = board
      ? `{
            vec2 pu = vPageUv;
            float cu = pu.x * ${f(W / WC)};
            if (uMirror > 0.5) cu = 1.0 - cu;
            vec2 clothUv = vec2(cu, pu.y * ${f(D / DC)} + ${f(OVERHANG / DC)});
            ${
              insidePage
                ? `// Outside the page block, show the cover cloth turned in, darkened
            // where the pages sit on it.
            if (pu.x > 1.0 || pu.y < 0.0 || pu.y > 1.0 || art.a < 0.5) {
              vec4 cloth = texture2D(uCloth, clothUv);
              art = vec4(cloth.rgb / max(cloth.a, 0.0001), 1.0);
              // The turn-in catches more light than the outside of the cover.
              art.rgb = mix(art.rgb, vec3(0.36, 0.38, 0.4), 0.38) * 1.12;

              // Board coordinates in world units: x from the spine, y from
              // the bottom edge of the board.
              vec2 bp = vec2(pu.x * ${f(W)}, (pu.y + ${f(OVERHANG / D)}) * ${f(D)});
              float toOuter = ${f(WC)} - bp.x;
              float toEnd = min(bp.y, ${f(DC)} - bp.y);

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

              // The hinge: a groove where the cover bends at the spine.
              float hinge = exp(-pow((bp.x - 0.014) / 0.004, 2.0));
              art.rgb *= 1.0 - 0.35 * hinge;
              art.rgb *= 1.0 + 0.12 * exp(-pow((bp.x - 0.022) / 0.003, 2.0));

              // Shadow where the page block sits on the board.
              vec2 gap = max(vec2(max(-pu.x, pu.x - 1.0) * ${f(W)}, max(-pu.y, pu.y - 1.0) * ${f(D)}), 0.0);
              art.rgb *= 1.0 - 0.5 * (1.0 - smoothstep(0.0, 0.03, length(gap)));
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
            art.rgb = mix(art.rgb, vec3(0.8, 0.78, 0.74), wear * (0.65 + 0.25 * corner));
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
      shader.uniforms.uOffset = offset;
      if (page.video) {
        shader.uniforms.uVideo = { value: videoTexture };
        shader.uniforms.uVideoMix = videoMix;
        shader.uniforms.uPaper = { value: new THREE.Color(page.video.paper) };
      }
      if (board) {
        shader.uniforms.uCloth = { value: board.cloth };
        shader.uniforms.uMirror = { value: board.mirror ? 1 : 0 };
      }
      layers.forEach((texture, i) => {
        shader.uniforms[`uLayer${i}`] = { value: texture };
      });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vPageUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvPageUv = uv;');
      const samplers = layers.map((_, i) => `uniform sampler2D uLayer${i};`).join('\n');
      const mixes = layers
        .map(
          (_, i) => `{
            vec4 l = texture2D(uLayer${i}, vMapUv + uOffset * ${LAYER_DEPTH[i + 1].toFixed(2)});
            art.rgb = mix(art.rgb, l.rgb / max(l.a, 0.0001), l.a);
          }`
        )
        .join('\n');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>\nvarying vec2 vPageUv;\nuniform float uCrease;\nuniform vec2 uOffset;\nuniform sampler2D uCloth;\nuniform float uMirror;\n${page.video ? 'uniform sampler2D uVideo;\nuniform float uVideoMix;\nuniform vec3 uPaper;\n' : ''}${samplers}`
        )
        .replace(
          '#include <map_fragment>',
          `#ifdef USE_MAP
            vec4 art = texture2D(map, vMapUv);
            art.rgb /= max(art.a, 0.0001);
            ${mixes}
            ${videoCode}
            ${boardCode}
            diffuseColor *= art;
          #endif
          ${
            spine
              ? `// The fold: a hint when the book lies still, deeper while pages turn.
          diffuseColor.rgb *= 1.0 - (0.05 + 0.3 * uCrease) * (1.0 - smoothstep(0.0, 0.09 + 0.06 * uCrease, vPageUv.x));`
              : ''
          }`
        );
    };
    material.customProgramCacheKey = () =>
      `page-${layers.length}-${spine}-${board ? 'board' : ''}-${cloth ? 'cloth' : ''}-${page.video ? 'video' : ''}`;
    return material;
  }

  // Leaves
  const leafCount = pages.length / 2;
  const lastSpread = leafCount - 1; // the last leaf is the back board; it never turns
  const thickness = (k) => (k === 0 || k === leafCount - 1 ? COVER_T : PAGE_T);
  const book = new THREE.Group();
  scene.add(book);

  const leaves = [];
  for (let k = 0; k < leafCount; k++) {
    const t = thickness(k);
    const isCover = k === 0 || k === leafCount - 1;
    const edge = track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(isCover ? '#26292d' : pages[2 * k].edge).multiplyScalar(isCover ? 1 : 0.93),
        roughness: isCover ? 0.95 : 0.7,
        metalness: isCover ? 0 : 0.05,
        roughnessMap: isCover ? roughMap : null,
        normalMap: isCover ? clothNormal : null,
        normalScale: new THREE.Vector2(0.9, 0.9),
      })
    );
    // Covers are bigger boards; their rim shows the cover's own texture.
    const board = isCover
      ? { cloth: canvasTexture(pages[k === 0 ? 0 : pages.length - 1].layers[0]), mirror: k !== 0 }
      : null;
    const geometry = isCover ? boardGeometry(t, WC, DC, COVER_RADIUS) : boardGeometry(t);
    const mesh = new THREE.Mesh(track(geometry), [
      pageMaterial(pages[2 * k + 1], true, board),
      pageMaterial(pages[2 * k], false, board),
      edge,
    ]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const pivot = new THREE.Group();
    pivot.add(mesh);
    book.add(pivot);
    leaves.push({ pivot, mesh, t, theta: 0 });
  }

  // Spreads 1..N each use one layers array; find it for the parallax.
  const spreadLayers = [];
  for (let s = 1; s < leafCount; s++) spreadLayers[s] = pages[2 * s].layers;

  // State
  // With an intro video the book starts open on it; otherwise closed.
  const startSpread = videoPage ? 1 : 0;
  let progress = startSpread; // the reading timeline: 0 closed, s = spread s open
  let target = startSpread;
  let tween = null;
  let drag = null;
  let hover = false;
  let hoverLift = 0;
  const mouse = { x: 0, y: 0, ex: 0, ey: 0 };
  let width = 1;
  let height = 1;
  // Where the frame (the book's box) sits within the bigger canvas, as
  // fractions of the canvas: { x0, x1, y0, y1 }.
  let inset = { x0: 0, x1: 1, y0: 0, y1: 1 };
  let visible = true;
  let frameId = 0;
  let last = performance.now();
  const startTime = last;

  function tweenTo(next, duration, ease) {
    if (reduceMotion) {
      progress = next;
      tween = null;
      return;
    }
    tween = { from: progress, to: next, start: performance.now(), duration: duration * 1000, ease };
  }

  function goTo(next) {
    next = clamp(Math.round(next), 0, lastSpread);
    if (next === target && !drag) return;
    target = next;
    onSpread?.(next);
    tweenTo(next, 1.5, easeInOutCubic);
  }

  function layout(time, dt) {
    // Mouse, eased: it only moves the light's sheen across the paper.
    const k = 1 - Math.exp(-dt * 3);
    mouse.ex += (mouse.x - mouse.ex) * k;

    // Leaf angles from the timeline, plus the cover lifting under the mouse.
    const closed = progress < 0.001;
    const liftTarget = hover && closed && !reduceMotion ? HOVER_LIFT : 0;
    hoverLift += (liftTarget - hoverLift) * (1 - Math.exp(-dt * 6));
    leaves.forEach((leaf, i) => {
      leaf.theta = Math.PI * clamp(progress - i, 0, 1);
    });
    leaves[0].theta = Math.max(leaves[0].theta, hoverLift);

    // Stack heights: flat leaves rest on those below them on their side;
    // a turning board swings about a hinge between the two piles.
    leaves.forEach((leaf, i) => {
      let right = 0;
      let left = 0;
      for (let j = i + 1; j < leafCount; j++) if (progress - j <= 0) right += leaves[j].t;
      for (let j = 0; j < i; j++) if (progress - j >= 1) left += leaves[j].t;
      const hinge = (right + left + leaf.t) / 2;
      leaf.pivot.position.y = hinge;
      leaf.pivot.rotation.z = leaf.theta;
      leaf.mesh.position.y = right - hinge;
    });

    // The fold darkens while any page is in the air.
    crease.value = leaves.reduce((m, leaf, i) => (i === 0 ? m : Math.max(m, Math.sin(leaf.theta))), 0);

    // Art layers slide while their page turns.
    for (let s = 1; s < leafCount; s++) {
      const turning = leaves[s].theta - (Math.PI - leaves[s - 1].theta);
      offsets
        .get(spreadLayers[s])
        ?.value.set(0.1 * turning, 0);
    }

    // The book slides right as the cover opens, so the spread is centred.
    const open = clamp(progress, 0, 1);
    book.position.x = (-WC / 2) * (1 - open);
    // The shadow reaches left only as the cover comes down onto the table.
    const landed = Math.pow(clamp((open - 0.55) / 0.45, 0, 1), 2);
    contactShadow.scale.set(WC * (1 + landed) * contact.scaleX, DC * contact.scaleY, 1);
    contactShadow.position.x = book.position.x + (WC * (1 - landed)) / 2;

    // The sheen follows the mouse.
    graze.position.x = -0.2 * mouse.ex;

    // Straight down, framing the open spread inside the frame element (the
    // canvas runs past it so shadows are never cut off).
    const aspect = width / height;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const frameW = inset.x1 - inset.x0;
    const frameH = inset.y1 - inset.y0;
    const distance = Math.max((DC / 2 + 0.03) / (tan * frameH), (WC + 0.03) / (tan * aspect * frameW));
    camera.position.set(0, distance, 0);
    camera.lookAt(0, 0, 0);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    // The canvas runs further past the frame below than above (that is where
    // the shadow falls), so shift the image to centre the book on the frame.
    const projection = camera.projectionMatrix.elements;
    projection[8] = -((inset.x0 + inset.x1) - 1);
    projection[9] = (inset.y0 + inset.y1) - 1;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }

  function tick() {
    frameId = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    if (video) {
      // Play only while the book rests on the intro: a page turning away
      // pauses it, and coming back plays it again.
      const onIntro = target === 1 && Math.abs(progress - 1) < 0.15;
      if (target !== 1) userPaused = reduceMotion;
      const shouldPlay = visible && onIntro && !userPaused && document.visibilityState === 'visible';
      if (shouldPlay && video.paused && !playPending) {
        if (!video.getAttribute('src')) video.src = videoPage.video.src;
        playPending = true;
        video
          .play()
          .catch(() => {})
          .finally(() => {
            playPending = false;
          });
      } else if (!shouldPlay && !video.paused) {
        video.pause();
      }
      videoMix.value += ((videoReady ? 1 : 0) - videoMix.value) * (1 - Math.exp(-dt * 4));
    }
    if (!visible) return;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.duration);
      progress = tween.from + (tween.to - tween.from) * tween.ease(t);
      if (t >= 1) tween = null;
    }
    layout((now - startTime) / 1000, dt);
    renderer.render(scene, camera);
  }

  // Pointer
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function hitsBook(event) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(leaves.map((l) => l.mesh), false)[0];
    return hit ? hit.point.clone() : null;
  }

  function onPointerDown(event) {
    if (event.button !== 0 || event.target.closest('a, button')) return;
    tween = null;
    drag = { startX: event.clientX, startProgress: progress, moved: false, samples: [[performance.now(), progress]] };
    try {
      eventTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic or already-released pointers cannot be captured.
    }
  }

  function onPointerMove(event) {
    const rect = frame.getBoundingClientRect();
    mouse.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1.5, 1.5);
    mouse.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1.5, 1.5);

    if (drag) {
      const dx = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > 6) drag.moved = true;
      if (drag.moved) {
        // Once open, a slow drag cannot shut the book; only a flick can.
        const min = drag.startProgress >= 1 ? 1 : 0;
        const raw = drag.startProgress - dx / rect.width;
        progress = clamp(raw, min, lastSpread);
        // Speed comes from the hand, not the clamped page, so a flick on the
        // first spread still registers.
        drag.samples.push([performance.now(), raw]);
        if (drag.samples.length > 6) drag.samples.shift();
      }
      return;
    }

    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    const over = inside && progress < 0.001 && !!hitsBook(event);
    if (over !== hover) {
      hover = over;
      onHover?.(over);
    }
    eventTarget.style.cursor = progress < 0.001 && !over ? '' : 'grab';
  }

  function onPointerUp(event) {
    const d = drag;
    drag = null;
    if (!d) return;
    if (!d.moved) {
      // A click on the closed book opens it.
      if (target === 0 && hitsBook(event)) goTo(1);
      return;
    }
    // Let go: carry on a little with the drag's speed, then settle on a page.
    const [t0, p0] = d.samples[0];
    const [t1, p1] = d.samples[d.samples.length - 1];
    const velocity = t1 > t0 ? ((p1 - p0) / (t1 - t0)) * 1000 : 0;
    if (d.startProgress >= 1 && velocity < CLOSE_FLICK) {
      hover = false;
      goTo(0);
      return;
    }
    const next = clamp(Math.round(progress + velocity * 0.25), d.startProgress >= 1 ? 1 : 0, lastSpread);
    target = next;
    onSpread?.(next);
    tweenTo(next, 0.7, easeOutCubic);
  }

  function onPointerLeave() {
    if (hover) {
      hover = false;
      onHover?.(false);
    }
  }

  eventTarget.addEventListener('pointerdown', onPointerDown);
  eventTarget.addEventListener('pointerup', onPointerUp);
  eventTarget.addEventListener('pointercancel', onPointerUp);
  eventTarget.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('pointermove', onPointerMove);

  const measure = () => {
    const c = canvas.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    width = Math.max(1, c.width);
    height = Math.max(1, c.height);
    inset = {
      x0: (f.left - c.left) / c.width,
      x1: (f.right - c.left) / c.width,
      y0: (f.top - c.top) / c.height,
      y1: (f.bottom - c.top) / c.height,
    };
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(canvas);
  resizeObserver.observe(frame);

  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    last = performance.now();
  });
  visibility.observe(canvas);

  measure();
  onSpread?.(startSpread);
  tick();

  return {
    goTo,
    // The play / pause button on the intro spread.
    toggleVideo() {
      if (!video || target !== 1) return;
      // Playing now? Then pause it; otherwise let it play.
      userPaused = !video.paused;
    },
    // Where the printed link on the last page appears, as percentages of
    // the frame, for laying a real link over it. The book lies flat and
    // centred there, so this holds for as long as the frame keeps its size.
    linkRect() {
      const page = pages.find((p) => p.link);
      if (!page) return null;
      camera.updateMatrixWorld();
      const c = canvas.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
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
    // The sound button. Unmuting needs a click, which this always comes from.
    toggleSound() {
      if (video) video.muted = !video.muted;
    },
    dispose() {
      cancelAnimationFrame(frameId);
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      resizeObserver.disconnect();
      visibility.disconnect();
      eventTarget.removeEventListener('pointerdown', onPointerDown);
      eventTarget.removeEventListener('pointerup', onPointerUp);
      eventTarget.removeEventListener('pointercancel', onPointerUp);
      eventTarget.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointermove', onPointerMove);
      for (const thing of disposables) thing.dispose();
      renderer.dispose();
    },
  };
}
