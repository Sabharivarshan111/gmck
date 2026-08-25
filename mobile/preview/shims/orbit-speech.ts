/**
 * The preview harness has no SpeechRecognizer and no TurboModuleRegistry.
 *
 * Reports **absent**, unlike the sound shim. The difference is what the flag
 * gates: sound hides a settings section that needs reviewing, so that shim
 * pretends to be there. This one gates a microphone that would open a
 * recording UI and never resolve — a control that cannot work is worse than a
 * control that is not offered, and `speechAvailable()` returning false is the
 * honest state of a browser.
 */
export default null;
