import fs from 'fs';
import path from 'path';

const speciesList = [
  'oak',
  'pine',
  'cherry',
  'maple',
  'willow',
  'apple',
  'bamboo',
  'palm',
  'saguaro',
  'sequoia',
  'bonsai',
  'sprout',
  'sapling',
  'ginkgo',
  'jacaranda',
  'mushroom',
];

let code = `// 24-Frame Cinematic Botanical Animations & Standalone Trees\n`;

// Standalone images
speciesList.forEach(sp => {
  code += `import ${sp} from './${sp}.png';\n`;
});

code += `\n// 24-Stage Frame Imports\n`;
speciesList.forEach(sp => {
  for (let i = 1; i <= 24; i++) {
    code += `import ${sp}${i} from './${sp}/stage${i}.png';\n`;
  }
  code += `\n`;
});

// TREE_IMAGES Record
code += `export const TREE_IMAGES: Record<string, any> = {\n`;
speciesList.forEach(sp => {
  code += `  ${sp},\n`;
});
code += `};\n\n`;

// SPECIES_STAGES Record
code += `export const SPECIES_STAGES: Record<string, any[]> = {\n`;
speciesList.forEach(sp => {
  code += `  ${sp}: [\n`;
  for (let i = 1; i <= 24; i++) {
    code += `    ${sp}${i},\n`;
  }
  code += `  ],\n`;
});
code += `};\n`;

fs.writeFileSync('/Users/sabharivarshan/.gemini/antigravity/scratch/gmck/mobile/src/assets/trees/index.ts', code);
console.log('✅ Generated mobile/src/assets/trees/index.ts with ALL 16 SPECIES and 384 frames mapped!');
