import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Builds the 365 Days of Drawing images from the original files.
// Run from the repository root:
//   node scripts/import-drawings.mjs /path/to/folder-of-originals
// The folder holds one image per day, named by its day number (1.png,
// 002.jpg, …). The originals are only read, never copied into public/. Each
// drawing becomes two WebP files:
//   public/playground/drawings/thumbs/001.webp   360px, for the grid
//   public/playground/drawings/large/001.webp    1600px, for the viewer
// and src/lib/drawings.json lists every day with its size.
const source = process.argv[2];
if (!source) throw new Error('Pass the folder containing the numbered drawings.');

const SIZES = { thumbs: { side: 360, quality: 80 }, large: { side: 1600, quality: 82 } };
const out = 'public/playground/drawings';

const files = (await fs.readdir(source, { recursive: true }))
  .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
  .map((file) => ({ file, day: Number(path.parse(file).name) }))
  .sort((a, b) => a.day - b.day);
if (files.length !== 365 || files.some(({ day }, i) => day !== i + 1)) {
  throw new Error('Expected exactly one numbered image for every day from 1 to 365.');
}

for (const dir of Object.keys(SIZES)) await fs.mkdir(path.join(out, dir), { recursive: true });

const manifest = [];
let index = 0;
const worker = async () => {
  while (index < files.length) {
    const { file, day } = files[index++];
    const name = `${String(day).padStart(3, '0')}.webp`;
    const input = sharp(path.join(source, file), { limitInputPixels: false }).rotate();
    let size;
    for (const [dir, { side, quality }] of Object.entries(SIZES)) {
      const info = await input
        .clone()
        .resize(side, side, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toFile(path.join(out, dir, name));
      if (dir === 'large') size = { width: info.width, height: info.height };
    }
    manifest[day - 1] = { day, ...size };
  }
};
await Promise.all(Array.from({ length: 6 }, worker));

await fs.writeFile('src/lib/drawings.json', JSON.stringify(manifest));
console.log(`Built ${manifest.length} drawings.`);
