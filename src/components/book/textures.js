// Draws every page of the book onto 2D canvases, which the WebGL scene uses
// as textures. A chapter is one illustration across both pages (a spread
// canvas, each page shows its half). Outer corners are cut round with
// transparency, so the pages need no rounded geometry.

import { buildCoverNormal } from './coverNormal';

export const PAGE_ASPECT = 1.2 / 1.05; // page depth (along the spine) / page width, as the reference's boards

// Hard covers overhang the pages by this much on the three outer sides.
export const COVER_OVERHANG = 0.035;
const COVER_W = 1 + COVER_OVERHANG;
const COVER_D = PAGE_ASPECT + 2 * COVER_OVERHANG;

// The embossed frame on the front cover: its outer rule's distance from the
// spine (kept clear of the hinge) and from the other edges, in page widths.
const FRAME = { spine: 0.09, edge: 0.062 };
const FRAME_CENTRE = (FRAME.spine + COVER_W - FRAME.edge) / 2;
// How many times the leather scan repeats across the cover.
const LEATHER_TILES = 1.7;

// Deep bottle-green leather (drawn darker than it shows: the scene's light
// lifts it to about #1f3d2b), and the gold foil stamped into it.
const LEATHER = '#0b2314';
const FOIL = '#d9b45f';

const TABLE_SIZE = 1024;

function fontFamilies() {
  const style = getComputedStyle(document.body);
  return {
    serif: style.getPropertyValue('--font-caslon').trim() || 'Georgia, serif',
    sans: style.getPropertyValue('--font-figtree').trim() || 'system-ui, sans-serif',
  };
}

function roundedRect(ctx, x, y, w, h, [tl, tr, br, bl]) {
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function svgImage(markup) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// Paper fibre and grain, so flat colours read as printed board.
function grain(ctx, w, h, amount = 0.06) {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 256;
  const t = tile.getContext('2d');
  const data = t.createImageData(256, 256);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.random() * 255;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255 * amount;
  }
  t.putImageData(data, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Soft blobs of light and shade, like a painted wash.
function wash(ctx, w, h, color, seed) {
  let s = seed;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = (0.05 + rand() * 0.12) * w;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.05 + rand() * 0.07;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

// Rub out specks from whatever was just drawn, so lettering looks chalky.
function chalkify(ctx, w, h, density = 0.35) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const count = Math.floor(w * h * 0.0006 * density * 10);
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = Math.random() * 0.6;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5);
  }
  ctx.restore();
}

// Draws one layer (lettering) on its own canvas so chalk specks only bite it.
function layer(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  return c;
}

// Serif lettering as the site sets its headings: tight, -0.02em.
function serif(ctx, size, family, style = '') {
  ctx.font = `${style} 400 ${size}px ${family}`.trim();
  ctx.letterSpacing = `${-0.02 * size}px`;
}

// A chapter spread in three layers, like a pop-up picture book: the paper
// and caption (still), the motif and big word (drift a little), and the
// character (drifts most). The scene slides the upper layers with the mouse
// and while the page turns.
async function drawSpread(chapter, { width, fonts, motifs, icons }) {
  const w = width * 2;
  const h = Math.round(width * PAGE_ASPECT);
  const blank = () => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };
  const base = blank();
  const ctx = base.getContext('2d');
  const r = width * 0.07;
  roundedRect(ctx, 0, 0, w, h, [r, r, r, r]);
  ctx.clip();

  // A painted scene: the picture across both pages, and its words on the
  // left page, placed as in the Figma layout (a 700-wide page: text 97 in
  // and 71 down, set a little larger than Figma for reading on screen:
  // Figtree 23 on 34, up to 430 wide, 16 between paragraphs).
  if (chapter.image) {
    const img = await loadImage(chapter.image);
    if (img) {
      ctx.fillStyle = chapter.paper;
      ctx.fillRect(0, 0, w, h);
      const scale = Math.max(w / img.width, h / img.height);
      ctx.drawImage(img, (w - img.width * scale) / 2, (h - img.height * scale) / 2, img.width * scale, img.height * scale);
      const u = width / 700;
      ctx.fillStyle = chapter.ink;
      ctx.font = `${23 * u}px ${fonts.sans}`;
      ctx.letterSpacing = '0px';
      ctx.textBaseline = 'middle';
      // `text` places the words on the spread (1400 x 800 units): x, y and
      // width of the column. By default, top left of the left page.
      const { x = 97, y: top = 71, width: column = 430 } = chapter.text ?? {};
      let y = top * u;
      for (const paragraph of chapter.paragraphs ?? []) {
        for (const line of wrapText(ctx, paragraph, column * u)) {
          ctx.fillText(line, x * u, y + 17 * u);
          y += 34 * u;
        }
        y += 16 * u;
      }
      return [base];
    }
  }

  ctx.fillStyle = chapter.paper;
  ctx.fillRect(0, 0, w, h);
  wash(ctx, w, h, chapter.accent, chapter.word.length * 977);
  wash(ctx, w, h, '#ffffff', chapter.word.length * 131);

  // Caption on the right page, like a picture book. It stays still.
  const x = width + width * 0.16;
  ctx.fillStyle = chapter.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${width * 0.04}px ${fonts.sans}`;
  ctx.letterSpacing = '0px';
  const lines = wrapText(ctx, chapter.body, width * 0.64);
  const lineHeight = width * 0.058;
  let y = h * 0.93 - lines.length * lineHeight;
  serif(ctx, width * 0.07, fonts.serif);
  ctx.fillText(chapter.title, x, y - width * 0.035);
  ctx.font = `${width * 0.04}px ${fonts.sans}`;
  ctx.letterSpacing = '0px';
  ctx.globalAlpha = 0.85;
  for (const line of lines) {
    y += lineHeight;
    ctx.fillText(line, x, y);
  }
  ctx.globalAlpha = 1;
  grain(ctx, w, h, 0.01); // a light grain: the pages are a smooth stock

  // Middle layer: the motif drawing and the big chalky word.
  const mid = blank();
  const m = mid.getContext('2d');
  const motif = motifs[chapter.motif] && (await svgImage(motifs[chapter.motif]));
  if (motif) {
    const scale = Math.max(w / 200, h / 125);
    m.drawImage(motif, (w - 200 * scale) / 2, (h - 125 * scale) / 2, 200 * scale, 125 * scale);
  }
  const word = layer(w, h, (l) => {
    let size = Math.min(width * 0.56, (w * 0.84) / (chapter.word.length * 0.44));
    serif(l, size, fonts.serif);
    while (l.measureText(chapter.word).width > w * 0.86) {
      size *= 0.95;
      serif(l, size, fonts.serif);
    }
    l.textAlign = 'center';
    l.textBaseline = 'alphabetic';
    l.fillStyle = chapter.ink;
    l.globalAlpha = 0.92;
    l.fillText(chapter.word, w / 2, h * 0.52);
    const wordWidth = l.measureText(chapter.word).width;
    serif(l, width * 0.12, fonts.serif, 'italic');
    l.globalAlpha = 0.75;
    l.textAlign = 'left';
    l.fillText(chapter.kicker, w / 2 - wordWidth * 0.5, h * 0.52 - size * 0.86);
    chalkify(l, w, h);
  });
  m.drawImage(word, 0, 0);

  // Front layer: the character for this side of me, on the left page.
  // (Half resolution: it is a soft shape, and it saves GPU memory.)
  const front = document.createElement('canvas');
  front.width = w / 2;
  front.height = Math.round(h / 2);
  const icon = icons[chapter.motif] && (await svgImage(icons[chapter.motif]));
  if (icon) {
    const f = front.getContext('2d');
    f.scale(0.5, front.height / h);
    const size = width * 0.42;
    f.globalAlpha = 0.9;
    f.drawImage(icon, width * 0.2, h - size - h * 0.07, size, size);
  }
  return [base, mid, front];
}

// Paper surface maps, tiled across each page: roughness (green channel)
// and metalness (blue) from fibrous noise, and a normal map from the same
// noise, so light catches the grain the way it does on printed board.
export function drawPaperMaps() {
  const size = 512;
  const height = new Float32Array(size * size);
  // Value noise at a few scales, plus short fibres.
  const octave = (cells, amp) => {
    const grid = Array.from({ length: (cells + 1) * (cells + 1) }, () => Math.random());
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * cells;
        const gy = (y / size) * cells;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        const at = (i, j) => grid[((j % cells) * (cells + 1)) + (i % cells)];
        const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
        const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
        height[y * size + x] += (top * (1 - fy) + bottom * fy) * amp;
      }
    }
  };
  octave(8, 0.12);
  octave(32, 0.3);
  octave(128, 0.45);
  for (let i = 0; i < 2600; i++) {
    let x = Math.random() * size;
    let y = Math.random() * size;
    const angle = Math.random() * Math.PI;
    const len = 4 + Math.random() * 14;
    for (let t = 0; t < len; t++) {
      height[(Math.floor(y + size) % size) * size + (Math.floor(x + size) % size)] += 0.12;
      x += Math.cos(angle);
      y += Math.sin(angle);
    }
  }

  const rough = document.createElement('canvas');
  const normal = document.createElement('canvas');
  rough.width = rough.height = normal.width = normal.height = size;
  const rd = rough.getContext('2d').createImageData(size, size);
  const nd = normal.getContext('2d').createImageData(size, size);
  const h = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const v = Math.min(1, h(x, y));
      rd.data[i] = 0;
      rd.data[i + 1] = 255 * (0.75 + 0.25 * v); // roughness
      rd.data[i + 2] = 255 * (0.6 + 0.4 * v); // metalness (scaled by the material)
      rd.data[i + 3] = 255;
      const dx = (h(x + 1, y) - h(x - 1, y)) * 2;
      const dy = (h(x, y + 1) - h(x, y - 1)) * 2;
      const len = Math.hypot(dx, dy, 1);
      nd.data[i] = 127.5 * (-dx / len + 1);
      nd.data[i + 1] = 127.5 * (-dy / len + 1);
      nd.data[i + 2] = 127.5 * (1 / len + 1);
      nd.data[i + 3] = 255;
    }
  }
  rough.getContext('2d').putImageData(rd, 0, 0);
  normal.getContext('2d').putImageData(nd, 0, 0);
  return { rough, normal };
}

// The first spread as my hero photo: the photo across the right page, as it
// sits on the home page (same proportions, so it lines up exactly).
async function drawHeroSpread(intro, { width }) {
  const w = width * 2;
  const h = Math.round(width * PAGE_ASPECT);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = width * 0.07;
  roundedRect(ctx, 0, 0, w, h, [r, r, r, r]);
  ctx.clip();
  ctx.fillStyle = intro.paper;
  ctx.fillRect(0, 0, w, h);
  const photo = await loadImage(intro.photo);
  if (photo) {
    const scale = Math.max(width / photo.width, h / photo.height);
    const pw = photo.width * scale;
    const ph = photo.height * scale;
    ctx.drawImage(photo, width + (width - pw) / 2, (h - ph) / 2, pw, ph);
  }
  return canvas;
}

// A photo printed with a white border and some wear: the border a little
// uneven (off-centre, deeper at the bottom), softly rounded corners scuffed
// along the edges, fine grain over the picture, a few dust specks and one
// faint scratch. The wear comes from a fixed seed, so it is the same every
// time. `cx`/`cy` centre the print; `iw` x `ih` is the picture inside it.
function agedPrint(ctx, picture, { cx, cy, iw, ih, u, seed = 7 }) {
  let s = seed;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const edge = { top: 11 * u, right: 11 * u, bottom: 17 * u, left: 13 * u };
  const pw = iw + edge.left + edge.right;
  const ph = ih + edge.top + edge.bottom;
  const px = cx - pw / 2;
  const py = cy - ph / 2;
  const ix = px + edge.left;
  const iy = py + edge.top;

  // The border.
  ctx.save();
  roundedRect(ctx, px, py, pw, ph, [5 * u, 5 * u, 5 * u, 5 * u]);
  ctx.fillStyle = '#fffdf8';
  ctx.fill();
  ctx.clip();
  // Scuffs along the edges, thicker towards the corners.
  for (let i = 0; i < 260; i++) {
    const side = Math.floor(rand() * 4);
    const t = rand();
    const along = side % 2 === 0 ? pw : ph;
    const nearCorner = Math.min(t, 1 - t) < 0.12 ? 1 : 0.35;
    if (rand() > nearCorner) continue;
    const depth = rand() * 2.2 * u;
    const x = side === 0 ? px + t * along : side === 2 ? px + t * along : side === 1 ? px + pw - depth : px + depth;
    const y = side === 1 || side === 3 ? py + t * along : side === 0 ? py + depth : py + ph - depth;
    ctx.fillStyle = `rgba(150, 128, 95, ${0.08 + rand() * 0.14})`;
    ctx.fillRect(x, y, (0.4 + rand() * 1.4) * u, (0.4 + rand() * 1.4) * u);
  }
  ctx.restore();
  // A faint, uneven outline where the print ends.
  roundedRect(ctx, px, py, pw, ph, [5 * u, 5 * u, 5 * u, 5 * u]);
  ctx.strokeStyle = 'rgba(110, 90, 60, 0.12)';
  ctx.lineWidth = 0.8 * u;
  ctx.stroke();

  // The picture.
  ctx.save();
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();
  ctx.drawImage(picture, ix, iy, iw, ih);
  // Film grain.
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const t = tile.getContext('2d');
  const data = t.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = rand() * 255;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255 * 0.16;
  }
  t.putImageData(data, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(ix, iy, iw, ih);
  ctx.globalCompositeOperation = 'source-over';
  // Dust: mostly pale specks, a few dark ones.
  for (let i = 0; i < 26; i++) {
    const light = rand() > 0.25;
    ctx.fillStyle = light ? `rgba(255, 252, 240, ${0.45 + rand() * 0.45})` : `rgba(30, 24, 18, ${0.25 + rand() * 0.3})`;
    ctx.beginPath();
    ctx.arc(ix + rand() * iw, iy + rand() * ih, (0.3 + rand() * 1.1) * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // One faint scratch, a long gentle curve.
  const sx = ix + iw * (0.25 + rand() * 0.5);
  ctx.strokeStyle = 'rgba(255, 252, 240, 0.28)';
  ctx.lineWidth = 0.6 * u;
  ctx.beginPath();
  ctx.moveTo(sx, iy + ih * 0.08);
  ctx.quadraticCurveTo(sx + iw * 0.06, iy + ih * 0.35, sx - iw * 0.02, iy + ih * 0.62);
  ctx.stroke();
  ctx.restore();
  // A faint line where the picture meets its border.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = u;
  ctx.strokeRect(ix, iy, iw, ih);
}

// The first spread, under the cover, as the Figma "00 Cover" frame (700 x
// 800 pages): a handwritten line and my logo on the left page (the inside
// of the cover), and my photo on the right.
async function drawIntro(intro, { width, fonts }) {
  const w = width * 2;
  const h = Math.round(width * PAGE_ASPECT);
  const u = width / 700;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = width * 0.07;
  roundedRect(ctx, 0, 0, w, h, [r, r, r, r]);
  ctx.clip();
  ctx.fillStyle = intro.paper;
  ctx.fillRect(0, 0, w, h);

  const [logo, picture] = await Promise.all([loadImage(intro.logo), loadImage(intro.picture)]);

  // Left page, as the Figma frame: the line about the book (set like the
  // words on the next page, Figtree 23 on 34, in the frame's dark green,
  // centred in a 367-wide column from 167 in, 340 down), and the small logo
  // 337 below the line's top.
  ctx.fillStyle = '#152a18';
  ctx.font = `${23 * u}px ${fonts.sans}`;
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const column = 350.5 * u;
  // (The caption's own line breaks are kept; a long line still wraps.)
  const lines = intro.caption.split('\n').flatMap((part) => wrapText(ctx, part, 400 * u));
  lines.forEach((line, i) => ctx.fillText(line, column, 340 * u + 17 * u + i * 34 * u));
  ctx.textAlign = 'left';
  if (logo) ctx.drawImage(logo, 326.8 * u, 677 * u, 47.37 * u, 49 * u);

  // Right page: my photo as an old print glued onto the page, at its own
  // proportions, 440 wide, centred on the Figma's line 357 from the spine
  // and centred down the page (see agedPrint).
  if (picture) {
    const iw = 440 * u;
    const ih = (iw * picture.height) / picture.width;
    agedPrint(ctx, picture, { cx: width + 357 * u, cy: h / 2, iw, ih, u });
  }

  grain(ctx, w, h, 0.01); // a light grain: the pages are a smooth stock
  return canvas;
}

// The last spread: a closing thought on the left; on the right, "To be
// continued", the intro about me and a printed "More about me" link.
// Returns the canvas and where that link sits on it (fractions of the
// spread, from the top left), so the page can lay a real link over it.
function drawEnd(end, { width, fonts }) {
  const w = width * 2;
  const h = Math.round(width * PAGE_ASPECT);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = width * 0.07;
  roundedRect(ctx, 0, 0, w, h, [r, r, r, r]);
  ctx.clip();
  ctx.fillStyle = '#f6f0e6';
  ctx.fillRect(0, 0, w, h);
  wash(ctx, w, h, '#e6d6bf', 17);

  // Left page: the closing thought.
  ctx.fillStyle = '#32404f';
  ctx.textAlign = 'center';
  serif(ctx, width * 0.065, fonts.serif, 'italic');
  ctx.globalAlpha = 0.75;
  const lines = wrapText(ctx, end.body, width * 0.7);
  lines.forEach((line, i) => ctx.fillText(line, width / 2, h * 0.45 + i * width * 0.09));
  ctx.globalAlpha = 1;

  // Right page: title and swoosh.
  const x = width * 1.14;
  const title = layer(w, h, (l) => {
    l.fillStyle = '#32404f';
    l.textAlign = 'left';
    serif(l, width * 0.13, fonts.serif);
    l.fillText(end.word, x, h * 0.3);
    l.strokeStyle = '#32404f';
    l.lineWidth = width * 0.006;
    l.beginPath();
    l.moveTo(x, h * 0.34);
    l.bezierCurveTo(width * 1.4, h * 0.32, width * 1.6, h * 0.37, width * 1.8, h * 0.33);
    l.stroke();
    chalkify(l, w, h, 0.2);
  });
  ctx.drawImage(title, 0, 0);

  // The intro about me.
  const size = width * 0.043;
  const lineHeight = size * 1.5;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#32404f';
  ctx.font = `${size}px ${fonts.sans}`;
  ctx.letterSpacing = '0px';
  ctx.globalAlpha = 0.8;
  let y = h * 0.47;
  for (const line of wrapText(ctx, end.intro, width * 0.7)) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  ctx.globalAlpha = 1;

  // The link, with an arrow, printed like the site's links.
  y += lineHeight * 0.9;
  ctx.font = `500 ${size}px ${fonts.sans}`;
  ctx.fillText(end.link.label, x, y);
  const labelWidth = ctx.measureText(end.link.label).width;
  const ax = x + labelWidth + size * 0.45;
  const ay = y - size * 0.33;
  const aw = size * 0.8;
  ctx.strokeStyle = '#32404f';
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax + aw, ay);
  ctx.moveTo(ax + aw * 0.6, ay - aw * 0.38);
  ctx.lineTo(ax + aw, ay);
  ctx.lineTo(ax + aw * 0.6, ay + aw * 0.38);
  ctx.stroke();
  const pad = size * 0.35;
  const link = {
    left: (x - pad) / w,
    top: (y - size - pad * 0.4) / h,
    right: (ax + aw + pad) / w,
    bottom: (y + size * 0.3 + pad * 0.4) / h,
  };

  grain(ctx, w, h, 0.01); // a light grain: the pages are a smooth stock
  return { canvas, link };
}

// The cover: bottle-green pebbled leather with a blind-embossed double frame
// and a fleuron in each corner, and my name and description stamped in gold
// foil in the middle. Besides the colour it returns two maps
// the size of the cover board: a normal map (the scanned leather grain plus
// the pressing) and a foil map (blue: foil, green: pressed and burnished)
// that the scene turns into metalness and roughness. The back cover lies
// face down, so it only needs its colour, which its turn-in shows.

// Draw in board units: x from the spine, y up from the bottom edge.
function toBoard(ctx, w, h, scale = 1) {
  ctx.setTransform((w * scale) / COVER_W, 0, 0, (-h * scale) / COVER_D, 0, h * scale);
}

// One corner fleuron, in a frame where the corner is the origin and +x, +y
// point into the cover: a leaf along the diagonal, a scroll running out
// along each rule with a leaflet on it, and two dots.
function fleuron(ctx) {
  const leaf = (ax, ay, bx, by, width) => {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const len = Math.hypot(bx - ax, by - ay);
    const px = (-(by - ay) / len) * width;
    const py = ((bx - ax) / len) * width;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(mx + px, my + py, bx, by);
    ctx.quadraticCurveTo(mx - px, my - py, ax, ay);
    ctx.fill();
  };
  const dot = (x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  leaf(0.028, 0.028, 0.078, 0.078, 0.014);
  dot(0.088, 0.088, 0.0032);
  dot(0.098, 0.098, 0.0022);
  for (const swap of [false, true]) {
    const p = (x, y) => (swap ? [y, x] : [x, y]);
    ctx.beginPath();
    ctx.moveTo(...p(0.032, 0.026));
    ctx.bezierCurveTo(...p(0.048, 0.01), ...p(0.078, 0.008), ...p(0.092, 0.018));
    ctx.bezierCurveTo(...p(0.1, 0.025), ...p(0.094, 0.034), ...p(0.087, 0.03));
    ctx.stroke();
    dot(...p(0.087, 0.03), 0.0026);
    leaf(...p(0.058, 0.014), ...p(0.07, 0.036), 0.006);
  }
}

// The pressed pattern, in board units.
function embossPattern(ctx, color) {
  const x0 = FRAME.spine;
  const x1 = COVER_W - FRAME.edge;
  const y0 = FRAME.edge;
  const y1 = COVER_D - FRAME.edge;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // The outer rule.
  ctx.lineWidth = 0.0055;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // The inner rule, its corners notched with a quarter circle.
  const gap = 0.016;
  const n = 0.03;
  const [ix0, ix1, iy0, iy1] = [x0 + gap, x1 - gap, y0 + gap, y1 - gap];
  ctx.lineWidth = 0.0026;
  ctx.beginPath();
  ctx.moveTo(ix0 + n, iy0);
  ctx.lineTo(ix1 - n, iy0);
  ctx.arc(ix1, iy0, n, Math.PI, Math.PI / 2, true);
  ctx.lineTo(ix1, iy1 - n);
  ctx.arc(ix1, iy1, n, Math.PI * 1.5, Math.PI, true);
  ctx.lineTo(ix0 + n, iy1);
  ctx.arc(ix0, iy1, n, 0, -Math.PI / 2, true);
  ctx.lineTo(ix0, iy0 + n);
  ctx.arc(ix0, iy0, n, Math.PI / 2, 0, true);
  ctx.closePath();
  ctx.stroke();
  // A fleuron in each corner, pointing in.
  for (const [cx, cy, sx, sy] of [
    [ix0, iy0, 1, 1],
    [ix1, iy0, -1, 1],
    [ix1, iy1, -1, -1],
    [ix0, iy1, 1, -1],
  ]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);
    fleuron(ctx);
    ctx.restore();
  }
}

// The cover's lettering, set the way a clothbound title is stamped: spaced
// capitals of one size, stacked and centred a little above the middle, closed
// with a small ornament.
function coverTitle(ctx, cover, { w, h, fonts, fill, scale = 1 }) {
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const u = w / COVER_W; // pixels per page width
  const x = FRAME_CENTRE * u;
  const size = 0.15 * u;
  const tracking = size * 0.16;
  const leading = 0.205 * u;
  const top = h * 0.335;
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.012;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  serif(ctx, size, fonts.serif);
  cover.lines.forEach((text, i) => {
    // Letter by letter, so the spacing is the same in every browser.
    const letters = [...text.toUpperCase()];
    const widths = letters.map((letter) => ctx.measureText(letter).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + tracking * (letters.length - 1);
    let cursor = x - total / 2;
    letters.forEach((letter, k) => {
      ctx.fillText(letter, cursor, top + i * leading);
      ctx.strokeText(letter, cursor, top + i * leading);
      cursor += widths[k] + tracking;
    });
  });
  // The ornament: a small diamond between two short rules.
  const y = top + (cover.lines.length - 1) * leading + 0.095 * u;
  const d = 0.011 * u;
  ctx.lineWidth = 0.004 * u;
  ctx.beginPath();
  ctx.moveTo(x - 0.1 * u, y);
  ctx.lineTo(x - d * 2.2, y);
  ctx.moveTo(x + d * 2.2, y);
  ctx.lineTo(x + 0.1 * u, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - d);
  ctx.lineTo(x + d, y);
  ctx.lineTo(x, y + d);
  ctx.lineTo(x - d, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCover(cover, { width, fonts, leather, back = false }) {
  const w = width;
  const h = Math.round(width * PAGE_ASPECT);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = width * 0.07;
  // The cover sits on the right, so its outer corners are on the right;
  // the back cover ends up on the left.
  roundedRect(ctx, 0, 0, w, h, back ? [r, 0, 0, r] : [0, r, r, 0]);
  ctx.clip();

  // Leather: the base green, toned by the scan's pebbles, with soft
  // mottling and edges darkened by handling.
  ctx.fillStyle = LEATHER;
  ctx.fillRect(0, 0, w, h);
  if (leather.rough) {
    const size = Math.round(w / LEATHER_TILES);
    const tile = document.createElement('canvas');
    tile.width = tile.height = size;
    tile.getContext('2d').drawImage(leather.rough, 0, 0, size, size);
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  wash(ctx, w, h, '#3a6b4b', 5);
  wash(ctx, w, h, '#0b1d12', 11);
  const handled = ctx.createRadialGradient(w * 0.55, h * 0.45, w * 0.25, w * 0.5, h * 0.5, w * 0.85);
  handled.addColorStop(0, 'rgba(6,16,10,0)');
  handled.addColorStop(1, 'rgba(6,16,10,0.4)');
  ctx.fillStyle = handled;
  ctx.fillRect(0, 0, w, h);

  if (!back) {
    // Pressing burnishes the leather a shade darker.
    ctx.save();
    toBoard(ctx, w, h);
    embossPattern(ctx, 'rgba(3,12,6,0.7)');
    ctx.restore();

    // Gold foil, a little uneven where it did not take.
    const foil = layer(w, h, (l) => {
      coverTitle(l, cover, { w, h, fonts, fill: FOIL });
      l.globalCompositeOperation = 'source-atop';
      const sheen = l.createLinearGradient(w * 0.3, 0, w * 0.75, 0);
      sheen.addColorStop(0, 'rgba(255,244,210,0.25)');
      sheen.addColorStop(0.5, 'rgba(255,244,210,0)');
      sheen.addColorStop(1, 'rgba(255,244,210,0.2)');
      l.fillStyle = sheen;
      l.fillRect(0, 0, w, h);
    });
    ctx.drawImage(foil, 0, 0);
  }

  // Spine hinge groove.
  const hinge = ctx.createLinearGradient(back ? w : 0, 0, back ? w * 0.9 : w * 0.1, 0);
  hinge.addColorStop(0, 'rgba(0,0,0,0.45)');
  hinge.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  hinge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hinge;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 0.06);

  if (back) return { canvas };
  return { canvas, normal: drawCoverNormal(cover, { w, h, fonts, leather }), foil: drawCoverFoil(cover, { w, h, fonts }) };
}

// The cover's normal map, at twice the colour's resolution so the grain
// stays crisp: the leather scan tiled across it, flattened where the
// pattern is pressed in, plus the pressing itself.
async function drawCoverNormal(cover, { w, h, fonts, leather }) {
  const s = 2;
  const nw = w * s;
  const nh = h * s;
  const mask = document.createElement('canvas');
  mask.width = nw;
  mask.height = nh;
  const m = mask.getContext('2d');
  m.fillStyle = '#000';
  m.fillRect(0, 0, nw, nh);
  m.save();
  toBoard(m, w, h, s);
  // Red: the pressed pattern. Green: the foil lettering, which lies smooth
  // over the leather and is pressed in only lightly, so it stays solid.
  embossPattern(m, '#f00');
  m.restore();
  m.globalCompositeOperation = 'lighter';
  coverTitle(m, cover, { w, h, fonts, fill: '#0f0', scale: s });
  // Soften the pressing's walls.
  const soft = document.createElement('canvas');
  soft.width = nw;
  soft.height = nh;
  const sc = soft.getContext('2d', { willReadFrequently: true });
  sc.filter = 'blur(1.6px)';
  sc.drawImage(mask, 0, 0);
  const press = sc.getImageData(0, 0, nw, nh).data;

  let grainData = null;
  let grainSize = 0;
  if (leather.normal) {
    grainSize = leather.normal.width;
    const t = document.createElement('canvas');
    t.width = t.height = grainSize;
    const tc = t.getContext('2d', { willReadFrequently: true });
    tc.drawImage(leather.normal, 0, 0);
    grainData = tc.getImageData(0, 0, grainSize, grainSize).data;
  }

  const job = { width: nw, height: nh, press, grain: grainData, grainSize, tiles: LEATHER_TILES };
  const pixels = await inWorker(job).catch(() => buildCoverNormal(job));
  const normal = document.createElement('canvas');
  normal.width = nw;
  normal.height = nh;
  normal.getContext('2d').putImageData(new ImageData(pixels, nw, nh), 0, 0);
  return normal;
}

// Runs the normal map's sums off the main thread, so the page stays smooth.
function inWorker(job) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./coverNormal.worker.js', import.meta.url));
    worker.onmessage = ({ data }) => {
      worker.terminate();
      resolve(data);
    };
    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };
    worker.postMessage(job);
  });
}

// Blue marks the foil (metal, smooth); green the pressing (burnished, a
// little smoother than the leather around it).
function drawCoverFoil(cover, { w, h, fonts }) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  toBoard(ctx, w, h);
  embossPattern(ctx, 'rgb(0,255,0)');
  ctx.restore();
  coverTitle(ctx, cover, { w, h, fonts, fill: 'rgb(0,255,170)' });
  return canvas;
}


// The shadow under the book: a tight dark contact edge plus a wide soft
// falloff, nudged down and right, away from the light at the top left.
// Returns the canvas and how much bigger it is than the rectangle inside
// it, so the scene can stretch the rectangle to the book's footprint.
export function drawContactShadow() {
  const rw = 448;
  const rh = Math.round((rw / 2) * PAGE_ASPECT); // an open spread: 2 pages wide
  // Room for the blur to fade to nothing on every side, so the shadow never
  // ends in a hard edge.
  const pad = 96;
  const canvas = document.createElement('canvas');
  canvas.width = rw + pad * 2;
  canvas.height = rh + pad * 2;
  const ctx = canvas.getContext('2d');
  const r = rw * 0.035;
  const shape = (inset, dx, dy) => roundedRect(ctx, pad + inset + dx, pad + inset + dy, rw - inset * 2, rh - inset * 2, [r, r, r, r]);
  ctx.fillStyle = '#fff';
  // Wide, faint ambient shadow, falling mostly down and right (the light is
  // above and to the left), so little of it reaches above the book.
  ctx.filter = 'blur(18px)';
  ctx.globalAlpha = 0.34;
  shape(0, 6, 28);
  ctx.fill();
  // Mid shadow.
  ctx.filter = 'blur(10px)';
  ctx.globalAlpha = 0.35;
  shape(0, 3, 6);
  ctx.fill();
  // Tight contact line where the board meets the surface.
  ctx.filter = 'blur(2.5px)';
  ctx.globalAlpha = 0.55;
  shape(1, 1, 2);
  ctx.fill();
  ctx.filter = 'none';
  return { canvas, scaleX: canvas.width / rw, scaleY: canvas.height / rh };
}

// Layered page edges, one band per leaf in that page's colour.
export function drawEdges(colors) {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = colors.length * 16;
  const ctx = canvas.getContext('2d');
  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * 16, 8, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, i * 16 + 14, 8, 2);
  });
  return canvas;
}

// Builds every page. `motifs` and `icons` are SVG markup keyed by motif.
// Returns pages in reading order: { layers, part } where part is 'left' or
// 'right' (half of a spread) or 'whole'.
export async function drawPages(book, { width, motifs, icons }) {
  const fonts = fontFamilies();
  await Promise.all([
    document.fonts.load(`400 64px ${fonts.serif}`),
    document.fonts.load(`italic 400 64px ${fonts.serif}`),
    document.fonts.load(`400 32px ${fonts.sans}`),
  ]).catch(() => {});
  // Make sure the site's own faces are in, not just their fallbacks: load
  // every face of the serif and sans families outright, then wait for all.
  const families = [fonts.serif, fonts.sans].map((f) => f.split(',')[0].trim().replace(/['"]/g, ''));
  await Promise.all(
    [...document.fonts].filter((face) => families.includes(face.family)).map((face) => face.load().catch(() => {}))
  );
  await document.fonts.ready;

  // The leather scan: its normal map for the grain, its roughness map to
  // tone the colour. Missing files leave plain green leather.
  const [leatherNormal, leatherRough] = await Promise.all([
    loadImage('/book/leather-normal.webp'),
    loadImage('/book/leather-rough.webp'),
  ]);
  const leather = { normal: leatherNormal, rough: leatherRough };

  const options = { width, fonts, motifs, icons, leather };
  const front = drawCover(book.cover, options);
  const pages = [{ layers: [front.canvas], part: 'whole', foil: front.foil }];
  if (book.intro) {
    const layers = [await drawIntro(book.intro, options)];
    pages.push({ layers, part: 'left', edge: book.intro.paper });
    // Outside the dialog the cover closes over my hero photo, not this page,
    // so the page also comes as the photo alone, full bleed (`hero`).
    pages.push({ layers, part: 'right', edge: book.intro.paper, hero: await drawHeroSpread(book.intro, options) });
  }
  for (const chapter of book.chapters) {
    const layers = await drawSpread(chapter, options);
    pages.push({ layers, part: 'left', edge: chapter.paper });
    pages.push({ layers, part: 'right', edge: chapter.paper });
  }
  const endArt = drawEnd(book.end, options);
  const end = [endArt.canvas];
  pages.push({ layers: end, part: 'left', edge: '#f6f0e6' });
  pages.push({ layers: end, part: 'right', edge: '#f6f0e6', link: endArt.link });
  pages.push({ layers: [drawCover(book.cover, { ...options, back: true }).canvas], part: 'whole' });
  pages[0].normal = await front.normal; // being built alongside the pages above
  pages[0].leatherNormal = leather.normal; // for the leather turned in round the endpapers
  return pages;
}
