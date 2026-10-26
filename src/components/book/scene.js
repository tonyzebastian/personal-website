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
//   mouse, so the sheen moves; the camera drifts with the mouse and slowly
//   on its own.
// - Each illustration is layered; upper layers slide with the mouse and
//   while their page turns.
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
const FOV = 36;
const LAYER_DEPTH = [0, 0.5, 1.6]; // how far each art layer drifts

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A board: rounded on the outer (x = W) corners, square at the spine.
// Material slots: 0 back face (y = 0), 1 front face (y = t), 2 edges.
function boardGeometry(t) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -D / 2);
  shape.lineTo(W - RADIUS, -D / 2);
  shape.quadraticCurveTo(W, -D / 2, W, -D / 2 + RADIUS);
  shape.lineTo(W, D / 2 - RADIUS);
  shape.quadraticCurveTo(W, D / 2, W - RADIUS, D / 2);
  shape.lineTo(0, D / 2);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 10 });
  geometry.rotateX(-Math.PI / 2); // extrude upwards; the shape's y becomes -z

  const [caps, sides] = geometry.groups;
  const half = caps.count / 2; // bottom lid first, then top lid
  geometry.clearGroups();
  geometry.addGroup(caps.start, half, 0);
  geometry.addGroup(caps.start + half, half, 1);
  geometry.addGroup(sides.start, sides.count, 2);

  // Page UVs: u runs from the spine (0) out to the edge (1); v from the
  // bottom of the art (near the reader) to the top.
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W, (D / 2 - pos.getZ(i)) / D);
  uv.needsUpdate = true;
  return geometry;
}

export function createBookScene({ canvas, frame, eventTarget, pages, reduceMotion = false, onSpread, onHover }) {
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

  function pageMaterial(page, onBack) {
    // The base layer carries this face's slice of the art: front faces run
    // from the spine outwards to the right; back faces end up mirrored on
    // the left, so their u runs right to left.
    const map = track(canvasTexture(page.layers[0]).clone());
    map.needsUpdate = true;
    if (page.part === 'whole') {
      map.repeat.set(onBack ? -1 : 1, 1);
      map.offset.set(onBack ? 1 : 0, 0);
    } else {
      map.repeat.set(onBack ? -0.5 : 0.5, 1);
      map.offset.set(0.5, 0);
    }
    const material = track(
      new THREE.MeshStandardMaterial({
        map,
        roughness: 0.45,
        metalness: 0.07,
        roughnessMap: roughMap,
        metalnessMap: roughMap,
        normalMap,
        normalScale: new THREE.Vector2(0.3, 0.3),
      })
    );
    const layers = page.layers.slice(1).map(canvasTexture);
    if (!offsets.has(page.layers)) offsets.set(page.layers, { value: new THREE.Vector2() });
    const offset = offsets.get(page.layers);
    const spine = page.part !== 'whole';

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uCrease = crease;
      shader.uniforms.uOffset = offset;
      layers.forEach((texture, i) => {
        shader.uniforms[`uLayer${i}`] = { value: texture };
      });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vPageU;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvPageU = uv.x;');
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
          `#include <common>\nvarying float vPageU;\nuniform float uCrease;\nuniform vec2 uOffset;\n${samplers}`
        )
        .replace(
          '#include <map_fragment>',
          `#ifdef USE_MAP
            vec4 art = texture2D(map, vMapUv);
            art.rgb /= max(art.a, 0.0001);
            ${mixes}
            diffuseColor *= art;
          #endif
          ${
            spine
              ? `// The fold: a hint when the book lies still, deeper while pages turn.
          diffuseColor.rgb *= 1.0 - (0.05 + 0.3 * uCrease) * (1.0 - smoothstep(0.0, 0.09 + 0.06 * uCrease, vPageU));`
              : ''
          }`
        );
    };
    material.customProgramCacheKey = () => `page-${layers.length}-${spine}`;
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
        color: new THREE.Color(isCover ? '#1d2024' : pages[2 * k].edge).multiplyScalar(isCover ? 1 : 0.93),
        roughness: 0.7,
        metalness: 0.05,
      })
    );
    const mesh = new THREE.Mesh(track(boardGeometry(t)), [pageMaterial(pages[2 * k + 1], true), pageMaterial(pages[2 * k], false), edge]);
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
  let progress = 0; // the reading timeline: 0 closed, s = spread s open
  let target = 0;
  let tween = null;
  let drag = null;
  let hover = false;
  let hoverLift = 0;
  let hoverSince = 0;
  const mouse = { x: 0, y: 0, ex: 0, ey: 0 };
  let width = 1;
  let height = 1;
  let inset = { x: 0, y: 0 };
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

  // A little nudge of the cover every few seconds while hovered.
  function wiggle(t) {
    if (reduceMotion || t < 2) return 0;
    const phase = (t - 2) % 4.75;
    return phase < 0.75 ? 0.075 * Math.abs(Math.sin((phase / 0.25) * Math.PI * 0.5)) : 0;
  }

  function layout(time, dt) {
    // Mouse, eased, plus a slow drift of its own.
    const k = 1 - Math.exp(-dt * 3);
    mouse.ex += (mouse.x - mouse.ex) * k;
    mouse.ey += (mouse.y - mouse.ey) * k;
    const drift = reduceMotion
      ? { x: 0, y: 0 }
      : { x: 0.04 * Math.sin((time / 60) * Math.PI * 2), y: 0.03 * Math.sin((time / 120) * Math.PI * 2) };

    // Leaf angles from the timeline, plus the cover lifting under the mouse.
    const closed = progress < 0.001;
    const liftTarget = hover && closed ? Math.PI / 32 + wiggle(time - hoverSince) : 0;
    hoverLift += (liftTarget - hoverLift) * (1 - Math.exp(-dt * 7));
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

    // Art layers drift with the mouse, and slide while their page turns.
    for (let s = 1; s < leafCount; s++) {
      const turning = leaves[s].theta - (Math.PI - leaves[s - 1].theta);
      offsets
        .get(spreadLayers[s])
        ?.value.set(-0.02 * mouse.ex + drift.x * 0.5 + 0.1 * turning, -0.02 * mouse.ey + drift.y * 0.5);
    }

    // The book slides right as the cover opens, so the spread is centred.
    const open = clamp(progress, 0, 1);
    book.position.x = (-W / 2) * (1 - open);
    // The shadow reaches left only as the cover comes down onto the table.
    const landed = Math.pow(clamp((open - 0.55) / 0.45, 0, 1), 2);
    contactShadow.scale.set(W * (1 + landed) * contact.scaleX, D * contact.scaleY, 1);
    contactShadow.position.x = book.position.x + (W * (1 - landed)) / 2;

    // The sheen follows the mouse.
    graze.position.x = -0.2 * mouse.ex + drift.x;

    // Straight down, framing the open spread inside the frame element (the
    // canvas runs past it so shadows are never cut off).
    const aspect = width / height;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const frameW = 1 - 2 * inset.x;
    const frameH = 1 - 2 * inset.y;
    const distance = Math.max((D / 2 + 0.03) / (tan * frameH), (W + 0.03) / (tan * aspect * frameW));
    const panX = -0.03 * mouse.ex + drift.x * 0.4;
    const panZ = 0.03 * mouse.ey + drift.y * 0.4;
    camera.position.set(panX, distance, panZ);
    camera.lookAt(panX, 0, panZ);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }

  function tick() {
    frameId = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
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
    eventTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    const rect = frame.getBoundingClientRect();
    mouse.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1.5, 1.5);
    mouse.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1.5, 1.5);

    if (drag) {
      const dx = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > 6 && target > 0) drag.moved = true;
      if (drag.moved) {
        progress = clamp(drag.startProgress - dx / rect.width, 0, lastSpread);
        drag.samples.push([performance.now(), progress]);
        if (drag.samples.length > 6) drag.samples.shift();
      }
      return;
    }

    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    const over = inside && progress < 0.001 && !!hitsBook(event);
    if (over !== hover) {
      hover = over;
      hoverSince = (performance.now() - startTime) / 1000;
      onHover?.(over);
    }
    eventTarget.style.cursor = progress < 0.001 ? (over ? 'pointer' : '') : 'grab';
  }

  function onPointerUp(event) {
    const d = drag;
    drag = null;
    if (!d) return;
    if (!d.moved) {
      // A click: open the book, or turn the page that was clicked.
      const point = hitsBook(event);
      if (!point) return;
      if (target === 0) goTo(1);
      else goTo(point.x > 0 ? target + 1 : target - 1);
      return;
    }
    // Let go: carry on a little with the drag's speed, then settle on a page.
    const [t0, p0] = d.samples[0];
    const [t1, p1] = d.samples[d.samples.length - 1];
    const velocity = t1 > t0 ? ((p1 - p0) / (t1 - t0)) * 1000 : 0;
    const next = clamp(Math.round(progress + velocity * 0.25), 0, lastSpread);
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
    inset = { x: (f.left - c.left) / c.width, y: (f.top - c.top) / c.height };
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
  tick();

  return {
    goTo,
    dispose() {
      cancelAnimationFrame(frameId);
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
