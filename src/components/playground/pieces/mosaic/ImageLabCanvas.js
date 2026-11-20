'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { releaseContext } from '@/lib/webgl';

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uTextureSize;
  uniform vec3 uBackground;
  uniform float uFit;
  uniform float uZoom;
  uniform vec2 uPosition;
  uniform float uTime;
  uniform float uShowOriginal;

  uniform float uMosaicEnabled;
  uniform float uMosaicTile;
  uniform float uNeighborBlend;
  uniform float uSaturation;
  uniform float uTileBorder;
  uniform float uMosaicGrain;

  uniform float uDitherEnabled;
  uniform float uDotSize;
  uniform float uSpacing;
  uniform float uEdgeScatter;
  uniform float uInterpretation;
  uniform vec3 uDitherInk;

  uniform float uCursorEnabled;
  uniform vec2 uLaggedPointer;
  uniform vec2 uPointerVelocity;
  uniform float uPointerActive;
  uniform float uCursorRadius;
  uniform float uCursorErase;
  uniform float uVelocitySpread;
  uniform float uMeshPush;

  uniform float uWaterEnabled;
  uniform float uDisplacement;
  uniform float uBands;
  uniform float uRoughness;
  uniform float uAmbientStrength;
  uniform float uAmbientSpeed;

  uniform float uContrast;
  uniform float uMidpoint;
  uniform float uEdgeInk;
  uniform float uInkBleed;
  uniform float uScreen;
  uniform float uScreenScale;
  uniform float uDryInk;
  uniform float uPaperGrain;
  uniform float uRegistration;
  uniform vec3 uInk0;
  uniform vec3 uInk1;
  uniform vec3 uInk2;
  uniform vec3 uInk3;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x),
      f.y
    );
  }

  vec2 mapImageUv(vec2 displayUv, out float inside) {
    float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
    float textureAspect = uTextureSize.x / max(uTextureSize.y, 1.0);
    vec2 imageUv = displayUv;

    if (uFit < 0.5) {
      if (textureAspect > canvasAspect) {
        imageUv.x = (imageUv.x - 0.5) * (canvasAspect / textureAspect) + 0.5;
      } else {
        imageUv.y = (imageUv.y - 0.5) * (textureAspect / canvasAspect) + 0.5;
      }
    } else {
      if (textureAspect > canvasAspect) {
        imageUv.y = (imageUv.y - 0.5) * (textureAspect / canvasAspect) + 0.5;
      } else {
        imageUv.x = (imageUv.x - 0.5) * (canvasAspect / textureAspect) + 0.5;
      }
    }

    vec2 center = mix(
      vec2(0.5 / uZoom),
      vec2(1.0 - 0.5 / uZoom),
      uPosition
    );
    imageUv = (imageUv - 0.5) / uZoom + center;
    imageUv.y = 1.0 - imageUv.y;

    inside =
      step(0.0, imageUv.x) *
      step(imageUv.x, 1.0) *
      step(0.0, imageUv.y) *
      step(imageUv.y, 1.0);
    return clamp(imageUv, 0.0, 1.0);
  }

  vec4 sourceAt(vec2 displayUv) {
    float inside = 1.0;
    vec2 imageUv = mapImageUv(displayUv, inside);
    vec4 source = texture2D(uTexture, imageUv);
    return mix(vec4(uBackground, 1.0), source, inside);
  }

  vec3 saturateColor(vec3 color, float amount) {
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    return clamp(mix(vec3(luminance), color, 1.0 + amount * 1.6), 0.0, 1.0);
  }

  vec4 mosaicAt(vec2 displayUv) {
    if (uMosaicEnabled < 0.5) {
      return sourceAt(displayUv);
    }

    float sourceInside = 1.0;
    mapImageUv(displayUv, sourceInside);
    if (uFit > 0.5 && sourceInside < 0.5) {
      return vec4(uBackground, 1.0);
    }

    vec2 pixel = displayUv * uResolution;
    vec2 cell = floor(pixel / uMosaicTile) * uMosaicTile + uMosaicTile * 0.5;
    vec2 cellUv = cell / uResolution;
    vec2 stepUv = vec2(uMosaicTile) / uResolution;

    vec4 center = sourceAt(cellUv);
    vec4 neighbors = (
      sourceAt(cellUv + vec2(stepUv.x, 0.0)) +
      sourceAt(cellUv - vec2(stepUv.x, 0.0)) +
      sourceAt(cellUv + vec2(0.0, stepUv.y)) +
      sourceAt(cellUv - vec2(0.0, stepUv.y))
    ) * 0.25;
    vec4 color = mix(center, neighbors, uNeighborBlend);
    color.rgb = saturateColor(color.rgb, uSaturation);

    vec2 within = fract(pixel / uMosaicTile);
    float edgeDistance = min(min(within.x, 1.0 - within.x), min(within.y, 1.0 - within.y));
    float border = 1.0 - smoothstep(0.0, 1.25 / max(uMosaicTile, 1.0), edgeDistance);
    color.rgb *= 1.0 - border * uTileBorder * 0.45;

    float grain = hash(floor(pixel) + vec2(17.3, 91.7)) - 0.5;
    color.rgb += grain * uMosaicGrain * 0.18;
    return vec4(clamp(color.rgb, 0.0, 1.0), 1.0);
  }

  vec2 applyWater(vec2 displayUv) {
    if (uWaterEnabled < 0.5) return displayUv;

    float currentTime = uTime * uAmbientSpeed * 2.0;
    float bandId = floor(displayUv.y * uBands);
    float rowShift = hash(vec2(bandId, 8.71)) * 2.0 - 1.0;
    float rowTempo = mix(0.11, 0.19, hash(vec2(bandId, 5.31)));
    float rowWave = sin(
      displayUv.y * uBands * 6.28318 +
      hash(vec2(bandId, 2.17)) * 6.28318 +
      currentTime * rowTempo
    );
    float broadWave = sin(displayUv.y * 31.0 - currentTime * 0.14);
    float brokenEdge = (hash(vec2(floor(displayUv.x * 15.0), bandId)) - 0.5) * uRoughness;
    float horizontalShift = (
      rowShift * 0.66 +
      rowWave * 0.22 +
      broadWave * 0.12 +
      brokenEdge * 0.13
    ) * uDisplacement * 0.115;
    float ambient = (
      sin(displayUv.y * 12.0 + currentTime * 0.22) * 0.0045 +
      sin(displayUv.y * 27.0 - currentTime * 0.13) * 0.0025
    ) * (0.45 + uDisplacement * 0.55) * uAmbientStrength;

    return vec2(clamp(displayUv.x + horizontalShift + ambient, 0.001, 0.999), displayUv.y);
  }

  vec2 applyCursorPush(vec2 displayUv) {
    if (uDitherEnabled < 0.5 || uCursorEnabled < 0.5 || uPointerActive < 0.5) {
      return displayUv;
    }

    vec2 deltaPixels = (displayUv - uLaggedPointer) * uResolution;
    float distancePixels = length(deltaPixels);
    float velocity = length(uPointerVelocity);
    float radius = uCursorRadius + velocity * uVelocitySpread;
    float influence = 1.0 - smoothstep(radius * 0.35, radius, distancePixels);
    vec2 direction = distancePixels > 0.1 ? normalize(deltaPixels) : vec2(0.0);
    return clamp(
      displayUv + direction * influence * uMeshPush / uResolution,
      vec2(0.001),
      vec2(0.999)
    );
  }

  vec4 applyDither(vec2 displayUv) {
    if (uDitherEnabled < 0.5) return mosaicAt(displayUv);

    vec2 pixel = displayUv * uResolution;
    vec2 gridCount = floor(uResolution / uSpacing);
    vec2 gridOffset = (uResolution - gridCount * uSpacing) * 0.5;
    vec2 adjusted = pixel - gridOffset;
    vec2 gridCenter = floor(adjusted / uSpacing) * uSpacing + uSpacing * 0.5;
    vec2 gridUv = (gridCenter + gridOffset) / uResolution;
    vec4 sampled = mosaicAt(gridUv);
    float brightness = dot(sampled.rgb, vec3(0.299, 0.587, 0.114));
    float detail = mix(1.0 - brightness, brightness, uInterpretation);
    float radius = uDotSize * smoothstep(0.12, 0.92, detail);
    float distanceToCenter = length(adjusted - gridCenter);
    float circle = 1.0 - smoothstep(radius - 0.65, radius + 0.65, distanceToCenter);

    vec2 gridIndex = floor(adjusted / uSpacing);
    float edgeDistance = min(min(pixel.x, uResolution.x - pixel.x), min(pixel.y, uResolution.y - pixel.y));
    float scatterZone = max(1.0, hash(gridIndex + vec2(41.7, 12.3)) * min(uResolution.x, uResolution.y) * 0.24);
    float edgeProbability = clamp(edgeDistance / scatterZone, 0.0, 1.0) * 0.8 + 0.2;
    float showProbability = mix(1.0, edgeProbability, uEdgeScatter);
    circle *= step(hash(gridIndex), showProbability);

    if (uCursorEnabled > 0.5 && uPointerActive > 0.5) {
      vec2 delta = (gridUv - uLaggedPointer) * uResolution;
      float velocity = length(uPointerVelocity);
      float radiusWithVelocity = uCursorRadius + velocity * uVelocitySpread;
      float cursorInfluence = 1.0 - smoothstep(radiusWithVelocity * 0.15, radiusWithVelocity, length(delta));
      float randomThreshold = hash(gridIndex + vec2(9.87, 6.54));
      float erased = cursorInfluence * uCursorErase;
      circle *= 1.0 - smoothstep(randomThreshold - 0.12, randomThreshold + 0.12, erased);
    }

    float inside = 1.0;
    mapImageUv(gridUv, inside);
    circle *= mix(1.0, inside, uFit);
    return vec4(mix(uBackground, uDitherInk, circle), 1.0);
  }

  vec3 paletteColor(float tone) {
    float bleed = mix(0.002, 0.14, uInkBleed);
    vec3 low = mix(uInk0, uInk1, smoothstep(0.25 - bleed, 0.25 + bleed, tone));
    vec3 high = mix(uInk2, uInk3, smoothstep(0.75 - bleed, 0.75 + bleed, tone));
    return mix(low, high, smoothstep(0.5 - bleed, 0.5 + bleed, tone));
  }

  vec4 applyPrint(vec2 displayUv, vec4 inputColor) {
    if (uWaterEnabled < 0.5) return inputColor;

    float sourceInside = 1.0;
    mapImageUv(displayUv, sourceInside);
    if (uFit > 0.5 && sourceInside < 0.5) {
      return vec4(uBackground, 1.0);
    }

    float luminance = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
    float contrast = mix(0.65, 2.25, uContrast);
    float tone = clamp((luminance - uMidpoint) * contrast + 0.5, 0.0, 1.0);
    vec3 color = paletteColor(tone);

    vec2 pixel = displayUv * uResolution;
    float sourceLeft = dot(mosaicAt(displayUv - vec2(1.5 / uResolution.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float sourceRight = dot(mosaicAt(displayUv + vec2(1.5 / uResolution.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float edge = smoothstep(0.04, 0.28, abs(sourceLeft - sourceRight)) * uEdgeInk;
    color = mix(color, uInk0, edge);

    float screenPattern = 1.0;
    float inkDensity = 1.0 - tone;
    if (uScreen < 0.5) {
      screenPattern = step(hash(floor(pixel / uScreenScale)), mix(0.12, 0.96, inkDensity));
    } else if (uScreen < 1.5) {
      vec2 cell = fract(pixel / uScreenScale) - 0.5;
      float dotRadius = mix(0.1, 0.68, inkDensity);
      screenPattern = 1.0 - smoothstep(dotRadius - 0.08, dotRadius + 0.08, length(cell));
    }
    vec3 screenedColor = mix(uBackground, color, screenPattern);
    color = mix(color, screenedColor, uDryInk * 0.72);

    float paper = hash(floor(pixel) + vec2(73.2, 19.4)) - 0.5;
    color += paper * uPaperGrain * 0.12;
    float plateWave = sin(pixel.x * 0.17 + pixel.y * 0.11);
    color.r += plateWave * uRegistration * 0.035;
    color.b -= plateWave * uRegistration * 0.025;
    return vec4(clamp(color, 0.0, 1.0), 1.0);
  }

  void main() {
    if (uShowOriginal > 0.5) {
      gl_FragColor = sourceAt(vUv);
      return;
    }
    vec2 workingUv = applyWater(vUv);
    workingUv = applyCursorPush(workingUv);
    vec4 color = applyDither(workingUv);
    gl_FragColor = applyPrint(workingUv, color);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'Unable to compile the Mosaic Image Lab shader.');
  }
  return shader;
}

function createProgram(gl) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || 'Unable to link the Mosaic Image Lab shader.');
  }
  return program;
}

function hexToRgb(hex) {
  const parsed = Number.parseInt(hex.replace('#', ''), 16);
  return [
    ((parsed >> 16) & 255) / 255,
    ((parsed >> 8) & 255) / 255,
    (parsed & 255) / 255,
  ];
}

const ImageLabCanvas = forwardRef(function ImageLabCanvas(
  { imageUrl, values, aspectRatio, onError },
  forwardedRef,
) {
  const canvasRef = useRef(null);
  const valuesRef = useRef(values);
  const textureSourceRef = useRef(null);
  const runtimeRef = useRef(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const laggedPointerRef = useRef({ x: 0.5, y: 0.5 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const pointerActiveRef = useRef(0);
  const lastPointerRef = useRef({ x: 0.5, y: 0.5, time: 0 });

  valuesRef.current = values;

  useImperativeHandle(forwardedRef, () => ({
    download() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `mosaic-image-lab-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    },
  }), []);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      textureSourceRef.current = image;
      runtimeRef.current?.upload(image);
    };
    image.onerror = () => onError?.('This image could not be loaded. Try a different file.');
    image.src = imageUrl;
  }, [imageUrl, onError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      onError?.('Mosaic Image Lab needs WebGL, which is unavailable in this browser.');
      return undefined;
    }

    let program;
    try {
      program = createProgram(gl);
    } catch (error) {
      onError?.(error.message);
      return undefined;
    }

    const position = gl.getAttribLocation(program, 'aPosition');
    const uniform = (name) => gl.getUniformLocation(program, name);
    const uniforms = {
      texture: uniform('uTexture'),
      resolution: uniform('uResolution'),
      textureSize: uniform('uTextureSize'),
      background: uniform('uBackground'),
      fit: uniform('uFit'),
      zoom: uniform('uZoom'),
      position: uniform('uPosition'),
      time: uniform('uTime'),
      showOriginal: uniform('uShowOriginal'),
      mosaicEnabled: uniform('uMosaicEnabled'),
      mosaicTile: uniform('uMosaicTile'),
      neighborBlend: uniform('uNeighborBlend'),
      saturation: uniform('uSaturation'),
      tileBorder: uniform('uTileBorder'),
      mosaicGrain: uniform('uMosaicGrain'),
      ditherEnabled: uniform('uDitherEnabled'),
      dotSize: uniform('uDotSize'),
      spacing: uniform('uSpacing'),
      edgeScatter: uniform('uEdgeScatter'),
      interpretation: uniform('uInterpretation'),
      ditherInk: uniform('uDitherInk'),
      cursorEnabled: uniform('uCursorEnabled'),
      laggedPointer: uniform('uLaggedPointer'),
      pointerVelocity: uniform('uPointerVelocity'),
      pointerActive: uniform('uPointerActive'),
      cursorRadius: uniform('uCursorRadius'),
      cursorErase: uniform('uCursorErase'),
      velocitySpread: uniform('uVelocitySpread'),
      meshPush: uniform('uMeshPush'),
      waterEnabled: uniform('uWaterEnabled'),
      displacement: uniform('uDisplacement'),
      bands: uniform('uBands'),
      roughness: uniform('uRoughness'),
      ambientStrength: uniform('uAmbientStrength'),
      ambientSpeed: uniform('uAmbientSpeed'),
      contrast: uniform('uContrast'),
      midpoint: uniform('uMidpoint'),
      edgeInk: uniform('uEdgeInk'),
      inkBleed: uniform('uInkBleed'),
      screen: uniform('uScreen'),
      screenScale: uniform('uScreenScale'),
      dryInk: uniform('uDryInk'),
      paperGrain: uniform('uPaperGrain'),
      registration: uniform('uRegistration'),
      inks: [uniform('uInk0'), uniform('uInk1'), uniform('uInk2'), uniform('uInk3')],
    };

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(uniforms.texture, 0);

    let textureWidth = 1;
    let textureHeight = 1;
    let animationFrame = null;
    let isVisible = true;
    let lastRenderedAt = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const screenMap = { stipple: 0, halftone: 1, clean: 2 };

    const upload = (image) => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureWidth = image.naturalWidth || image.width;
      textureHeight = image.naturalHeight || image.height;
    };

    const render = (now = performance.now()) => {
      const current = valuesRef.current;
      const quality = current.output.previewQuality === 'high' ? 2 : 1.35;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width * quality));
      const height = Math.max(1, Math.round(rect.height * quality));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const lag = current.cursor.lag / 100;
      laggedPointerRef.current.x += (pointerRef.current.x - laggedPointerRef.current.x) * lag;
      laggedPointerRef.current.y += (pointerRef.current.y - laggedPointerRef.current.y) * lag;
      velocityRef.current.x *= 0.92;
      velocityRef.current.y *= 0.92;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.textureSize, textureWidth, textureHeight);
      gl.uniform3fv(uniforms.background, hexToRgb(current.output.backgroundColor));
      gl.uniform1f(uniforms.fit, current.output.fit === 'contain' ? 1 : 0);
      gl.uniform1f(uniforms.zoom, current.output.zoom / 100);
      gl.uniform2f(uniforms.position, current.output.positionX / 100, 1 - current.output.positionY / 100);
      gl.uniform1f(uniforms.time, reducedMotion ? 0 : now / 1000);
      gl.uniform1f(uniforms.showOriginal, current.output.showOriginal ? 1 : 0);

      gl.uniform1f(uniforms.mosaicEnabled, current.mosaic.enabled ? 1 : 0);
      gl.uniform1f(uniforms.mosaicTile, current.mosaic.tileSize * quality);
      gl.uniform1f(uniforms.neighborBlend, current.mosaic.neighborBlend / 100);
      gl.uniform1f(uniforms.saturation, current.mosaic.saturation / 100);
      gl.uniform1f(uniforms.tileBorder, current.mosaic.tileBorder / 100);
      gl.uniform1f(uniforms.mosaicGrain, current.mosaic.grain / 100);

      gl.uniform1f(uniforms.ditherEnabled, current.dither.enabled ? 1 : 0);
      gl.uniform1f(uniforms.dotSize, current.dither.dotSize * quality);
      gl.uniform1f(uniforms.spacing, current.dither.spacing * quality);
      gl.uniform1f(uniforms.edgeScatter, current.dither.edgeScatter / 100);
      gl.uniform1f(uniforms.interpretation, current.dither.interpretation === 'light' ? 1 : 0);
      gl.uniform3fv(uniforms.ditherInk, hexToRgb(current.dither.inkColor));

      gl.uniform1f(uniforms.cursorEnabled, current.cursor.enabled ? 1 : 0);
      gl.uniform2f(uniforms.laggedPointer, laggedPointerRef.current.x, laggedPointerRef.current.y);
      gl.uniform2f(uniforms.pointerVelocity, velocityRef.current.x, velocityRef.current.y);
      gl.uniform1f(uniforms.pointerActive, pointerActiveRef.current);
      gl.uniform1f(uniforms.cursorRadius, current.cursor.radius * quality);
      gl.uniform1f(uniforms.cursorErase, current.cursor.erasure / 100);
      gl.uniform1f(uniforms.velocitySpread, current.cursor.velocitySpread * quality);
      gl.uniform1f(uniforms.meshPush, current.cursor.meshPush * quality);

      gl.uniform1f(uniforms.waterEnabled, current.water.enabled ? 1 : 0);
      gl.uniform1f(uniforms.displacement, current.water.displacement / 100);
      gl.uniform1f(uniforms.bands, current.water.bandDetail);
      gl.uniform1f(uniforms.roughness, current.water.edgeRoughness / 100);
      gl.uniform1f(uniforms.ambientStrength, reducedMotion ? 0 : current.water.ambientStrength / 100);
      gl.uniform1f(uniforms.ambientSpeed, current.water.ambientSpeed / 100);

      gl.uniform1f(uniforms.contrast, current.print.contrast / 100);
      gl.uniform1f(uniforms.midpoint, current.print.midtoneBalance / 100);
      gl.uniform1f(uniforms.edgeInk, current.print.edgeInk / 100);
      gl.uniform1f(uniforms.inkBleed, current.print.inkBleed / 100);
      gl.uniform1f(uniforms.screen, screenMap[current.print.texture]);
      gl.uniform1f(uniforms.screenScale, current.print.screenSize * quality);
      gl.uniform1f(uniforms.dryInk, current.print.dryInk / 100);
      gl.uniform1f(uniforms.paperGrain, current.print.paperGrain / 100);
      gl.uniform1f(uniforms.registration, current.print.plateOffset / 100);
      const palette = current.palette;
      [palette.inkOne, palette.inkTwo, palette.inkThree, palette.inkFour]
        .forEach((color, index) => gl.uniform3fv(uniforms.inks[index], hexToRgb(color)));

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const schedule = () => {
      if (animationFrame === null && isVisible && !document.hidden) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const animate = (now) => {
      animationFrame = null;
      if (now - lastRenderedAt >= 1000 / 30) {
        lastRenderedAt = now;
        render(now);
      }
      schedule();
    };

    const resizeObserver = new ResizeObserver(() => render());
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) schedule();
    }, { threshold: 0.05 });
    intersectionObserver.observe(canvas);
    const handleVisibility = () => {
      if (!document.hidden) schedule();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    runtimeRef.current = { render, upload };
    if (textureSourceRef.current) upload(textureSourceRef.current);
    render();
    schedule();

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      releaseContext(gl);
      runtimeRef.current = null;
    };
  }, [onError]);

  const handlePointerMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const next = {
      x: (event.clientX - rect.left) / rect.width,
      y: 1 - (event.clientY - rect.top) / rect.height,
    };
    const now = performance.now();
    const previous = lastPointerRef.current;
    const elapsed = Math.max(8, now - previous.time);
    velocityRef.current = {
      x: ((next.x - previous.x) / elapsed) * 1000,
      y: ((next.y - previous.y) / elapsed) * 1000,
    };
    if (!pointerActiveRef.current) laggedPointerRef.current = { ...next };
    pointerRef.current = next;
    lastPointerRef.current = { ...next, time: now };
    pointerActiveRef.current = 1;
  };

  const handlePointerLeave = () => {
    pointerActiveRef.current = 0;
    velocityRef.current = { x: 0, y: 0 };
  };

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none"
      style={{ aspectRatio }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label="Interactive Mosaic Image Lab preview"
    />
  );
});

export default ImageLabCanvas;
