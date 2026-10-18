# GMCK World Trauma Day — Remotion collision previsualization

This project produces a **22-second, fixed-camera 2D motion prototype**, not yet a photorealistic final film. It holds four original vehicle identities and the same road from first frame to last. Its purpose is to test timing and avoid the earlier Gemini errors: an ambulance reversing or duplicating, altered crash site, vanishing car, or a motorcycle hitting an undamaged bus.

## Run

```sh
cd video/world-trauma-day
npm install
npm run studio
npm run render
```

## Locked timings

- A01 wrong-lane entry: 2.10–3.45 seconds (front always points WEST)
- B01 bus-front / A01 ambulance-front impact: 5.37 seconds
- C01 silver car / bus-rear impact: 6.46 seconds
- M01 motorcycle / bus-north-side impact: 6.65 seconds
- Rescue ambulance A02 (white with GREEN stripe) enters after 13 seconds, never during the impact.

All motion is specified by deterministic x/y coordinates, not independent text-to-video calls. For a realistic cinematic finish, replace SVG assets with consistent 3D vehicle models, a fixed environment and keyframed mesh deformation. Medical response clips may be added separately in Remotion. The prototype movie and a detailed Python frame-by-frame audit are available as a downloadable attachment in the corresponding ChatGPT conversation.

**Do not merge into the production app without reviewing.** This is an independent video project kept on a separate branch.
