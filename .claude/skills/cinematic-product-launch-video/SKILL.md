---
name: cinematic-product-launch-video
description: "Master standard and skill for creating world-class, Apple Keynote / Stripe-level SaaS product launch and promo videos using Remotion and Hyperframes. Documents past failure modes, 3D camera choreography, UI integrity, neural voice calibration, and mobile safe-zone compliance. Use when working on anything under remotion-ad/ — writing or re-cutting an ad script, changing shot timing, camera moves or captions, adding or re-recording a voice, or diagnosing a broken frame in a rendered cut."
---

# 🎬 Cinematic SaaS Product Launch & Promo Video Engine

This skill defines the complete standard, architecture, motion language, and execution rules for generating top-tier, viral product launch videos (vertical 9:16 reels/shorts and landscape 16:9) inspired by **Apple Keynote reveals**, **Stripe/Vercel motion design**, and **hyper-polished modern SaaS animations**.

---

## ⚠️ Critical Post-Mortem: Past Mistakes & Permanent Rules

When building video ads with Remotion, Hyperframes, or React-based video renderers, **NEVER repeat these critical past failure modes**:

### ❌ Mistake 1: Distorting / Cropping the Inner UI Inside the Phone Screen
- **What went wrong**: Applying `scale(1.45)` and `translateY(-30%)` directly to the `<img>` or inner content *inside* the phone's screen frame. This cropped navigation bars, made text look pixelated/cut-off, and caused the Dynamic Island / camera notch to overlap text unnaturally.
- **The Correct Rule**: **The inner UI must remain 100% natural, crisp, and properly framed.**
  - All camera motion (push-in, pull-back, 3D tilt, orbital rotation, parallax drift) must be applied to the **3D Phone Container & Camera**, NOT by warping the screen content inside.
  - The phone moves through 3D space (`transform: scale(cameraZoom) rotateX(rx) rotateY(ry) translate3d(x,y,z)`), while the inner screen renders a pristine, high-resolution interface.

### ❌ Mistake 2: Using Unloaded / Broken Remote Images or Blank Placeholders
- **What went wrong**: Displaying screenshots where remote assets failed to load (e.g. `This diagram could not be loaded` or wireframe line boxes like `Types of synovial joint`).
- **The Correct Rule**:
  - Every screen must be bundled locally in `public/app_screens/` or rendered as a live native React component.
  - Real hand-drawn medical plates, real clinical notes, real interactive chat bubbles, and real flashcards must be rendered with full detail.

### ❌ Mistake 3: Robotic "AI-Sounding" Scripts & Multilingual Accent Glitches
- **What went wrong**:
  - Scripts used robotic sci-fi phrases like *"Quantum triple-tap protocol"*, *"10-star question targets"*, or compressed acronyms like *"TNMGRMU"*.
  - Using multilingual TTS models (`*MultilingualNeural`) that erroneously switched to French or Spanish phonemes when encountering acronyms.
- **The Correct Rule**:
  - Write **human, confident, editorial Apple Keynote copywriting**.
  - Pronounce proper names clearly: `"The Tamil Nadu Dr. M.G.R. Medical University"` or `"TN MGR University"`.
  - Use natural medical student terms: `"highly repeated exam questions"`, `"8-page university essays"`, `"hand-drawn surgical plates"`.
  - Use pure native US English voices (`en-US-AvaNeural`, `en-US-JennyNeural`, `en-US-AriaNeural`) at calm, articulate speeds ($+8\%$ to $+12\%$).

### ❌ Mistake 4: Subtitles Placed in the Instagram / TikTok Cropping Danger Zone
- **What went wrong**: Placing captions at `bottom: 80px` – `120px` where Instagram Reels / TikTok UI (like buttons, comments, share, sound track, caption overlay) completely cover or crop the text.
- **The Correct Rule**:
  - Place subtitle containers at `bottom: 300px` – `320px` (or `top: 72%`–`75%`).
  - Enclose in a sleek frosted glass capsule (`rgba(3, 7, 18, 0.75)` backdrop blur with subtle border) so it remains legible over any background.

### ❌ Mistake 5: Artificial Blue Boxes / Template-Like Overlays
- **What went wrong**: Drawing artificial 2px neon cyan boxes around components on top of the phone screen.
- **The Correct Rule**:
  - Guide viewer attention using **cinematic lighting, subtle depth of field, camera focal emphasis, and soft ambient backlights**, never artificial overlay rectangles.

---

## 🎨 Visual Style & Motion Language Standard

### 1. Visual Style
- **Aesthetic**: Minimal, futuristic, premium, editorial.
- **Background**: Deep obsidian/slate base (`#030712`) with subtle, slowly shifting aurora mesh gradients and ambient radial glows matching the active theme color.
- **Phone Model**: Precision 3D titanium frame with dual-layer chamfered edges, dynamic island pill, subtle glass specular reflections, and soft drop shadow (`0 25px 60px -15px rgba(0,0,0,0.9)`).
- **Lighting**: Soft directional studio light, subtle rim reflections, and soft backlight glowing behind the device.

### 2. Camera & 3D Choreography
- Treat Remotion compositions as a **cinematic camera tracking a physical device in space**:
  - **Hero Reveals (0.0s – 3.0s)**: Gentle floating wide shot with subtle 3D perspective ($rx: 4^\circ, ry: -6^\circ$).
  - **Feature Deep Dives**: Camera pushes in smoothly ($1.08\times \rightarrow 1.18\times$), tilts naturally into the active quadrant, and glides gracefully.
  - **Macro Focus**: Camera draws close to the device while ambient background softens.
  - **Transitions**: Continuous spatial movement where the camera glides between angles with spring physics rather than abrupt cuts.

### 3. Pacing & Timing
- **Duration**: 75.0 seconds (2,250 frames at 30 fps).
- **Shot Rhythm**: 25 dynamic shots $\times$ strictly 3.0 seconds (90 frames) per shot.
- **Voice Sync**: Each spoken sentence takes 1.8s – 2.4s, leaving 0.6s breathing room before the next transition.
- **Audio-Visual Lock**: The visual headline, device screen, and spoken audio must match 1:1 on every single frame.

---

## 📂 Assets Architecture & File Structure

For seamless compatibility with local agents and cloud AI (such as Claude / CI runners), store all assets in standard paths:

```
remotion-ad/
├── public/
│   ├── app_screens/          # 100% Genuine, uncropped high-resolution app screenshots
│   │   ├── glass-home.png
│   │   ├── home.png
│   │   ├── browse.png
│   │   ├── questions.png
│   │   ├── tca-note.png
│   │   ├── notes-renderer.png
│   │   ├── askai.png
│   │   ├── bot-liquidglass.png
│   │   ├── chatdemo.png
│   │   ├── anki-study.png
│   │   ├── apkg-1-hub.png
│   │   ├── timer.png
│   │   ├── treegallery.png
│   │   ├── music-06-playing.png
│   │   ├── calots_triangle_anatomy.jpg
│   │   └── stomach_lymphatics_anatomy.jpg
│   └── audio/
│       ├── apple_keynote/    # 25 shot clips (shot_01.mp3 .. shot_25.mp3)
│       ├── college_humor/    # 25 shot clips (shot_01.mp3 .. shot_25.mp3)
│       └── cyberpunk_os/     # 25 shot clips (shot_01.mp3 .. shot_25.mp3)
├── src/
│   ├── components/
│   │   ├── AuroraMeshBackground.tsx   # Atmospheric multi-color mesh gradients
│   │   ├── LayeredCameraPhone.tsx     # 3D Titanium device with camera movement
│   │   ├── KineticWordCaption.tsx     # Safe-zone elevated kinetic typography
│   │   ├── GlowBadge.tsx              # Top minimalist category pill
│   │   ├── ScreenRegistry.tsx         # Genuine screen views & native diagram cards
│   │   └── Master25ShotTimeline.tsx   # Master 25-shot synchronized timeline
│   ├── compositions/
│   │   ├── OrbitAd_AppleKeynote.tsx
│   │   ├── OrbitAd_CollegeHumor.tsx
│   │   ├── OrbitAd_CyberpunkOS.tsx
│   │   ├── HyperframesAppleKeynote.tsx
│   │   ├── HyperframesCollegeHumor.tsx
│   │   └── HyperframesCyberpunkOS.tsx
│   ├── Root.tsx
│   └── index.ts
└── generate_perfect_voiceovers.mjs     # Edge-TTS voiceover synthesis engine
```

---

## 🎙️ Voiceover Synthesis Specification

Always use `msedge-tts` or native WebSockets with **single-language US English neural voices**:
- **Apple Keynote Executive**: `en-US-AvaNeural` or `en-US-JennyNeural` (Rate: `+10%`, Pitch: `+0Hz`)
- **College / Student Relatable**: `en-US-JennyNeural` (Rate: `+12%`, Pitch: `+1Hz`)
- **Futuristic / Cyberpunk OS**: `en-US-AriaNeural` (Rate: `+10%`, Pitch: `-1Hz`)

**Never use Multilingual variants on technical medical names or abbreviations to prevent foreign accent switches.**
