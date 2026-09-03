import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jpeg = require('./mobile/node_modules/jpeg-js');

const rawJpg = fs.readFileSync('/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/.user_uploaded/media_1788110758874.jpg');
const decoded = jpeg.decode(rawJpg, { useTArray: true });
const { width, height, data } = decoded;

// 1. Precise Row Boundary Detection using smoothed vertical projection
const rowDensity = new Float32Array(height);
for (let y = 0; y < height; y++) {
  let nonWhite = 0;
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const distToWhite = Math.sqrt((255-r)**2 + (255-g)**2 + (255-b)**2);
    if (distToWhite > 35) nonWhite++;
  }
  rowDensity[y] = nonWhite;
}

// Find the 3 inter-row minimum valleys
const valleysY = [];
const expectedRowStarts = [0, height * 0.23, height * 0.48, height * 0.72];
for (let i = 1; i <= 3; i++) {
  const searchMin = Math.round(height * (i * 0.25 - 0.08));
  const searchMax = Math.round(height * (i * 0.25 + 0.08));
  let minVal = Infinity;
  let minIdx = searchMin;
  for (let y = searchMin; y <= searchMax; y++) {
    if (rowDensity[y] < minVal) {
      minVal = rowDensity[y];
      minIdx = y;
    }
  }
  valleysY.push(minIdx);
}

const rowIntervals = [
  { startY: 0, endY: valleysY[0] },
  { startY: valleysY[0], endY: valleysY[1] },
  { startY: valleysY[1], endY: valleysY[2] },
  { startY: valleysY[2], endY: height }
];

console.log("Calculated Optimal Row Cuts:", rowIntervals);

// For each row, find the 5 column minimum valleys between the 6 trees
rowIntervals.forEach((row, rIdx) => {
  const colDensity = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    let nonWhite = 0;
    for (let y = row.startY; y < row.endY; y++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const distToWhite = Math.sqrt((255-r)**2 + (255-g)**2 + (255-b)**2);
      if (distToWhite > 35) nonWhite++;
    }
    colDensity[x] = nonWhite;
  }

  const valleysX = [0];
  for (let i = 1; i <= 5; i++) {
    const searchMin = Math.round(width * (i / 6 - 0.07));
    const searchMax = Math.round(width * (i / 6 + 0.07));
    let minVal = Infinity;
    let minIdx = searchMin;
    for (let x = searchMin; x <= searchMax; x++) {
      if (colDensity[x] < minVal) {
        minVal = colDensity[x];
        minIdx = x;
      }
    }
    valleysX.push(minIdx);
  }
  valleysX.push(width);

  console.log(`Row ${rIdx + 1} (${row.startY}..${row.endY}) Column Cuts:`, valleysX);
});
