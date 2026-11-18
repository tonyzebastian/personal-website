// Builds the leather cover's normal map from two inputs prepared on the page:
// `press`, an RGBA mask of what is pressed into the board (red the pattern,
// green the foil lettering, pressed only lightly), and `grain`, the
// scanned leather's normal map, tiled across the cover and flattened where
// the pattern is pressed in. Plain number crunching with no DOM, so it can run
// in a worker (see coverNormal.worker.js).
export function buildCoverNormal({ width, height, press, grain, grainSize, tiles }) {
  const d = new Uint8ClampedArray(width * height * 4);
  const tile = width / tiles;
  const depth = 4; // how deep the pressing reads
  const row = width * 4;
  for (let y = 0; y < height; y++) {
    const ty = Math.floor(((y % tile) / tile) * grainSize);
    for (let x = 0; x < width; x++) {
      const i = y * row + x * 4;
      const heightAt = (k) => press[k] + 0.15 * press[k + 1];
      const p = Math.min(1, Math.max(press[i], press[i + 1]) / 170);
      const here = heightAt(i);
      const left = x > 0 ? heightAt(i - 4) : here;
      const right = x < width - 1 ? heightAt(i + 4) : here;
      const up = y > 0 ? heightAt(i - row) : here;
      const down = y < height - 1 ? heightAt(i + row) : here;
      // Pressed in: the height drops where the mask is white.
      const ex = ((right - left) / 255) * depth;
      const ey = ((up - down) / 255) * depth;

      let lx = 0;
      let ly = 0;
      let lz = 1;
      if (grain) {
        const j = (ty * grainSize + Math.floor(((x % tile) / tile) * grainSize)) * 4;
        const flat = 2 * (1 - p);
        lx = (grain[j] / 127.5 - 1) * flat;
        ly = (grain[j + 1] / 127.5 - 1) * flat;
        lz = grain[j + 2] / 127.5 - 1;
      }
      const nx = lx + ex;
      const ny = ly + ey;
      const len = Math.hypot(nx, ny, lz) || 1;
      d[i] = 127.5 * (nx / len + 1);
      d[i + 1] = 127.5 * (ny / len + 1);
      d[i + 2] = 127.5 * (lz / len + 1);
      d[i + 3] = 255;
    }
  }
  return d;
}
