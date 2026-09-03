import https from 'https';

const token = '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';

const releaseData = {
  tag_name: 'release-97',
  target_commitish: 'main',
  name: 'Release build 97',
  body: `## Orbit MBBS — Release Build 97

### 🌿 24-Frame Cinematic Botanical Growth Engine
- **Full 16 Species Coverage**: All 16 species (*oak, pine, cherry blossom, maple, willow, apple, bamboo, palm, saguaro, sequoia, bonsai, sprout, sapling, ginkgo, jacaranda, mushroom*) sliced into 24 distinct PNG keyframes (384 total frames).
- **Locked Ground Baseline**: Soil mound, root flare, and pot are locked to a single stationary line (Y = 84%) across all 24 frames, eliminating ground jumping and visual wobble.
- **60fps Sub-Pixel RAF Interpolation**: \`FocusTree.tsx\` continuously morphs across 60 frames per second using harmonic sinusoidal blending and sub-pixel blooming ($0.98 \\rightarrow 1.01$).
- **Stage 1 Seed Start**: Removed artificial 20% growth floor so timers start authentically at Stage 1 (bare seed / potted soil) at 0% progress.
- **Today's Plot Reset Action**: Added an interactive Reset button with tactile press feedback in Today's Plot card to clear daily planted trees.

### 🎨 Medical Diagram Engine & Matching Fixes
- **Strict Anti-Collision Matching**: Fixed question matching in \`handwrittenNotes.ts\` to prevent unrelated diagrams (like Rotator Cuff) from appearing on general joint / bone questions.
- **Textbook-Grounded Rule (94)**: Codified mandatory pre-generation textbook research from standard Indian MBBS textbooks (*BD Chaurasia, Vishram Singh, K. Sembulingam, DM Vasudevan, Ramadas Nayak, KD Tripathi*).
- **Generated High-Yield Diagrams**: Added authentic, high-yield textbook diagrams for Synovial Joints, Cartilaginous Joints, Blood Supply of Long Bones, Endochondral Ossification, and Haversian System.

### ✅ Production Verification
- Root Web Production Build: **PASS**
- Mobile Production Bundle: **PASS**
- Strict TypeScript Check: **0 errors**
- Focus Trees Integrity Check: **12/12 PASS**
`,
  draft: false,
  prerelease: true
};

const payload = JSON.stringify(releaseData);

const options = {
  hostname: 'api.github.com',
  path: '/repos/Sabharivarshan111/gmck/releases',
  method: 'POST',
  headers: {
    'User-Agent': 'Node.js',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    try {
      const resp = JSON.parse(body);
      if (resp.id) {
        console.log(`🎉 Successfully created GitHub Release: ${resp.name} (${resp.tag_name})`);
        console.log(`URL: ${resp.html_url}`);
      } else {
        console.error('Failed to create release:', resp);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
