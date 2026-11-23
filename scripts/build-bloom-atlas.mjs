// Packs the photography set into one square texture for HiddenGallery's
// WebGL bloom: a grid of CELL px squares (centre crops), in the order of
// src/lib/photos.json, written to public/images/visuals/bloom-atlas.webp.
// Run again whenever photos.json changes: node scripts/build-bloom-atlas.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const CELL = 192; // px per photo: sharp at the bloom's largest size on a 2x screen
const photos = JSON.parse(await readFile(new URL('../src/lib/photos.json', import.meta.url)));
const cols = Math.ceil(Math.sqrt(photos.length));
const size = cols * CELL;

const tiles = await Promise.all(
  photos.map(async (photo, i) => ({
    input: await sharp(`public/images/visuals/${photo.id}.jpg`).resize(CELL, CELL, { fit: 'cover' }).toBuffer(),
    left: (i % cols) * CELL,
    top: Math.floor(i / cols) * CELL,
  })),
);

await sharp({ create: { width: size, height: size, channels: 3, background: '#ebebeb' } })
  .composite(tiles)
  .webp({ quality: 82 })
  .toFile('public/images/visuals/bloom-atlas.webp');

console.log(`bloom-atlas.webp: ${photos.length} photos, ${cols}x${cols} grid of ${CELL}px`);
