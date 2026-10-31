# Technique sources and source selection

Read current upstream documentation before using a tool; CLI options and models change. Pin the revision/version used in project credits. Use available local tools when they meet the brief; do not depend on Claude-specific commands or a specific model.

- Vibha effects: https://github.com/Vibha-Ramprakash/claude-video-effects — read SKILL.md, setup and relevant effect code. Useful: headline-box, split-headline, lean-in, slow-push, reject-stamp, headline-wall and UI cards. Remove unrelated default copy/mascots. Verify the selected effect at native output width. Do not say you ran the repo if you only adapted its framing/easing; label the adaptation accurately.
- Lemo-Opuscar: https://github.com/lemomo-ai/lemo-opuscar — read AGENTS.md, DIRECTOR.md, TECHNIQUE.md and the chosen STYLE.md. Write an original treatment before consulting demo techniques. Useful: Swiss Motion Graphics knife-cut/reflow, Dark Tech Keynote UI/grid, Pictogram Motion clear icons. User's own footage, voice and no-BGM instructions take priority over defaults. Do not copy demo characters, stories, scores or branding.
- HyperFrames: https://github.com/heygen-com/hyperframes — for deterministic HTML/GSAP overlays and diagram animation. Prefer existing GMCK `.agents/skills/hyperframes*`, `talking-head-recut`, `embedded-captions`, `media-use` and motion skills when in that repo. An untouched-video overlay workflow does not satisfy a requested trim; conform the footage first.
- ClaudeAnimationBase: https://github.com/JohnHeibel/ClaudeAnimationBase — consult the animation guide for staging and motion; create the user's mascot or an original character. Do not inherit Clawd/Claude identity.

## Downloaded SFX

Search web/YouTube references when requested, but distinguish a reference video from a licensed downloadable source. Suitable starting points, subject to current availability and license:
- https://sfxreels.com/transition-sound-effects/ and https://sfxreels.com/license/
- https://mixkit.co/free-sound-effects/ and its current license
- https://pixabay.com/sound-effects/ and the selected asset's license
- YouTube Audio Library, if accessible through the user's authorized environment.

For every chosen sound keep asset name, creator if provided, source URL, license URL, retrieval date, downloaded filename and the edit cue(s). A "no copyright" title alone is insufficient evidence. Do not call a sound currently viral unless current evidence supports that claim. Use reusable reel-style effects without that claim otherwise. Do not silently synthesize substitutes when downloads fail; choose another accessible licensed source or explain the specific blocker. Honor a no-BGM brief even if a sound pack contains meme songs, choir stings or music beds. Do not redistribute raw assets when their terms prohibit it; include download URLs or a fetch script instead.

Analyze downloaded audio with ffprobe and waveform/RMS/peak measurements. Trim excessive leading silence, align the transient peak to the visual hit, fade edges, avoid repetitive clutter and balance around speech. Save the final mix, not merely the selected list.

## Logos and visual assets

Fetch recognizable marks from official brand pages or official repos where possible. Verify each actual downloaded image, preserve aspect/legibility and identify it in credits. Label React vs React Native correctly even when using the shared atom mark. Source Flutter and Lovable from their current official brand pages. Display marks only to identify discussed tools, not as channel identity or an endorsement. Preserve user-provided ORBIT/GMCK assets without adding unrequested cloud logos. Generate precise medical diagrams and data graphics with code/vector tools rather than relying on image generation for accuracy.
