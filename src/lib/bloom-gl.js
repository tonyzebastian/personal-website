// The WebGL renderer for HiddenGallery's bloom: paper bubbles holding photos
// that run together like a liquid.
//
// Every bubble (and the drop under the pointer) is a circle described by its
// signed distance (negative inside, positive outside, in CSS px). The shader
// joins them with a smooth minimum (Inigo Quilez's polynomial smin), which
// rounds the seam between two shapes over a blend radius K: far apart they
// stay round, near each other a neck grows between them. Because the shape
// is a true distance, its edge is anti-aliased to one device pixel, and the
// outline and shadow are read off the same distance, so they follow the
// necks too. Per pixel, bottom to top:
//   - a soft shadow (the field shifted down a little, faded out),
//   - a 1px ink hairline just outside the edge,
//   - the paper, a touch darker deep in the necks so they read as liquid,
//   - each bubble's photo, a circle inset INSET px, from one texture atlas.
// The scene is drawn into a fixed full-screen canvas, but only inside the
// scissor box around the shapes, so the cost follows the bloom, not the
// screen. WebGL 2 (for mipmaps on the atlas); without it the bloom is off.

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
uniform vec4 uShape[MAX]; // centre x, y, radius, photo radius (CSS px)
uniform vec4 uTex[MAX];   // atlas cell origin u, v, cell size, unused
uniform vec3 uSource;     // the drop under the pointer: x, y, radius
uniform float uK;         // blend radius of the necks
uniform sampler2D uAtlas;
uniform float uReady;     // 1 once the atlas has loaded
out vec4 color;

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// The joined shape's distance at p; hard is the plain union (no necks).
float field(vec2 p, out float hard) {
  float d = length(p - uSource.xy) - uSource.z;
  hard = d;
  for (int i = 0; i < MAX; i++) {
    if (i >= uCount) break;
    float di = length(p - uShape[i].xy) - uShape[i].z;
    d = smin(d, di, uK);
    hard = min(hard, di);
  }
  return d;
}

// Coverage of a shape at distance d: one device pixel of anti-aliasing.
float cover(float d) { return clamp(0.5 - d * uDpr, 0.0, 1.0); }

vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  float hard;
  float d = field(p, hard);
  float unused;
  float ds = field(p - vec2(0.0, 2.0), unused);

  // Shadow: a tight contact shade and a wider soft one, both from below.
  float shadow = 0.10 * (1.0 - smoothstep(-1.0, 2.0, ds)) + 0.07 * (1.0 - smoothstep(-2.0, 9.0, ds));
  vec4 result = vec4(0.0, 0.0, 0.0, shadow);

  // Hairline: 1px of ink just outside the edge.
  float ring = cover(d - 1.0) - cover(d);
  result = over(vec4(vec3(22.0, 2.0, 22.0) / 255.0, 1.0) * ring * 0.14, result);

  // Paper, shaded a little where the smin has filled in a neck.
  float neck = smoothstep(0.0, uK * 0.35, hard - d);
  vec3 paper = mix(vec3(1.0), vec3(0.955, 0.95, 0.945), neck);
  for (int i = 0; i < MAX; i++) {
    if (i >= uCount) break;
    vec4 s = uShape[i];
    float r = s.w;
    if (r <= 0.5) continue;
    vec2 local = (p - s.xy) / (2.0 * r) + 0.5;
    float c = clamp((r - length(p - s.xy)) * uDpr + 0.5, 0.0, 1.0);
    if (c <= 0.0) continue;
    vec4 t = uTex[i];
    vec2 uv = t.xy + clamp(local, 0.015, 0.985) * t.z;
    vec3 photo = mix(vec3(0.92), texture(uAtlas, uv).rgb, uReady);
    paper = mix(paper, photo, c);
  }
  float a = cover(d);
  result = over(vec4(paper * a, a), result);
  color = result;
}`;

// Sets up the canvas. Returns null when WebGL 2 is missing or fails.
export function createBloomRenderer(canvas, atlasUrl, cols) {
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
    tex: u('uTex'),
    source: u('uSource'),
    k: u('uK'),
    atlas: u('uAtlas'),
    ready: u('uReady'),
  };

  // The atlas: a grid of cols x cols photos (scripts/build-bloom-atlas.mjs).
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([235, 235, 235, 255]));
  gl.uniform1i(U.atlas, 0);
  let ready = 0;
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
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
  };
  image.src = atlasUrl;

  gl.enable(gl.SCISSOR_TEST);
  gl.clearColor(0, 0, 0, 0);
  const shapes = new Float32Array(MAX * 4);
  const tex = new Float32Array(MAX * 4);
  let dpr = 1;
  let drawn = false; // something is on the canvas

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
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

  // bubbles: [{ x, y, r, photo, index }] in CSS px; source: { x, y, r }.
  const draw = (bubbles, source, k) => {
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
      tex.set([(b.index % cols) * cell, Math.floor(b.index / cols) * cell, cell, 0], i * 4);
      left = Math.min(left, b.x - b.r);
      right = Math.max(right, b.x + b.r);
      top = Math.min(top, b.y - b.r);
      bottom = Math.max(bottom, b.y + b.r);
    }
    // Room for the neck, hairline and shadow.
    const pad = k + 14;
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
    gl.uniform3f(U.source, source.r > 0.5 ? source.x : -1e5, source.r > 0.5 ? source.y : -1e5, Math.max(0, source.r));
    gl.uniform1f(U.k, k);
    gl.uniform1f(U.ready, ready);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.scissor(0, 0, canvas.width, canvas.height);
    drawn = true;
  };

  return { gl, draw, clear, resize };
}
