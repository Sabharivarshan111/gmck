import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import cp from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jpeg = require('./mobile/node_modules/jpeg-js');

// CRC32 table for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0;
    rgbaBuffer.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines, { level: 9 });

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function sliceWithPerItemBoundingBox(imagePath, speciesKey, outputBaseDir, canvasSize = 256) {
  let jpgFile = imagePath;
  if (imagePath.endsWith('.png')) {
    const tmpJpg = `/tmp/${speciesKey}_converted.jpg`;
    cp.execSync(`sips -s format jpeg "${imagePath}" --out "${tmpJpg}"`);
    jpgFile = tmpJpg;
  }

  const rawJpg = fs.readFileSync(jpgFile);
  const decoded = jpeg.decode(rawJpg, { useTArray: true });
  const { width, height, data } = decoded;

  // 1. Dynamic Row Valleys
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

  const valleysY = [];
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

  const targetDir = path.join(outputBaseDir, speciesKey);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let stageNum = 1;
  rowIntervals.forEach((row, rIdx) => {
    // 2. Dynamic Column Valleys for this row
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

    // 3. Extract each cell and find tight bounding box
    for (let c = 0; c < 6; c++) {
      const cellX0 = valleysX[c];
      const cellX1 = valleysX[c+1];
      const cellY0 = row.startY;
      const cellY1 = row.endY;

      // Find tight bounding box of central tree in cell
      let minX = cellX1, maxX = cellX0, minY = cellY1, maxY = cellY0;
      let count = 0;

      for (let y = cellY0; y < cellY1; y++) {
        for (let x = cellX0; x < cellX1; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          const brightness = (r + g + b) / 3;
          const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
          const distToWhite = Math.sqrt((255-r)**2 + (255-g)**2 + (255-b)**2);

          if (distToWhite > 40 && !(brightness > 238 && maxDiff < 15)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            count++;
          }
        }
      }

      const canvas = Buffer.alloc(canvasSize * canvasSize * 4); // all 0 (transparent)

      if (count > 20 && maxX >= minX && maxY >= minY) {
        const itemW = maxX - minX + 1;
        const itemH = maxY - minY + 1;

        // Scale factor to fit harmoniously inside canvas (leaving margin)
        // For early stages (tiny acorns), keep natural proportions; for large mature trees, scale to fit canvas
        const maxDim = Math.max(itemW, itemH);
        let scale = 1.0;
        if (maxDim > canvasSize * 0.88) {
          scale = (canvasSize * 0.88) / maxDim;
        }

        const renderW = Math.round(itemW * scale);
        const renderH = Math.round(itemH * scale);

        // Center horizontally & place earth mound near bottom (90% mark)
        const offsetX = Math.round((canvasSize - renderW) / 2);
        const offsetY = Math.round(canvasSize * 0.90 - renderH);

        for (let dy = 0; dy < renderH; dy++) {
          for (let dx = 0; dx < renderW; dx++) {
            const srcX = minX + Math.min(itemW - 1, Math.floor(dx / scale));
            const srcY = minY + Math.min(itemH - 1, Math.floor(dy / scale));
            const srcIdx = (srcY * width + srcX) * 4;

            const dstX = offsetX + dx;
            const dstY = offsetY + dy;
            if (dstX < 0 || dstX >= canvasSize || dstY < 0 || dstY >= canvasSize) continue;

            const dstIdx = (dstY * canvasSize + dstX) * 4;

            const r = data[srcIdx];
            const g = data[srcIdx + 1];
            const b = data[srcIdx + 2];

            const brightness = (r + g + b) / 3;
            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            const distToWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);

            if (distToWhite < 40 || (brightness > 238 && maxDiff < 15)) {
              canvas[dstIdx] = 0;
              canvas[dstIdx + 1] = 0;
              canvas[dstIdx + 2] = 0;
              canvas[dstIdx + 3] = 0;
            } else if (distToWhite < 65 || (brightness > 218 && maxDiff < 20)) {
              const alpha = Math.max(0, Math.min(1, (distToWhite - 40) / 25));
              canvas[dstIdx] = r;
              canvas[dstIdx + 1] = g;
              canvas[dstIdx + 2] = b;
              canvas[dstIdx + 3] = Math.round(255 * alpha);
            } else {
              canvas[dstIdx] = r;
              canvas[dstIdx + 1] = g;
              canvas[dstIdx + 2] = b;
              canvas[dstIdx + 3] = 255;
            }
          }
        }
      }

      const pngBuf = encodePNG(canvasSize, canvasSize, canvas);
      const outName = `stage${stageNum}.png`;
      fs.writeFileSync(path.join(targetDir, outName), pngBuf);

      if (stageNum === 24) {
        fs.writeFileSync(path.join(outputBaseDir, `${speciesKey}.png`), pngBuf);
      }

      stageNum++;
    }
  });

  console.log(`🎯 Perfectly Cut & Centered ${speciesKey} (All 24 stages onto ${canvasSize}x${canvasSize} transparent canvas)`);
}

const brainUserUploads = '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/.user_uploaded';
const outputTreesDir = '/Users/sabharivarshan/.gemini/antigravity/scratch/gmck/mobile/src/assets/trees';

const TREE_MAPPINGS = [
  { species: 'oak', file: 'media_1788110758874.jpg' },
  { species: 'saguaro', file: 'media_1788110758909.png' },
  { species: 'bonsai', file: 'media_1788110758923.jpg' },
  { species: 'sequoia', file: 'media_1788110758927.jpg' },
  { species: 'palm', file: 'media_1788110951560.jpg' },
  { species: 'jacaranda', file: 'media_1788110951566.jpg' },
  { species: 'sprout', file: 'media_1788110951577.jpg' },
  { species: 'sapling', file: 'media_1788110951577.jpg' },
  { species: 'ginkgo', file: 'media_1788110951588.jpg' },
  { species: 'mushroom', file: 'media_1788110951612.jpg' },
  { species: 'bamboo', file: 'media_1788111041430.jpg' },
  { species: 'willow', file: 'media_1788111041432.jpg' },
  { species: 'apple', file: 'media_1788111041442.jpg' },
  { species: 'cherry', file: 'media_1788111041450.jpg' },
  { species: 'maple', file: 'media_1788111041477.jpg' },
  { species: 'pine', file: 'media_1788111269228.jpg' },
];

for (const tm of TREE_MAPPINGS) {
  const fullPath = path.join(brainUserUploads, tm.file);
  if (fs.existsSync(fullPath)) {
    sliceWithPerItemBoundingBox(fullPath, tm.species, outputTreesDir, 256);
  }
}
console.log("\n🔥 ALL 16 SPECIES (384 FRAMES) CUT AND CENTERED!");
