import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

interface WaveformRiverProps {
  active?: boolean;
  color?: string;
  height?: number;
}

/**
 * Waveform River Audio Visualizer for Web Preview
 *
 * Mirrored waveform ribbon scrolling right-to-left with a glowing leading head
 * dot where new audio enters. Connects to real-time mic or synthetic wave.
 */
export function WaveformRiver({
  active = true,
  color = '#22d3ee',
  height = 52,
}: WaveformRiverProps) {
  const { colors } = useTheme();
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !active) {
      return;
    }

    const cv: any = canvasRef.current;
    const ctx: any = cv.getContext?.('2d');
    if (!ctx) {
      return;
    }

    const win: any = typeof globalThis !== 'undefined' ? globalThis : {};
    const nav: any = win.navigator || {};

    let running = true;
    let raf = 0;
    const COLS = 120;
    let W = cv.clientWidth || 320;
    let H = cv.clientHeight || height;
    let DPR = Math.min(2, win.devicePixelRatio || 1);
    let cw = W / COLS;
    let t = 0;

    const amp = new Float32Array(COLS);
    const eng = new Float32Array(COLS);
    let head = 0;
    for (let i = 0; i < COLS; i++) {
      amp[i] = 0.5;
      eng[i] = 0;
    }

    let nz = 0;
    let nzT = 0;
    function synthSample(time: number): [number, number] {
      const lfo1 = 0.5 + 0.5 * Math.sin(time * 0.31);
      const lfo2 = 0.5 + 0.5 * Math.sin(time * 0.17 + 1.3);
      let s =
        Math.sin(time * 5.2) * 0.42 * lfo1 +
        Math.sin(time * 8.9 + 0.6) * 0.3 * lfo2 +
        Math.sin(time * 2.1) * 0.22 +
        Math.sin(time * 13.7 + 2.0) * 0.14 * lfo1;
      if (time - nzT > 0.045) {
        nz += (Math.random() * 2 - 1 - nz) * 0.5;
        nzT = time;
      }
      s += nz * 0.18 * lfo2;
      const e = Math.min(1, Math.abs(s) * 0.9 + lfo1 * 0.25);
      return [0.5 + s * 0.5, e];
    }

    let actx: any = null;
    let analyser: any = null;
    let td: Uint8Array | null = null;
    let live = false;
    let micStream: any = null;

    try {
      const AC = win.AudioContext || win.webkitAudioContext;
      if (AC && nav.mediaDevices?.getUserMedia) {
        actx = new AC();
        analyser = actx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;
        td = new Uint8Array(analyser.fftSize);

        nav.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream: any) => {
            if (!running) {
              stream.getTracks?.().forEach((tr: any) => tr.stop());
              return;
            }
            micStream = stream;
            const src = actx.createMediaStreamSource(stream);
            src.connect(analyser);
            live = true;
          })
          .catch(() => {
            live = false;
          });
      }
    } catch {
      live = false;
    }

    function liveSample(): [number, number] {
      if (!analyser || !td) {
        return synthSample(t);
      }
      analyser.getByteTimeDomainData(td);
      let sum = 0;
      let peak = 0;
      const n = td.length;
      for (let i = 0; i < n; i++) {
        const v = (td[i] - 128) / 128;
        sum += v * v;
        if (Math.abs(v) > peak) {
          peak = Math.abs(v);
        }
      }
      const rms = Math.sqrt(sum / n);
      return [0.5 + peak * 0.48, Math.min(1, rms * 2.8)];
    }

    function resize() {
      if (!cv) return;
      DPR = Math.min(2, win.devicePixelRatio || 1);
      W = cv.clientWidth || 320;
      H = cv.clientHeight || height;
      cv.width = Math.max(1, (W * DPR) | 0);
      cv.height = Math.max(1, (H * DPR) | 0);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cw = W / COLS;
    }

    function colAt(k: number) {
      return (head + k) % COLS;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const mid = H * 0.5;

      // Baseline
      ctx.strokeStyle = 'rgba(34,211,238,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(W, mid);
      ctx.stroke();

      // Mirrored ribbon
      ctx.beginPath();
      for (let k = 0; k < COLS; k++) {
        const idx = colAt(k);
        const x = k * cw;
        const a = amp[idx];
        const y = mid - (a - 0.5) * H * 0.82;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let k2 = COLS - 1; k2 >= 0; k2--) {
        const i2 = colAt(k2);
        const x2 = k2 * cw;
        const a2 = amp[i2];
        const y2 = mid + (a2 - 0.5) * H * 0.82;
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();

      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(34,211,238,0.02)');
      g.addColorStop(0.7, 'rgba(34,211,238,0.18)');
      g.addColorStop(1, 'rgba(34,211,238,0.48)');
      ctx.fillStyle = g;
      ctx.fill();

      // Bright crest stroke
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let k3 = 0; k3 < COLS; k3++) {
        const i3 = colAt(k3);
        const x3 = k3 * cw;
        const a3 = amp[i3];
        const y3 = mid - (a3 - 0.5) * H * 0.82;
        if (k3 === 0) ctx.moveTo(x3, y3);
        else ctx.lineTo(x3, y3);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Leading head dot where new audio enters
      const hi = colAt(COLS - 1);
      const hy = mid - (amp[hi] - 0.5) * H * 0.82;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 + eng[hi] * 14;
      ctx.beginPath();
      ctx.arc(W - cw * 0.5, hy, 2.4 + eng[hi] * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function append() {
      const s = live && analyser ? liveSample() : synthSample(t);
      amp[head] = s[0];
      eng[head] = s[1];
      head = (head + 1) % COLS;
    }

    function loop() {
      if (!running) return;
      t += 0.024;
      append();
      draw();
      raf = (win.requestAnimationFrame || requestAnimationFrame)(loop);
    }

    resize();
    win.addEventListener?.('resize', resize);
    loop();

    return () => {
      running = false;
      if (raf) (win.cancelAnimationFrame || cancelAnimationFrame)(raf);
      win.removeEventListener?.('resize', resize);
      if (micStream) {
        micStream.getTracks?.().forEach((tr: any) => tr.stop());
      }
      if (actx) {
        try {
          actx.close();
        } catch {
          // ignore
        }
      }
    };
  }, [active, color, height]);

  return (
    <View style={[styles.container, { height, borderColor: colors.border }]}>
      <View style={styles.badgeRow}>
        <View style={[styles.liveDot, { backgroundColor: color }]} />
        <Text style={[styles.liveLabel, { color }]}>LISTENING...</Text>
      </View>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: '#07080d',
          borderRadius: 12,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#07080d',
    marginBottom: 8,
  },
  badgeRow: {
    position: 'absolute',
    top: 6,
    left: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7, 8, 13, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
