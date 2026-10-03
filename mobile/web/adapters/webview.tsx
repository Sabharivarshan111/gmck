import React from 'react';
import { StyleSheet } from 'react-native';
export function WebView({ source, style }: any) {
  // Native note HTML is treated as untrusted and cannot run scripts or navigate the parent.
  const remote = typeof source?.uri === 'string' && /^https:\/\/(www\.)?(youtube-nocookie\.com|youtube\.com)\/embed\//.test(source.uri);
  return <iframe title="Note media" src={remote ? source.uri : undefined} srcDoc={remote ? undefined : source?.html}
    sandbox={remote ? 'allow-scripts allow-same-origin allow-presentation' : ''} allow="fullscreen; encrypted-media" allowFullScreen
    style={{ ...StyleSheet.flatten(style), border: 0 }} />;
}
export default WebView;
