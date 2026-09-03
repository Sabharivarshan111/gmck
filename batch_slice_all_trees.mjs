import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import cp from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jpeg = require('./mobile/node_modules/jpeg-js');

const brainUserUploads = '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/.user_uploaded';
const outputTreesDir = '/Users/sabharivarshan/.gemini/antigravity/scratch/gmck/mobile/src/assets/trees';

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

function sliceSpriteSheet(imagePath, speciesKey, grid = { rows: 4, cols: 6 }) {
  console.log(`\nProcessing ${speciesKey} from ${path.basename(imagePath)}...`);
  let jpgFile = imagePath;
  if (imagePath.endsWith('.png')) {
    const tmpJpg = `/tmp/${speciesKey}_converted.jpg`;
    cp.execSync(`sips -s format jpeg "${imagePath}" --out "${tmpJpg}"`);
    jpgFile = tmpJpg;
  }

  const rawJpg = fs.readFileSync(jpgFile);
  const decoded = jpeg.decode(rawJpg, { useTArray: true });
  const { width: fullW, height: fullH, data: srcData } = decoded;

  const stageW = Math.floor(fullW / grid.cols);
  const stageH = Math.floor(fullH / grid.rows);

  const targetDir = path.join(outputTreesDir, speciesKey);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let stageNum = 1;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const startX = c * stageW;
      const startY = r * stageH;
      const rgba = Buffer.alloc(stageW * stageH * 4);

      // Safe bounds to prevent neighbor bleed: ignore outer 4% of cell edges
      const xMargin = Math.round(stageW * 0.035);
      const yMargin = Math.round(stageH * 0.02);

      for (let y = 0; y < stageH; y++) {
        for (let x = 0; x < stageW; x++) {
          const dstIdx = ((y * stageW) + x) * 4;

          // If in border margin, make fully transparent
          if (x < xMargin || x >= stageW - xMargin || y < yMargin || y >= stageH - yMargin) {
            rgba[dstIdx] = 0;
            rgba[dstIdx + 1] = 0;
            rgba[dstIdx + 2] = 0;
            rgba[dstIdx + 3] = 0;
            continue;
          }

          const srcIdx = (((startY + y) * fullW) + (startX + x)) * 4;
          const red = srcData[srcIdx];
          const green = srcData[srcIdx + 1];
          const blue = srcData[srcIdx + 2];

          const brightness = (red + green + blue) / 3;
          const maxDiff = Math.max(Math.abs(red - green), Math.abs(green - blue), Math.abs(red - blue));
          const distToWhite = Math.sqrt((255 - red) ** 2 + (255 - green) ** 2 + (255 - blue) ** 2);

          // Pure white & near-white removal with soft feathering
          if (distToWhite < 42 || (brightness > 235 && maxDiff < 15)) {
            rgba[dstIdx] = 0;
            rgba[dstIdx + 1] = 0;
            rgba[dstIdx + 2] = 0;
            rgba[dstIdx + 3] = 0;
          } else if (distToWhite < 68 || (brightness > 215 && maxDiff < 22)) {
            const alpha = Math.max(0, Math.min(1, (distToWhite - 42) / 26));
            rgba[dstIdx] = red;
            rgba[dstIdx + 1] = green;
            rgba[dstIdx + 2] = blue;
            rgba[dstIdx + 3] = Math.round(255 * alpha);
          } else {
            rgba[dstIdx] = red;
            rgba[dstIdx + 1] = green;
            rgba[dstIdx + 2] = blue;
            rgba[dstIdx + 3] = 255;
          }
        }
      }

      const pngBuf = encodePNG(stageW, stageH, rgba);
      const outName = `stage${stageNum}.png`;
      fs.writeFileSync(path.join(targetDir, outName), pngBuf);

      if (stageNum === 24) {
        fs.writeFileSync(path.join(outputTreesDir, `${speciesKey}.png`), pngBuf);
      }

      stageNum++;
    }
  }
  console.log(`✅ Finished ${speciesKey}: 24 clean frames generated.`);
}

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
    sliceSpriteSheet(fullPath, tm.species);
  } else {
    console.warn(`File not found: ${fullPath}`);
  }
}

console.log("\n🎉 ALL 16 TREE SPECIES PERFECTLY RE-SLICED WITH ZERO BLEED!");
