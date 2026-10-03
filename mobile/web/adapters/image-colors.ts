export default { async getColors(uri: string) {
  const image = new Image(); image.crossOrigin = 'anonymous'; image.src = uri; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 24;
  const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0, 24, 24);
  const data = context.getImageData(0, 0, 24, 24).data; const rgb = [0, 0, 0]; let count = 0;
  for (let index = 0; index < data.length; index += 4) if (data[index + 3] > 128) { count++; for (let color = 0; color < 3; color++) rgb[color] += data[index + color]; }
  const average = '#' + rgb.map(value => Math.round(value / Math.max(count, 1)).toString(16).padStart(2, '0')).join('');
  return { platform: 'android' as const, average, dominant: average, vibrant: average, darkVibrant: average, lightVibrant: average };
} };
