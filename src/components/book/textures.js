// Draws every page of the book onto 2D canvases, which the WebGL scene uses
// as textures. A chapter is one illustration across both pages (a spread
// canvas, each page shows its half). Outer corners are cut round with
// transparency, so the pages need no rounded geometry.

export const PAGE_ASPECT = 1.2 / 1.05; // page depth (along the spine) / page width, as the reference's boards

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

  if (chapter.image) {
    const img = await loadImage(chapter.image);
    if (img) {
      const scale = Math.max(w / img.width, h / img.height);
      ctx.drawImage(img, (w - img.width * scale) / 2, (h - img.height * scale) / 2, img.width * scale, img.height * scale);
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
  grain(ctx, w, h, 0.08);

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

// The intro spread: plain paper with the video's poster printed on it. The
// scene lays the moving video over this once it plays. Like the old hero,
// the footage is multiplied onto the paper, so its white backdrop becomes
// the page.
async function drawIntro(intro, { width }) {
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
  const poster = await loadImage(intro.poster);
  if (poster) {
    const scale = Math.max(w / poster.width, h / poster.height);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(poster, (w - poster.width * scale) / 2, (h - poster.height * scale) / 2, poster.width * scale, poster.height * scale);
    ctx.globalCompositeOperation = 'source-over';
  }
  grain(ctx, w, h, 0.05);
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

  grain(ctx, w, h, 0.08);
  return { canvas, link };
}

// The cover: a dark board with chalky lettering.
function drawCover(cover, { width, fonts, back = false }) {
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

  const bg = ctx.createRadialGradient(w * 0.6, h * 0.35, 0, w * 0.5, h * 0.5, w * 0.9);
  bg.addColorStop(0, '#2b3036');
  bg.addColorStop(1, '#16191c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  wash(ctx, w, h, '#4a5058', 5);
  // A faint chalk smudge, as if wiped by hand.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * w * 0.3, 1 + Math.random() * 3);
  }
  ctx.restore();

  if (!back) {
    const lettering = layer(w, h, (l) => {
      l.fillStyle = '#f2ede4';
      l.strokeStyle = '#f2ede4';
      l.textAlign = 'center';
      serif(l, w * 0.15, fonts.serif);
      const [first, ...rest] = cover.title.split(' ');
      l.fillText(first, w / 2, h * 0.3);
      l.fillText(rest.join(' '), w / 2, h * 0.3 + w * 0.15);
      // Hand-drawn swoosh under the name, and an arrow pointing at it.
      l.globalAlpha = 0.8;
      l.lineWidth = w * 0.006;
      l.lineCap = 'round';
      l.beginPath();
      l.moveTo(w * 0.22, h * 0.3 + w * 0.2);
      l.bezierCurveTo(w * 0.4, h * 0.3 + w * 0.18, w * 0.62, h * 0.3 + w * 0.215, w * 0.8, h * 0.3 + w * 0.185);
      l.stroke();
      l.beginPath();
      l.moveTo(w * 0.88, h * 0.12);
      l.lineTo(w * 0.78, h * 0.19);
      l.moveTo(w * 0.78, h * 0.19);
      l.lineTo(w * 0.81, h * 0.135);
      l.moveTo(w * 0.78, h * 0.19);
      l.lineTo(w * 0.84, h * 0.19);
      l.stroke();
      serif(l, w * 0.068, fonts.serif, 'italic');
      l.globalAlpha = 0.78;
      wrapText(l, cover.subtitle, w * 0.68).forEach((line, i) => {
        l.fillText(line, w / 2, h * 0.3 + w * 0.3 + i * w * 0.085);
      });
      l.globalAlpha = 0.45;
      serif(l, w * 0.035, fonts.serif);
      l.fillText(cover.note, w / 2, h * 0.86);
      chalkify(l, w, h, 0.5);
    });
    ctx.drawImage(lettering, 0, 0);
  }

  // Spine hinge groove.
  const hinge = ctx.createLinearGradient(back ? w : 0, 0, back ? w * 0.9 : w * 0.1, 0);
  hinge.addColorStop(0, 'rgba(0,0,0,0.5)');
  hinge.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  hinge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hinge;
  ctx.fillRect(0, 0, w, h);

  grain(ctx, w, h, 0.12);
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

  const options = { width, fonts, motifs, icons };
  const pages = [{ layers: [drawCover(book.cover, options)], part: 'whole', edge: '#1d2024' }];
  if (book.intro) {
    const layers = [await drawIntro(book.intro, options)];
    const video = { src: book.intro.video, paper: book.intro.paper };
    pages.push({ layers, part: 'left', edge: book.intro.paper, video });
    pages.push({ layers, part: 'right', edge: book.intro.paper, video });
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
  pages.push({ layers: [drawCover(book.cover, { ...options, back: true })], part: 'whole', edge: '#1d2024' });
  return pages;
}
