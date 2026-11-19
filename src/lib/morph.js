// The FLIP morph shared by the home sections that switch views (Musings,
// Playground): measure each piece in the old view, switch, measure again, then
// animate the new pieces from the old places with Web Animations while copies
// of the old ones fade out over them in a layer inside the section.

export const MORPH = { duration: 400, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }; // --ease-snappy
export const STAGGER = 30; // ms between pieces

// Where an element sits, in screen pixels. `k` is the scale it is drawn at
// (a shrunk side card), so text can be sized against what is on screen.
export function measure(el, text = true) {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const k = el.offsetWidth ? rect.width / el.offsetWidth : 1;
  const style = getComputedStyle(el);
  // Text starts after any left padding (a row's date leaves room for a pipe).
  const pad = text ? parseFloat(style.paddingLeft) * k || 0 : 0;
  return {
    el,
    left: rect.left + pad,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    k,
    font: parseFloat(style.fontSize) * k,
  };
}

// From old to new for text: move its top left onto the old one and size it
// to the old font. Translation is in the element's own (possibly shrunk) space.
export function flipText(a, b) {
  return `translate(${(a.left - b.left) / b.k}px, ${(a.top - b.top) / b.k}px) scale(${a.font / b.font})`;
}

// From old to new for a box: cover the old rectangle exactly.
export function flipBox(a, b) {
  return `translate(${(a.left - b.left) / b.k}px, ${(a.top - b.top) / b.k}px) scale(${a.width / b.width}, ${a.height / b.height})`;
}

// A layer inside the section for the outgoing copies, so they scroll with the
// page if it moves mid-morph; the list column's own overflow clips anything
// flying past its edge, so nothing crosses over the panel. `origin` turns
// screen positions into the layer's.
export function cloneLayer(section) {
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.dataset.morphLayer = '';
  Object.assign(layer.style, { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '40' });
  section.appendChild(layer);
  const r = section.getBoundingClientRect();
  layer.origin = { left: r.left, top: r.top };
  return layer;
}

export function cloneText(m, layer) {
  const el = m.el;
  const style = getComputedStyle(el);
  const copy = el.cloneNode(true);
  copy.removeAttribute('data-morph');
  Object.assign(copy.style, {
    position: 'absolute',
    left: `${m.left - layer.origin.left}px`,
    top: `${m.top - layer.origin.top}px`,
    width: `${el.offsetWidth - parseFloat(style.paddingLeft)}px`,
    margin: '0',
    padding: '0',
    transformOrigin: '0 0',
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    whiteSpace: style.whiteSpace,
    overflow: 'hidden',
    textOverflow: style.textOverflow,
  });
  layer.appendChild(copy);
  return copy;
}

export function cloneBox(el, m, layer) {
  const copy = el.cloneNode(true);
  copy.querySelectorAll('[data-morph]').forEach((node) => node.removeAttribute('data-morph'));
  Object.assign(copy.style, {
    position: 'absolute',
    left: `${m.left - layer.origin.left}px`,
    top: `${m.top - layer.origin.top}px`,
    width: `${m.width / m.k}px`,
    height: `${m.height / m.k}px`,
    transformOrigin: '0 0',
  });
  // A copied <video> starts blank, so each one is swapped for a still of the
  // frame on screen.
  const videos = el.querySelectorAll('video');
  copy.querySelectorAll('video').forEach((video, i) => {
    const source = videos[i];
    const still = document.createElement('canvas');
    still.width = source.videoWidth || 1;
    still.height = source.videoHeight || 1;
    try {
      still.getContext('2d').drawImage(source, 0, 0);
    } catch {}
    still.className = video.className;
    still.style.cssText = video.style.cssText;
    video.replaceWith(still);
  });
  layer.appendChild(copy);
  return copy;
}

export function finishMorph(busy) {
  const run = busy.current;
  if (!run) return;
  busy.current = null;
  run.animations.forEach((anim) => anim.cancel());
  run.clones.forEach((node) => node.remove());
  document.querySelectorAll('[data-panes]').forEach((panes) => (panes.style.overflowY = ''));
}
