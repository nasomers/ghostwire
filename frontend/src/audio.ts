// Ghostwire Audio Engine v4
// Dark Internet Sonification - Spectral, Corrupted, Subterranean
// A glimpse into the hidden side of the internet

import * as Tone from 'tone';
import type {
  URLhausHit,
  GreyNoiseData,
  DShieldAttack,
  FeodoC2,
  RansomwareVictim,
  PhishingURL,
  SSLBlacklistEntry,
  BruteforceAttack,
  TorExitNode,
  HIBPBreach,
  SpamhausDrop,
  BGPEvent
} from './socket';

// Dark scales - emphasizing tension and unease
const SCALES = {
  phrygian: [0, 1, 3, 5, 7, 8, 10],      // Spanish/dark
  locrian: [0, 1, 3, 5, 6, 8, 10],        // Most unstable
  superLocrian: [0, 1, 3, 4, 6, 8, 10],   // Altered scale - maximum tension
  wholeTone: [0, 2, 4, 6, 8, 10],         // Dreamlike, unsettling
  diminished: [0, 2, 3, 5, 6, 8, 9, 11],  // Symmetric, ominous
};

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function degreeToNote(degree: number, scale: number[], root: string, octave: number): string {
  const rootIndex = ROOT_NOTES.indexOf(root);
  const scaleNote = scale[Math.abs(degree) % scale.length];
  const octaveOffset = Math.floor(degree / scale.length);
  const noteIndex = (rootIndex + scaleNote) % 12;
  return ROOT_NOTES[noteIndex] + (octave + octaveOffset);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Convert string to pseudo-random values for sound parameters
function hashToParams(str: string): { freq: number; pan: number; delay: number; offset: number } {
  const h = hashString(str || 'default');
  return {
    freq: 0.5 + (h % 100) / 100,
    pan: ((h % 200) - 100) / 100,
    delay: (h % 50) / 100,
    offset: h % 12  // For scale degree offset
  };
}

export class AudioEngine {
  private initialized = false;

  // === MASTER CHAIN ===
  private masterGain!: Tone.Gain;
  private masterLimiter!: Tone.Limiter;
  private masterCompressor!: Tone.Compressor;
  private analyzer!: Tone.Analyser;

  // === SPATIAL/REVERB SYSTEM (Tension Architecture) ===
  private voidReverb!: Tone.Reverb;        // Massive, dark reverb
  private tightReverb!: Tone.Reverb;       // Claustrophobic reverb
  private reverbBlend!: Tone.CrossFade;    // Crossfade between void and tight

  // === CORRUPTION EFFECTS ===
  private bitCrusher!: Tone.BitCrusher;
  private distortion!: Tone.Distortion;
  private chebyshev!: Tone.Chebyshev;      // Waveshaping distortion
  private feedbackDelay!: Tone.FeedbackDelay;
  private pitchShift!: Tone.PitchShift;    // For tape warble effect

  // === FILTERS ===
  private darkFilter!: Tone.Filter;        // Master lowpass for darkness
  private resonantFilter!: Tone.Filter;    // Sweeping resonant filter

  // === SUBTERRANEAN BASS LAYER ===
  private infraBass!: Tone.MonoSynth;      // 20-40Hz rumble
  private subDrone!: Tone.Synth;           // Sub-bass drone
  private bassLFO!: Tone.LFO;              // Modulates bass intensity

  // === SPECTRAL DRONES (always running) ===
  private voidDrone1!: Tone.PolySynth;     // Detuned sine clusters
  private voidDrone2!: Tone.PolySynth;     // Detuned triangle clusters
  private ghostPad!: Tone.PolySynth;       // Ethereal pad with slow attack
  private whisperNoise!: Tone.Noise;       // Constant low noise floor
  private whisperFilter!: Tone.AutoFilter;
  private whisperGain!: Tone.Gain;

  // === SPECTRAL EVENT SYNTHS ===
  private spectralSynth!: Tone.PolySynth;  // Ghostly melodic hits
  private grainSynth!: Tone.GrainPlayer;   // Granular-style textures
  private metallicSynth!: Tone.MetalSynth; // Metallic resonances
  private fmGhost!: Tone.FMSynth;          // FM for spectral movement

  // === CORRUPTION EVENT SYNTHS ===
  private glitchSynth!: Tone.NoiseSynth;   // Glitch bursts
  private stutterSynth!: Tone.MembraneSynth;
  private staticBurst!: Tone.NoiseSynth;   // Radio static

  // === THREAT-SPECIFIC SYNTHS ===
  private malwareSynth!: Tone.MonoSynth;   // URLhaus - infected signal
  private c2Pulse!: Tone.MonoSynth;        // Feodo - command pulse
  private ransomDrone!: Tone.PolySynth;    // Ransomware - heavy dread
  private phishChime!: Tone.PluckSynth;    // Phishing - deceptive bells
  private torWhisper!: Tone.PolySynth;     // Tor - anonymous murmur
  private bruteHammer!: Tone.MembraneSynth; // Bruteforce - persistent hits

  // === STATE ===
  private currentScale = SCALES.phrygian;
  private currentRoot = 'C';
  private currentOctave = 1;  // Lower for darkness

  private globalTension = 0;      // 0-1, drives reverb/filter
  private globalIntensity = 1.0;  // Event intensity
  private threatAccumulator = 0;  // Builds with events, decays over time

  private droneInterval: ReturnType<typeof setInterval> | null = null;
  private tensionInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {}

  async init() {
    if (this.initialized) return;

    await Tone.start();
    console.log('[Audio] Initializing dark internet sonification...');

    Tone.getTransport().bpm.value = 40; // Slow, ominous

    // === BUILD MASTER CHAIN ===
    this.masterCompressor = new Tone.Compressor({
      threshold: -20,
      ratio: 6,
      attack: 0.01,
      release: 0.3,
    });

    this.masterLimiter = new Tone.Limiter(-2);
    this.masterGain = new Tone.Gain(1.0);
    this.analyzer = new Tone.Analyser('waveform', 256);

    // === REVERB SYSTEM (Tension Architecture) ===
    this.voidReverb = new Tone.Reverb({
      decay: 15,
      wet: 1,
      preDelay: 0.3,
    });
    await this.voidReverb.ready;

    this.tightReverb = new Tone.Reverb({
      decay: 1.5,
      wet: 1,
      preDelay: 0.01,
    });
    await this.tightReverb.ready;

    this.reverbBlend = new Tone.CrossFade(0.7); // Start with more void

    // === CORRUPTION EFFECTS ===
    this.bitCrusher = new Tone.BitCrusher(10); // Will modulate 6-12
    this.distortion = new Tone.Distortion(0.05); // Gentler distortion
    this.chebyshev = new Tone.Chebyshev(2);
    this.feedbackDelay = new Tone.FeedbackDelay({
      delayTime: 0.3,
      maxDelay: 2,
      feedback: 0.3,
      wet: 0.2,
    });
    this.pitchShift = new Tone.PitchShift({
      pitch: 0,
      windowSize: 0.1,
      delayTime: 0,
      wet: 0.3,
    });

    // === FILTERS ===
    this.darkFilter = new Tone.Filter({
      frequency: 800,
      type: 'lowpass',
      rolloff: -24,
      Q: 1,
    });

    this.resonantFilter = new Tone.Filter({
      frequency: 400,
      type: 'bandpass',
      rolloff: -24,
      Q: 8,
    });

    // === ROUTING ===
    // Reverb blend
    this.voidReverb.connect(this.reverbBlend.a);
    this.tightReverb.connect(this.reverbBlend.b);

    // Main chain
    this.reverbBlend.connect(this.darkFilter);
    this.darkFilter.connect(this.feedbackDelay);
    this.feedbackDelay.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterGain);
    this.masterGain.connect(this.analyzer);
    this.analyzer.toDestination();

    // Corruption chain (parallel) - reduced for cleaner sound
    const corruptionBus = new Tone.Gain(0.25);
    this.bitCrusher.connect(this.distortion);
    this.distortion.connect(this.chebyshev);
    this.chebyshev.connect(corruptionBus);
    corruptionBus.connect(this.voidReverb);

    // === SUBTERRANEAN BASS ===
    this.infraBass = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 },
      filterEnvelope: { attack: 0.5, decay: 0.5, sustain: 1, release: 2, baseFrequency: 20, octaves: 1 },
      volume: -6,
    });
    this.infraBass.connect(this.masterCompressor); // Bypass reverb for punch

    this.subDrone = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 2, sustain: 0.6, release: 8 },
      volume: -12,
    });
    this.subDrone.connect(this.voidReverb);

    this.bassLFO = new Tone.LFO({
      frequency: 0.05,
      min: -18,
      max: -8,
    });
    this.bassLFO.connect(this.infraBass.volume);
    this.bassLFO.start();

    // === SPECTRAL DRONES ===
    this.voidDrone1 = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 6, decay: 4, sustain: 0.3, release: 10 },
      volume: -20,
      maxPolyphony: 8,
    });
    this.voidDrone1.set({ detune: -10 });
    this.voidDrone1.connect(this.voidReverb);

    this.voidDrone2 = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 8, decay: 4, sustain: 0.4, release: 12 },
      volume: -22,
      maxPolyphony: 8,
    });
    this.voidDrone2.set({ detune: 8 });
    this.voidDrone2.connect(this.voidReverb);

    this.ghostPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine4' },
      envelope: { attack: 10, decay: 5, sustain: 0.2, release: 15 },
      volume: -24,
      maxPolyphony: 16,
    });
    this.ghostPad.connect(this.pitchShift);
    this.pitchShift.connect(this.voidReverb);

    // Whisper noise floor
    this.whisperFilter = new Tone.AutoFilter({
      frequency: 0.03,
      baseFrequency: 60,
      octaves: 4,
      depth: 0.8,
    });
    this.whisperFilter.connect(this.voidReverb);
    this.whisperFilter.start();

    this.whisperGain = new Tone.Gain(0.015);
    this.whisperGain.connect(this.whisperFilter);

    this.whisperNoise = new Tone.Noise('brown');
    this.whisperNoise.connect(this.whisperGain);
    this.whisperNoise.start();

    // === SPECTRAL EVENT SYNTHS ===
    this.spectralSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 2, sustain: 0.1, release: 4 },
      volume: -14,
      maxPolyphony: 32,
    });
    this.spectralSynth.connect(this.voidReverb);

    this.metallicSynth = new Tone.MetalSynth({
      envelope: { attack: 0.01, decay: 0.8, release: 0.5 },
      harmonicity: 3.1,
      modulationIndex: 16,
      resonance: 2000,
      octaves: 1,
      volume: -18,
    });
    this.metallicSynth.connect(this.bitCrusher);

    this.fmGhost = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 5,
      envelope: { attack: 1, decay: 2, sustain: 0.2, release: 3 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.5, decay: 1, sustain: 0.3, release: 2 },
      volume: -16,
    });
    this.fmGhost.connect(this.voidReverb);

    // === CORRUPTION EVENT SYNTHS ===
    this.glitchSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' }, // Pink noise is less harsh than white
      envelope: { attack: 0.002, decay: 0.04, sustain: 0, release: 0.02 },
      volume: -18, // Quieter
    });
    this.glitchSynth.connect(this.bitCrusher);

    this.stutterSynth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      volume: -10,
    });
    this.stutterSynth.connect(this.tightReverb);

    this.staticBurst = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 },
      volume: -14,
    });
    this.staticBurst.connect(this.resonantFilter);
    this.resonantFilter.connect(this.voidReverb);

    // === THREAT-SPECIFIC SYNTHS ===
    this.malwareSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.8 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5, baseFrequency: 150, octaves: 3 },
      volume: -12,
    });
    this.malwareSynth.connect(this.bitCrusher);

    this.c2Pulse = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.3 },
      filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2, baseFrequency: 100, octaves: 2 },
      volume: -14,
    });
    this.c2Pulse.connect(this.tightReverb);

    this.ransomDrone = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth4' },
      envelope: { attack: 0.2, decay: 1, sustain: 0.5, release: 3 },
      volume: -10,
      maxPolyphony: 12,
    });
    this.ransomDrone.connect(this.distortion);
    this.distortion.connect(this.voidReverb);

    this.phishChime = new Tone.PluckSynth({
      attackNoise: 2,
      dampening: 2000,
      resonance: 0.95,
      volume: -14,
    });
    this.phishChime.connect(this.voidReverb);

    this.torWhisper = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 3, decay: 4, sustain: 0.2, release: 6 },
      volume: -20,
    });
    this.torWhisper.connect(this.voidReverb);

    this.bruteHammer = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0.01, release: 0.3 },
      volume: -8,
    });
    this.bruteHammer.connect(this.tightReverb);

    // Start transport
    Tone.getTransport().start();

    // Start ambient layers
    this.startAmbientLayers();
    this.startTensionSystem();

    this.initialized = true;
    console.log('[Audio] Dark internet sonification ready');
  }

  isInitialized() {
    return this.initialized;
  }

  private startAmbientLayers() {
    // Evolving drone that shifts every 12-20 seconds
    const playDroneChord = () => {
      if (!this.initialized) return;

      try {
        const now = Tone.now();
        const root = this.getScaleNote(0, this.currentOctave);
        const fifth = this.getScaleNote(4, this.currentOctave);
        const octave = this.getScaleNote(0, this.currentOctave + 1);

        // Void drones - detuned clusters
        this.voidDrone1.triggerAttackRelease([root], 16, now);
        this.voidDrone2.triggerAttackRelease([fifth], 14, now + 2);

        // Ghost pad - occasional ethereal chord
        if (Math.random() > 0.6) {
          const ghostNotes = [
            this.getScaleNote(2, this.currentOctave + 1),
            this.getScaleNote(5, this.currentOctave + 1),
          ];
          this.ghostPad.triggerAttackRelease(ghostNotes, 20, now + 4);
        }

        // Sub bass pulse
        if (Math.random() > 0.5) {
          this.subDrone.triggerAttackRelease('C1', 12, now);
        }
      } catch (err) {
        console.error('[Audio] Drone error:', err);
      }
    };

    playDroneChord();
    this.droneInterval = setInterval(playDroneChord, 15000 + Math.random() * 5000);
  }

  private startTensionSystem() {
    // Continuously modulate effects based on tension
    this.tensionInterval = setInterval(() => {
      if (!this.initialized) return;

      try {
        // Decay threat accumulator
        this.threatAccumulator = Math.max(0, this.threatAccumulator - 0.02);

        // Calculate tension (0-1)
        this.globalTension = Math.min(1, this.threatAccumulator / 10);

        // Reverb blend: high tension = tight reverb, low tension = void reverb
        this.reverbBlend.fade.rampTo(this.globalTension * 0.8, 2);

        // Filter opens with tension
        const filterFreq = 400 + this.globalTension * 1200;
        this.darkFilter.frequency.rampTo(filterFreq, 1);

        // Bit crusher degrades with tension
        // Gentler bit crushing (6-12 bits instead of 4-12)
        const bits = 12 - Math.floor(this.globalTension * 4);
        this.bitCrusher.bits.value = Math.max(6, bits);

        // Feedback delay increases with tension (capped to prevent runaway)
        this.feedbackDelay.feedback.rampTo(0.15 + this.globalTension * 0.25, 1);

        // Pitch shift wobble increases with tension (tape warble)
        if (this.globalTension > 0.3) {
          const wobble = (Math.random() - 0.5) * this.globalTension * 0.3;
          this.pitchShift.pitch = wobble;
        } else {
          this.pitchShift.pitch = 0;
        }

        // Whisper noise increases with tension
        this.whisperGain.gain.rampTo(0.01 + this.globalTension * 0.04, 1);

        // Resonant filter sweep during high tension
        if (this.globalTension > 0.5) {
          // Use sin^2 to keep values positive, range: 200-500Hz
          const sinVal = Math.sin(Date.now() / 2000);
          const sweepFreq = 200 + (sinVal * sinVal) * 300 * this.globalTension;
          this.resonantFilter.frequency.rampTo(sweepFreq, 0.5);
        }
      } catch (err) {
        console.error('[Audio] Tension system error:', err);
      }
    }, 200);
  }

  private getScaleNote(degree: number, octave: number): string {
    return degreeToNote(degree, this.currentScale, this.currentRoot, octave);
  }

  private addTension(amount: number) {
    this.threatAccumulator = Math.min(15, this.threatAccumulator + amount);
  }

  private lastGlitchTime = 0;

  // Rate limiters for each event type to prevent polyphony overflow
  private lastEventTime: Record<string, number> = {};

  private throttleEvent(eventType: string, minIntervalMs: number): boolean {
    const now = Tone.now() * 1000; // Convert to ms
    const lastTime = this.lastEventTime[eventType] || 0;
    if (now - lastTime < minIntervalMs) return false;
    this.lastEventTime[eventType] = now;
    return true;
  }

  private triggerGlitch(intensity: number = 0.5) {
    if (!this.initialized) return;

    // Debounce rapid glitch triggers to prevent scheduling conflicts
    const currentTime = Tone.now();
    if (currentTime - this.lastGlitchTime < 0.1) return;
    this.lastGlitchTime = currentTime;

    try {
      const now = currentTime + 0.02; // Offset to ensure future scheduling
      // Random glitch bursts - stagger them more to avoid conflicts
      const count = Math.floor(1 + intensity * 2);
      for (let i = 0; i < count; i++) {
        const time = now + i * 0.08;
        this.glitchSynth.triggerAttackRelease('32n', time);
      }
    } catch (err) {
      // Silently ignore timing errors for glitches - they're not critical
    }
  }

  private triggerStatic(duration: string = '8n') {
    if (!this.initialized) return;
    try {
      this.staticBurst.triggerAttackRelease(duration, Tone.now());
    } catch (err) {
      console.error('[Audio] Static error:', err);
    }
  }

  // === URLhaus - Malware URLs ===
  playMalwareUrl(hit: URLhausHit) {
    if (!this.initialized) return;
    if (!this.throttleEvent('malware', 100)) return; // 1 note spectralSynth
    try {
      const now = Tone.now() + 0.02;
      const params = hashToParams(hit.url || hit.host);
      const threat = hit.threat?.toLowerCase() || 'malware';

      this.addTension(1.5);

      // Corrupted signal sound
      const note = this.getScaleNote(Math.floor(params.freq * 7), 2);
      this.malwareSynth.triggerAttackRelease(note, '4n', now);

      // Glitch burst for dangerous threats
      if (threat.includes('emotet') || threat.includes('ransomware') || threat.includes('cobalt')) {
        this.triggerGlitch(0.8);
        this.metallicSynth.triggerAttackRelease('8n', now + 0.1);
        this.addTension(1);
      }

      // Spectral tail
      this.spectralSynth.triggerAttackRelease(
        [this.getScaleNote(3, 3)],
        '2n',
        now + 0.2
      );
    } catch (err) {
      console.error('[Audio] Malware URL error:', err);
    }
  }

  // === DShield - Honeypot Attacks ===
  playHoneypotAttack(attack: DShieldAttack) {
    if (!this.initialized) return;
    if (!this.throttleEvent('honeypot', 80)) return;
    try {
      const now = Tone.now() + 0.02;
      const attackType = attack.attackType || 'scan';

      this.addTension(0.8);

      // Stutter hit
      this.stutterSynth.triggerAttackRelease('C1', '16n', now);

      if (attackType.includes('brute') || attackType.includes('ssh') || attackType.includes('rdp')) {
        // Aggressive repeated hits for bruteforce
        for (let i = 0; i < 3; i++) {
          this.bruteHammer.triggerAttackRelease('G0', '32n', now + 0.02 + i * 0.08);
        }
        this.addTension(0.5);
      } else if (attackType.includes('exploit') || attackType.includes('smb')) {
        // Heavy metallic for exploits
        this.metallicSynth.triggerAttackRelease('4n', now);
        this.triggerGlitch(0.6);
      } else {
        // Light static for scans
        this.triggerStatic('16n');
      }
    } catch (err) {
      console.error('[Audio] Honeypot attack error:', err);
    }
  }

  // === Feodo - Botnet C2 ===
  playBotnetC2(c2: FeodoC2) {
    if (!this.initialized) return;
    if (!this.throttleEvent('c2', 120)) return; // 2 notes c2Pulse
    try {
      const now = Tone.now() + 0.02;
      const params = hashToParams(c2.ip);
      const malware = c2.malware?.toLowerCase() || '';

      this.addTension(2);

      // Command pulse - mechanical, rhythmic
      const note = this.getScaleNote(Math.floor(params.freq * 5), 1);
      this.c2Pulse.triggerAttackRelease(note, '8n', now);
      this.c2Pulse.triggerAttackRelease(note, '16n', now + 0.3);

      // Online C2s are more threatening
      if (c2.status === 'online') {
        this.infraBass.triggerAttackRelease('C0', '1n', now);
        this.addTension(1.5);

        // Spectral presence
        this.fmGhost.triggerAttackRelease(this.getScaleNote(0, 2), '2n', now + 0.1);
      }

      // Malware family signatures
      if (malware.includes('emotet') || malware.includes('trickbot')) {
        this.triggerGlitch(0.9);
      } else if (malware.includes('qakbot') || malware.includes('icedid')) {
        this.staticBurst.triggerAttackRelease('4n', now + 0.2);
      }
    } catch (err) {
      console.error('[Audio] Botnet C2 error:', err);
    }
  }

  // === RansomWatch - Ransomware Victims ===
  playRansomwareVictim(victim: RansomwareVictim) {
    if (!this.initialized) return;
    if (!this.throttleEvent('ransomware', 200)) return; // 3-note chord on ransomDrone (12 poly)
    try {
      const now = Tone.now() + 0.05;

      // Maximum tension
      this.addTension(5);

      // Deep dread drone
      this.infraBass.triggerAttackRelease('C0', '2n', now);

      // Dissonant chord cluster
      const dreadChord = [
        this.getScaleNote(0, 1),
        this.getScaleNote(1, 1),  // Minor 2nd - maximum dissonance
        this.getScaleNote(6, 1),  // Tritone
      ];
      this.ransomDrone.triggerAttackRelease(dreadChord, '1n', now + 0.1);

      // Metallic crash
      this.metallicSynth.triggerAttackRelease('2n', now);

      // Single glitch burst (NoiseSynth is monophonic, avoid scheduling conflicts)
      this.glitchSynth.triggerAttackRelease('8n', now + 0.1);

      // Filter sweep for impact
      this.darkFilter.frequency.rampTo(2000, 0.1, now);
      this.darkFilter.frequency.rampTo(600, 3, now + 0.2);

      // Extra bit crush for ransomware (but not too harsh)
      this.bitCrusher.bits.value = 6;
      setTimeout(() => {
        if (this.initialized) this.bitCrusher.bits.value = 8;
      }, 800);
    } catch (err) {
      console.error('[Audio] Ransomware victim error:', err);
    }
  }

  // === OpenPhish - Phishing URLs ===
  playPhishing(phish: PhishingURL) {
    if (!this.initialized) return;
    if (!this.throttleEvent('phishing', 100)) return;
    try {
      const now = Tone.now() + 0.02;
      const params = hashToParams(phish.domain);

      this.addTension(0.6);

      // Deceptive chime - sounds almost pleasant but wrong
      const note = this.getScaleNote(Math.floor(params.freq * 7), 3);
      this.phishChime.triggerAttack(note, now);

      // Slightly detuned echo
      if (phish.targetBrand) {
        const dissonant = this.getScaleNote(Math.floor(params.freq * 7) + 1, 3);
        this.phishChime.triggerAttack(dissonant, now + 0.15);
        this.addTension(0.3);
      }

      // Subtle static for HTTPS (fake security)
      if (phish.protocol === 'https') {
        this.triggerStatic('32n');
      }
    } catch (err) {
      console.error('[Audio] Phishing error:', err);
    }
  }

  // === SSLBL - Malicious Certificates ===
  playMaliciousCert(entry: SSLBlacklistEntry) {
    if (!this.initialized) return;
    if (!this.throttleEvent('cert', 100)) return;
    try {
      const now = Tone.now() + 0.02;
      const params = hashToParams(entry.sha1 || entry.malware);

      this.addTension(0.8);

      // Spectral FM sound for certificates
      const note = this.getScaleNote(Math.floor(params.freq * 5), 2);
      this.fmGhost.modulationIndex.setValueAtTime(5 + params.freq * 10, now);
      this.fmGhost.triggerAttackRelease(note, '4n', now);

      // JA3 fingerprints get extra corruption
      if (entry.ja3Fingerprint) {
        this.triggerGlitch(0.4);
      }
    } catch (err) {
      console.error('[Audio] Malicious cert error:', err);
    }
  }

  // === Blocklist.de - Brute Force Attacks ===
  playBruteforce(attack: BruteforceAttack) {
    if (!this.initialized) return;
    if (!this.throttleEvent('bruteforce', 80)) return;
    try {
      const now = Tone.now() + 0.02;
      const attackType = attack.attackType || 'generic';

      this.addTension(1);

      // Persistent hammering
      this.bruteHammer.triggerAttackRelease('E0', '16n', now);
      this.bruteHammer.triggerAttackRelease('E0', '32n', now + 0.1);

      if (attackType.includes('ssh')) {
        // SSH: mechanical repetition
        this.c2Pulse.triggerAttackRelease(this.getScaleNote(2, 1), '16n', now + 0.05);
      } else if (attackType.includes('mail') || attackType.includes('spam')) {
        // Mail: buzzing annoyance
        this.triggerStatic('8n');
      } else if (attackType.includes('login')) {
        // Login: extra aggressive
        for (let i = 0; i < 4; i++) {
          this.stutterSynth.triggerAttackRelease('C1', '32n', now + 0.02 + i * 0.06);
        }
      }
    } catch (err) {
      console.error('[Audio] Bruteforce error:', err);
    }
  }

  // === Tor - Dark Web Exit Nodes ===
  playTorNode(node: TorExitNode) {
    if (!this.initialized) return;
    if (!this.throttleEvent('tor', 150)) return; // torWhisper + ghostPad (16 poly)
    try {
      const now = Tone.now() + 0.02;
      const params = hashToParams(node.fingerprint);

      // Tor is ambient, mysterious - less tension
      this.addTension(0.3);

      // Anonymous whisper
      const whisperNote = this.getScaleNote(Math.floor(params.freq * 7), 2);
      this.torWhisper.triggerAttackRelease([whisperNote], '2n', now);

      // Occasional shimmer for high-bandwidth nodes
      if (node.bandwidth > 50000000) {
        const shimmerNotes = [
          this.getScaleNote(4, 3),
          this.getScaleNote(6, 3),
        ];
        this.ghostPad.triggerAttackRelease(shimmerNotes, '1n', now + 1);
      }

      // Increase void reverb for Tor
      this.feedbackDelay.wet.rampTo(0.35, 0.5, now);
      this.feedbackDelay.wet.rampTo(0.2, 3, now + 1);
    } catch (err) {
      console.error('[Audio] Tor node error:', err);
    }
  }

  // === GreyNoise - Scanner Noise ===
  updateNoiseFloor(data: GreyNoiseData) {
    if (!this.initialized) return;
    try {
      const activity = Math.min((data.scannerCount || 50) / 100, 1);

      // Modulate whisper noise
      this.whisperGain.gain.rampTo(0.01 + activity * 0.03, 2);

      // Noise color based on threat level
      if (data.scannerTypes?.includes('malicious')) {
        if (this.whisperNoise.type !== 'pink') {
          this.whisperNoise.type = 'pink';
        }
        this.whisperFilter.baseFrequency = 40;
        this.addTension(activity * 0.5);
      } else {
        if (this.whisperNoise.type !== 'brown') {
          this.whisperNoise.type = 'brown';
        }
        this.whisperFilter.baseFrequency = 60;
      }

      this.whisperFilter.octaves = 3 + activity * 4;
    } catch (err) {
      console.error('[Audio] GreyNoise error:', err);
    }
  }

  // Update loop
  update(deltaTime: number) {
    if (!this.initialized) return;
    // Tension system handles most updates via interval
    // This is for any frame-rate dependent updates
    this.globalIntensity = 1.0 + this.globalTension * 0.5;
  }

  // === User Controls ===
  setScale(scaleName: keyof typeof SCALES) {
    if (SCALES[scaleName]) {
      this.currentScale = SCALES[scaleName];
      console.log(`[Audio] Scale: ${scaleName}`);
    }
  }

  setRoot(root: string) {
    if (ROOT_NOTES.includes(root)) {
      this.currentRoot = root;
      console.log(`[Audio] Root: ${root}`);
    }
  }

  setMasterVolume(volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.rampTo(v, 0.1);
  }

  setReverbAmount(wet: number) {
    // This now controls the void/tight balance differently
    // Higher wet = more void reverb (spacious), lower = more tight (claustrophobic)
    const w = Math.max(0, Math.min(1, wet));
    this.reverbBlend.fade.rampTo(1 - w, 0.5);
  }

  getWaveform(): Float32Array {
    if (!this.initialized || !this.analyzer) {
      return new Float32Array(256);
    }
    return this.analyzer.getValue() as Float32Array;
  }

  getTension(): number {
    return this.globalTension;
  }

  // === HIBP - Data Breach ===
  playBreach(breach: HIBPBreach) {
    if (!this.initialized) return;
    if (!this.throttleEvent('breach', 150)) return; // 4 notes spectralSynth (32 poly)
    try {
      const now = Tone.now() + 0.02;
      const params = hashToParams(breach.name);

      // Breaches are catastrophic - high tension
      this.addTension(breach.pwnCount > 1000000 ? 2.0 : 1.5);

      // Deep, ominous drone for massive data loss
      const bassNote = this.getScaleNote(0, 1);
      this.ransomDrone.triggerAttackRelease(bassNote, '2n', now);

      // Cascade of falling notes - data spilling out
      const fallNotes = [
        this.getScaleNote(6, 4),
        this.getScaleNote(4, 4),
        this.getScaleNote(2, 3),
        this.getScaleNote(0, 3),
      ];
      fallNotes.forEach((note, i) => {
        this.spectralSynth.triggerAttackRelease(note, '8n', now + i * 0.15);
      });

      // Distorted impact for large breaches
      if (breach.pwnCount > 100000) {
        this.distortion.wet.rampTo(0.6, 0.1, now);
        this.distortion.wet.rampTo(0.2, 1, now + 0.5);
        this.infraBass.triggerAttackRelease(this.getScaleNote(0, 1), '4n', now);
      }

      // Increase corruption for sensitive breaches
      if (breach.isSensitive) {
        this.bitCrusher.wet.rampTo(0.5, 0.2, now);
        this.bitCrusher.wet.rampTo(0.15, 2, now + 1);
      }
    } catch (err) {
      console.error('[Audio] Breach error:', err);
    }
  }

  // === Spamhaus - Hijacked IP Range ===
  playSpamhaus(drop: SpamhausDrop) {
    if (!this.initialized) return;
    if (!this.throttleEvent('spamhaus', 120)) return;
    try {
      const now = Tone.now() + 0.02;
      const params = hashToParams(drop.cidr);

      // Network hijacking - medium-high tension
      this.addTension(1.0);

      // Mechanical, industrial sound for infrastructure attack
      const mechNote = this.getScaleNote(Math.floor(params.freq * 5), 2);
      this.bruteHammer.triggerAttackRelease(mechNote, '8n', now);

      // Static burst - network interference
      this.staticBurst.triggerAttackRelease('16n', now + 0.1);

      // Sub bass rumble for large IP ranges
      if (drop.numAddresses > 65536) {
        this.subDrone.frequency.rampTo(35 + params.freq * 15, 0.5, now);
        this.subDrone.volume.rampTo(-18, 0.3, now);
        this.subDrone.volume.rampTo(-30, 2, now + 1);
      }

      // Glitchy artifacts
      this.glitchSynth.triggerAttackRelease(
        this.getScaleNote(params.offset % 7, 4),
        '32n',
        now + 0.2
      );
    } catch (err) {
      console.error('[Audio] Spamhaus error:', err);
    }
  }

  // === BGP Event - Route Hijack/Leak ===
  playBGPEvent(bgpEvent: BGPEvent) {
    if (!this.initialized) return;
    if (!this.throttleEvent('bgp', 150)) return;
    try {
      const now = Tone.now() + 0.02;
      const params = hashToParams(bgpEvent.prefix);

      // Tension based on severity
      const tensionMap = { critical: 2.5, high: 1.8, medium: 1.0, low: 0.5 };
      this.addTension(tensionMap[bgpEvent.severity] || 1.0);

      if (bgpEvent.eventType === 'hijack') {
        // Hijack - aggressive, alarming
        // MetalSynth rapid strikes for alarm effect
        this.metallicSynth.triggerAttackRelease('16n', now);
        this.metallicSynth.triggerAttackRelease('16n', now + 0.1);
        this.metallicSynth.triggerAttackRelease('32n', now + 0.2);

        // FM growl with valid note
        const growlNote = this.getScaleNote(2, 2);
        this.fmGhost.triggerAttackRelease(growlNote, '4n', now + 0.05);

        // Heavy distortion
        this.distortion.wet.rampTo(0.7, 0.1, now);
        this.distortion.wet.rampTo(0.2, 1.5, now + 0.3);

      } else if (bgpEvent.eventType === 'leak') {
        // Leak - unstable, wavering
        const leakNote = this.getScaleNote(params.offset % 6, 3);
        this.ghostPad.triggerAttackRelease([leakNote], '2n', now);

        // Pitch instability
        this.pitchShift.pitch = (Math.random() - 0.5) * 4;
        setTimeout(() => { this.pitchShift.pitch = 0; }, 1500);

        // Feedback swell
        this.feedbackDelay.wet.rampTo(0.5, 0.3, now);
        this.feedbackDelay.wet.rampTo(0.2, 2, now + 1);

      } else if (bgpEvent.eventType === 'withdrawal') {
        // Withdrawal - sudden silence, then echo
        this.spectralSynth.triggerAttackRelease(
          this.getScaleNote(4, 3),
          '16n',
          now
        );
        // Void reverb swell
        this.voidReverb.wet.rampTo(0.9, 0.5, now);
        this.voidReverb.wet.rampTo(0.6, 3, now + 1);

      } else {
        // General announcement - ambient pulse
        this.c2Pulse.triggerAttackRelease(
          this.getScaleNote(params.freq % 5, 3),
          '8n',
          now
        );
      }
    } catch (err) {
      console.error('[Audio] BGP event error:', err);
    }
  }

  dispose() {
    if (!this.initialized) return;

    if (this.droneInterval) clearInterval(this.droneInterval);
    if (this.tensionInterval) clearInterval(this.tensionInterval);

    this.whisperNoise.stop();
    this.bassLFO.stop();

    // Dispose all nodes
    this.voidDrone1.dispose();
    this.voidDrone2.dispose();
    this.ghostPad.dispose();
    this.whisperNoise.dispose();
    this.whisperFilter.dispose();
    this.whisperGain.dispose();
    this.spectralSynth.dispose();
    this.metallicSynth.dispose();
    this.fmGhost.dispose();
    this.glitchSynth.dispose();
    this.stutterSynth.dispose();
    this.staticBurst.dispose();
    this.malwareSynth.dispose();
    this.c2Pulse.dispose();
    this.ransomDrone.dispose();
    this.phishChime.dispose();
    this.torWhisper.dispose();
    this.bruteHammer.dispose();
    this.infraBass.dispose();
    this.subDrone.dispose();
    this.bassLFO.dispose();
    this.voidReverb.dispose();
    this.tightReverb.dispose();
    this.reverbBlend.dispose();
    this.bitCrusher.dispose();
    this.distortion.dispose();
    this.chebyshev.dispose();
    this.feedbackDelay.dispose();
    this.pitchShift.dispose();
    this.darkFilter.dispose();
    this.resonantFilter.dispose();
    this.masterCompressor.dispose();
    this.masterLimiter.dispose();
    this.masterGain.dispose();
    this.analyzer.dispose();

    Tone.getTransport().stop();
    Tone.getTransport().cancel();

    this.initialized = false;
  }
}
