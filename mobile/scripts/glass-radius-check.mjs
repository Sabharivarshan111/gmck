/**
 * One corner radius per glass surface.
 *
 * `GlassSurface` draws four things on one curve: the fill (clipped by the
 * outer View's `borderRadius`), the bevel rim, the counter-rim, and — on
 * Android 13+ with a wallpaper — the AGSL shader's rounded-rectangle SDF. If
 * the style says one number and the `borderRadius` prop says another, the fill
 * is clipped on one curve and everything drawn over it on a different one, and
 * the corner reads as cut.
 *
 * The home hero shipped that way: `styles.hero` was `radius.xl` (24) and the
 * prop was 20. It sat directly above the quick-action tiles, whose numbers
 * agreed, so the screen showed two corner treatments at once — reported as
 * "the cutting of the corner is not nice and it's not consistent".
 *
 * `GlassSurface` now takes the radius from the flattened style whenever the
 * style has one, so the two cannot disagree at runtime. This check exists so
 * the contradiction cannot be written down either: a call site that sets a
 * radius in BOTH places is a reader being told two different things, and the
 * next person to change one will not know to change the other.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

/** The token scale, so `radius.xl` and `24` compare as the same number. */
const TOKENS = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
const asNumber = value => {
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);
  const token = text.match(/^radius\.(\w+)$/);
  return token ? (TOKENS[token[1]] ?? null) : null;
};

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

for (const file of await walk(path.join(root, 'src'))) {
  const body = await fs.readFile(file, 'utf8');
  if (!body.includes('<GlassSurface')) continue;
  const rel = path.relative(root, file);

  for (const match of body.matchAll(/<GlassSurface\b([\s\S]{0,300}?)>/g)) {
    const tag = match[1];
    const prop = tag.match(/borderRadius=\{([^}]+)\}/);
    if (!prop) continue;
    const styled = tag.match(/style=\{?\[?\s*styles\.(\w+)/);
    if (!styled) continue;

    // The named style's own block, taken by brace depth rather than by a
    // regex: a style object holds nested objects and a lazy match walks out
    // of the one being asked about and into the next.
    const start = body.indexOf(`\n  ${styled[1]}: {`);
    if (start < 0) continue;
    let depth = 0;
    let end = start;
    for (let i = body.indexOf('{', start); i < body.length; i += 1) {
      if (body[i] === '{') depth += 1;
      else if (body[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const block = body.slice(start, end);
    const inStyle = block.match(/\n\s{4}borderRadius:\s*([\w.]+)/);
    if (!inStyle) continue;

    const a = asNumber(prop[1]);
    const b = asNumber(inStyle[1]);
    if (a === null || b === null) continue;
    if (a !== b) {
      problems.push(
        `${rel}: <GlassSurface style={styles.${styled[1]}}> says borderRadius ` +
          `${inStyle[1]} (${b}) in the style and ${prop[1]} (${a}) in the prop. ` +
          'The style clips the fill and wins; the prop is dead and misleading.',
      );
    } else {
      problems.push(
        `${rel}: <GlassSurface style={styles.${styled[1]}}> repeats borderRadius ` +
          `${a} in both the style and the prop. Drop the prop — the style is ` +
          'what clips the fill, and two copies of one number drift.',
      );
    }
  }
}

if (problems.length) {
  process.stdout.write('GLASS RADIUS\n');
  for (const problem of problems) process.stdout.write(`  - ${problem}\n`);
  process.stdout.write(
    `\n${problems.length} surface(s) name a corner radius twice. A glass card draws its\n` +
      'fill, its rim, its counter-rim and its shader on ONE curve; two numbers is how\n' +
      'a corner ends up looking cut.\n',
  );
  process.exit(1);
}

process.stdout.write('OK  every glass surface names its corner radius once\n');
