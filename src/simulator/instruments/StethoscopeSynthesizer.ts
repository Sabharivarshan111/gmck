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
  private compressor: DynamicsCompressorNode | null = null;
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
  private currentMode: 'bell' | 'diaphragm' = 'diaphragm';
  private isCardiacActive = false;
  private isPulmonaryActive = false;

  private safe(t: number): number {
    const min = (this.ctx ? this.ctx.currentTime : 0) + 0.003;
    return Math.max(t, min);
  }

  constructor() {}

  /**
   * Synchronous unlock method: MUST be called directly in the synchronous
   * call-stack of a user click/touch event to satisfy WebKit / iOS CoreAudio autoplay policies.
   */
  public unlock(): void {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // iOS CoreAudio hardware power-saving unlock buffer
    try {
      if (this.ctx) {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
      }
    } catch {
      // Ignore
    }
  }

  public async initialize(): Promise<void> {
    this.unlock();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.masterGain) return; // Already wired

    // 1. Master Output Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.15, this.ctx.currentTime);

    // 2. Dynamics Compressor (Raises quiet murmur tails, prevents clipping on loud transients)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4.0, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

    // 3. Biomechanical Chest-Wall Transfer Function Formant
    // Peaking at 180 Hz (+5 dB) to bridge the missing fundamental on laptop/mobile speakers
    this.chestWallResonance = this.ctx.createBiquadFilter();
    this.chestWallResonance.type = 'peaking';
    this.chestWallResonance.frequency.setValueAtTime(180, this.ctx.currentTime);
    this.chestWallResonance.Q.setValueAtTime(1.2, this.ctx.currentTime);
    this.chestWallResonance.gain.setValueAtTime(5.0, this.ctx.currentTime);

    // 4. Dual-Stage Stethoscope Filter Bank (Default: Diaphragm)
    this.stethFilterStage1 = this.ctx.createBiquadFilter();
    this.stethFilterStage2 = this.ctx.createBiquadFilter();
    this.setStethoscopeMode(this.currentMode);

    // Acoustic Chain: Sources -> chestWall -> stage1 -> stage2 -> compressor -> masterGain -> destination
    this.chestWallResonance.connect(this.stethFilterStage1);
    this.stethFilterStage1.connect(this.stethFilterStage2);
    this.stethFilterStage2.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.noiseBuffer = this.generatePinkNoiseBuffer(this.ctx, 5.0);
    this.waveShaperCurve = this.generateDistortionCurve();
  }

  public setVolume(vol: number): void {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(2.0, vol));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  public setStethoscopeMode(mode: 'bell' | 'diaphragm'): void {
    this.currentMode = mode;
    if (!this.ctx || !this.stethFilterStage1 || !this.stethFilterStage2) return;
    const now = this.ctx.currentTime;

    if (mode === 'bell') {
      // Bell: Lowpass (280 Hz) + gentle highpass (35 Hz) for low-pitch gallops & rumbles
      this.stethFilterStage1.type = 'lowpass';
      this.stethFilterStage1.frequency.setTargetAtTime(280, now, 0.05);
      this.stethFilterStage1.Q.setTargetAtTime(0.7, now, 0.05);

      this.stethFilterStage2.type = 'highpass';
      this.stethFilterStage2.frequency.setTargetAtTime(35, now, 0.05);
      this.stethFilterStage2.Q.setTargetAtTime(0.7, now, 0.05);
    } else {
      // Diaphragm: Highpass (60 Hz) + Peaking Formant (420 Hz, +4 dB)
      // Crisp high-frequency transmission for valve clicks, blowing regurgitant murmurs & rubs
      this.stethFilterStage1.type = 'highpass';
      this.stethFilterStage1.frequency.setTargetAtTime(60, now, 0.05);
      this.stethFilterStage1.Q.setTargetAtTime(0.7, now, 0.05);

      this.stethFilterStage2.type = 'peaking';
      this.stethFilterStage2.frequency.setTargetAtTime(420, now, 0.05);
      this.stethFilterStage2.Q.setTargetAtTime(1.1, now, 0.05);
      this.stethFilterStage2.gain.setTargetAtTime(4.0, now, 0.05);
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
      // Peak-normalized amplitude (0.78 scale avoids clipping while maintaining loud murmur presence)
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.78;
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
    this.isCardiacActive = true;
    if (this.ctx && this.nextBeatTime < this.ctx.currentTime) {
      this.nextBeatTime = this.ctx.currentTime + 0.02;
    }
    if (!this.isRunning) {
      this.isRunning = true;
      if (this.ctx) {
        this.nextBeatTime = this.ctx.currentTime + 0.04;
      }
      this.runScheduler();
    }
  }

  public setHeartPreset(preset: HeartSoundPreset): void {
    this.currentHeartPreset = preset;
    this.isCardiacActive = true;
    if (this.ctx && this.nextBeatTime < this.ctx.currentTime) {
      this.nextBeatTime = this.ctx.currentTime + 0.02;
    }
    if (!this.isRunning) {
      this.isRunning = true;
      this.runScheduler();
    }
  }

  public setHeartRate(hr: number): void {
    this.currentHr = Math.max(30, hr);
  }

  public stopCardiacAuscultation(): void {
    this.isCardiacActive = false;
    if (!this.isPulmonaryActive) {
      this.checkStopScheduler();
    }
  }

  public startPulmonaryAuscultation(rr: number, preset: LungSoundPreset): void {
    this.currentRr = rr;
    this.currentLungPreset = preset;
    this.isPulmonaryActive = preset !== 'silent';
    if (this.ctx && this.nextBreathTime < this.ctx.currentTime) {
      this.nextBreathTime = this.ctx.currentTime + 0.02;
    }
    if (!this.isRunning) {
      this.isRunning = true;
      if (this.ctx) {
        this.nextBreathTime = this.ctx.currentTime + 0.04;
      }
      this.runScheduler();
    }
  }

  public setLungPreset(preset: LungSoundPreset): void {
    this.currentLungPreset = preset;
    this.isPulmonaryActive = preset !== 'silent';
    if (this.ctx && this.nextBreathTime < this.ctx.currentTime) {
      this.nextBreathTime = this.ctx.currentTime + 0.02;
    }
    if (!this.isRunning && preset !== 'silent') {
      this.isRunning = true;
      this.runScheduler();
    }
  }

  public setRespiratoryRate(rr: number): void {
    this.currentRr = Math.max(6, rr);
  }

  public stopPulmonaryAuscultation(): void {
    this.isPulmonaryActive = false;
    this.currentLungPreset = 'silent';
    if (!this.isCardiacActive) {
      this.checkStopScheduler();
    }
  }

  public stopAll(): void {
    this.isCardiacActive = false;
    this.isPulmonaryActive = false;
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

      // Web Audio catch-up protection: avoid scheduling behind currentTime
      if (this.nextBeatTime < now) {
        this.nextBeatTime = now + 0.02;
      }
      if (this.nextBreathTime < now) {
        this.nextBreathTime = now + 0.02;
      }

      // 1. Schedule Cardiac Beats
      if (this.isCardiacActive) {
        const beatDuration = 60 / Math.max(30, this.currentHr);
        while (this.nextBeatTime < now + lookahead) {
          this.renderCardiacBeat(this.nextBeatTime, beatDuration, this.currentHeartPreset);
          this.nextBeatTime += beatDuration;
        }
      }

      // 2. Schedule Respiratory Breaths
      if (this.isPulmonaryActive && this.currentLungPreset !== 'silent') {
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
    const masterAttn = isTamponade ? 0.28 : 1.0;

    // --- S1: Dual Mitral (M1) + Tricuspid (T1) Coaptation ---
    const s1Gain = (preset === 'mitral_stenosis' ? 1.45 : 1.0) * masterAttn;
    // M1: Mitral closure (multi-harmonic punch)
    this.synthesizeValveTransient(t, 68, 50, 0.11, s1Gain * 0.95);
    this.synthesizeLeafletOverhead(t, 140, 95, 0.045, s1Gain * 0.45);
    // T1: Tricuspid closure (24 ms later)
    this.synthesizeValveTransient(t + 0.024, 60, 44, 0.09, s1Gain * 0.55);

    // --- S2: Semilunar Closure (A2 + P2 Splitting) ---
    const s2Time = t + systolicTime;
    const s2Gain = (preset === 'aortic_stenosis' ? 0.35 : 0.95) * masterAttn; // AS has soft/absent A2
    // A2: Aortic component (higher frequency snap)
    this.synthesizeValveTransient(s2Time, 125, 85, 0.08, s2Gain * 0.95);
    this.synthesizeCrispSnap(s2Time, 210, 0.02, s2Gain * 0.35);
    // P2: Pulmonic component (28 ms splitting)
    this.synthesizeValveTransient(s2Time + 0.028, 98, 72, 0.065, s2Gain * 0.48);

    // --- PATHOLOGY DSP ROUTING ---
    switch (preset) {
      case 's3_gallop': {
        // S3: Early diastolic rapid filling thud (140 ms post-A2)
        const s3Time = s2Time + 0.14;
        this.synthesizeGallopThud(s3Time, 52, 38, 0.075, 0.75 * masterAttn);
        break;
      }

      case 's4_gallop': {
        // S4: Late diastolic presystolic kick (85 ms prior to S1)
        const s4Time = t + cycleDuration - 0.085;
        this.synthesizeGallopThud(s4Time, 58, 42, 0.065, 0.65 * masterAttn);
        break;
      }

      case 'mitral_stenosis': {
        // 1. Opening Snap (OS): 75 ms after S2
        const osTime = s2Time + 0.075;
        this.synthesizeOpeningSnap(osTime, 0.75);

        // 2. Low-pitched mid-diastolic rumble with missing fundamental harmonics
        const rumbleStart = osTime + 0.02;
        const rumbleDur = cycleDuration - systolicTime - 0.14;
        this.synthesizeMitralRumble(rumbleStart, Math.max(0.12, rumbleDur), 0.72);

        // 3. Presystolic accentuation (crescendo into S1)
        const presysTime = t + cycleDuration - 0.12;
        this.synthesizePresystolicCrescendo(presysTime, 0.11, 0.85);
        break;
      }

      case 'aortic_stenosis': {
        // Harsh systolic ejection murmur (diamond-shaped crescendo-decrescendo, 250-550 Hz)
        const asStart = t + 0.035;
        const asDur = systolicTime - 0.055;
        this.synthesizeAorticStenosisMurmur(asStart, asDur, 0.95);
        break;
      }

      case 'mitral_regurg': {
        // High-pitched pansystolic blowing murmur (plateau envelope, 250-650 Hz)
        this.synthesizeMitralRegurgMurmur(t, systolicTime, 0.82);
        break;
      }

      case 'aortic_regurg': {
        // High-pitched early diastolic decrescendo murmur (300-800 Hz)
        const arDur = cycleDuration - systolicTime - 0.02;
        this.synthesizeAorticRegurgMurmur(s2Time, arDur, 0.75);
        break;
      }

      case 'friction_rub': {
        // Triphasic superficial leathery scratch (atrial, ventricular, diastolic)
        this.synthesizePericardialScratch(t + 0.08, 0.12, 0.65);
        this.synthesizePericardialScratch(s2Time + 0.08, 0.1, 0.55);
        this.synthesizePericardialScratch(t + cycleDuration - 0.11, 0.085, 0.5);
        break;
      }
    }
  }

  // --- PRIMITIVE DSP SOUND GENERATORS ---

  /**
   * Valve Transient with Psychoacoustic Harmonics:
   * Combines fundamental sub-bass with 2nd and 3rd harmonics + transient click
   * so the sound pressure waveform cuts through laptop and mobile phone speakers.
   */
  private synthesizeValveTransient(
    t: number,
    fStart: number,
    fEnd: number,
    duration: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const st = this.safe(t);

    // 1. Fundamental Component
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(fStart, st);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, fEnd), st + duration);

    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain * 0.9, st + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, st + duration);

    osc.connect(gain);
    gain.connect(this.chestWallResonance);
    osc.start(st);
    osc.stop(st + duration + 0.01);

    // 2. Psychoacoustic 2nd Harmonic (Audible on MacBook & smartphone speakers!)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(fStart * 2.2, st);
    osc2.frequency.exponentialRampToValueAtTime(Math.max(50, fEnd * 2.0), st + duration * 0.85);

    gain2.gain.setValueAtTime(0.001, st);
    gain2.gain.linearRampToValueAtTime(peakGain * 0.55, st + 0.004);
    gain2.gain.exponentialRampToValueAtTime(0.0001, st + duration * 0.85);

    osc2.connect(gain2);
    gain2.connect(this.chestWallResonance);
    osc2.start(st);
    osc2.stop(st + duration + 0.01);

    // 3. Psychoacoustic 3rd Harmonic Formant Click (gives tactile snap)
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(fStart * 3.4, st);
    osc3.frequency.exponentialRampToValueAtTime(Math.max(80, fEnd * 3.0), st + duration * 0.6);

    gain3.gain.setValueAtTime(0.001, st);
    gain3.gain.linearRampToValueAtTime(peakGain * 0.28, st + 0.003);
    gain3.gain.exponentialRampToValueAtTime(0.0001, st + duration * 0.6);

    osc3.connect(gain3);
    gain3.connect(this.chestWallResonance);
    osc3.start(st);
    osc3.stop(st + duration + 0.01);
  }

  private synthesizeLeafletOverhead(
    t: number,
    fStart: number,
    fEnd: number,
    duration: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const st = this.safe(t);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(fStart, st);
    osc.frequency.exponentialRampToValueAtTime(fEnd, st + duration);

    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain, st + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, st + duration);

    osc.connect(gain);
    gain.connect(this.chestWallResonance);

    osc.start(st);
    osc.stop(st + duration + 0.01);
  }

  private synthesizeCrispSnap(t: number, freq: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const st = this.safe(t);
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(freq, st);
    bpf.Q.setValueAtTime(2.2, st);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain, st + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, st + duration);

    source.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(st);
    source.stop(st + duration);
  }

  private synthesizeGallopThud(
    t: number,
    fStart: number,
    fEnd: number,
    duration: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const st = this.safe(t);
    const osc = this.ctx.createOscillator();
    const harmonicOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(fStart, st);
    osc.frequency.exponentialRampToValueAtTime(fEnd, st + duration);

    // Harmonic overtone brings the thud into the audible 150-200 Hz range for phone/MacBook
    harmonicOsc.type = 'triangle';
    harmonicOsc.frequency.setValueAtTime(fStart * 3.2, st);
    harmonicOsc.frequency.exponentialRampToValueAtTime(fEnd * 2.8, st + duration * 0.7);

    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain * 1.1, st + 0.014); // Soft fluid attack
    gain.gain.exponentialRampToValueAtTime(0.0001, st + duration);

    osc.connect(gain);
    harmonicOsc.connect(gain);
    gain.connect(this.chestWallResonance);

    osc.start(st);
    harmonicOsc.start(st);
    osc.stop(st + duration + 0.01);
    harmonicOsc.stop(st + duration + 0.01);
  }

  private synthesizeOpeningSnap(t: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const st = this.safe(t);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, st);
    osc.frequency.exponentialRampToValueAtTime(195, st + 0.02);

    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain, st + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.02);

    osc.connect(gain);
    gain.connect(this.chestWallResonance);

    osc.start(st);
    osc.stop(st + 0.022);
  }

  private synthesizeMitralRumble(t: number, duration: number, gainVal: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const st = this.safe(t);
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    // Dual-stage broad turbulent filter tuned for missing fundamental (160-280 Hz)
    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(220, st);
    bpf.Q.setValueAtTime(1.4, st);

    const peak = this.ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(160, st);
    peak.Q.setValueAtTime(1.5, st);
    peak.gain.setValueAtTime(8.0, st);

    // Modulated rough mechanical shudder oscillator (14 Hz tremor characteristic of stenotic orifice)
    const shudderOsc = this.ctx.createOscillator();
    const shudderGain = this.ctx.createGain();
    shudderOsc.type = 'sawtooth';
    shudderOsc.frequency.setValueAtTime(85, st); // 85 Hz rumble with 170 Hz / 255 Hz harmonics

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(14, st);
    lfoGain.gain.setValueAtTime(25, st);
    lfo.connect(shudderOsc.frequency);
    lfo.start(st);
    lfo.stop(st + duration);

    shudderGain.gain.setValueAtTime(0.001, st);
    shudderGain.gain.linearRampToValueAtTime(gainVal * 0.65, st + 0.04);
    shudderGain.gain.exponentialRampToValueAtTime(0.001, st + duration);

    shudderOsc.connect(shudderGain);
    shudderGain.connect(this.chestWallResonance);
    shudderOsc.start(st);
    shudderOsc.stop(st + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(gainVal * 0.85, st);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, st + duration);

    source.connect(bpf);
    bpf.connect(peak);
    peak.connect(noiseGain);
    noiseGain.connect(this.chestWallResonance);

    source.start(st);
    source.stop(st + duration);
  }

  private synthesizePresystolicCrescendo(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const st = this.safe(t);
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(180, st);
    bpf.Q.setValueAtTime(1.6, st);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, st);
    gain.gain.exponentialRampToValueAtTime(peakGain, st + duration);

    source.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(st);
    source.stop(st + duration);
  }

  private synthesizeAorticStenosisMurmur(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const st = this.safe(t);
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    // WaveShaper saturation for harsh, gravelly timbre
    const shaper = this.ctx.createWaveShaper();
    if (this.waveShaperCurve) shaper.curve = this.waveShaperCurve;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(360, st);
    bpf.Q.setValueAtTime(1.4, st);

    const shelf = this.ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.setValueAtTime(520, st);
    shelf.gain.setValueAtTime(4.5, st);

    // Diamond-shaped crescendo-decrescendo gain envelope
    const gain = this.ctx.createGain();
    const halfDur = duration * 0.52;
    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain, st + halfDur);
    gain.gain.exponentialRampToValueAtTime(0.001, st + duration);

    source.connect(shaper);
    shaper.connect(bpf);
    bpf.connect(shelf);
    shelf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(st);
    source.stop(st + duration);
  }

  private synthesizeMitralRegurgMurmur(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const st = this.safe(t);
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(260, st);
    hpf.Q.setValueAtTime(0.85, st);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(440, st);
    bpf.Q.setValueAtTime(1.2, st);

    // Holosystolic plateau envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain, st + 0.012);
    gain.gain.setValueAtTime(peakGain, st + duration - 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, st + duration);

    source.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(st);
    source.stop(st + duration);
  }

  private synthesizeAorticRegurgMurmur(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const st = this.safe(t);
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(320, st);
    hpf.Q.setValueAtTime(0.8, st);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(540, st);
    bpf.Q.setValueAtTime(1.1, st);

    // Early diastolic decrescendo envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(peakGain, st);
    gain.gain.exponentialRampToValueAtTime(0.001, st + duration);

    source.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(st);
    source.stop(st + duration);
  }

  private synthesizePericardialScratch(t: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.chestWallResonance || !this.noiseBuffer) return;
    const st = this.safe(t);
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    // Dual-bandpass leathery friction bank
    const bpf1 = this.ctx.createBiquadFilter();
    bpf1.type = 'bandpass';
    bpf1.frequency.setValueAtTime(520, st);
    bpf1.Q.setValueAtTime(2.2, st);

    const bpf2 = this.ctx.createBiquadFilter();
    bpf2.type = 'bandpass';
    bpf2.frequency.setValueAtTime(950, st);
    bpf2.Q.setValueAtTime(2.5, st);

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(380, st);
    hpf.Q.setValueAtTime(0.8, st);

    // Granular friction amplitude envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain * 0.9, st + duration * 0.25);
    gain.gain.linearRampToValueAtTime(peakGain * 0.45, st + duration * 0.5);
    gain.gain.linearRampToValueAtTime(peakGain, st + duration * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, st + duration);

    source.connect(hpf);
    hpf.connect(bpf1);
    hpf.connect(bpf2);
    bpf1.connect(gain);
    bpf2.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(st);
    source.stop(st + duration);
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
    const st = this.safe(t);

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    const isBronchial = preset === 'bronchial';

    if (isBronchial) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isInsp ? 720 : 880, st);
      filter.Q.setValueAtTime(3.2, st);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isInsp ? 380 : 260, st);
      filter.Q.setValueAtTime(0.8, st);
    }

    const gain = this.ctx.createGain();
    const peakGain = isInsp ? 0.35 : isBronchial ? 0.32 : 0.12;

    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(peakGain, st + duration * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, st + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.chestWallResonance);

    source.start(st);
    source.stop(st + duration);
  }

  private scheduleCrackleCluster(startTime: number, duration: number, count: number): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const st = this.safe(startTime);
    for (let i = 0; i < count; i++) {
      const offset = duration * Math.pow(Math.random(), 0.65);
      const crackleTime = st + offset;
      const freq = 1200 + Math.random() * 900;
      const crackleDur = 0.006 + Math.random() * 0.003;
      const amp = 0.18 + Math.random() * 0.22;
      this.synthesizeValveTransient(crackleTime, freq, freq * 0.7, crackleDur, amp);
    }
  }

  private playPolyphonicWheeze(t: number, duration: number): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const st = this.safe(t);
    const wheezeFreqs = [360, 480, 640, 790];
    wheezeFreqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() * 10 - 5), st);

      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.setValueAtTime(4.2 + idx * 0.4, st);
      lfoGain.gain.setValueAtTime(14, st);
      lfo.connect(osc.frequency);
      lfo.start(st);
      lfo.stop(st + duration);

      const amp = 0.14 / (idx + 1);
      gain.gain.setValueAtTime(0.001, st);
      gain.gain.linearRampToValueAtTime(amp, st + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, st + duration);

      osc.connect(gain);
      gain.connect(this.chestWallResonance!);

      osc.start(st);
      osc.stop(st + duration);
    });
  }

  private playStridorTone(t: number, duration: number): void {
    if (!this.ctx || !this.chestWallResonance) return;
    const st = this.safe(t);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, st);
    osc.frequency.linearRampToValueAtTime(545, st + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(510, st + duration);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(530, st);
    bpf.Q.setValueAtTime(5.0, st);

    gain.gain.setValueAtTime(0.001, st);
    gain.gain.linearRampToValueAtTime(0.38, st + duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, st + duration);

    osc.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.chestWallResonance);

    osc.start(st);
    osc.stop(st + duration);
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
