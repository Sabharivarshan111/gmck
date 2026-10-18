/** Android can reduce its actual backing buffer under resource pressure.
 * Three's requested canvas size then exceeds the surface it can draw into.
 * Use the real surface so geometry and CSS-projected labels stay registered.
 */
export function syncDrawingBufferViewport(renderer: {
  getContext(): { readonly drawingBufferWidth: number; readonly drawingBufferHeight: number };
  getPixelRatio(): number;
  setViewport(x: number, y: number, width: number, height: number): unknown;
}): boolean {
  const gl = renderer.getContext();
  const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
  const ratio = renderer.getPixelRatio();
  if (width <= 0 || height <= 0 || !Number.isFinite(ratio) || ratio <= 0) return false;
  renderer.setViewport(0, 0, width / ratio, height / ratio);
  return true;
}
