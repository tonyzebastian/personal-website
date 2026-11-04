'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const OUTPUT_WIDTH = 900;
const ANALYSIS_WIDTH = 280;

const STYLE_PRESETS = {
  painterly: {
    brush: 'pastel',
    opacity: 0.5,
    length: 1,
    weight: 1,
    color: 1,
  },
  watercolor: {
    brush: 'marker',
    opacity: 0.2,
    length: 1.35,
    weight: 1.25,
    color: 0.88,
  },
  graphite: {
    brush: '2B',
    opacity: 0.66,
    length: 0.88,
    weight: 0.58,
    color: 0.08,
  },
  ink: {
    brush: 'rotring',
    opacity: 0.78,
    length: 1.08,
    weight: 0.45,
    color: 0.45,
  },
};

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function drawPlacedImage(context, image, width, height, output, alpha = 1) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const fitScale = output.fit === 'contain'
    ? Math.min(width / imageWidth, height / imageHeight)
    : Math.max(width / imageWidth, height / imageHeight);
  const scale = fitScale * (output.zoom / 100);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const x = (width - drawWidth) * (output.positionX / 100);
  const y = (height - drawHeight) * (output.positionY / 100);

  context.save();
  context.globalAlpha = alpha;
  context.drawImage(image, x, y, drawWidth, drawHeight);
  context.restore();
}

function createAnalysis(image, values, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  context.fillStyle = values.brush.paperColor;
  context.fillRect(0, 0, width, height);
  drawPlacedImage(context, image, width, height, values.output);
  return context.getImageData(0, 0, width, height);
}

function pixelAt(imageData, x, y) {
  const safeX = clamp(Math.round(x), 0, imageData.width - 1);
  const safeY = clamp(Math.round(y), 0, imageData.height - 1);
  const index = (safeY * imageData.width + safeX) * 4;
  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
  ];
}

function luminanceAt(imageData, x, y) {
  const [red, green, blue] = pixelAt(imageData, x, y);
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

function analyzeDirection(imageData, x, y) {
  const left = luminanceAt(imageData, x - 1, y);
  const right = luminanceAt(imageData, x + 1, y);
  const top = luminanceAt(imageData, x, y - 1);
  const bottom = luminanceAt(imageData, x, y + 1);
  const gradientX = right - left;
  const gradientY = bottom - top;

  return {
    angle: Math.atan2(gradientY, gradientX) + Math.PI / 2,
    strength: Math.min(255, Math.hypot(gradientX, gradientY) * 2.2),
  };
}

function strokeColor(rgb, style, fidelity, opacity, strength) {
  const luminance = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
  const colorAmount = fidelity * style.color;
  let red = luminance + (rgb[0] - luminance) * colorAmount;
  let green = luminance + (rgb[1] - luminance) * colorAmount;
  let blue = luminance + (rgb[2] - luminance) * colorAmount;

  if (style === STYLE_PRESETS.graphite) {
    red *= 0.68;
    green *= 0.7;
    blue *= 0.74;
  } else if (style === STYLE_PRESETS.ink) {
    red *= 0.72;
    green *= 0.78;
    blue *= 0.82;
  } else if (style === STYLE_PRESETS.watercolor) {
    red += (255 - red) * 0.08;
    green += (255 - green) * 0.08;
    blue += (255 - blue) * 0.08;
  }

  const alpha = opacity * (0.58 + (strength / 255) * 0.42);
  return `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${alpha.toFixed(3)})`;
}

function drawBaseLayer(canvas, image, values) {
  const context = canvas.getContext('2d');
  const originalBlend = values.output.showOriginal ? 1 : values.brush.originalBlend / 100;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = values.brush.paperColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (originalBlend > 0) {
    drawPlacedImage(context, image, canvas.width, canvas.height, values.output, originalBlend);
  }
}

function paintImage(brush, image, values, width, height) {
  const settings = values.brush;
  const style = STYLE_PRESETS[settings.style] || STYLE_PRESETS.painterly;
  const analysisHeight = Math.max(1, Math.round(ANALYSIS_WIDTH * height / width));
  const imageData = createAnalysis(image, values, ANALYSIS_WIDTH, analysisHeight);
  const outputScaleX = width / ANALYSIS_WIDTH;
  const outputScaleY = height / analysisHeight;
  const detail = settings.detail / 100;
  const size = settings.strokeSize;
  const edgeFollow = settings.edgeFollow / 100;
  const fidelity = settings.colorFidelity / 100;
  const seed = [
    settings.seed,
    settings.style,
    settings.detail,
    settings.strokeSize,
    settings.edgeFollow,
    settings.colorFidelity,
    values.output.fit,
    values.output.zoom,
    values.output.positionX,
    values.output.positionY,
  ].join(':');

  brush.seed(seed);
  brush.noiseSeed(seed);
  brush.clear();
  brush.noField();

  const passes = [
    {
      step: Math.round(25 - detail * 7),
      length: size * 4.4,
      weight: size * 1.35,
      opacity: style.opacity * 0.45,
      jitter: 0.42,
    },
    {
      step: Math.round(15 - detail * 5),
      length: size * 2.7,
      weight: size * 0.72,
      opacity: style.opacity * 0.72,
      jitter: 0.38,
    },
  ];

  if (detail > 0.38) {
    passes.push({
      step: Math.round(10 - detail * 4),
      length: size * 1.55,
      weight: size * 0.34,
      opacity: style.opacity,
      jitter: 0.3,
      edgesOnly: detail < 0.72,
    });
  }

  passes.forEach((pass, passIndex) => {
    const step = Math.max(4, pass.step);
    const offset = step * 0.5;

    for (let gridY = offset; gridY < analysisHeight; gridY += step) {
      for (let gridX = offset; gridX < ANALYSIS_WIDTH; gridX += step) {
        const x = clamp(gridX + brush.random(-step, step) * pass.jitter, 1, ANALYSIS_WIDTH - 2);
        const y = clamp(gridY + brush.random(-step, step) * pass.jitter, 1, analysisHeight - 2);
        const direction = analyzeDirection(imageData, x, y);
        if (pass.edgesOnly && direction.strength < 28 && brush.random() > 0.28) continue;

        const rgb = pixelAt(imageData, x, y);
        const tonalDetail = 0.62 + (1 - luminanceAt(imageData, x, y) / 255) * 0.45;
        const lineLength = pass.length
          * style.length
          * outputScaleX
          * brush.random(0.72, 1.32)
          * tonalDetail;
        const lineWeight = Math.max(
          0.45,
          pass.weight * style.weight * outputScaleX * brush.random(0.76, 1.2),
        );
        const orientationJitter = (1 - edgeFollow) * Math.PI * 0.85
          + (1 - Math.min(1, direction.strength / 80)) * Math.PI * 0.12;
        const angle = direction.angle + brush.random(-orientationJitter, orientationJitter);
        const centerX = x * outputScaleX - width / 2;
        const centerY = y * outputScaleY - height / 2;
        const dx = Math.cos(angle) * lineLength * 0.5;
        const dy = Math.sin(angle) * lineLength * 0.5;
        const alpha = pass.opacity * (passIndex === 0 ? 0.82 : 1);

        brush.set(
          style.brush,
          strokeColor(rgb, style, fidelity, alpha, direction.strength),
          lineWeight,
        );
        brush.line(centerX - dx, centerY - dy, centerX + dx, centerY + dy);
      }
    }
  });

  brush.render();
}

const BrushPainterCanvas = forwardRef(function BrushPainterCanvas(
  { imageUrl, values, aspectRatio, onError },
  forwardedRef,
) {
  const baseCanvasRef = useRef(null);
  const brushCanvasRef = useRef(null);
  const brushRef = useRef(null);
  const imageRef = useRef(null);
  const valuesRef = useRef(values);
  const renderTimerRef = useRef(null);
  const renderRef = useRef(() => {});
  const readyRef = useRef(false);

  valuesRef.current = values;

  const outputHeight = Math.max(1, Math.round(OUTPUT_WIDTH / aspectRatio));

  useImperativeHandle(forwardedRef, () => ({
    async download() {
      const brush = brushRef.current;
      const baseCanvas = baseCanvasRef.current;
      if (!brush || !baseCanvas || !readyRef.current) return false;

      const { width, height, pixels } = await brush.readPixels();
      const output = document.createElement('canvas');
      output.width = width;
      output.height = height;
      const context = output.getContext('2d');
      context.drawImage(baseCanvas, 0, 0, width, height);

      const strokes = document.createElement('canvas');
      strokes.width = width;
      strokes.height = height;
      strokes.getContext('2d').putImageData(new ImageData(pixels, width, height), 0, 0);
      context.drawImage(strokes, 0, 0);

      const blob = await new Promise((resolve) => output.toBlob(resolve, 'image/png'));
      if (!blob) return false;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `brush-painting-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      return true;
    },
  }), []);

  useEffect(() => {
    const image = new Image();
    let cancelled = false;
    image.decoding = 'async';
    image.onload = () => {
      if (cancelled) return;
      imageRef.current = image;
      onError?.('');
      renderRef.current();
    };
    image.onerror = () => onError?.('This image could not be loaded. Try a different file.');
    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl, onError]);

  useEffect(() => {
    const brushCanvas = brushCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    if (!brushCanvas || !baseCanvas) return undefined;

    let painting;
    let cancelled = false;
    readyRef.current = false;
    brushCanvas.width = OUTPUT_WIDTH;
    brushCanvas.height = outputHeight;
    baseCanvas.width = OUTPUT_WIDTH;
    baseCanvas.height = outputHeight;

    const render = () => {
      if (!readyRef.current || !painting || !imageRef.current) return;
      drawBaseLayer(baseCanvas, imageRef.current, valuesRef.current);
      paintImage(painting, imageRef.current, valuesRef.current, OUTPUT_WIDTH, outputHeight);
    };
    renderRef.current = render;

    async function initialize() {
      if (!('gpu' in navigator)) {
        onError?.('Brush Painter needs WebGPU. Try the latest Chrome or Edge.');
        return;
      }

      try {
        const brushModule = await import('webgpu-brush/standalone');
        if (cancelled) return;
        painting = brushModule.createBrush({ canvas: brushCanvas });
        painting.angleMode(brushModule.RADIANS);
        await painting.ready();

        if (cancelled) {
          painting.dispose();
          return;
        }

        brushRef.current = painting;
        readyRef.current = true;
        onError?.('');
        render();
      } catch (error) {
        console.error(error);
        if (!cancelled) onError?.('The WebGPU brush renderer could not start on this device.');
      }
    }

    initialize();

    return () => {
      cancelled = true;
      readyRef.current = false;
      brushRef.current = null;
      renderRef.current = () => {};
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
      painting?.dispose();
    };
  }, [onError, outputHeight]);

  useEffect(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(() => renderRef.current(), 180);
    return () => clearTimeout(renderTimerRef.current);
  }, [values]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-white" style={{ aspectRatio }}>
      <canvas ref={baseCanvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <canvas
        ref={brushCanvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Image rendered with procedural WebGPU brush strokes"
      />
    </div>
  );
});

export default BrushPainterCanvas;
