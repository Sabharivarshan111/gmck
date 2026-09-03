import fs from 'fs';

const speciesList = [
  'oak', 'pine', 'cherry', 'maple', 'willow', 'apple',
  'bamboo', 'palm', 'saguaro', 'sequoia', 'bonsai', 'sprout'
];

const standaloneImages = [
  'apple', 'bamboo', 'bonsai', 'cherry', 'ginkgo', 'jacaranda',
  'maple', 'mushroom', 'oak', 'palm', 'pine', 'saguaro',
  'sapling', 'sequoia', 'sprout', 'willow'
];

let content = `// 24-Frame Cinematic Botanical Animations & Standalone Trees\n`;

for (const img of standaloneImages) {
  content += `import ${img} from './${img}.png';\n`;
}

content += `\n// 24-Stage Frame Imports\n`;

for (const sp of speciesList) {
  for (let i = 1; i <= 24; i++) {
    content += `import ${sp}${i} from './${sp}/stage${i}.png';\n`;
  }
  content += `\n`;
}

content += `export const TREE_IMAGES: Record<string, any> = {\n`;
for (const img of standaloneImages) {
  content += `  ${img},\n`;
}
content += `};\n\n`;

content += `export const SPECIES_STAGES: Record<string, any[]> = {\n`;
for (const sp of speciesList) {
  content += `  ${sp}: [\n`;
  for (let i = 1; i <= 24; i++) {
    content += `    ${sp}${i},\n`;
  }
  content += `  ],\n`;
}
content += `};\n`;

fs.writeFileSync('mobile/src/assets/trees/index.ts', content);
console.log('mobile/src/assets/trees/index.ts updated with 24 stages per species!');
