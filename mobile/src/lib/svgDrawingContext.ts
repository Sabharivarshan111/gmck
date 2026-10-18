/** Small native SVG adapter for the canonical ECG cutout's Canvas drawing calls. */
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export class SvgDrawingContext {
  fillStyle = '#000';
  strokeStyle = '#000';
  lineWidth = 1;
  lineCap = 'butt';
  lineJoin = 'miter';
  font = '10px monospace';
  textAlign = 'left';
  private path = '';
  private dash: number[] = [];
  private elements: string[] = [];
  beginPath() { this.path = ''; }
  moveTo(x: number, y: number) { this.path += `M${x} ${y} `; }
  lineTo(x: number, y: number) { this.path += `L${x} ${y} `; }
  closePath() { this.path += 'Z'; }
  arc(x: number, y: number, radius: number, start: number, end: number) {
    if (Math.abs(end - start - Math.PI * 2) > 1e-8) throw Error('ECG source introduced a noncircular arc; review native adapter');
    this.path += `M${x + radius} ${y} a${radius} ${radius} 0 1 0 ${-2 * radius} 0 a${radius} ${radius} 0 1 0 ${2 * radius} 0 `;
  }
  setLineDash(values: number[]) { this.dash = values; }
  private strokeAttributes() { return `stroke="${escape(this.strokeStyle)}" stroke-width="${this.lineWidth}" stroke-linecap="${this.lineCap}" stroke-linejoin="${this.lineJoin}" stroke-dasharray="${this.dash.join(' ')}"`; }
  stroke() { this.elements.push(`<path d="${this.path}" fill="none" ${this.strokeAttributes()}/>`); }
  fill() { this.elements.push(`<path d="${this.path}" fill="${escape(this.fillStyle)}"/>`); }
  fillRect(x: number, y: number, width: number, height: number) { this.elements.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${escape(this.fillStyle)}"/>`); }
  strokeRect(x: number, y: number, width: number, height: number) { this.elements.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" ${this.strokeAttributes()}/>`); }
  private fontSize() { return Number(this.font.match(/([\d.]+)px/)?.[1] || 10); }
  // Canonical cutout labels use monospace. Native font rasterization is checked
  // separately on Android; this measures nominal character advances for pills.
  measureText(value: string) { return { width: Array.from(value).length * this.fontSize() * .6 }; }
  fillText(value: string, x: number, y: number) {
    const anchor = this.textAlign === 'center' ? 'middle' : this.textAlign === 'right' ? 'end' : 'start';
    this.elements.push(`<text x="${x}" y="${y}" fill="${escape(this.fillStyle)}" font-size="${this.fontSize()}" font-weight="${this.font.includes('bold') ? '700' : '400'}" font-family="monospace" text-anchor="${anchor}">${escape(value)}</text>`);
  }
  svg(width: number, height: number) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${this.elements.join('')}</svg>`; }
}
