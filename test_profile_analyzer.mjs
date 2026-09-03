import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jpeg = require('./mobile/node_modules/jpeg-js');

const rawJpg = fs.readFileSync('/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/.user_uploaded/media_1788110758874.jpg');
const decoded = jpeg.decode(rawJpg, { useTArray: true });
const { width, height, data } = decoded;
console.log(`Image dimensions: ${width}x${height}`);

// Calculate row density (fraction of non-white pixels per row)
const rowDensity = new Float32Array(height);
for (let y = 0; y < height; y++) {
  let nonWhite = 0;
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const distToWhite = Math.sqrt((255-r)**2 + (255-g)**2 + (255-b)**2);
    if (distToWhite > 40) nonWhite++;
  }
  rowDensity[y] = nonWhite / width;
}

// Find row gaps (where rowDensity drops near 0)
const rowBands = [];
let inBand = false;
let startY = 0;
for (let y = 0; y < height; y++) {
  if (rowDensity[y] > 0.005) {
    if (!inBand) {
      inBand = true;
      startY = y;
    }
  } else {
    if (inBand) {
      inBand = false;
      rowBands.push({ startY, endY: y, height: y - startY });
    }
  }
}
if (inBand) rowBands.push({ startY, endY: height, height: height - startY });

console.log("Detected Row Bands:", rowBands);

// For each row band, find column bands
rowBands.forEach((band, rIdx) => {
  const colDensity = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    let nonWhite = 0;
    for (let y = band.startY; y < band.endY; y++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const distToWhite = Math.sqrt((255-r)**2 + (255-g)**2 + (255-b)**2);
      if (distToWhite > 40) nonWhite++;
    }
    colDensity[x] = nonWhite / band.height;
  }

  const colBands = [];
  let inCol = false;
  let startX = 0;
  for (let x = 0; x < width; x++) {
    if (colDensity[x] > 0.005) {
      if (!inCol) {
        inCol = true;
        startX = x;
      }
    } else {
      if (inCol) {
        inCol = false;
        colBands.push({ startX, endX: x, width: x - startX });
      }
    }
  }
  if (inCol) colBands.push({ startX, endX: width, width: width - startX });
  console.log(`Row ${rIdx + 1} (${band.startY} to ${band.endY}, H=${band.height}) has ${colBands.length} items:`, colBands.map(c => `[${c.startX}..${c.endX}, W=${c.width}]`));
});
