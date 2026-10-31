# Execution and export reliability

## Start with capabilities

Check for a command runner, FFmpeg/ffprobe, a renderer, ASR and accessible footage. Use the host's current setup/network/credential instructions. Do not bypass blocked networks, expose secrets or request a paid API key merely to run local ASR. Install task-scoped dependencies where supported. If ordinary chat cannot execute video tools, follow normal-chat.md's truthful fallback.

## Proven pitfalls from the actual edits

- A 1920x1080 encoded phone clip with -90° rotation displays as 1080x1920. Normalize once, remove stale rotation metadata and inspect the output; don't accidentally rotate twice.
- Do not send 16kHz ASR WAVs through the final voice chain. Decode final audio from the original camera file at its native/full working rate, normally 48kHz.
- If faster-whisper/PyAV fails at decode, a decoded 16kHz mono float32 numpy array avoids container-version issues. Pass normalized waveform values, not raw int16 magnitudes. Still correct Tamil/English tool-name errors manually; timestamps in an English translation are not guaranteed Tamil word alignments.
- Avoid many parallel trim branches of one large camera input when they buffer entire suffixes and exhaust memory. Conform per source with frame-select/setpts, then concatenate compatible parts, or process segments sequentially.
- Avoid aggressive gate/denoise artifacts. Use modest high-pass, steady-noise reduction, presence EQ and compression before loudness normalization. Balance downloaded SFX by measured local voice energy and transient peaks.
- Repo effects may need a supported MediaPipe/OpenCV environment and local GL runtime dependencies. Read the real error and follow permitted setup; do not fake running an unavailable effect. Keep a native-resolution pre-rendered camera pass in the media project if useful.
- Finish AAC generation before remux/render. Never modify an input file being read; write a new file and rename atomically only after completion. Regenerating AAC mid-encode previously produced corrupt exports.
- Wait for renders and remuxes to finish. Check moov/container readability, full duration and decode before treating a file as ready; one export previously existed but was incomplete. Verify downloaded byte size/archive integrity before extracting or delivering a ZIP.
- Transparent draw operations on an opaque RGBA insert can punch accidental windows into it. Composite semi-transparent shapes over an opaque scene base when the intent is full-screen illustration; inspect for presenter fragments leaking through icons.
- Keep fonts inside a font-only directory, licenses elsewhere. Measure long text with the actual font/weight. Check unknown-glyph boxes and branding defaults.

## QA gates

1. Metadata: output display size, frame rate, intended duration, audio stream(s), rotation and complete tail. Compare against the new brief, not old task values.
2. Technical playback: full video **and audio** decode, container errors, black-frame detection and loudness/true peaks. Run `python3 scripts/audit_media.py VIDEO --width W --height H --fps FPS --duration SECONDS --out QA.json`. A passing technical audit does not certify medical accuracy, subtitle correctness, audio aesthetics or layout.
3. Visual: full-duration contact sheet, plus enlarged hook, strike, logo, longest title, diagram labels, peak zoom, every phase and final cut. Dense 0.2-second strips around reported errors; inspect composition after actual camera transforms. Use proportional safe zones rather than fixed coordinates copied from another resolution.
4. Semantic: verify phrase and logo timing against the original Tamil; retain qualifiers. Confirm all intended sections/medical phases and soundtrack variants actually exist. A still frame alone cannot prove an effect moves or a reached-for-camera gesture was fully removed.
5. Audio: listen to the finished mix if possible, checking phone intelligibility, word boundaries, hum edits, scratch/impact peaks and no music. If no listening capability is available, state the measurement/decode checks actually performed; do not claim an audible review.
6. Delivery: inspect every persistence result. Return real current links. Retain a runnable source project, SRT, credits, timeline and QA. Follow the host's saving/Library workflow; native file links and scratch links are distinct. Never invent Library IDs, credentials or a permanent URL.

Use a temporary output then rename only after the gates pass. On a failed export, repair the affected file and re-run relevant checks; avoid repeatedly broadening successful tests without a new concern.
