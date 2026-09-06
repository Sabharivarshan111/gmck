// ============================================================================
// STETHOSCOPE SYNTHESIZER ENGINE (Web Audio API)
// Real-time procedural DSP synthesis of physiological and pathological
// cardiac and pulmonary acoustics for medical education.
// ============================================================================

export type AuscultationSite =
  | 'mitral'
  | 'aortic'
  | 'tricuspid'
  | 'pulmonic'
  | 'lung_bases'
  | 'lung_apices'
  | 'trachea';

export type HeartSoundPreset =
  | 'normal'
  | 's3_gallop'
  | 's4_gallop'
  | 'mitral_stenosis'
  | 'friction_rub'
  | 'tamponade_muffled';

export type LungSoundPreset =
  | 'vesicular'
  | 'bronchial'
  | 'crackles'
  | 'wheeze'
  | 'stridor'
  | 'silent';

export class StethoscopeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private stethFilter: BiquadFilterNode | null = null;
  private cardiacTimer: number | null = null;
  private pulmonaryTimer: number | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {}

  public async initialize(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    // Stethoscope Bell / Diaphragm Acoustic Filter (Default Diaphragm)
    this.stethFilter = this.ctx.createBiquadFilter();
    this.stethFilter.type = 'bandpass';
    this.stethFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.stethFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    this.stethFilter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.noiseBuffer = this.generatePinkNoiseBuffer(this.ctx, 4.0);
  }

  public setStethoscopeMode(mode: 'bell' | 'diaphragm'): void {
    if (!this.ctx || !this.stethFilter) return;
    const now = this.ctx.currentTime;
    if (mode === 'bell') {
      // Bell: Low-pass filter for low-frequency gallops (S3, S4) and diastolic rumbles
      this.stethFilter.type = 'lowpass';
      this.stethFilter.frequency.setTargetAtTime(140, now, 0.05);
      this.stethFilter.Q.setTargetAtTime(1.2, now, 0.05);
    } else {
      // Diaphragm: Bandpass filter for high-pitched valve snaps, rubs, and breath sounds
      this.stethFilter.type = 'bandpass';
      this.stethFilter.frequency.setTargetAtTime(320, now, 0.05);
      this.stethFilter.Q.setTargetAtTime(0.7, now, 0.05);
    }
  }

  private generatePinkNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // --------------------------------------------------------------------------
  // CARDIAC AUSCULTATION SCHEDULER
  // --------------------------------------------------------------------------
  public startCardiacAuscultation(hr: number, preset: HeartSoundPreset): void {
    this.stopCardiacAuscultation();
    if (!this.ctx || !this.stethFilter) return;

    const cycleDuration = 60 / Math.max(30, hr);
    const systolicTime = 0.38 * Math.sqrt(cycleDuration);

    const scheduleBeat = () => {
      if (!this.ctx || !this.stethFilter) return;
      const t = this.ctx.currentTime + 0.03;

      const isTamponade = preset === 'tamponade_muffled';
      const masterAttenuation = isTamponade ? 0.22 : 1.0;

      // 1. Synthesize S1 (Mitral/Tricuspid closure: 40 - 70 Hz damped thump)
      const s1Freq = preset === 'mitral_stenosis' ? 82 : isTamponade ? 45 : 68;
      const s1Gain = (preset === 'mitral_stenosis' ? 1.3 : 0.9) * masterAttenuation;
      this.playDampedThump(t, s1Freq, 42, 0.1, s1Gain);

      // 2. Synthesize S2 (Aortic/Pulmonic closure: 80 - 120 Hz snap)
      const s2Time = t + systolicTime;
      const s2Freq = isTamponade ? 60 : 105;
      const s2Gain = 0.8 * masterAttenuation;
      this.playDampedThump(s2Time, s2Freq, 70, 0.08, s2Gain);

      // 3. Pathological elements
      if (preset === 's3_gallop') {
        // S3: Early diastolic rapid filling ventricular thud
        const s3Time = s2Time + 0.14;
        this.playDampedThump(s3Time, 40, 32, 0.065, 0.45 * masterAttenuation);
      } else if (preset === 's4_gallop') {
        // S4: Late diastolic presystolic atrial kick
        const s4Time = t + cycleDuration - 0.09;
        this.playDampedThump(s4Time, 44, 34, 0.055, 0.38 * masterAttenuation);
      } else if (preset === 'mitral_stenosis') {
        // Opening Snap (OS): High pitched snap 75ms after S2
        const osTime = s2Time + 0.075;
        this.playDampedThump(osTime, 210, 160, 0.025, 0.65);

        // Diastolic Rumble: Low frequency filtered noise decaying in diastole
        this.playFilteredNoiseRumble(osTime + 0.02, cycleDuration - systolicTime - 0.12, 85, 4.0, 0.4);

        // Presystolic accentuation (crescendo into S1)
        const presysTime = t + cycleDuration - 0.14;
        this.playPresystolicCrescendo(presysTime, 0.13, 0.55);
      } else if (preset === 'friction_rub') {
        // Triphasic superficial leathery rub
        this.playPericardialScratch(t + 0.06, 0.14);
        this.playPericardialScratch(s2Time + 0.08, 0.12);
        this.playPericardialScratch(t + cycleDuration - 0.13, 0.1);
      }

      this.cardiacTimer = window.setTimeout(scheduleBeat, cycleDuration * 1000);
    };

    scheduleBeat();
  }

  public stopCardiacAuscultation(): void {
    if (this.cardiacTimer) {
      clearTimeout(this.cardiacTimer);
      this.cardiacTimer = null;
    }
  }

  private playDampedThump(
    t: number,
    fStart: number,
    fEnd: number,
    duration: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.stethFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(fStart, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t + duration);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.stethFilter);

    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  private playFilteredNoiseRumble(
    t: number,
    duration: number,
    centerFreq: number,
    Q: number,
    gainVal: number
  ): void {
    if (!this.ctx || !this.stethFilter || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(centerFreq, t);
    bpf.Q.setValueAtTime(Q, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.05, duration));

    source.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.stethFilter);

    source.start(t);
    source.stop(t + Math.max(0.05, duration));
  }

  private playPresystolicCrescendo(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.stethFilter || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(110, t);
    bpf.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(peakGain, t + duration);

    source.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.stethFilter);

    source.start(t);
    source.stop(t + duration);
  }

  private playPericardialScratch(t: number, duration: number): void {
    if (!this.ctx || !this.stethFilter || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(540, t);
    bpf.Q.setValueAtTime(5.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.45, t + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.stethFilter);

    source.start(t);
    source.stop(t + duration);
  }

  // --------------------------------------------------------------------------
  // PULMONARY AUSCULTATION SCHEDULER
  // --------------------------------------------------------------------------
  public startPulmonaryAuscultation(rr: number, preset: LungSoundPreset): void {
    this.stopPulmonaryAuscultation();
    if (!this.ctx || !this.stethFilter || !this.noiseBuffer) return;
    if (preset === 'silent') return;

    const cycleDuration = 60 / Math.max(8, rr);
    const isBronchial = preset === 'bronchial';
    const inspRatio = isBronchial ? 0.45 : 0.65;
    const inspDuration = cycleDuration * inspRatio;
    const expDuration = cycleDuration * (1 - inspRatio) * 0.85;

    const scheduleBreath = () => {
      if (!this.ctx || !this.stethFilter || !this.noiseBuffer) return;
      const t = this.ctx.currentTime + 0.03;

      // 1. Inspiratory phase
      this.playAirflowPhase(t, inspDuration, true, preset);

      // 2. Fine End-Inspiratory Crackles
      if (preset === 'crackles') {
        const crackleStartTime = t + inspDuration * 0.65;
        const crackleDuration = inspDuration * 0.35;
        this.scheduleCrackleCluster(crackleStartTime, crackleDuration, 28);
      }

      // 3. Stridor
      if (preset === 'stridor') {
        this.playStridorTone(t, inspDuration);
      }

      // 4. Expiratory phase
      const pauseDuration = isBronchial ? 0.2 : 0.05;
      const expStartTime = t + inspDuration + pauseDuration;
      this.playAirflowPhase(expStartTime, expDuration, false, preset);

      // 5. Polyphonic Expiratory Wheezing
      if (preset === 'wheeze') {
        this.playPolyphonicWheeze(expStartTime, expDuration);
      }

      this.pulmonaryTimer = window.setTimeout(scheduleBreath, cycleDuration * 1000);
    };

    scheduleBreath();
  }

  public stopPulmonaryAuscultation(): void {
    if (this.pulmonaryTimer) {
      clearTimeout(this.pulmonaryTimer);
      this.pulmonaryTimer = null;
    }
  }

  private playAirflowPhase(
    t: number,
    duration: number,
    isInsp: boolean,
    preset: LungSoundPreset
  ): void {
    if (!this.ctx || !this.stethFilter || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    const isBronchial = preset === 'bronchial';

    if (isBronchial) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isInsp ? 720 : 880, t);
      filter.Q.setValueAtTime(3.5, t);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isInsp ? 380 : 260, t);
      filter.Q.setValueAtTime(0.8, t);
    }

    const gain = this.ctx.createGain();
    const peakGain = isInsp ? 0.35 : isBronchial ? 0.32 : 0.12;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + duration * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.stethFilter);

    source.start(t);
    source.stop(t + duration);
  }

  private scheduleCrackleCluster(startTime: number, duration: number, count: number): void {
    if (!this.ctx || !this.stethFilter) return;

    for (let i = 0; i < count; i++) {
      const offset = duration * Math.pow(Math.random(), 0.65);
      const crackleTime = startTime + offset;
      const freq = 1200 + Math.random() * 900;
      const crackleDur = 0.006 + Math.random() * 0.003;
      const amp = 0.18 + Math.random() * 0.22;

      this.playDampedThump(crackleTime, freq, freq * 0.7, crackleDur, amp);
    }
  }

  private playPolyphonicWheeze(t: number, duration: number): void {
    if (!this.ctx || !this.stethFilter) return;

    const wheezeFreqs = [360, 480, 640, 790];
    wheezeFreqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() * 10 - 5), t);

      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.setValueAtTime(4.2 + idx * 0.4, t);
      lfoGain.gain.setValueAtTime(14, t);
      lfo.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + duration);

      const amp = 0.14 / (idx + 1);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(amp, t + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.stethFilter!);

      osc.start(t);
      osc.stop(t + duration);
    });
  }

  private playStridorTone(t: number, duration: number): void {
    if (!this.ctx || !this.stethFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.linearRampToValueAtTime(545, t + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(510, t + duration);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(530, t);
    bpf.Q.setValueAtTime(6.0, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.38, t + duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.stethFilter);

    osc.start(t);
    osc.stop(t + duration);
  }

  public dispose(): void {
    this.stopCardiacAuscultation();
    this.stopPulmonaryAuscultation();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
