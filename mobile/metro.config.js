const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// The question bank lives in the web app's src/data. It is pure TypeScript data
// with no DOM or browser dependencies, so the native app consumes it directly
// instead of keeping a second copy in sync.
const sharedData = path.resolve(__dirname, '..', 'src', 'data');

// A few web-app modules are pure logic with no DOM dependency and are shared
// rather than forked — notably the display-name blocklist, which would drift
// if it were duplicated. Only files this app actually imports are bundled.
const sharedLib = path.resolve(__dirname, '..', 'src', 'lib');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Metro refuses to resolve files outside the project root unless they are
  // explicitly watched.
  watchFolders: [sharedData, sharedLib],
  resolver: {
    extraNodeModules: {
      '@data': sharedData,
      '@shared': sharedLib,
    },
    /*
     * Where a file OUTSIDE this folder looks for node_modules.
     *
     * Metro resolves a bare module request by walking up from the requesting
     * file. For `../src/lib/apkgFormat.ts` that is `/repo/src/node_modules`,
     * then `/repo/node_modules` — and never `mobile/node_modules`, which is the
     * only one CI installs. Babel injects helper imports of its own into the
     * files it transforms (`@babel/runtime/helpers/interopRequireDefault` for a
     * default import of a CommonJS module), so a shared file that needs one
     * fails to bundle with:
     *
     *   Unable to resolve module @babel/runtime/helpers/interopRequireDefault
     *   from /repo/src/lib/apkgFormat.ts
     *
     * It is invisible on a developer's machine, because running the web app
     * once installs `/repo/node_modules` and the walk finds the helper there.
     * The release build has no such folder, so this was a green local build and
     * a red CI one — the same environment difference that had the Vercel build
     * failing on `mobile/tsconfig.json`, pointing the other way.
     *
     * `@shared` was safe for a year because the only file behind it was the
     * profanity list, which is plain data Babel adds nothing to.
     */
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
