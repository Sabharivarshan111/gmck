import React from 'react';
import { StyleSheet } from 'react-native';
export function WebView({ source, style }: any) {
  // Render only a validated YouTube URL directly. Never grant scripts to note HTML.
  const candidate = source?.uri || (source?.baseUrl === 'https://www.youtube-nocookie.com' && typeof source.html === 'string'
    ? new DOMParser().parseFromString(source.html, 'text/html').querySelector('iframe')?.getAttribute('src') : '');
  let remote = '';
  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:' && ['www.youtube-nocookie.com', 'youtube-nocookie.com', 'www.youtube.com', 'youtube.com'].includes(url.hostname)
      && /^\/embed\/[a-zA-Z0-9_-]{11}$/.test(url.pathname) && !url.username && !url.password && !url.port) {
      url.searchParams.set('origin', location.origin);
      url.searchParams.set('widget_referrer', location.origin);
      remote = url.href;
    }
  } catch { /* arbitrary note HTML stays sandboxed */ }
  return <iframe title="Note media" src={remote || undefined} srcDoc={remote ? undefined : source?.html}
    sandbox={remote ? 'allow-scripts allow-same-origin allow-presentation' : ''}
    referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen
    style={{ ...StyleSheet.flatten(style), border: 0 }} />;
}
export default WebView;
