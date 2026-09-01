// The avatar's engine, run for real.
//
// This is the check this repo does not usually get to write. `sample(t)` is a
// pure function of the time with no DOM, no native module and no emulator
// behind it, so the actual thing that draws the bot can be *executed* here and
// its output asserted — rather than grepped for, screenshotted, or taken on
// trust until an APK lands.
//
// What it protects, in order of how badly each one shipped-would-hurt:
//
//   • determinism, which everything else rests on;
//   • the morph landing and then stopping, which is what lets the scheduler
//     stop with it — an avatar that never settles is a phone that never idles;
//   • the eyes staying inside the viewBox at every gaze, since a clipped eye
//     is the failure a still screenshot of one state would never show.
//
//   node scripts/bot-check.mjs
// Run with `--experimental-strip-types`, which is why package.json wraps it:
// Node erases the type annotations and runs the engine's real source, so what
// is asserted here is the file that ships rather than a compiled copy of it
// that could drift from it.
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./ts-resolve.mjs', pathToFileURL(`${import.meta.dirname}/`));

const { BotEngine, HALF_BOX, RADIUS } = await import('../src/bot/engine.ts');
const { STATES, isStill } = await import('../src/bot/states.ts');

const failures = [];
const check = (ok, what) => {
  if (!ok) failures.push(what);
};

const ids = Object.keys(STATES);

/* ---- determinism ---- */

{
  const a = new BotEngine();
  const b = new BotEngine();
  a.setState('thinking', 0);
  b.setState('thinking', 0);
  let same = true;
  for (let t = 0; t < 12; t += 0.37) {
    if (JSON.stringify(a.sample(t)) !== JSON.stringify(b.sample(t))) {
      same = false;
      break;
    }
  }
  check(same, 'two engines driven identically produce different frames — sample() is not a pure function of the time');

  // Replaying an earlier time must give the earlier picture back. This is the
  // property that a "discard the previous state once the morph is over"
  // optimisation quietly destroys.
  const engine = new BotEngine();
  engine.setState('wide', 0);
  const early = JSON.stringify(engine.sample(0.1));
  engine.sample(9);
  check(
    JSON.stringify(engine.sample(0.1)) === early,
    'replaying a time from during the morph gives a different frame the second time — the engine is not re-readable',
  );
}

/* ---- the morph lands, and then stops ---- */

for (const id of ids) {
  const engine = new BotEngine();
  engine.setState(id, 0);
  const def = STATES[id];

  check(
    !engine.sample(def.morph * 0.5).settled,
    `${id} reports settled halfway through its own morph`,
  );

  if (isStill(id)) {
    check(engine.sample(def.morph + 0.01).settled, `${id} never settles, so the scheduler can never stop`);
    const one = JSON.stringify(engine.sample(def.morph + 1));
    const two = JSON.stringify(engine.sample(def.morph + 40));
    check(one === two, `${id} is declared still but its frames keep changing`);
  } else {
    check(!engine.sample(def.morph + 5).settled, `${id} claims to settle while it is still animating`);
  }
}

/* ---- nothing leaves the box, at any gaze ---- */

{
  let worst = 0;
  let where = '';
  for (const id of ids) {
    const engine = new BotEngine();
    engine.setState(id, 0);
    for (let t = 0; t < 50; t += 0.11) {
      const frame = engine.sample(t);
      check(Number.isFinite(frame.r) && frame.r > 0, `${id} produced a body radius of ${frame.r}`);
      for (const eye of frame.eyes) {
        const at = /translate\(([-0-9.]+) ([-0-9.]+)\)/.exec(eye.transform);
        check(!!at, `${id} produced an eye with no translate`);
        if (!at) continue;
        const reach = Math.hypot(Number(at[1]) - HALF_BOX, Number(at[2]) - HALF_BOX);
        if (reach > worst) {
          worst = reach;
          where = id;
        }
        check(
          Number.isFinite(reach) && reach <= RADIUS + 1,
          `${id} put an eye ${reach.toFixed(1)} from the centre, outside a body of radius ${RADIUS}`,
        );
        check(eye.d.startsWith('M') && eye.d.endsWith('Z'), `${id} produced an unclosed eye path`);
        check(eye.opacity > 0, `${id} produced an eye at zero opacity — it would simply be missing`);
      }
    }
  }
  check(worst > RADIUS * 0.2, 'the eyes never move away from the centre — the sphere model is not doing anything');
  process.stdout.write(`     eyes reach ${worst.toFixed(1)} of ${RADIUS} at their furthest (${where})\n`);
}

/* ---- the blink actually happens ---- */

{
  const engine = new BotEngine();
  engine.setState('idle', 0);
  let closed = 0;
  for (let t = 0; t < 48; t += 0.02) {
    const eye = engine.sample(t).eyes[0];
    const m = /matrix\([-0-9.]+ ([-0-9.]+)/.exec(eye.transform);
    if (m && Math.abs(Number(m[1])) < 0.3) closed += 1;
  }
  check(closed > 0, 'the bot never blinks across 48 seconds of idle');

  const sleeping = new BotEngine();
  sleeping.setState('sleep', 0);
  const shut = sleeping.sample(3).eyes.every(eye => /matrix\([-0-9.]+ (-?0\.0)/.test(eye.transform));
  check(shut, 'sleep does not close the eyes');
}

/* ---- wink is asymmetric, and only wink ---- */

for (const id of ids) {
  const engine = new BotEngine();
  engine.setState(id, 0);
  const [a, b] = engine.sample(2).eyes;
  const lidOf = eye => Math.abs(Number(/matrix\([-0-9.]+ ([-0-9.]+)/.exec(eye.transform)[1]));
  const asymmetric = Math.abs(lidOf(a) - lidOf(b)) > 0.2;
  if (id === 'wink') {
    check(asymmetric, 'wink closes both eyes or neither — it is the one state that must be lopsided');
  }
}

if (failures.length > 0) {
  console.error('Bot engine check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `OK  ${ids.length} states are deterministic, settle when they claim to, blink, and keep both eyes on the face`,
);
