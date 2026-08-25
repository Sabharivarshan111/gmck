/**
 * A present, silent stand-in for the native sound module.
 *
 * The preview harness is react-native-web: there is no TurboModuleRegistry and
 * no SoundPool, so importing the real spec would reach for an export
 * react-native-web does not have.
 *
 * It reports **present** rather than absent, and that is a deliberate change.
 * `soundAvailable` gates whether the sound controls are drawn at all — correct
 * on a device, where a missing module means those switches would do nothing —
 * but in the preview it meant the entire alert-sound section was invisible.
 * That is the one place it needs to be visible: it is a review harness, and a
 * section that cannot be reviewed is a section that ships unreviewed, which is
 * how the Pomodoro sheet reached a phone with four unlabelled sliders in it.
 *
 * Playback is a no-op. Nothing here should ever suggest the browser made a
 * sound; what it stands in for is the layout, the selected state and the
 * wiring, all of which are real.
 */
export default {
  play: () => {},
  preview: () => {},
  /** No phone, nothing silencing it. */
  silencingReason: () => '',
};
