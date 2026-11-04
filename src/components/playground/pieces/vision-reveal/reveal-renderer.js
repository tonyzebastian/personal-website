import { releaseContext } from "@/lib/webgl";

/**
 * Contour-reveal renderer (WebGL2, two-pass).
 *
 * Ported from the `temp-design/reveal-effect/index.html` prototype. Pass 1
 * accumulates the cursor brush into a decaying trail buffer; pass 2 composites
 * a flat base color with a hidden image, revealing the image where the trail
 * (or a permanent soft center region) overlaps with parts of the image that
 * deviate from the base color — warped along image contours + fbm noise.
 *
 * Added vs. the prototype: `baseReveal` / `baseRevealRadius` keep a soft area
 * in the middle permanently revealed so the field is never fully blank.
 */
export const REVEAL_DEFAULTS = {
    // Deviation reference for the reveal — must match the hidden image's own
    // background tone (not the section bg). The unrevealed field is transparent,
    // so only image content that differs from this color is revealed.
    base: "#ece8e1",
    contrast: 2.5,
    radius: 0.38,
    soft: 0.08,
    thresh: 0.06,
    disp: 0.094,
    noise: 0,
    decay: 0.94,
    hoverReveal: 0.5,
    baseReveal: 0.35,
    baseRevealRadius: 0.58,
};
const VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
const TRAIL_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPrev;
uniform vec2  uMouse;
uniform float uAspect;
uniform float uRadius;
uniform float uDecay;
uniform float uActive;
void main() {
  vec2 d = (vUv - uMouse) * vec2(uAspect, 1.0);
  float dist = length(d);
  float brush = (1.0 - smoothstep(uRadius * 0.35, uRadius, dist)) * uActive;
  float prev = texture(uPrev, vUv).r * uDecay;
  fragColor = vec4(vec3(max(prev, brush)), 1.0);
}`;
const COMPOSITE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uBg;
uniform sampler2D uTrail;
uniform vec2  uImageRes;
uniform float uImageAspect;
uniform float uCanvasAspect;
uniform vec3  uBase;
uniform float uThreshold;
uniform float uSoftness;
uniform float uDisplace;
uniform float uNoiseAmt;
uniform float uContrast;
uniform float uTime;
uniform float uBaseReveal;
uniform float uBaseRadius;
uniform float uPhase;
uniform float uHoverReveal;

float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a * vnoise(p); p *= 2.0; a *= 0.5; }
  return v;
}
vec2 containUv(vec2 uv){
  // Fit the whole image inside the canvas (letterbox). Out-of-[0,1] samples land
  // on clamped edge pixels (≈ base tone) so the leftover bands stay transparent.
  float ca = uCanvasAspect, ia = uImageAspect;
  if (ca > ia) uv.x = (uv.x - 0.5) * (ca / ia) + 0.5;
  else         uv.y = (uv.y - 0.5) * (ia / ca) + 0.5;
  return uv;
}
void main(){
  vec2 iuv = containUv(vUv);

  vec2 px = 1.0 / uImageRes;
  float lx = luma(texture(uBg, iuv + vec2(px.x, 0)).rgb) - luma(texture(uBg, iuv - vec2(px.x, 0)).rgb);
  float ly = luma(texture(uBg, iuv + vec2(0, px.y)).rgb) - luma(texture(uBg, iuv - vec2(0, px.y)).rgb);
  vec2 grad = vec2(lx, ly);

  float n = fbm(iuv * 6.0 + vec2(uTime * 0.05, -uTime * 0.04));

  vec2 gwarp = clamp(grad, -1.0, 1.0) * uDisplace;
  vec2 nwarp = (vec2(n, fbm(iuv * 6.0 + 13.7)) - 0.5) * uDisplace;
  float trail = texture(uTrail, vUv + gwarp + nwarp).r;

  // Single base-reveal blob that traces one clockwise circle as the section
  // scrolls into full view (uPhase 0 -> 1) and returns to its start, then holds.
  // Warped by fbm into an organic, slowly drifting form.
  const float ORBIT_RADIUS = 0.40;        // circle radius (vertical uv; X auto-matched)
  const vec2  ORBIT_CENTER = vec2(0.5, 0.62);
  const float START_ANGLE  = 1.5561945;   // 135deg => starts top-left; tweak this
  float ang = START_ANGLE - uPhase * 6.2831853; // minus => clockwise on screen
  // Aspect-correct X so the path reads as a true circle on screen (the canvas is
  // far wider than it is tall) instead of a flat, wide ellipse.
  vec2 anchor = ORBIT_CENTER + vec2(cos(ang) / uCanvasAspect, sin(ang)) * ORBIT_RADIUS;

  float fluid = fbm(vUv * 3.0 + vec2(uTime * 0.05, uTime * 0.03));
  vec2 cd = (vUv - anchor) * vec2(uCanvasAspect, 1.0);
  float fd = length(cd) + (fluid - 0.5) * 0.45;
  float center = (1.0 - smoothstep(uBaseRadius * 0.3, uBaseRadius, fd)) * uBaseReveal;
  // Cap the hover trail so it reveals only high-contrast content (like the base
  // blob) instead of flooding midtones — keeps the hover airy, not "burned".
  float reveal = max(trail * uHoverReveal, center);

  vec4 img = texture(uBg, iuv);
  float dev = clamp(length(img.rgb - uBase) * uContrast, 0.0, 1.0);
  float gate = dev * reveal;
  float edge = uThreshold - (n - 0.5) * uNoiseAmt;
  float mask = smoothstep(edge, edge + uSoftness, gate);
  // Force the unrevealed field to be exactly the base color (no noise bleed).
  mask *= smoothstep(0.0, 0.12, reveal);

  // Output the image with mask as alpha so the unrevealed field is fully
  // transparent — the section background (sand + grain) shows through and the
  // shader blends seamlessly instead of reading as an opaque card.
  fragColor = vec4(img.rgb, mask);
}`;
function hex2rgb(h) {
    return [
        parseInt(h.slice(1, 3), 16) / 255,
        parseInt(h.slice(3, 5), 16) / 255,
        parseInt(h.slice(5, 7), 16) / 255,
    ];
}
function compile(gl, type, src) {
    const s = gl.createShader(type);
    if (!s)
        throw new Error("Failed to create shader");
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) ?? "Shader compile error");
    }
    return s;
}
function program(gl, vs, fs) {
    const p = gl.createProgram();
    if (!p)
        throw new Error("Failed to create program");
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p) ?? "Program link error");
    }
    return p;
}
function uniforms(gl, p) {
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(p, i);
        if (info)
            u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return u;
}
export class RevealRenderer {
    constructor(canvas, params, imageSrc) {
        this.pp = [null, null];
        this.src = 0;
        this.imageRes = [1200, 675];
        this.imageAspect = 1200 / 675;
        this.dpr = 1;
        this.cw = 0;
        this.ch = 0;
        this.mouse = [0.5, 0.5];
        this.target = [0.5, 0.5];
        this.active = 0;
        this.hoverAmt = 0;
        // Orbit phase (0 = start position, 1 = one full clockwise loop, back to start).
        this.phase = 0;
        this.phaseTarget = 0;
        this.rafId = null;
        this.running = false;
        this.startTime = performance.now();
        this.resizeObserver = null;
        this.disposed = false;
        this.ready = false;
        this.loop = (now) => {
            if (!this.running)
                return;
            this.draw(now);
            this.rafId = requestAnimationFrame(this.loop);
        };
        this.canvas = canvas;
        this.params = { ...params };
        const gl = canvas.getContext("webgl2", {
            antialias: false,
            premultipliedAlpha: false,
            alpha: true,
        });
        if (!gl)
            throw new Error("WebGL2 not supported");
        this.gl = gl;
        gl.clearColor(0, 0, 0, 0);
        this.trailProg = program(gl, VERT, TRAIL_FRAG);
        this.compProg = program(gl, VERT, COMPOSITE_FRAG);
        this.trailU = uniforms(gl, this.trailProg);
        this.compU = uniforms(gl, this.compProg);
        const vao = gl.createVertexArray();
        if (!vao)
            throw new Error("Failed to create VAO");
        this.vao = vao;
        const bgTex = gl.createTexture();
        if (!bgTex)
            throw new Error("Failed to create texture");
        this.bgTex = bgTex;
        const img = new Image();
        img.onload = () => {
            if (this.disposed)
                return;
            this.imageRes = [img.naturalWidth, img.naturalHeight];
            this.imageAspect = img.naturalWidth / img.naturalHeight;
            gl.bindTexture(gl.TEXTURE_2D, bgTex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this.ready = true;
            this.renderOnce();
            canvas.dataset.ready = "true";
            canvas.dispatchEvent(new Event("ready"));
        };
        img.src = imageSrc;
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas);
        this.resize();
    }
    makeTarget(w, h) {
        const { gl } = this;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        return { tex, fbo, w, h };
    }
    clearTrail() {
        const { gl } = this;
        for (let i = 0; i < 2; i++) {
            const t = this.pp[i];
            if (!t)
                continue;
            gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
            gl.viewport(0, 0, t.w, t.h);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }
    resetTrail() {
        this.clearTrail();
    }
    resize() {
        if (this.disposed)
            return;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.cw = Math.floor(this.canvas.clientWidth * this.dpr);
        this.ch = Math.floor(this.canvas.clientHeight * this.dpr);
        if (this.cw === 0 || this.ch === 0)
            return;
        this.canvas.width = this.cw;
        this.canvas.height = this.ch;
        const tw = Math.max(2, Math.floor(this.cw / 2));
        const th = Math.max(2, Math.floor(this.ch / 2));
        this.pp[0] = this.makeTarget(tw, th);
        this.pp[1] = this.makeTarget(tw, th);
        this.clearTrail();
        if (!this.running)
            this.renderOnce();
    }
    draw(now) {
        const { gl } = this;
        if (!this.ready || !this.pp[0] || !this.pp[1])
            return;
        const t = (now - this.startTime) / 1000;
        this.mouse[0] += (this.target[0] - this.mouse[0]) * 0.35;
        this.mouse[1] += (this.target[1] - this.mouse[1]) * 0.35;
        // Fade the permanent center reveal out while the pointer is active so the
        // reveal follows the cursor instead of sitting in the middle. Fade out fast
        // on hover, ease back in gently when the pointer leaves.
        const hoverRate = this.active > this.hoverAmt ? 0.25 : 0.05;
        this.hoverAmt += (this.active - this.hoverAmt) * hoverRate;
        this.phase += (this.phaseTarget - this.phase) * 0.12;
        const dst = 1 - this.src;
        const dstT = this.pp[dst];
        const srcT = this.pp[this.src];
        // --- trail pass ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, dstT.fbo);
        gl.viewport(0, 0, dstT.w, dstT.h);
        gl.useProgram(this.trailProg);
        gl.bindVertexArray(this.vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, srcT.tex);
        gl.uniform1i(this.trailU.uPrev ?? null, 0);
        gl.uniform2f(this.trailU.uMouse ?? null, this.mouse[0], this.mouse[1]);
        gl.uniform1f(this.trailU.uAspect ?? null, this.cw / this.ch);
        gl.uniform1f(this.trailU.uRadius ?? null, this.params.radius);
        gl.uniform1f(this.trailU.uDecay ?? null, this.params.decay);
        gl.uniform1f(this.trailU.uActive ?? null, this.active);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        // --- composite pass ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.cw, this.ch);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.compProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.bgTex);
        gl.uniform1i(this.compU.uBg ?? null, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, dstT.tex);
        gl.uniform1i(this.compU.uTrail ?? null, 1);
        gl.uniform2f(this.compU.uImageRes ?? null, this.imageRes[0], this.imageRes[1]);
        gl.uniform1f(this.compU.uImageAspect ?? null, this.imageAspect);
        gl.uniform1f(this.compU.uCanvasAspect ?? null, this.cw / this.ch);
        const base = hex2rgb(this.params.base);
        gl.uniform3f(this.compU.uBase ?? null, base[0], base[1], base[2]);
        gl.uniform1f(this.compU.uThreshold ?? null, this.params.thresh);
        gl.uniform1f(this.compU.uSoftness ?? null, this.params.soft);
        gl.uniform1f(this.compU.uDisplace ?? null, this.params.disp);
        gl.uniform1f(this.compU.uNoiseAmt ?? null, this.params.noise);
        gl.uniform1f(this.compU.uContrast ?? null, this.params.contrast);
        gl.uniform1f(this.compU.uTime ?? null, t);
        gl.uniform1f(this.compU.uBaseReveal ?? null, this.params.baseReveal * (1 - this.hoverAmt));
        gl.uniform1f(this.compU.uBaseRadius ?? null, this.params.baseRevealRadius);
        gl.uniform1f(this.compU.uPhase ?? null, this.phase);
        gl.uniform1f(this.compU.uHoverReveal ?? null, this.params.hoverReveal);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        this.src = dst;
    }
    renderOnce() {
        this.draw(performance.now());
    }
    setParams(partial) {
        this.params = { ...this.params, ...partial };
        if (!this.running)
            this.renderOnce();
    }
    /** Orbit phase target, 0 (start) .. 1 (one full clockwise loop back to start). */
    setPhase(v) {
        this.phaseTarget = Math.max(0, Math.min(1, v));
        if (!this.running)
            this.renderOnce();
    }
    setMouse(x, y, present) {
        // x,y in CSS px relative to canvas top-left.
        const w = this.canvas.clientWidth || 1;
        const h = this.canvas.clientHeight || 1;
        this.target[0] = x / w;
        this.target[1] = 1 - y / h;
        this.active = present ? 1 : 0;
    }
    start() {
        if (this.running || this.disposed)
            return;
        this.running = true;
        this.startTime = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }
    stop() {
        this.running = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    dispose() {
        this.disposed = true;
        this.stop();
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        const { gl } = this;
        for (const t of this.pp) {
            if (t) {
                gl.deleteTexture(t.tex);
                gl.deleteFramebuffer(t.fbo);
            }
        }
        gl.deleteTexture(this.bgTex);
        gl.deleteVertexArray(this.vao);
        gl.deleteProgram(this.trailProg);
        gl.deleteProgram(this.compProg);
        releaseContext(gl);
    }
}
