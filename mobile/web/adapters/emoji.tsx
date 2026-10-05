import React from 'react';

// Android's Noto artwork stays visible across browsers, including machines
// without an emoji font. Only the native app's built-in glyphs are bundled.
const artwork = import.meta.glob('../emoji/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
export function renderEmoji(children: React.ReactNode): React.ReactNode {
  if (Array.isArray(children)) return children.map(renderEmoji);
  if (typeof children !== 'string' || !/\p{Extended_Pictographic}/u.test(children)) return children;
  return Array.from(segmenter.segment(children), ({ segment }, index) => {
    const key = Array.from(segment).filter(character => character.codePointAt(0) !== 0xfe0f)
      .map(character => character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')).join('-');
    const src = artwork[`../emoji/${key}.svg`];
    return src ? <img key={index} src={src} alt={segment} draggable={false}
      style={{ height: '1em', width: '1em', verticalAlign: '-0.12em', objectFit: 'contain' }} /> : segment;
  });
}
