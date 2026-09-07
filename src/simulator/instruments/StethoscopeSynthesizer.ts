// ============================================================================
// STETHOSCOPE SYNTHESIZER ENGINE (Medical-Grade Web Audio API)
// Real-time procedural DSP synthesis of physiological and pathological
// cardiac and pulmonary acoustics for clinical education.
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
  | 'aortic_stenosis'
  | 'mitral_regurg'
  | 'aortic_regurg'
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
  private chestWallResonance: BiquadFilterNode | null = null;
  private stethFilterStage1: BiquadFilterNode | null = null;
  private stethFilterStage2: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private waveShaperCurve: Float32Array | null = null;

  // Web Audio lookahead scheduler state
  private isRunning = false;
  private schedulerTimer: number | null = null;
  private nextBeatTime = 0;
  private nextBreathTime = 0;
  private currentHr = 72;
  private currentRr = 14;
  private currentHeartPreset: HeartSoundPreset = 'normal';
  private currentLungPreset: LungSoundPreset = 'vesicular';

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
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // 1. Biomechanical Chest-Wall Transfer Function Formant
    this.chestWallResonance = this.ctx.createBiquadFilter();
    this.chestWallResonance.type = 'peaking';
    this.chestWallResonance.frequency.setValueAtTime(65, this.ctx.currentTime);
    this.chestWallResonance.Q.setValueAtTime(1.2, this.ctx.currentTime);
    this.chestWallResonance.gain.setValueAtTime(3.5, this.ctx.currentTime);

    // 2. Dual-Stage Stethoscope Filter Bank (Default: Diaphragm)
    this.stethFilterStage1 = this.ctx.createBiquadFilter();
    this.stethFilterStage2 = this.ctx.createBiquadFilter();
    this.setStethoscopeMode('diaphragm');

    // Acoustic Chain: Sources -> chestWall -> stage1 -> stage2 -> masterGain -> destination
    this.chestWallResonance.connect(this.stethFilterStage1);
    this.stethFilterStage1.connect(this.stethFilterStage2);
    this.stethFilterStage2.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.noiseBuffer = this.generatePinkNoiseBuffer(this.ctx, 5.0);
    this.waveShaperCurve = this.generateDistortionCurve();
  }

  public setStethoscopeMode(mode: 'bell' | 'diaphragm'): void {
    if (!this.ctx || !this.stethFilterStage1 || !this.stethFilterStage2) return;
    const now = this.ctx.currentTime;

    if (mode === 'bell') {
      // Bell: Maximally flat lowpass (190 Hz) + highpass cutoff (25 Hz)
      this.stethFilterStage1.type = 'lowpass';
      this.stethFilterStage1.frequency.setTargetAtTime(190, now, 0.05);
      this.stethFilterStage1.Q.setTargetAtTime(0.65, now, 0.05);

      this.stethFilterStage2.type = 'highpass';
      this.stethFilterStage2.frequency.setTargetAtTime(25, now, 0.05);
      this.stethFilterStage2.Q.setTargetAtTime(0.7, now, 0.05);
    } else {
      // Diaphragm: Lowshelf attenuation (-14 dB at 120 Hz) + gentle lowpass (900 Hz)
      this.stethFilterStage1.type = 'lowshelf';
      this.stethFilterStage1.frequency.setTargetAtTime(120, now, 0.05);
      this.stethFilterStage1.gain.setTargetAtTime(-14, now, 0.05);

      this.stethFilterStage2.type = 'lowpass';
      this.stethFilterStage2.frequency.setTargetAtTime(900, now, 0.05);
      this.stethFilterStage2.Q.setTargetAtTime(0.7, now, 0.05);
    }
  }

  private generatePinkNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

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

  private generateDistortionCurve(): Float32Array {
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      // Soft saturation curve for harsh vascular turbulence
      curve[i] = ((3 + 1.5) * x * 20 * (Math.PI / 180)) / (Math.PI + 1.5 * Math.abs(x * 20 * (Math.PI / 180)));
    }
    return curve;
  }

  // --------------------------------------------------------------------------
  // LOOKAHEAD TIMING SCHEDULER
  // --------------------------------------------------------------------------
  public startCardiacAuscultation(hr: number, preset: HeartSoundPreset): void {
    this.currentHr = hr;
    this.currentHeartPreset = preset;
    if (!this.isRunning) {
      this.isRunning = true;
      if (this.ctx) {
        this.nextBeatTime = this.ctx.currentTime + 0.05;
      }
      this.runScheduler();
    }
  }

  public stopCardiacAuscultation(): void {
    this.currentHeartPreset = 'normal';
    this.checkStopScheduler();
  }

  public startPulmonaryAuscultation(rr: number, preset: LungSoundPreset): void {
    this.currentRr = rr;
    this.currentLungPreset = preset;
    if (!this.isRunning) {
      this.isRunning = true;
      if (this.ctx) {
        this.nextBreathTime = this.ctx.currentTime + 0.05;
      }
      this.runScheduler();
    }
  }

  public stopPulmonaryAuscultation(): void {
    this.currentLungPreset = 'silent';
    this.checkStopScheduler();
  }

  private checkStopScheduler(): void {
    if (this.schedulerTimer) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.isRunning = false;
  }

  private runScheduler = (): void => {
    if (this.schedulerTimer) window.clearInterval(this.schedulerTimer);
    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx) return;
      const lookahead = 0.15; // 150 ms lookahead window
      const now = this.ctx.currentTime;

      // 1. Schedule Cardiac Beats
      const beatDuration = 60 / Math.max(30, this.currentHr);
      while (this.nextBeatTime < now + lookahead) {
        this.renderCardiacBeat(this.nextBeatTime, beatDuration, this.currentHeartPreset);
        this.nextBeatTime += beatDuration;
      }

      // 2. Schedule Respiratory Breaths
      if (this.currentLungPreset !== 'silent') {
        const breathDuration = 60 / Math.max(8, this.currentRr);
        while (this.nextBreathTime < now + lookahead) {
          this.renderBreathCycle(this.nextBreathTime, breathDuration, this.currentLungPreset);
          this.nextBreathTime += breathDuration;
        }
      }
    }, 25); // Run every 25 ms
  };

  // --------------------------------------------------------------------------
  // CARDIAC DSP SYNTHESIS
  // --------------------------------------------------------------------------
  private renderCardiacBeat(t: number, cycleDuration: number, preset: HeartSoundPreset): void {
    if (!this.ctx || !this.chestWallResonance) return;

    const systolicTime = 0.38 * Math.sqrt(cycleDuration);
    const isTamponade = preset === 'tamponade_muffled';
    const masterAttn = isTamponade ? 0.22 : 1.0;

    // --- S1: Dual Mitral (M1) + Tricuspid (T1) Coaptation ---
    const s1Gain = (preset === 'mitral_stenosis' ? 1.35 : 1.0) * masterAttn;
    // M1: Mitral closure
    this.synthesizeValveTransient(t, 64, 46, 0.11, s1Gain * 0.85);
    this.synthesizeLeafletOverhead(t, 120, 85, 0.04, s1Gain * 0.3);
    // T1: Tricuspid closure (24 ms later)
    this.synthesizeValveTransient(t + 0.024, 55, 42, 0.085, s1Gain * 0.45);

    // --- S2: Semilunar Closure (A2 + P2 Splitting) ---
    const s2Time = t + systolicTime;
    const s2Gain = (preset === 'aortic_stenosis' ? 0.35 : 0.9) * masterAttn; // AS has soft/absent A2!
    // A2: Aortic component
    this.synthesizeValveTransient(s2Time, 115, 78, 0.075, s2Gain * 0.85);
    this.synthesizeCrispSnap(s2Time, 180, 0.015, s2Gain * 0.2);
    // P2: Pulmonic component (28 ms splitting)
    this.synthesizeValveTransient(s2Time + 0.028, 92, 68, 0.06, s2Gain * 0.38);

    // --- PATHOLOGY DSP ROUTING ---
    switch (preset) {
      case 's3_gallop': {
        // S3: Early diastolic rapid filling thud (140 ms post-A2)
        const s3Time = s2Time + 0.14;
        this.synthesizeGallopThud(s3Time, 44, 34, 0.065, 0.55 * masterAttn);
        break;
      }

      case 's4_gallop': {
        // S4: Late diastolic presystolic kick (85 ms prior to S1)
        const s4Time = t + cycleDuration - 0.085;
        this.synthesizeGallopThud(s4Time, 52, 38, 0.055, 0.45 * masterAttn);
        break;
      }

      case 'mitral_stenosis': {
        // 1. Opening Snap (OS): 75 ms after S2
        const osTime = s2Time + 0.075;
        this.synthesizeOpeningSnap(osTime, 0.6);

        // 2. Low-pitched mid-diastolic rumble
        const rumbleStart = osTime + 0.02;
        const rumbleDur = cycleDuration - systolicTime - 0.15;
        this.synthesizeMitralRumble(rumbleStart, Math.max(0.1, rumbleDur), 0.42);

        // 3. Presystolic accentuation (crescendo into S1)
        const presysTime = t + cycleDuration - 0.12;
        this.synthesizePresystolicCrescendo(presysTime, 0.11, 0.65);
        break;
      }

      case 'aortic_stenosis': {
        // Harsh systolic ejection murmur (diamond-shaped, 200-500 Hz)
        const asStart = t + 0.035;
        const asDur = systolicTime - 0.06;
        this.synthesizeAorticStenosisMurmur(asStart, asDur, 0.75);
        break;
      }

      case 'mitral_regurg': {
        // High-pitched pansystolic blowing murmur (plateau envelope, 250-600 Hz)
        this.synthesizeMitralRegurgMurmur(t, systolicTime, 0.55);
        break;
      }

      case 'aortic_regurg': {
        // High-pitched early diastolic decrescendo murmur (300-750 Hz)
        const arDur = cycleDuration - systolicTime - 0.02;
        this.synthesizeAorticRegurgMurmur(s2Time, arDur, 0.5);
        break;
      }

      case 'friction_rub': {
        // Triphasic superficial leathery scratch
        this.synthesizePericardialScratch(t + 0.08, 0.12, 0.42);
        this.synthesizePericardialScratch(s2Time + 0.08, 0.1, 0.35);
        this.synthesizePericardialScratch(t + cycleDuration - 0.11, 0.085, 0.32);
        break;
      }
    }
  }

  // --- PRIMITIVE DSP SOUND GENERATORS ---

  private synthesizeValveTransient(
    t: number,
    fStart: number,
    fEnd: number,
    duration: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(fStart, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t + duration);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.chestWallResonance);

    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  private synthesizeLeafletOverhead(
    t: number,
    fStart: number,
    fEnd: number,
    duration: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(fStart, t);
    osc.frequency.exponentialRampToValueAtTime(fEnd, t + duration);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.chestWallResonance);

    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  private synthesizeCrispSnap(t: number, freq: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(freq, t);
    bpf.Q.setValueAtTime(2.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    source.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(t);
    source.stop(t + duration);
  }

  private synthesizeGallopThud(
    t: number,
    fStart: number,
    fEnd: number,
    duration: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(fStart, t);
    osc.frequency.exponentialRampToValueAtTime(fEnd, t + duration);

    // Wall resonance overtone coupler
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(fStart * 1.8, t);
    subOsc.frequency.exponentialRampToValueAtTime(fEnd * 1.8, t + duration * 0.7);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.014); // Soft fluid attack
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.chestWallResonance);

    osc.start(t);
    subOsc.start(t);
    osc.stop(t + duration + 0.01);
    subOsc.stop(t + duration + 0.01);
  }

  private synthesizeOpeningSnap(t: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(230, t);
    osc.frequency.exponentialRampToValueAtTime(175, t + 0.02);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    osc.connect(gain);
    gain.connect(this.chestWallResonance);

    osc.start(t);
    osc.stop(t + 0.022);
  }

  private synthesizeMitralRumble(t: number, duration: number, gainVal: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    // Dual-stage broad turbulent filter (lowpass + low peaking)
    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(110, t);
    lpf.Q.setValueAtTime(1.2, t);

    const peak = this.ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(72, t);
    peak.Q.setValueAtTime(1.5, t);
    peak.gain.setValueAtTime(6.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + duration);

    source.connect(lpf);
    lpf.connect(peak);
    peak.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(t);
    source.stop(t + duration);
  }

  private synthesizePresystolicCrescendo(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(95, t);
    bpf.Q.setValueAtTime(1.6, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.exponentialRampToValueAtTime(peakGain, t + duration);

    source.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(t);
    source.stop(t + duration);
  }

  private synthesizeAorticStenosisMurmur(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    // WaveShaper saturation for harsh, gravelly timbre
    const shaper = this.ctx.createWaveShaper();
    if (this.waveShaperCurve) shaper.curve = this.waveShaperCurve;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(320, t);
    bpf.Q.setValueAtTime(1.4, t);

    const shelf = this.ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.setValueAtTime(480, t);
    shelf.gain.setValueAtTime(3.5, t);

    // Diamond-shaped crescendo-decrescendo gain envelope
    const gain = this.ctx.createGain();
    const halfDur = duration * 0.52;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + halfDur);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(shaper);
    shaper.connect(bpf);
    bpf.connect(shelf);
    shelf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(t);
    source.stop(t + duration);
  }

  private synthesizeMitralRegurgMurmur(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(220, t);
    hpf.Q.setValueAtTime(0.85, t);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(380, t);
    bpf.Q.setValueAtTime(1.2, t);

    // Holosystolic plateau envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.012);
    gain.gain.setValueAtTime(peakGain, t + duration - 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(t);
    source.stop(t + duration);
  }

  private synthesizeAorticRegurgMurmur(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(280, t);
    hpf.Q.setValueAtTime(0.8, t);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(480, t);
    bpf.Q.setValueAtTime(1.1, t);

    // Early diastolic decrescendo envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(peakGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(t);
    source.stop(t + duration);
  }

  private synthesizePericardialScratch(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    // Dual-bandpass leathery friction bank
    const bpf1 = this.ctx.createBiquadFilter();
    bpf1.type = 'bandpass';
    bpf1.frequency.setValueAtTime(450, t);
    bpf1.Q.setValueAtTime(2.2, t);

    const bpf2 = this.ctx.createBiquadFilter();
    bpf2.type = 'bandpass';
    bpf2.frequency.setValueAtTime(880, t);
    bpf2.Q.setValueAtTime(2.5, t);

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(320, t);
    hpf.Q.setValueAtTime(0.8, t);

    // Granular friction amplitude envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain * 0.9, t + duration * 0.25);
    gain.gain.linearRampToValueAtTime(peakGain * 0.45, t + duration * 0.5);
    gain.gain.linearRampToValueAtTime(peakGain, t + duration * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(hpf);
    hpf.connect(bpf1);
    hpf.connect(bpf2);
    bpf1.connect(gain);
    bpf2.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(t);
    source.stop(t + duration);
  }

  // --------------------------------------------------------------------------
  // PULMONARY DSP SYNTHESIS
  // --------------------------------------------------------------------------
  private renderBreathCycle(t: number, cycleDuration: number, preset: LungSoundPreset): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;

    const isBronchial = preset === 'bronchial';
    const inspRatio = isBronchial ? 0.45 : 0.65;
    const inspDuration = cycleDuration * inspRatio;
    const expDuration = cycleDuration * (1 - inspRatio) * 0.85;

    // Inspiratory airflow
    this.playAirflowPhase(t, inspDuration, true, preset);

    // Fine end-inspiratory crackles
    if (preset === 'crackles') {
      const crackleStart = t + inspDuration * 0.65;
      const crackleDur = inspDuration * 0.35;
      this.scheduleCrackleCluster(crackleStart, crackleDur, 28);
    }

    // Stridor
    if (preset === 'stridor') {
      this.playStridorTone(t, inspDuration);
    }

    // Expiratory airflow
    const pauseDuration = isBronchial ? 0.2 : 0.05;
    const expStart = t + inspDuration + pauseDuration;
    this.playAirflowPhase(expStart, expDuration, false, preset);

    // Expiratory wheezing
    if (preset === 'wheeze') {
      this.playPolyphonicWheeze(expStart, expDuration);
    }
  }

  private playAirflowPhase(
    t: number,
    duration: number,
    isInsp: boolean,
    preset: LungSoundPreset
  ): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    const isBronchial = preset === 'bronchial';

    if (isBronchial) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isInsp ? 720 : 880, t);
      filter.Q.setValueAtTime(3.2, t);
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
    gain.connect(this.chestWallResonance);

    source.start(t);
    source.stop(t + duration);
  }

  private scheduleCrackleCluster(startTime: number, duration: number, count: number): void {
    if (!this.ctx || !this.chestWallResonance) return;
    for (let i = 0; i < count; i++) {
      const offset = duration * Math.pow(Math.random(), 0.65);
      const crackleTime = startTime + offset;
      const freq = 1200 + Math.random() * 900;
      const crackleDur = 0.006 + Math.random() * 0.003;
      const amp = 0.18 + Math.random() * 0.22;
      this.synthesizeValveTransient(crackleTime, freq, freq * 0.7, crackleDur, amp);
    }
  }

  private playPolyphonicWheeze(t: number, duration: number): void {
    if (!this.ctx || !this.chestWallResonance) return;
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
      gain.connect(this.chestWallResonance!);

      osc.start(t);
      osc.stop(t + duration);
    });
  }

  private playStridorTone(t: number, duration: number): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.linearRampToValueAtTime(545, t + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(510, t + duration);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(530, t);
    bpf.Q.setValueAtTime(5.0, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.38, t + duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

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
