import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jpeg = require('./mobile/node_modules/jpeg-js');

const brainDir = '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4';
const outDir = '/Users/sabharivarshan/.gemini/antigravity/scratch/gmck/mobile/src/assets/trees';

// 1. Copy standalone pristine single-tree images
const directCopies = [
  { src: 'single_sprout_seedling_1788099950279.jpg', dest: 'sprout.jpg' },
  { src: 'single_budding_sapling_1788099976380.jpg', dest: 'sapling.jpg' },
  { src: 'single_lush_oak_1788100029959.jpg', dest: 'oak.jpg' },
  { src: 'single_autumn_maple_1788100079540.jpg', dest: 'maple.jpg' },
  { src: 'single_weeping_willow_1788100107348.jpg', dest: 'willow.jpg' },
  { src: 'single_cherry_blossom_1788100138818.jpg', dest: 'cherry.jpg' },
  { src: 'single_alpine_pine_1788100170609.jpg', dest: 'pine.jpg' },
  { src: 'single_apple_tree_1788100208754.jpg', dest: 'apple.jpg' },
];

for (const item of directCopies) {
  const srcPath = path.join(brainDir, item.src);
  const destPath = path.join(outDir, item.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied direct single tree: ${item.dest}`);
  }
}

// Helper to crop pixel-perfect sub-rectangle
function cropJpeg(sheetFile, x, y, width, height, destFile) {
  const rawData = fs.readFileSync(path.join(brainDir, sheetFile));
  const decoded = jpeg.decode(rawData, { useTArray: true });
  
  const croppedData = Buffer.alloc(width * height * 4);
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const srcIdx = ((y + row) * decoded.width + (x + col)) * 4;
      const destIdx = (row * width + col) * 4;
      croppedData[destIdx] = decoded.data[srcIdx];         // R
      croppedData[destIdx + 1] = decoded.data[srcIdx + 1]; // G
      croppedData[destIdx + 2] = decoded.data[srcIdx + 2]; // B
      croppedData[destIdx + 3] = 255;                      // A
    }
  }
  
  const encoded = jpeg.encode({ data: croppedData, width, height }, 92);
  fs.writeFileSync(path.join(outDir, destFile), encoded.data);
  console.log(`Cropped and saved: ${destFile} (${width}x${height})`);
}

// Sheet 2: Sakura (TL), Bamboo (TR), Ginkgo (BL), Jacaranda (BR)
cropJpeg('botanical_trees_sheet2_1788098227446.jpg', 525, 10, 485, 485, 'bamboo.jpg');
cropJpeg('botanical_trees_sheet2_1788098227446.jpg', 15, 525, 485, 485, 'ginkgo.jpg');
cropJpeg('botanical_trees_sheet2_1788098227446.jpg', 525, 525, 485, 485, 'jacaranda.jpg');

// Sheet 3: Pine (TL), Palm (TR), Saguaro (BL), Sequoia (BR)
cropJpeg('botanical_trees_sheet3_1788098247732.jpg', 525, 10, 485, 485, 'palm.jpg');
cropJpeg('botanical_trees_sheet3_1788098247732.jpg', 15, 525, 485, 485, 'saguaro.jpg');
cropJpeg('botanical_trees_sheet3_1788098247732.jpg', 525, 525, 485, 485, 'sequoia.jpg');

// Sheet 4: Sprout (TL), Sapling (TR), Bonsai (BL), Mushroom (BR)
cropJpeg('botanical_trees_sheet4_1788098271454.jpg', 15, 525, 485, 485, 'bonsai.jpg');
cropJpeg('botanical_trees_sheet4_1788098271454.jpg', 525, 525, 485, 485, 'mushroom.jpg');

console.log('All 16 trees successfully prepared!');
