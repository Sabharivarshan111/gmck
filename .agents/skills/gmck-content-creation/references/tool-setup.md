# Automatic editing tool setup

Run the check yourself; do not give the user a checklist to install tools when the current chat can do the setup.

```sh
python3 scripts/ensure_tools.py --project-dir /absolute/media-project --install --asr
```

Resolve `scripts/` relative to this skill, not a remembered scratch path. Keep `.gmck-tools-venv`, downloaded models and readiness reports in the media project. The script imports dependencies in the actual selected interpreter and performs an encode/probe/decode test. Use the returned Python path for project scripts. It does not install or change the system FFmpeg, enable ChatGPT tools or grant network access.

| Capability | Prepare and prove |
|---|---|
| Cutting, grading, audio, subtitles, export | FFmpeg/ffprobe, ass/loudnorm/afftdn/zoompan/overlay filters; actual H.264/AAC smoke render |
| Native graphics, text, SVG logos | Pillow, numpy, scipy, CairoSVG; load the actual chosen font and render SVG when needed |
| Tamil ASR | faster-whisper + socksio; use multilingual small/medium or a task-appropriate model. `--model small` downloads/loads and executes inference; it does not certify Tamil accuracy. Correct names and review the actual speech. |
| Downloaded SFX/logos | Assistant browsing tools plus permitted downloads; check real response/content/duration/license. Never synthesize a requested downloaded effect just because one site blocks downloads. |
| Face-tracked repo effects | Add `--face`, follow Vibha setup/models, then run a real still with its segmenter/tracker. A successful import does not verify GPU/GL/model initialization. Use a documented native-resolution adaptation if tracking is unnecessary, and label it honestly. |
| HyperFrames/HTML motion | Check node/npm and the selected repo CLI, renderer and headless-browser launch. Follow its current setup instructions and snapshot an actual composition. An installed npm package alone is insufficient. |
| Lemo inserts | Read the chosen guides/style; use the current code renderer or an appropriate tested local stack. Preserve the user’s no-BGM and real-voice requirements. |
| Persistent downloads | Discover the current host’s file-saving tools; use Library skill in ChatGPT Work. Check every result and return supported current links. |

Do not download every possible browser, model and repo for a simple edit. Prepare the required core first and load optional engines only when selected. Report a missing system binary or a policy-blocked download clearly; do not bypass restrictions or expose credentials. System tools are normally present in a capable Work execution environment, but must be checked afresh.

## Honest availability statements

Say “core encode/decode and filters tested” only after the smoke test passes. Say “ASR model tested” only after model load and inference succeed. Do not describe merely imported face/browser packages as tested render engines. If no command runner is exposed in ordinary ChatGPT, use the skill’s concrete planning/source fallback and explicitly say an MP4 was not rendered. Installing this skill cannot turn a text-only chat into a video-rendering runtime.
