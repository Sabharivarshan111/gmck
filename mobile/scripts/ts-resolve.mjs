/**
 * Let Node resolve the app's extensionless imports.
 *
 * `src/bot/` imports `./face`, not `./face.ts`, because that is what Metro and
 * the TypeScript build expect and the app's source should not be bent to suit
 * a check. Node's ESM resolver needs the extension, so this hook adds it —
 * fifteen lines, and the alternative was either a build step (which puts a
 * compiled copy between the check and the code it is checking) or `.ts` on
 * every import in the app (which changes shipping source for a test).
 */
export function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
    return next(`${specifier}.ts`, context);
  }
  return next(specifier, context);
}
