import fs from 'fs';
import path from 'path';

const treesDir = '/Users/sabharivarshan/.gemini/antigravity/scratch/gmck/mobile/src/assets/trees';
const speciesList = [
  'oak', 'pine', 'cherry', 'maple', 'bamboo', 'willow',
  'apple', 'palm', 'saguaro', 'sequoia', 'bonsai', 'sprout',
  'ginkgo', 'jacaranda', 'mushroom', 'sapling'
];

for (const sp of speciesList) {
  const dir = path.join(treesDir, sp);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const maturePath = path.join(treesDir, `${sp}.png`);
  const sproutPath = path.join(treesDir, 'sprout.png');
  const saplingPath = path.join(treesDir, 'sapling.png');
  const mature = fs.existsSync(maturePath) ? maturePath : saplingPath;

  // 24 frames progressive distribution
  // Frames 1-6: Sprout / Seedling (0% - 25%)
  // Frames 7-14: Sapling / Young Tree (25% - 60%)
  // Frames 15-24: Developing to Grand Mature Tree (60% - 100%)
  for (let i = 1; i <= 24; i++) {
    let sourceFile;
    if (i <= 6) {
      sourceFile = sproutPath;
    } else if (i <= 14) {
      sourceFile = saplingPath;
    } else {
      sourceFile = mature;
    }
    fs.copyFileSync(sourceFile, path.join(dir, `stage${i}.png`));
  }
  console.log(`Configured 24 frames for: ${sp}`);
}

console.log('All 16 species populated with 24-frame animation sequences!');
