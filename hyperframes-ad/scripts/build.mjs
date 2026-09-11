/**
 * Generate the two HyperFrames compositions from the ad scripts we already have.
 *
 * ## Why this is generated and not typed out
 *
 * The words in these two films are the app owner's, and they live in exactly
 * one place: `remotion-ad/src/scripts/`. Twenty-six ads are written there,
 * `check:ad-truth` holds them to what the screenshots under them actually show,
 * and `preflight` holds each one to sixty seconds of speech. Retyping two of
 * them into HTML would create a second copy of the script with no check on it,
 * and this repo has been caught by exactly that shape more than once — a
 * distilled copy that went stale while everything around it stayed right.
 *
 * So the compositions are build output. Edit the script, run the build, and the
 * HTML follows. `scripts/check.mjs` fails if the committed HTML is not what the
 * current scripts produce.
 *
 * ## What it does NOT take from Remotion
 *
 * Only the data: the shot list, the spoken line, the caption a muted viewer
 * reads, which screenshot each shot plays over, and the accent. None of the
 * motion comes across. A Remotion shot is a React component reading
 * `useCurrentFrame()`; a HyperFrames shot is static HTML with a GSAP tween
 * seeking over it, and the two express a camera move in completely different
 * terms. These are authored as HyperFrames films, not as a port.
 *
 *   node scripts/build.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repo = path.resolve(root, '..');
const remotion = path.join(repo, 'remotion-ad');

const { ALL_SCRIPTS } = await import(
  pathToFileURL(path.join(remotion, 'src', 'scripts', 'index.ts')).href
);
const { resolveShotFrames, REEL_FRAMES, FPS } = await import(
  pathToFileURL(path.join(remotion, 'src', 'scripts', 'types.ts')).href
);

/* ------------------------------------------------------------------------
 * The screen registry, read as text.
 *
 * `ScreenRegistry.tsx` imports `staticFile` from Remotion, so it cannot simply
 * be imported here — and copying the key/filename table into this file would
 * be the second copy this whole script exists to avoid. It is a flat object
 * literal, so it is read rather than imported, and a key an ad names that is
 * not in it stops the build.
 * --------------------------------------------------------------------- */
const registrySrc = await fs.readFile(
  path.join(remotion, 'src', 'components', 'ScreenRegistry.tsx'),
  'utf8',
);
const SCREENS = Object.fromEntries(
  [...registrySrc.matchAll(/(\w+):\s*\{\s*kind:\s*'(\w+)',\s*file:\s*'([^']+)'\s*\}/g)].map(
    (m) => [m[1], { kind: m[2], file: m[3] }],
  ),
);
if (Object.keys(SCREENS).length < 20) {
  throw new Error(
    `Only parsed ${Object.keys(SCREENS).length} screens out of ScreenRegistry.tsx — ` +
      'the literal shape changed and this reader did not.',
  );
}

/* ---- The two films ----------------------------------------------------- */

const VARIATIONS = [
  {
    scriptId: 'orbit-ask-it',
    dir: 'ask-it',
    look: 'prompt',
    title: 'Orbit MBBS — Ask it',
  },
  {
    scriptId: 'orbit-the-year',
    dir: 'the-year',
    look: 'keynote',
    title: 'Orbit MBBS — The year you are in',
  },
];

/* ---- Caption sizing, decided here rather than at render time ------------
 *
 * The caption band is a fixed box and the type has to fit inside it. Remotion
 * solves this at render time by measuring; here the size is chosen from the
 * string's own length against a ladder, which is deterministic, needs no
 * measurement, and cannot disagree between a preview and a render.
 *
 * The ladder is conservative on purpose: a caption one step smaller than it
 * had to be is invisible to a viewer, and one step larger runs out of the band.
 * --------------------------------------------------------------------- */
const captionSize = (text, look) => {
  const n = text.length;
  const ladder = look === 'keynote'
    ? [[16, 96], [26, 84], [34, 72], [46, 62], [999, 54]]
    : [[16, 84], [26, 74], [34, 64], [46, 56], [999, 48]];
  return ladder.find(([max]) => n <= max)[1];
};

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Two decimal places is a third of a frame at 30fps — finer than anyone sees. */
const secs = (frames) => Number((frames / FPS).toFixed(3));

/* ---- Assets ------------------------------------------------------------ */

const assetDir = path.join(root, 'assets');
const copied = new Set();

const copyAsset = async (from, to) => {
  if (copied.has(to)) return true;
  const dest = path.join(assetDir, to);
  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(from, dest);
    copied.add(to);
    return true;
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------------------
 * Build one film.
 * --------------------------------------------------------------------- */
const build = async ({ scriptId, dir, look, title }) => {
  const script = ALL_SCRIPTS.find((s) => s.id === scriptId);
  if (!script) throw new Error(`No script called ${scriptId}`);

  const frames = resolveShotFrames(script);
  const total = frames.reduce((a, b) => a + b, 0);
  if (total !== REEL_FRAMES) {
    throw new Error(
      `${scriptId} resolves to ${total} frames, not ${REEL_FRAMES}. A sixty-second ` +
        'film that is not sixty seconds is one the platform trims the call to action off.',
    );
  }

  const dark = look === 'keynote';
  const scenes = [];
  const audio = [];
  const tweens = [];
  const missingScreens = [];
  let cursor = 0;
  let missingAudio = 0;

  for (const [i, shot] of script.shots.entries()) {
    const start = secs(cursor);
    const dur = secs(frames[i]);
    cursor += frames[i];

    const id = `s${String(shot.n).padStart(2, '0')}`;
    const accent = shot.accent ?? '#7C5CFF';
    const caption = shot.silentText ?? shot.text ?? '';
    const size = captionSize(caption, look);

    /* ---- The picture ------------------------------------------------- */
    let stage = '';
    if (shot.openCard || shot.endCard) {
      stage = brandCard(shot, accent, dark);
    } else if (shot.typed) {
      stage = typedPrompt(id, shot, accent, dark);
    } else if (shot.screen) {
      const asset = SCREENS[shot.screen];
      if (!asset) {
        missingScreens.push(shot.screen);
      } else {
        const name = path.basename(asset.file);
        const ok = await copyAsset(
          path.join(remotion, 'public', asset.file),
          `screens/${name}`,
        );
        if (!ok) missingScreens.push(`${shot.screen} (${asset.file} not on disk)`);
        // `focus` is which slice of a tall screenshot is in frame: 0 is the top
        // of the screen, 1 the bottom. It is the screen's own scroll position,
        // not a camera move, which is why it is a static offset here and the
        // drift below is what moves.
        const focus = shot.focus ?? 0.18;
        stage = `
        <div class="stage">
          <div class="panel" id="${id}-panel" data-layout-allow-overflow>
            <img class="shot-img" id="${id}-img" src="assets/screens/${esc(name)}#${id}"
                 alt="" style="object-position: 50% ${(focus * 100).toFixed(0)}%">
          </div>
        </div>`;
      }
    }

    /* ---- The words --------------------------------------------------- */
    const words = shot.openCard || shot.endCard
      ? ''
      : `
        <div class="band">
          ${shot.kicker ? `<p class="kicker" id="${id}-kicker" style="color:${accent}">${esc(shot.kicker)}</p>` : ''}
          <p class="caption" id="${id}-cap" style="font-size:${size}px">${esc(caption)}</p>
        </div>`;

    scenes.push(`      <section class="clip shot ${look}" id="${id}" data-start="${start}" data-duration="${dur}" data-track-index="0" style="--accent:${accent}">
${stage}${words}
      </section>`);

    /* ---- The voice ---------------------------------------------------- */
    const clipRel = `audio/${script.id}/shot_${String(shot.n).padStart(2, '0')}.mp3`;
    const gotAudio = await copyAsset(path.join(remotion, 'public', clipRel), clipRel);
    if (gotAudio) {
      audio.push(
        `      <audio id="vo-${String(shot.n).padStart(2, '0')}" data-start="${start}" ` +
          `data-duration="${dur}" data-track-index="1" src="assets/${clipRel}" preload="auto"></audio>`,
      );
    } else {
      missingAudio += 1;
    }

    /* ---- The motion ---------------------------------------------------- */
    tweens.push(shotTweens({ id, start, dur, look, shot }));
  }

  if (missingScreens.length) {
    throw new Error(
      `${scriptId} names screens that are not on disk: ${missingScreens.join(', ')}.\n` +
        'Run `cd remotion-ad && npm run plates && npm run screens` first — a film ' +
        'must never be built against a screenshot the app no longer has.',
    );
  }

  const music = script.music
    ? await copyAsset(path.join(remotion, 'public', script.music), path.basename(script.music))
    : false;
  const bed = music
    ? `      <audio id="bed-${esc(script.id)}" data-start="0" data-duration="60" data-track-index="${look === 'keynote' ? 3 : 2}" ` +
      `data-volume="0.18" src="assets/${esc(path.basename(script.music))}" preload="auto"></audio>`
    : '';

  const html = page({ script, title, look, dark, scenes, audio, bed, tweens });
  const out = path.join(root, dir, 'index.html');
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, html);

  /*
     Each film is its own HyperFrames project, and `assets` inside it is a link
     to the one real directory.

     The CLI treats the directory it is given as the project root and refuses a
     `../` in any asset path — Studio resolves those against the root and 404s.
     Two films in one project would mean one `index.html`, and `snapshot` and
     `preview` only ever look at that. A link per film gives each one a root of
     its own without a second copy of twenty megabytes of screenshots.
  */
  const link = path.join(root, dir, 'assets');
  await fs.rm(link, { recursive: true, force: true });
  await fs.symlink(path.relative(path.join(root, dir), assetDir), link, 'dir');

  return { file: `${dir}/index.html`, shots: script.shots.length, missingAudio, music };
};

/* ---- The brand card, opening and closing ------------------------------- */
const brandCard = (shot, accent, dark) => {
  const open = Boolean(shot.openCard);
  // The mark appears twice in every film, opening and closing. Same file, so
  // the compiler can discover one media node twice; the fragment makes each
  // node's URL its own without fetching anything a second time.
  const mark = `assets/brand/orbit-logo.png#${open ? 'open' : 'close'}`;
  return `
        <div class="brand">
          <div class="brand-glow" style="background:radial-gradient(58% 38% at 50% 42%, ${accent}3d 0%, transparent 72%)"></div>
          <img class="brand-mark" src="${mark}" alt="Orbit"
               style="filter: drop-shadow(0 18px 48px ${accent}55)">
          ${open
            ? `<p class="brand-hello">Welcome to Orbit</p>`
            : `<p class="brand-for">Made for the medical community</p>
          <p class="brand-free">Completely free</p>
          <div class="brand-store">
            <img src="assets/brand/google-play-logo.svg" alt="" width="72" height="72">
            <span>Download on Play Store</span>
          </div>`}
        </div>`;
};

/* ---- The typed prompt --------------------------------------------------
 *
 * Typing without a per-frame callback: the line is masked with `clip-path`
 * from fully hidden to fully shown on a stepped ease, and the caret's `x`
 * runs the same steps across the measured width of the text. Both tweens
 * are ordinary property animations, so a seek to any time lands on exactly
 * the same frame — which a callback that rewrites `textContent` would not
 * guarantee.
 *
 * The width is measured once, inside `document.fonts.ready`, because a
 * measurement taken before the face has loaded is a measurement of a
 * fallback font.
 * --------------------------------------------------------------------- */
const PROMPT_INNER = 800; // the bar's 960px less its padding, caret and gap

const typedPrompt = (id, shot, accent, dark) => {
  const line = shot.text ?? '';
  /*
     The type is sized to the line rather than fixed.

     At a flat 42px, "Pathogenesis of rheumatic heart disease" measured 970px
     inside an 860px bar and hung out of the white box by 157px — `check`
     reported it and it is exactly the kind of thing only a render shows. A
     monospace glyph is about 0.6em wide, so the width is arithmetic: pick the
     largest size on the ladder whose line still fits the bar.
  */
  const size = Math.max(26, Math.min(42, Math.floor(PROMPT_INNER / (Math.max(1, line.length) * 0.6))));
  return `
        <div class="stage">
          <div class="prompt" id="${id}-prompt">
            <span class="prompt-line" id="${id}-line" style="font-size:${size}px">${esc(line)}</span><span class="caret" id="${id}-caret" style="background:${accent}; height:${Math.round(size * 1.15)}px"></span>
          </div>
        </div>`;
};

/* ---- The motion for one shot ------------------------------------------ */
const shotTweens = ({ id, start, dur, look, shot }) => {
  const t = start.toFixed(3);
  const lines = [];

  if (shot.openCard || shot.endCard) {
    lines.push(`tl.from("#${id} .brand-mark", { scale: 0.9, autoAlpha: 0, duration: 0.6, ease: "power3.out" }, ${t});`);
    lines.push(`tl.from("#${id} .brand-glow", { autoAlpha: 0, duration: 0.7, ease: "none" }, ${t});`);
    lines.push(`tl.from("#${id} .brand-hello, #${id} .brand-for", { y: 26, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, ${(start + 0.28).toFixed(3)});`);
    if (shot.endCard) {
      lines.push(`tl.from("#${id} .brand-free", { y: 22, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, ${(start + 0.44).toFixed(3)});`);
      lines.push(`tl.from("#${id} .brand-store", { y: 18, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, ${(start + 0.62).toFixed(3)});`);
    }
    return lines.join('\n    ');
  }

  if (shot.typed) {
    // Steps, one per character, so the line arrives a letter at a time.
    const n = Math.max(1, (shot.text ?? '').length);
    const typeFor = Math.min(1.5, dur * 0.55);
    lines.push(`typeIn("#${id}-line", "#${id}-caret", ${n}, ${t}, ${typeFor.toFixed(3)});`);
    lines.push(`tl.from("#${id}-prompt", { y: 24, autoAlpha: 0, duration: 0.45, ease: "power3.out" }, ${t});`);
  } else if (shot.screen) {
    /*
       The picture arrives and then drifts, and the drift is the only thing
       moving for most of the shot. A still screenshot held for two seconds
       reads as a slideshow; a slow, constant travel reads as a camera.
    */
    if (look === 'keynote') {
      lines.push(`tl.from("#${id}-panel", { scale: 1.06, autoAlpha: 0, duration: 0.6, ease: "power2.out" }, ${t});`);
      lines.push(`tl.fromTo("#${id}-img", { scale: 1.0 }, { scale: 1.05, duration: ${dur.toFixed(3)}, ease: "none" }, ${t});`);
    } else {
      lines.push(`tl.from("#${id}-panel", { yPercent: 6, autoAlpha: 0, duration: 0.55, ease: "power3.out" }, ${t});`);
      lines.push(`tl.fromTo("#${id}-img", { yPercent: 0 }, { yPercent: -2.2, duration: ${dur.toFixed(3)}, ease: "none" }, ${t});`);
    }
  }

  if (shot.kicker) {
    lines.push(`tl.from("#${id}-kicker", { y: 14, autoAlpha: 0, duration: 0.4, ease: "power2.out" }, ${(start + 0.1).toFixed(3)});`);
  }
  lines.push(`tl.from("#${id}-cap", { y: 22, autoAlpha: 0, duration: 0.45, ease: "power3.out" }, ${(start + 0.18).toFixed(3)});`);
  if (look === 'keynote') {
    // The gradient sweep across the headline: the bright stop travels from one
    // edge to the other once, over the whole shot.
    lines.push(`tl.fromTo("#${id}-cap", { backgroundPositionX: "0%" }, { backgroundPositionX: "100%", duration: ${dur.toFixed(3)}, ease: "none" }, ${t});`);
  }
  return lines.join('\n    ');
};

/* ---- The page ---------------------------------------------------------- */
const page = ({ script, title, look, dark, scenes, audio, bed, tweens }) => {
  const ink = dark ? '#F3F6FC' : '#101418';
  const ground = dark ? '#05070D' : '#F6F7F9';
  const sub = dark ? '#9AA6BC' : '#5B6472';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>${esc(title)}</title>
    <!--
      GENERATED by scripts/build.mjs from remotion-ad/src/scripts/${script.id}.
      Do not edit by hand: "npm run check" fails when this file is not what
      the current script produces, and the words belong to the script.
    -->
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: ${ground}; }
      #root {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: ${ground};
        color: ${ink};
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .clip { position: absolute; inset: 0; }

      /* ---- the picture ------------------------------------------------ */
      .stage {
        position: absolute;
        left: 0; right: 0;
        top: 0;
        height: 1340px;
        display: grid;
        place-items: center;
        padding: ${dark ? '0' : '96px 0 0'};
      }
      .panel {
        position: relative;
        overflow: hidden;
        ${dark
          ? 'width: 1080px; height: 1340px; border-radius: 0;'
          : 'width: 660px; height: 1140px; border-radius: 44px; box-shadow: 0 48px 120px rgba(16,20,24,0.18), 0 2px 0 rgba(255,255,255,0.7) inset;'}
      }
      .shot-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      ${dark
        ? `.panel::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(to bottom, rgba(5,7,13,0.55) 0%, rgba(5,7,13,0) 26%, rgba(5,7,13,0) 52%, ${ground} 97%),
          radial-gradient(72% 52% at 50% 42%, rgba(5,7,13,0) 40%, rgba(5,7,13,0.62) 100%);
      }`
        : ''}

      /* ---- the typed prompt ------------------------------------------- */
      .prompt {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 960px;
        padding: 40px 46px;
        border-radius: 34px;
        background: ${dark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'};
        border: 1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(16,20,24,0.10)'};
        box-shadow: ${dark ? 'none' : '0 28px 70px rgba(16,20,24,0.12)'};
      }
      .prompt-line {
        font-family: ui-monospace, monospace;
        line-height: 1.25;
        letter-spacing: -0.01em;
        color: ${ink};
        white-space: nowrap;
        clip-path: inset(0 0 0 0);
      }
      .caret { display: inline-block; width: 6px; border-radius: 3px; }

      /* ---- the words -------------------------------------------------- */
      .band {
        position: absolute;
        left: 72px; right: 72px;
        bottom: 330px;
        min-height: 230px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 18px;
      }
      .kicker {
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .caption {
        margin: 0;
        font-weight: 800;
        line-height: 1.08;
        letter-spacing: -0.025em;
        text-wrap: balance;
        color: ${ink};
        ${look === 'keynote'
          ? `background-image: linear-gradient(100deg, ${ink} 0%, ${ink} 30%, #FFFFFF 46%, ${ink} 62%, ${ink} 100%);
        background-size: 280% 100%;
        background-position-x: 0%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;`
          : ''}
      }

      /* ---- the brand card --------------------------------------------- */
      .brand {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 22px;
        padding-bottom: 150px;
        background: #05070D;
        color: #F3F6FC;
      }
      .brand-glow { position: absolute; inset: 0; }
      .brand-mark { position: relative; width: 560px; height: auto; }
      .brand-hello { position: relative; margin: 0; font-size: 58px; font-weight: 800; letter-spacing: -0.01em; }
      .brand-for { position: relative; margin: 0; font-size: 40px; font-weight: 600; opacity: 0.86; }
      .brand-free {
        position: relative;
        margin: 0;
        font-size: 62px;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: #2BD9F2;
        text-shadow: 0 0 38px rgba(43,217,242,0.45);
      }
      .brand-store { position: relative; display: flex; align-items: center; gap: 26px; }
      .brand-store span { font-size: 52px; font-weight: 800; letter-spacing: -0.02em; }
      .sub { color: ${sub}; }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="${esc(script.id)}"
      data-start="0"
      data-width="1080"
      data-height="1920"
      data-fps="30"
      data-duration="60"
    >
${scenes.join('\n')}
${[bed, ...audio].filter(Boolean).join('\n')}
    </div>

    <script src="assets/gsap.min.js"></script>
    <script>
      /*
         One paused timeline, registered only once it is fully built.

         It is built inside document.fonts.ready because the typed prompt
         measures its own line, and a width measured against a fallback face is
         the wrong width. Registering the key before the build finishes would
         hand the runtime an empty timeline, which renders blank.
      */
      document.fonts.ready.then(function () {
        var tl = gsap.timeline({ paused: true });

        function typeIn(lineSel, caretSel, chars, at, over) {
          var line = window.document.querySelector(lineSel);
          var caret = window.document.querySelector(caretSel);
          if (!line || !caret) return;
          var w = line.getBoundingClientRect().width;
          var step = "steps(" + chars + ")";
          tl.fromTo(
            line,
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: over, ease: step },
            at
          );
          tl.fromTo(
            caret,
            { x: -w },
            { x: 0, duration: over, ease: step },
            at
          );
        }

    ${tweens.join('\n    ')}

        window.__timelines["${esc(script.id)}"] = tl;
        if (window.__hfForceTimelineRebind) window.__hfForceTimelineRebind();
      });
    </script>
  </body>
</html>
`;
};

/* ---- Run --------------------------------------------------------------- */

// The brand marks travel with the films; both are already correct in the
// Remotion project (the logo is alpha-matted, the Play mark is Google's own
// unmodified artwork) and neither may be redrawn here.
await fs.mkdir(path.join(assetDir, 'brand'), { recursive: true });
for (const [from, to] of [
  ['orbit-logo.png', 'brand/orbit-logo.png'],
  ['google-play-logo.svg', 'brand/google-play-logo.svg'],
]) {
  if (!(await copyAsset(path.join(remotion, 'public', from), to))) {
    throw new Error(`Brand asset missing: remotion-ad/public/${from}`);
  }
}
await copyAsset(
  path.join(root, 'node_modules', 'gsap', 'dist', 'gsap.min.js'),
  'gsap.min.js',
);

/*
 * Each film is built on its own, and one failing does not stop the other.
 *
 * They share a script set and a look, not a set of screenshots: `ask-it` walks
 * a single question into its own written answer and its diagram, `the-year`
 * walks the four MBBS years. A plate missing from one is no reason the other
 * cannot be built and reviewed.
 */
const results = [];
const failures = [];
for (const v of VARIATIONS) {
  try {
    results.push(await build(v));
  } catch (err) {
    failures.push(`${v.scriptId}: ${err.message}`);
  }
}

for (const r of results) {
  const voice =
    r.missingAudio === 0
      ? 'voiced'
      : `SILENT — ${r.missingAudio} clip(s) not on disk, so this renders without the voice`;
  process.stdout.write(`  ${r.file}  ${r.shots} shots, 60.0s, ${voice}\n`);
}
for (const f of failures) process.stdout.write(`\n  NOT BUILT  ${f}\n`);
if (results.length === 0) process.exitCode = 1;
if (results.some((r) => r.missingAudio > 0)) {
  process.stdout.write(
    '\nThe recordings are made by `cd remotion-ad && npm run voice`, which needs\n' +
      'the speech host this sandbox cannot reach. CI records them; a render here\n' +
      'is a check on the picture, never on the finished film.\n',
  );
}
