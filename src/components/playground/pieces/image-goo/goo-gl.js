// The WebGL renderer for Image Goo: photos in squircle bubbles that run
// together with a drop under the pointer like a liquid.
//
// Every bubble (and the drop) is a shape described by its signed distance
// (negative inside, positive outside, in CSS px). The shader joins them with
// a smooth minimum (Inigo Quilez's polynomial smin), which rounds the seam
// between two shapes over a blend radius K: far apart they stay apart, near
// each other a neck grows between them. Because the shape is a true
// distance, its edge is anti-aliased to one device pixel. To look like liquid
// rather than geometry, the outer edge wobbles with slow noise (only in the
// necks and while the pointer moves), and the bridges to the drop pinch and
// bead. The shapes can be rounded boxes (square to circle, by corner radius)
// or squircles. Per pixel, bottom to top:
//   - an optional outline just outside the edge,
//   - the goo (fill), a touch darker deep in the necks so they read as liquid,
//   - each bubble's photo, its shape inset by the frame width, from one
//     texture atlas.
// The canvas fills the piece's box, but only the scissor box around the
// shapes is drawn, so the cost follows the goo. WebGL 2 (for mipmaps on the
// atlas); without it the piece shows nothing.

export const MAX = 24; // bubbles drawn at once (shown and leaving)

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
#define MAX ${MAX}
uniform vec2 uSize;      // canvas size in CSS px
uniform float uDpr;
uniform int uCount;
uniform vec4 uShape[MAX]; // centre x, y, half size, photo half size (CSS px)
uniform vec4 uTex[MAX];   // atlas cell origin u, v, cell size, bridge radius to the drop (px, 0 for none)
uniform float uReach[MAX]; // px the bubble swells on the side facing the drop
uniform vec3 uSource;     // the drop under the pointer: x, y, radius
uniform float uK;         // blend radius of the necks
uniform float uKind;      // 0: rounded box (uRound sets the corners), 1: squircle
uniform float uRound;     // corner radius as a share of the half size (1 = circle)
uniform vec3 uFill;       // the goo's colour: the frame round each photo, the necks, the drop
uniform vec3 uRing;       // an outline's colour
uniform float uRingWidth; // px, 0 for none
uniform sampler2D uAtlas;
uniform float uReady;     // 1 once the atlas has loaded
uniform float uTime;      // s, moves the wobble
uniform float uWobble;    // px, how far edges wander at most
uniform float uEnergy;    // 0 to 1: how much the pointer is moving (the rest of the time the surface is smooth)
out vec4 color;

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// Distance from q (relative to the centre) to a shape of half size h and
// corner radius c. A squircle is the superellipse |x|^4 + |y|^4 = h^4. Its
// level function f = (x^4 + y^4)^(1/4) changes more slowly toward the
// corners (16% slower on the diagonal), so f - h alone would give a wider,
// uneven edge there; dividing by the gradient's length makes it a true
// distance near the edge, so the anti-aliasing and the frame are even all the
// way round.
float shape(vec2 q, float h, float c) {
  if (uKind > 0.5) {
    vec2 a = abs(q) + 1e-4;
    vec2 a2 = a * a;
    float f = pow(dot(a2, a2), 0.25);
    float grad = length(a2 * a) / (f * f * f);
    return (f - h) / grad;
  }
  vec2 d = abs(q) - vec2(h - c);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - c;
}

// Smooth value noise in [0, 1].
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

// A bridge from the drop (a, radius ra) to bubble i (b, half size hb), of
// radius w at its ends. Like a stretched thread of liquid it is thinnest in
// the middle, and while thin it breaks up into beads (the radius ripples
// along it, and where the ripple dips below zero there's a gap), which drift
// along it over time. As it thickens the beads run together into one neck.
float bridge(vec2 p, vec2 a, float ra, vec2 b, float hb, float w, float seed) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float len = length(ba);
  float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float across = length(pa - ba * t);
  float span = max(1.0, len - ra - hb);
  float g = clamp((t * len - ra) / span, 0.0, 1.0); // 0 at the drop's edge, 1 at the bubble's
  float pinch = 0.4 + 0.6 * pow(abs(2.0 * g - 1.0), 1.4);
  float thin = 1.0 - smoothstep(0.9, 2.6, w); // beads only while the thread is thin
  float ripple = sin(g * span / 5.5 * 6.2832 - uTime * 2.2 + seed * 1.7);
  float r = w * pinch * (1.0 + 0.6 * thin * ripple) - 0.35 * thin;
  return across - r;
}

// Every shape joined over uK, plus a bridge to each bubble near the drop
// (radius in uTex.w), blended in over a short radius so its ends flare into
// a neck. Unlike a longer blend radius, a bridge doesn't swell the drop.
// hard is the plain union of the shapes, without necks or bridges.
float field(vec2 p, out float hard) {
  // The drop is the bubbles' shape too (a squircle), like the square cursor.
  float d = shape(p - uSource.xy, uSource.z, uSource.z * uRound);
  hard = d;
  float bridges = 1e5;
  for (int i = 0; i < MAX; i++) {
    if (i >= uCount) break;
    float h = uShape[i].z;
    vec2 q = p - uShape[i].xy;
    float di = shape(q, h, h * uRound);
    // Swell toward the drop: a lobe of the frame on the side facing it.
    float reach = uReach[i];
    if (reach > 0.0) {
      vec2 toward = normalize(uSource.xy - uShape[i].xy + 1e-4);
      float facing = smoothstep(0.1, 1.0, dot(normalize(q + 1e-4), toward));
      di -= reach * facing * facing;
    }
    d = smin(d, di, uK);
    hard = min(hard, di);
    float w = uTex[i].w;
    if (w > 0.0) bridges = min(bridges, bridge(p, uSource.xy, uSource.z, uShape[i].xy, h, w, float(i)));
  }
  return smin(d, bridges, 6.0);
}

// Coverage of a shape at distance d: one device pixel of anti-aliasing.
float cover(float d) { return clamp(0.5 - d * uDpr, 0.0, 1.0); }

vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  float hard;
  float d = field(p, hard);

  // Wobble: slow noise pushes the outer edge out by varying amounts so it
  // looks like liquid (outward only, so it never eats into a photo). Only
  // where something is happening: in the necks and bridges (where the joined
  // shape departs from the plain union, which only happens near the pointer
  // or while bubbles come and go), and over everything while the pointer
  // moves (uEnergy, most on the drop, least on the frames). Still and alone,
  // the surface is smooth. A finer layer roughens the edge a touch.
  float neckness = smoothstep(0.0, 3.0, hard - d);
  float onDrop = 1.0 - smoothstep(0.0, 8.0, length(p - uSource.xy) - uSource.z);
  float amount = uWobble * max(neckness, uEnergy * mix(0.3, 1.0, onDrop));
  float slow = noise(p * 0.085 + vec2(uTime * 0.35, -uTime * 0.27)) * 2.0 - 1.0;
  float fine = noise(p * 0.42 - vec2(uTime * 0.6, uTime * 0.45)) * 2.0 - 1.0;
  d -= amount * (0.5 + 0.5 * (slow + 0.3 * fine) / 1.3);

  // The goo, a little darker where the smin has filled in a neck.
  float neck = smoothstep(0.0, uK * 0.35, hard - d);
  vec3 paper = uFill * mix(1.0, 0.93, neck);
  for (int i = 0; i < MAX; i++) {
    if (i >= uCount) break;
    vec4 s = uShape[i];
    float h = s.w;
    if (h <= 0.5) continue;
    vec2 q = p - s.xy;
    // The photo: the bubble's own shape, inset by exactly the frame width
    // (s.z - h), so the frame is even round the corners too. Its edge is
    // never wobbled, and the goo always covers it.
    float pd = shape(q, s.z, s.z * uRound) + (s.z - h);
    d = min(d, pd);
    float c = clamp(0.5 - pd * uDpr, 0.0, 1.0);
    if (c <= 0.0) continue;
    vec4 t = uTex[i];
    vec2 uv = t.xy + clamp(q / (2.0 * h) + 0.5, 0.015, 0.985) * t.z;
    vec3 photo = mix(vec3(0.92), texture(uAtlas, uv).rgb, uReady);
    paper = mix(paper, photo, c);
  }
  // Border: uRingWidth px just outside the edge, following the necks.
  float ring = uRingWidth > 0.0 ? cover(d - uRingWidth) - cover(d) : 0.0;
  vec4 result = vec4(uRing, 1.0) * ring;
  float a = cover(d);
  result = over(vec4(paper * a, a), result);
  color = result;
}`;

// Sets up the canvas. atlas: a promise of the photo atlas (an image or
// canvas holding a cols x cols grid of square photos); onReady runs once it is
// on the GPU, so a still scene can be drawn again with photos in it. Returns
// null when WebGL 2 is missing or fails.
export function createGooRenderer(canvas, atlas, cols, onReady) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  // One triangle that covers the screen; the scissor box limits the work.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (name) => gl.getUniformLocation(program, name);
  const U = {
    size: u('uSize'),
    dpr: u('uDpr'),
    count: u('uCount'),
    shape: u('uShape'),
    reach: u('uReach'),
    tex: u('uTex'),
    source: u('uSource'),
    k: u('uK'),
    atlas: u('uAtlas'),
    ready: u('uReady'),
    time: u('uTime'),
    wobble: u('uWobble'),
    energy: u('uEnergy'),
    kind: u('uKind'),
    round: u('uRound'),
    fill: u('uFill'),
    ring: u('uRing'),
    ringWidth: u('uRingWidth'),
  };

  // The atlas, grey until it arrives.
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([235, 235, 235, 255]));
  gl.uniform1i(U.atlas, 0);
  let ready = 0;
  atlas.then((image) => {
    if (gl.isContextLost()) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    ready = 1;
    onReady?.();
  }, () => {}); // if the photos can't load, the bubbles stay grey

  gl.enable(gl.SCISSOR_TEST);
  gl.clearColor(0, 0, 0, 0);
  const shapes = new Float32Array(MAX * 4);
  const tex = new Float32Array(MAX * 4);
  const reach = new Float32Array(MAX);
  let dpr = 1;
  let drawn = false; // something is on the canvas

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    drawn = true; // a resize clears the canvas; make sure the next frame clears its scissor too
  };
  resize();

  const clear = () => {
    if (!drawn) return;
    gl.scissor(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawn = false;
  };

  // bubbles: [{ x, y, r, photo, index, bridge, reach }] in CSS px (r and photo
  // are half sizes, bridge the radius of its line to the drop and reach how
  // far it swells toward the drop, 0 for none); source: { x, y, r }; look: { kind, round, fill: [r, g, b], time?, wobble?, energy?, ring?, ringWidth? }.
  const draw = (bubbles, source, k, look) => {
    clear();
    const n = Math.min(MAX, bubbles.length);
    if (!n && source.r <= 0.5) return;
    let left = source.r > 0.5 ? source.x - source.r : Infinity;
    let right = source.r > 0.5 ? source.x + source.r : -Infinity;
    let top = source.r > 0.5 ? source.y - source.r : Infinity;
    let bottom = source.r > 0.5 ? source.y + source.r : -Infinity;
    const cell = 1 / cols;
    for (let i = 0; i < n; i++) {
      const b = bubbles[i];
      shapes.set([b.x, b.y, b.r, b.photo], i * 4);
      tex.set([(b.index % cols) * cell, Math.floor(b.index / cols) * cell, cell, b.bridge ?? 0], i * 4);
      reach[i] = b.reach ?? 0;
      left = Math.min(left, b.x - b.r - (b.reach ?? 0));
      right = Math.max(right, b.x + b.r + (b.reach ?? 0));
      top = Math.min(top, b.y - b.r - (b.reach ?? 0));
      bottom = Math.max(bottom, b.y + b.r + (b.reach ?? 0));
    }
    // Room for the neck and the border.
    const pad = k + 4 + (look.wobble ?? 0) * 1.3;
    const x0 = Math.max(0, Math.floor((left - pad) * dpr));
    const x1 = Math.min(canvas.width, Math.ceil((right + pad) * dpr));
    const y0 = Math.max(0, Math.floor((top - pad) * dpr));
    const y1 = Math.min(canvas.height, Math.ceil((bottom + pad) * dpr));
    if (x1 <= x0 || y1 <= y0) return;
    // Scissor is from the bottom left.
    gl.scissor(x0, canvas.height - y1, x1 - x0, y1 - y0);
    gl.uniform2f(U.size, canvas.width / dpr, canvas.height / dpr);
    gl.uniform1f(U.dpr, dpr);
    gl.uniform1i(U.count, n);
    gl.uniform4fv(U.shape, shapes);
    gl.uniform4fv(U.tex, tex);
    gl.uniform1fv(U.reach, reach);
    gl.uniform3f(U.source, source.r > 0.5 ? source.x : -1e5, source.r > 0.5 ? source.y : -1e5, Math.max(0, source.r));
    gl.uniform1f(U.k, k);
    gl.uniform1f(U.ready, ready);
    gl.uniform1f(U.time, look.time ?? 0);
    gl.uniform1f(U.wobble, look.wobble ?? 0);
    gl.uniform1f(U.energy, look.energy ?? 0);
    gl.uniform1f(U.kind, look.kind === 'squircle' ? 1 : 0);
    gl.uniform1f(U.round, look.round);
    gl.uniform3fv(U.fill, look.fill);
    gl.uniform3fv(U.ring, look.ring ?? look.fill);
    gl.uniform1f(U.ringWidth, look.ringWidth ?? 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.scissor(0, 0, canvas.width, canvas.height);
    drawn = true;
  };

  return { gl, draw, clear, resize };
}
