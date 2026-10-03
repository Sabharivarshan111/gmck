import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
export const ViewType = { TEXTURE: 0, SURFACE: 1, SURFACE_SECURE: 2 };
const Video = forwardRef<{ seek(seconds: number): void }, any>((props, ref) => {
  const video = useRef<HTMLVideoElement>(null);
  const { volume = 1, rate = 1, paused, source, onError } = props;
  useImperativeHandle(ref, () => ({ seek(seconds) { if (video.current) video.current.currentTime = seconds; } }));
  useEffect(() => {
    if (!video.current) return;
    video.current.volume = Math.max(0, Math.min(1, volume));
    video.current.playbackRate = rate;
    if (paused) video.current.pause();
    else video.current.play().catch(error => onError?.({ error: { errorString: error.message } }));
  }, [paused, volume, rate, source?.uri, onError]);
  return <video ref={video} src={props.source?.uri} loop={props.repeat} muted={props.muted} playsInline
    style={{ ...StyleSheet.flatten(props.style), objectFit: props.resizeMode === 'cover' ? 'cover' : 'contain' }}
    onLoadedMetadata={() => props.onLoad?.({ duration: video.current?.duration ?? 0 })}
    onTimeUpdate={() => props.onProgress?.({ currentTime: video.current?.currentTime ?? 0, playableDuration: video.current?.duration ?? 0 })}
    onSeeked={() => props.onSeek?.({ currentTime: video.current?.currentTime ?? 0 })}
    onEnded={() => props.onEnd?.()} onError={() => props.onError?.({ error: { errorString: 'This file could not be played by your browser.' } })} />;
});
export default Video;
