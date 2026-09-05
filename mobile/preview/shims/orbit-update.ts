/**
 * Google Play's in-app update API, absent — which is the honest answer here.
 *
 * The preview is a browser. There is no Play services, no Play account and no
 * installed app to update, so `TurboModuleRegistry.get` would return null on a
 * device in exactly this situation too. Returning null rather than a fake means
 * the preview shows what a build Play did not install shows: no update card,
 * ever.
 *
 * Anything that pretended otherwise would be worse than nothing. A shim that
 * reported an update available would put a button on screen whose only possible
 * outcome is a Play sheet that cannot open.
 */
export default null;
