/**
 * The preview harness has no Storage Access Framework and no app storage.
 *
 * Reports **absent** — the opposite of the notify and sound shims, and for a
 * reason. Those gate controls whose *states* are worth reviewing in a browser;
 * this one gates a button whose entire job is to open a system picker that
 * does not exist here. A stub returning an invented file would put the notes
 * editor into a state no tap on a real phone can produce, with a video the
 * renderer then cannot play.
 *
 * So `noteFilesAvailable` is false here, the "Add file" button is not offered,
 * and `check:smoke` asserts the picture path — which is real in both — rather
 * than a fiction.
 */
export default null;
