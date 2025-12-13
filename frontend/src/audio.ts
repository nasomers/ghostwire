// Ghostwire Audio Engine v5 - Generative Music
// Threat data drives actual melodic, rhythmic, harmonic music

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

// === MUSICAL CONSTANTS ===

const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  pentatonic: [0, 3, 5, 7, 10],
};

const CHORD_PROGRESSIONS = {
  dark: [
    [0, 3, 7],      // i (minor)
    [5, 8, 0],      // iv
    [7, 10, 2],     // v
    [0, 3, 7],      // i
  ],
  tense: [
    [0, 3, 7],      // i
    [1, 4, 8],      // bII (neapolitan)
    [7, 10, 2],     // v
    [0, 3, 6],      // i (dim)
  ],
  ethereal: [
    [0, 4, 7],      // I (borrowed major)
    [5, 9, 0],      // IV
    [3, 7, 10],     // iii
    [0, 3, 7],      // i
  ],
};

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Convert scale degree to note name
function degreeToNote(degree: number, scale: number[], root: string, octave: number): string {
  const rootIdx = ROOTS.indexOf(root);
  const scaleNote = scale[Math.abs(degree) % scale.length];
  const octaveOffset = Math.floor(Math.abs(degree) / scale.length);
  const noteIdx = (rootIdx + scaleNote) % 12;
  return ROOTS[noteIdx] + (octave + octaveOffset);
}

// Simple hash for consistent randomness
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

// === ARPEGGIO PATTERNS ===

interface ArpPattern {
  degrees: number[];
  durations: string[];
  velocities: number[];
}

const ARPS: Record<string, ArpPattern> = {
  rise: {
    degrees: [0, 2, 4, 7, 9, 12],
    durations: ['16n', '16n', '16n', '16n', '8n', '4n'],
    velocities: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  },
  fall: {
    degrees: [12, 9, 7, 4, 2, 0],
    durations: ['16n', '16n', '16n', '16n', '8n', '4n'],
    velocities: [1.0, 0.9, 0.8, 0.7, 0.6, 0.5],
  },
  pulse: {
    degrees: [0, 0, 4, 0, 7, 0],
    durations: ['8n', '8n', '8n', '8n', '8n', '8n'],
    velocities: [1.0, 0.3, 0.8, 0.3, 0.9, 0.3],
  },
  cascade: {
    degrees: [0, 4, 7, 4, 0, -3],
    durations: ['16n', '16n', '16n', '16n', '8n', '4n'],
    velocities: [0.8, 0.7, 0.9, 0.6, 0.8, 1.0],
  },
  shimmer: {
    degrees: [0, 7, 4, 11, 7, 14],
    durations: ['8n', '8n', '8n', '8n', '8n', '2n'],
    velocities: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
  },
  stab: {
    degrees: [0, 0, 4],
    durations: ['16n', '8n', '4n'],
    velocities: [1.0, 0.4, 0.9],
  },
};

// === AUDIO ENGINE ===

export class AudioEngine {
  private initialized = false;

  // Master chain
  private masterGain!: Tone.Gain;
  private masterComp!: Tone.Compressor;
  private masterLimiter!: Tone.Limiter;
  private analyzer!: Tone.Analyser;

  // Effects
  private reverb!: Tone.Reverb;
  private delay!: Tone.FeedbackDelay;
  private filter!: Tone.Filter;
  private chorus!: Tone.Chorus;

  // Synths - melodic
  private leadSynth!: Tone.PolySynth;      // Main melodies
  private padSynth!: Tone.PolySynth;       // Chord pads
  private bassSynth!: Tone.MonoSynth;      // Bass line
  private arpSynth!: Tone.PolySynth;       // Arpeggios
  private bellSynth!: Tone.PolySynth;      // Bell-like tones
  private pluckSynth!: Tone.PluckSynth;    // Plucked strings

  // Synths - percussive
  private kickSynth!: Tone.MembraneSynth;
  private hihatSynth!: Tone.MetalSynth;
  private snareSynth!: Tone.NoiseSynth;

  // Synths - textural
  private droneSynth!: Tone.PolySynth;
  private noiseSynth!: Tone.Noise;
  private noiseGain!: Tone.Gain;

  // Musical state
  private currentRoot = 'D';
  private currentScale = SCALES.minor;
  private currentProgression = CHORD_PROGRESSIONS.dark;
  private chordIndex = 0;
  private tension = 0;
  private activity = 0;
  private bpm = 75;

  // Timing
  private lastChordChange = 0;
  private chordInterval = 4000; // 4 seconds per chord
  private lastBeat = 0;
  private beatInterval = 800; // ms per beat at 75bpm
  private pendingArps: Array<{
    synth: Tone.PolySynth;
    pattern: ArpPattern;
    baseOctave: number;
    startTime: number;
    velocity: number;
  }> = [];

  // Sequences
  private melodicQueue: Array<{
    note: string;
    duration: string;
    time: number;
    velocity: number;
    synth: 'lead' | 'arp' | 'bell';
  }> = [];

  // Cooldowns
  private lastEventTime: Record<string, number> = {};

  constructor() {}

  async init() {
    if (this.initialized) return;

    await Tone.start();
    console.log('[Audio v5] Initializing generative music engine...');

    Tone.getTransport().bpm.value = this.bpm;

    // === MASTER CHAIN ===
    this.masterComp = new Tone.Compressor({
      threshold: -18,
      ratio: 4,
      attack: 0.02,
      release: 0.25,
    });

    this.masterLimiter = new Tone.Limiter(-1);
    this.masterGain = new Tone.Gain(0.8);
    this.analyzer = new Tone.Analyser('waveform', 256);

    this.masterComp.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterGain);
    this.masterGain.connect(this.analyzer);
    this.analyzer.toDestination();

    // === EFFECTS ===
    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.3,
      preDelay: 0.1,
    });
    await this.reverb.ready;
    this.reverb.connect(this.masterComp);

    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n.',
      feedback: 0.25,
      wet: 0.2,
    });
    this.delay.connect(this.reverb);

    this.filter = new Tone.Filter({
      frequency: 2000,
      type: 'lowpass',
      rolloff: -12,
    });
    this.filter.connect(this.delay);

    this.chorus = new Tone.Chorus({
      frequency: 0.5,
      depth: 0.3,
      wet: 0.15,
    }).start();
    this.chorus.connect(this.filter);

    // === MELODIC SYNTHS ===

    // Lead - clean, clear, slightly warm
    this.leadSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      volume: -10,
    });
    this.leadSynth.maxPolyphony = 8;
    this.leadSynth.connect(this.chorus);

    // Pad - lush, sustained
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine4' },
      envelope: { attack: 1.5, decay: 2, sustain: 0.6, release: 3 },
      volume: -16,
    });
    this.padSynth.maxPolyphony = 12;
    this.padSynth.connect(this.reverb);

    // Bass - deep, warm
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.7, release: 0.5 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.5,
        release: 0.3,
        baseFrequency: 80,
        octaves: 2,
      },
      volume: -8,
    });
    this.bassSynth.connect(this.masterComp);

    // Arp - shimmery, crystal
    this.arpSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.4 },
      volume: -14,
    });
    this.arpSynth.maxPolyphony = 16;
    this.arpSynth.connect(this.delay);

    // Bell - glassy
    this.bellSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 2, sustain: 0, release: 1.5 },
      volume: -18,
    });
    this.bellSynth.maxPolyphony = 8;
    this.bellSynth.connect(this.reverb);

    // Pluck
    this.pluckSynth = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 3000,
      resonance: 0.9,
      volume: -12,
    });
    this.pluckSynth.connect(this.delay);

    // === PERCUSSIVE SYNTHS ===

    this.kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      volume: -12,
    });
    this.kickSynth.connect(this.masterComp);

    this.hihatSynth = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -24,
    });
    this.hihatSynth.connect(this.masterComp);

    this.snareSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      volume: -18,
    });
    this.snareSynth.connect(this.masterComp);

    // === TEXTURAL ===

    this.droneSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 3, sustain: 0.5, release: 6 },
      volume: -22,
    });
    this.droneSynth.maxPolyphony = 4;
    this.droneSynth.connect(this.reverb);

    this.noiseGain = new Tone.Gain(0.02);
    this.noiseGain.connect(this.reverb);

    this.noiseSynth = new Tone.Noise('brown');
    this.noiseSynth.connect(this.noiseGain);
    this.noiseSynth.start();

    // Start transport
    Tone.getTransport().start();

    // Start ambient chord cycle
    this.startChordCycle();

    // Start rhythm
    this.startRhythm();

    this.initialized = true;
    console.log('[Audio v5] Generative music engine ready');
  }

  isInitialized() {
    return this.initialized;
  }

  // === CHORD SYSTEM ===

  private startChordCycle() {
    // Play initial chord
    this.playCurrentChord();

    // Cycle chords
    setInterval(() => {
      if (!this.initialized) return;
      this.advanceChord();
      this.playCurrentChord();
    }, this.chordInterval);
  }

  private advanceChord() {
    this.chordIndex = (this.chordIndex + 1) % this.currentProgression.length;

    // Occasionally change progression based on tension
    if (this.chordIndex === 0 && Math.random() < 0.3) {
      if (this.tension > 0.6) {
        this.currentProgression = CHORD_PROGRESSIONS.tense;
      } else if (this.tension < 0.3) {
        this.currentProgression = CHORD_PROGRESSIONS.ethereal;
      } else {
        this.currentProgression = CHORD_PROGRESSIONS.dark;
      }
    }
  }

  private playCurrentChord() {
    if (!this.initialized) return;

    try {
      const chord = this.currentProgression[this.chordIndex];
      const notes = chord.map(d => this.getNote(d, 2));

      // Pad plays the chord
      this.padSynth.triggerAttackRelease(notes, '2n', Tone.now());

      // Bass plays root
      const bassNote = this.getNote(chord[0], 1);
      this.bassSynth.triggerAttackRelease(bassNote, '2n', Tone.now());

      // Drone on root occasionally
      if (Math.random() < 0.3) {
        const droneNote = this.getNote(0, 1);
        this.droneSynth.triggerAttackRelease([droneNote], '4n', Tone.now() + 0.5);
      }
    } catch (e) {
      // Ignore timing errors
    }
  }

  // === RHYTHM SYSTEM ===

  private startRhythm() {
    // Subtle pulse - not too aggressive
    setInterval(() => {
      if (!this.initialized) return;
      this.playBeat();
    }, this.beatInterval);
  }

  private playBeat() {
    const now = Tone.now();
    const beatInBar = (Date.now() / this.beatInterval) % 4;

    try {
      // Kick on 1 and 3 (when activity is high enough)
      if (this.activity > 0.3 && (Math.floor(beatInBar) === 0 || Math.floor(beatInBar) === 2)) {
        if (Math.random() < 0.7) {
          this.kickSynth.triggerAttackRelease('C1', '8n', now);
        }
      }

      // Hihat on upbeats (more frequent with activity)
      if (this.activity > 0.2 && Math.random() < this.activity * 0.5) {
        this.hihatSynth.triggerAttackRelease('16n', now);
      }

      // Snare ghost notes at high tension
      if (this.tension > 0.5 && Math.random() < 0.15) {
        this.snareSynth.triggerAttackRelease('32n', now);
      }
    } catch (e) {
      // Ignore
    }
  }

  // === MELODIC GENERATION ===

  private playArpeggio(pattern: ArpPattern, synth: Tone.PolySynth, baseOctave: number, velocity: number = 1) {
    const now = Tone.now();

    let timeOffset = 0;
    for (let i = 0; i < pattern.degrees.length; i++) {
      const note = this.getNote(pattern.degrees[i], baseOctave);
      const dur = pattern.durations[i];
      const vel = pattern.velocities[i] * velocity;

      try {
        synth.triggerAttackRelease(note, dur, now + timeOffset, vel);
      } catch (e) {
        // Ignore timing errors
      }

      // Calculate time offset from duration
      timeOffset += Tone.Time(dur).toSeconds();
    }
  }

  private playMelodyPhrase(degrees: number[], octave: number, synth: Tone.PolySynth) {
    const now = Tone.now();
    const noteDurations = ['8n', '8n', '16n', '16n', '8n', '4n'];

    let timeOffset = 0;
    for (let i = 0; i < degrees.length && i < noteDurations.length; i++) {
      const note = this.getNote(degrees[i], octave);
      const dur = noteDurations[i];

      try {
        synth.triggerAttackRelease(note, dur, now + timeOffset, 0.7 + Math.random() * 0.3);
      } catch (e) {
        // Ignore
      }

      timeOffset += Tone.Time(dur).toSeconds();
    }
  }

  private playBell(degree: number, octave: number) {
    const note = this.getNote(degree, octave);
    try {
      this.bellSynth.triggerAttackRelease(note, '4n', Tone.now(), 0.6);
    } catch (e) {
      // Ignore
    }
  }

  // === UTILITY ===

  private getNote(degree: number, octave: number): string {
    return degreeToNote(degree, this.currentScale, this.currentRoot, octave);
  }

  private throttle(key: string, minMs: number): boolean {
    const now = Date.now();
    if (now - (this.lastEventTime[key] || 0) < minMs) return false;
    this.lastEventTime[key] = now;
    return true;
  }

  private addTension(amount: number) {
    this.tension = Math.min(1, Math.max(0, this.tension + amount));

    // Tension affects filter and effects
    this.filter.frequency.rampTo(1200 + this.tension * 2000, 0.5);
    this.delay.feedback.rampTo(0.15 + this.tension * 0.2, 0.5);
    this.reverb.wet.rampTo(0.2 + this.tension * 0.3, 0.5);
    this.noiseGain.gain.rampTo(0.01 + this.tension * 0.04, 0.5);
  }

  private addActivity(amount: number) {
    this.activity = Math.min(1, Math.max(0, this.activity + amount));
  }

  // === THREAT HANDLERS ===

  playMalwareUrl(hit: URLhausHit) {
    if (!this.initialized) return;
    if (!this.throttle('malware', 150)) return;

    this.addTension(0.08);
    this.addActivity(0.1);

    // Malware: descending arpeggio (falling/corrupting)
    this.playArpeggio(ARPS.fall, this.arpSynth, 4, 0.7);

    // Pluck accent
    const h = hash(hit.url || 'malware');
    this.pluckSynth.triggerAttack(this.getNote(h % 7, 3), Tone.now());
  }

  playHoneypotAttack(attack: DShieldAttack) {
    if (!this.initialized) return;
    if (!this.throttle('honeypot', 100)) return;

    this.addTension(0.04);
    this.addActivity(0.08);

    // Honeypot: quick stab pattern
    this.playArpeggio(ARPS.stab, this.arpSynth, 3, 0.6);

    // Occasional kick for aggressive attacks
    if (attack.attackType?.includes('brute') && Math.random() < 0.5) {
      this.kickSynth.triggerAttackRelease('C1', '16n', Tone.now());
    }
  }

  playBotnetC2(c2: FeodoC2) {
    if (!this.initialized) return;
    if (!this.throttle('c2', 180)) return;

    this.addTension(0.12);
    this.addActivity(0.12);

    // C2: pulsing pattern (command/control rhythm)
    this.playArpeggio(ARPS.pulse, this.arpSynth, 2, 0.8);

    // Low lead note for command
    const note = this.getNote(0, 2);
    this.leadSynth.triggerAttackRelease(note, '4n', Tone.now() + 0.1, 0.7);

    // Extra layer for online C2
    if (c2.status === 'online') {
      this.playBell(4, 4);
      this.addTension(0.08);
    }
  }

  playRansomwareVictim(victim: RansomwareVictim) {
    if (!this.initialized) return;
    if (!this.throttle('ransomware', 300)) return;

    this.addTension(0.25);
    this.addActivity(0.2);

    // Ransomware: dramatic - falling arp then low impact
    this.playArpeggio(ARPS.cascade, this.leadSynth, 4, 1.0);

    // Heavy bass drop
    setTimeout(() => {
      this.bassSynth.triggerAttackRelease(this.getNote(0, 0), '2n', Tone.now());
      this.kickSynth.triggerAttackRelease('C0', '4n', Tone.now());
    }, 300);

    // Dissonant chord
    const dissonant = [
      this.getNote(0, 2),
      this.getNote(1, 2), // minor 2nd
      this.getNote(6, 2), // tritone
    ];
    setTimeout(() => {
      this.padSynth.triggerAttackRelease(dissonant, '1n', Tone.now());
    }, 500);
  }

  playPhishing(phish: PhishingURL) {
    if (!this.initialized) return;
    if (!this.throttle('phishing', 120)) return;

    this.addTension(0.03);
    this.addActivity(0.06);

    // Phishing: deceptively pleasant bell
    const h = hash(phish.domain || 'phish');
    this.playBell(h % 7, 4);

    // Slightly off arp
    if (phish.targetBrand) {
      setTimeout(() => {
        this.playBell((h + 1) % 7, 4); // Dissonant echo
      }, 200);
    }
  }

  playMaliciousCert(entry: SSLBlacklistEntry) {
    if (!this.initialized) return;
    if (!this.throttle('cert', 140)) return;

    this.addTension(0.05);
    this.addActivity(0.05);

    // Cert: shimmer pattern (cryptographic)
    this.playArpeggio(ARPS.shimmer, this.bellSynth, 4, 0.5);
  }

  playBruteforce(attack: BruteforceAttack) {
    if (!this.initialized) return;
    if (!this.throttle('brute', 80)) return;

    this.addTension(0.06);
    this.addActivity(0.1);

    // Brute force: repetitive stabs
    const now = Tone.now();
    this.arpSynth.triggerAttackRelease(this.getNote(0, 3), '16n', now, 0.8);
    this.arpSynth.triggerAttackRelease(this.getNote(0, 3), '16n', now + 0.1, 0.6);

    // Kick for emphasis
    if (Math.random() < 0.4) {
      this.kickSynth.triggerAttackRelease('C1', '16n', now + 0.05);
    }
  }

  playTorNode(node: TorExitNode) {
    if (!this.initialized) return;
    if (!this.throttle('tor', 200)) return;

    // Tor: ethereal, mysterious
    this.addActivity(0.03);

    // Long, slow notes
    const h = hash(node.fingerprint || 'tor');
    const note = this.getNote(h % 5, 4);
    this.bellSynth.triggerAttackRelease(note, '2n', Tone.now(), 0.4);

    // Drone layer
    if (Math.random() < 0.3) {
      this.droneSynth.triggerAttackRelease([this.getNote(0, 2)], '4n', Tone.now() + 0.5);
    }
  }

  updateNoiseFloor(data: GreyNoiseData) {
    if (!this.initialized) return;

    // Scanner noise affects activity
    const scanLevel = Math.min((data.scannerCount || 50) / 200, 1);
    this.activity = this.activity * 0.9 + scanLevel * 0.1;

    // Noise floor volume
    this.noiseGain.gain.rampTo(0.01 + scanLevel * 0.03, 1);
  }

  playBreach(breach: HIBPBreach) {
    if (!this.initialized) return;
    if (!this.throttle('breach', 250)) return;

    this.addTension(0.2);
    this.addActivity(0.15);

    // Breach: cascading fall (data spilling)
    this.playArpeggio(ARPS.fall, this.leadSynth, 5, 0.9);

    // Low rumble
    this.bassSynth.triggerAttackRelease(this.getNote(0, 0), '1n', Tone.now());

    // Cascade echo
    setTimeout(() => {
      this.playArpeggio(ARPS.fall, this.arpSynth, 4, 0.5);
    }, 400);

    // Major breach: extra impact
    if (breach.pwnCount > 1000000) {
      setTimeout(() => {
        this.kickSynth.triggerAttackRelease('C0', '2n', Tone.now());
        this.padSynth.triggerAttackRelease([
          this.getNote(0, 1),
          this.getNote(3, 1),
          this.getNote(7, 1),
        ], '1n', Tone.now());
      }, 600);
    }
  }

  playSpamhaus(drop: SpamhausDrop) {
    if (!this.initialized) return;
    if (!this.throttle('spamhaus', 160)) return;

    this.addTension(0.08);
    this.addActivity(0.08);

    // IP hijack: mechanical pulse
    this.playArpeggio(ARPS.pulse, this.arpSynth, 2, 0.7);

    // Static-like snare
    this.snareSynth.triggerAttackRelease('16n', Tone.now());
  }

  playBGPEvent(event: BGPEvent) {
    if (!this.initialized) return;
    if (!this.throttle('bgp', 400)) return;

    const tensionMap = { critical: 0.15, high: 0.1, medium: 0.05, low: 0.02 };
    this.addTension(tensionMap[event.severity] || 0.05);
    this.addActivity(0.1);

    if (event.eventType === 'hijack') {
      // BGP hijack: alarming rise
      this.playArpeggio(ARPS.rise, this.leadSynth, 3, 0.9);

      // Metallic alarm
      this.hihatSynth.triggerAttackRelease('8n', Tone.now());
      this.hihatSynth.triggerAttackRelease('8n', Tone.now() + 0.1);
      this.hihatSynth.triggerAttackRelease('8n', Tone.now() + 0.2);

    } else if (event.eventType === 'leak') {
      // Leak: unstable shimmer
      this.playArpeggio(ARPS.shimmer, this.arpSynth, 4, 0.6);

    } else {
      // Other: simple pulse
      this.playArpeggio(ARPS.stab, this.arpSynth, 3, 0.5);
    }
  }

  // === UPDATE LOOP ===

  update(deltaTime: number) {
    if (!this.initialized) return;

    // Decay tension and activity
    this.tension = Math.max(0, this.tension - deltaTime * 0.03);
    this.activity = Math.max(0, this.activity - deltaTime * 0.05);
  }

  // === USER CONTROLS ===

  setScale(scaleName: keyof typeof SCALES) {
    if (SCALES[scaleName]) {
      this.currentScale = SCALES[scaleName];
      console.log(`[Audio] Scale: ${scaleName}`);
    }
  }

  setRoot(root: string) {
    if (ROOTS.includes(root)) {
      this.currentRoot = root;
      console.log(`[Audio] Root: ${root}`);
    }
  }

  setMasterVolume(volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.rampTo(v, 0.1);
  }

  setReverbAmount(wet: number) {
    const w = Math.max(0, Math.min(1, wet));
    this.reverb.wet.rampTo(w, 0.5);
  }

  getWaveform(): Float32Array {
    if (!this.initialized || !this.analyzer) {
      return new Float32Array(256);
    }
    return this.analyzer.getValue() as Float32Array;
  }

  getTension(): number {
    return this.tension;
  }

  dispose() {
    if (!this.initialized) return;

    this.noiseSynth.stop();

    this.leadSynth.dispose();
    this.padSynth.dispose();
    this.bassSynth.dispose();
    this.arpSynth.dispose();
    this.bellSynth.dispose();
    this.pluckSynth.dispose();
    this.kickSynth.dispose();
    this.hihatSynth.dispose();
    this.snareSynth.dispose();
    this.droneSynth.dispose();
    this.noiseSynth.dispose();
    this.noiseGain.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.filter.dispose();
    this.chorus.dispose();
    this.masterComp.dispose();
    this.masterLimiter.dispose();
    this.masterGain.dispose();
    this.analyzer.dispose();

    Tone.getTransport().stop();
    Tone.getTransport().cancel();

    this.initialized = false;
  }
}
