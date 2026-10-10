// Fit the front-facing bounds in both axes, including depth and room for controls.
export function isolationCameraDistance(size: { x: number; y: number; z: number }, fovDegrees: number, aspect: number, mobile = false, viewportHeight = 636): number {
  const tangent = Math.tan(fovDegrees * Math.PI / 360);
  const usableHeight = mobile ? Math.max(0.16, Math.min(0.60, (viewportHeight - 312) / viewportHeight)) : 0.84;
  const usableWidth = mobile ? 0.82 : 0.90;
  return Math.max(0.15, size.y / (2 * tangent * usableHeight), size.x / (2 * tangent * Math.max(0.1, aspect) * usableWidth)) + size.z / 2;
}
