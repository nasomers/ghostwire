// Ghostwire Audio Engine v6 - Evolving Generative Music
// Threat data drives melodic, rhythmic, harmonic music that evolves over time

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

const SCALES: Record<string, number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  pentatonic: [0, 3, 5, 7, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  wholeTone: [0, 2, 4, 6, 8, 10],
  blues: [0, 3, 5, 6, 7, 10],
  japanese: [0, 1, 5, 7, 8],
};


const CHORD_PROGRESSIONS: Record<string, number[][]> = {
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
  descending: [
    [0, 3, 7],      // i
    [-1, 2, 6],     // VII
    [-3, 0, 4],     // VI
    [-5, -2, 2],    // V
  ],
  chromatic: [
    [0, 3, 7],      // i
    [1, 4, 8],      // bII
    [2, 5, 9],      // II
    [0, 3, 7],      // i
  ],
  spacious: [
    [0, 7, 12],     // power + octave
    [5, 12, 17],    // open voicing
    [-5, 0, 7],     // bass drop
    [0, 7, 14],     // wide
  ],
};

const PROGRESSION_SEQUENCE = [
  'dark', 'tense', 'ethereal', 'descending', 'chromatic', 'spacious'
];

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

// Base patterns that can be mutated
const BASE_ARPS: Record<string, ArpPattern> = {
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
  spiral: {
    degrees: [0, 2, 4, 2, 4, 7, 4, 7, 9],
    durations: ['16n', '16n', '16n', '16n', '16n', '16n', '8n', '8n', '4n'],
    velocities: [0.6, 0.5, 0.7, 0.5, 0.8, 0.6, 0.9, 0.7, 1.0],
  },
  pendulum: {
    degrees: [0, 7, -3, 9, -5, 11, 0],
    durations: ['8n', '8n', '8n', '8n', '8n', '8n', '4n'],
    velocities: [0.8, 0.7, 0.8, 0.6, 0.9, 0.5, 1.0],
  },
  trill: {
    degrees: [0, 2, 0, 2, 0, 2, 4],
    durations: ['32n', '32n', '32n', '32n', '32n', '32n', '4n'],
    velocities: [0.7, 0.6, 0.7, 0.6, 0.8, 0.7, 0.9],
  },
  wide: {
    degrees: [0, 12, 7, 19, 4, 16],
    durations: ['8n', '8n', '8n', '8n', '8n', '2n'],
    velocities: [0.8, 0.5, 0.7, 0.4, 0.9, 0.6],
  },
  dark: {
    degrees: [0, -5, -3, 0, 3, 0],
    durations: ['8n', '8n', '8n', '8n', '8n', '4n'],
    velocities: [0.9, 0.7, 0.8, 0.6, 0.7, 0.5],
  },
  chaos: {
    degrees: [0, 11, -4, 9, -7, 14, 2],
    durations: ['16n', '16n', '8n', '16n', '16n', '8n', '4n'],
    velocities: [1.0, 0.5, 0.9, 0.6, 0.8, 0.7, 0.4],
  },
};

const ARP_NAMES = Object.keys(BASE_ARPS);

// === TEXTURE TYPES ===

type TextureMode = 'melody' | 'chords' | 'arps';

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


  // Synths - textural
  private droneSynth!: Tone.PolySynth;
  private noiseSynth!: Tone.Noise;
  private noiseGain!: Tone.Gain;

  // Musical state
  private currentRoot = 'C';
  private currentScale = SCALES.phrygian;
  private currentScaleName = 'phrygian';
  private currentProgression = CHORD_PROGRESSIONS.dark;
  private currentProgressionName = 'dark';
  private chordIndex = 0;
  private tension = 0;
  private activity = 0;
  private bpm = 75;

  // Texture system - alternates between melody/chords/arps
  private currentTexture: TextureMode = 'melody';
  private textureIndex = 0;
  private readonly textureSequence: TextureMode[] = ['melody', 'arps', 'chords', 'melody', 'chords', 'arps'];

  // Evolution state - gets trippier over time
  private evolutionTime = 0; // total seconds since start
  private evolutionPhase = 0; // 0-10, increases every ~2 minutes
  private progressionIndex = 0;
  private arpMutationLevel = 0; // 0-1, how much to mutate arps
  private octaveSpread = 0; // how wide the octave range gets
  private polyrhythmLevel = 0; // adds more complex rhythms

  // Timing
  private lastChordChange = 0;
  private chordInterval = 4000; // 4 seconds per chord
  private lastBeat = 0;
  private beatInterval = 800; // ms per beat at 75bpm
  private lastEvolution = 0;
  private evolutionInterval = 90000; // evolve every 1.5 minutes

  // Timbre state
  private timbreIndex = 0; // for cycling timbres independently
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
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.6 },
      volume: -10,
    });
    this.leadSynth.maxPolyphony = 12;
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
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 },
      volume: -14,
    });
    this.arpSynth.maxPolyphony = 24;
    this.arpSynth.connect(this.delay);

    // Bell - glassy
    this.bellSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1 },
      volume: -18,
    });
    this.bellSynth.maxPolyphony = 16;
    this.bellSynth.connect(this.reverb);

    // Pluck
    this.pluckSynth = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 3000,
      resonance: 0.9,
      volume: -12,
    });
    this.pluckSynth.connect(this.delay);

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

    // Start evolution system
    this.startEvolution();

    // Start texture cycling
    this.startTextureCycle();

    this.initialized = true;
    console.log('[Audio v6] Evolving generative music engine ready');
  }

  // === EVOLUTION SYSTEM ===

  private startEvolution() {
    // Check for evolution every 30 seconds
    setInterval(() => {
      if (!this.initialized) return;
      this.evolutionTime += 30;
      this.checkEvolution();
    }, 30000);

    // Timbre changes more frequently (every 30-45 seconds)
    setInterval(() => {
      if (!this.initialized) return;
      this.evolveTimbres();
    }, 30000 + Math.random() * 15000);
  }

  private checkEvolution() {
    // Every 1.5 minutes, evolve to next phase
    const newPhase = Math.floor(this.evolutionTime / 90);
    if (newPhase > this.evolutionPhase && newPhase <= 12) {
      this.evolutionPhase = newPhase;
      this.evolve();
    }

    // Gradually increase mutation level (faster ramp)
    this.arpMutationLevel = Math.min(1, this.evolutionTime / 450); // max at 7.5 min
    this.octaveSpread = Math.min(2, this.evolutionTime / 240); // max 2 octaves at 4 min
    this.polyrhythmLevel = Math.min(1, this.evolutionTime / 360); // max at 6 min
  }

  private evolve() {
    console.log(`[Audio] Evolution phase ${this.evolutionPhase}`);

    // Change progression every phase
    this.progressionIndex = (this.progressionIndex + 1) % PROGRESSION_SEQUENCE.length;
    this.currentProgressionName = PROGRESSION_SEQUENCE[this.progressionIndex];
    this.currentProgression = CHORD_PROGRESSIONS[this.currentProgressionName];
    console.log(`[Audio] Progression change: ${this.currentProgressionName}`);

    // Tempo drift at higher phases
    if (this.evolutionPhase >= 5) {
      const tempoShift = (Math.random() - 0.5) * 10;
      this.bpm = Math.max(60, Math.min(100, 75 + tempoShift));
      Tone.getTransport().bpm.rampTo(this.bpm, 4);
    }

    // Increase effect intensity
    if (this.evolutionPhase >= 3) {
      this.chorus.wet.rampTo(0.15 + this.evolutionPhase * 0.03, 2);
    }
    if (this.evolutionPhase >= 6) {
      this.delay.feedback.rampTo(0.25 + this.evolutionPhase * 0.02, 2);
    }

    // Evolve synth timbres
    this.evolveTimbres();
  }

  private evolveTimbres() {
    this.timbreIndex++;

    // Oscillator type options for different synths
    const oscTypes = ['sine', 'triangle', 'sine4', 'triangle8'] as const;
    const softOscTypes = ['sine', 'triangle', 'sine4', 'triangle8'] as const;

    try {
      // Lead synth - cycle through oscillator types
      const leadOsc = oscTypes[this.timbreIndex % oscTypes.length];
      this.leadSynth.set({ oscillator: { type: leadOsc } });
      console.log(`[Audio] Timbre change - Lead: ${leadOsc}`);

      // Arp synth - stay cleaner but vary
      const arpOsc = softOscTypes[this.timbreIndex % softOscTypes.length];
      this.arpSynth.set({ oscillator: { type: arpOsc } });

      // Pad synth - evolve envelope
      const padAttack = 0.8 + (this.timbreIndex % 4) * 0.4;
      const padRelease = 2 + (this.timbreIndex % 3);
      this.padSynth.set({
        envelope: { attack: padAttack, release: padRelease }
      });

      // Filter - varies more dynamically
      const filterFreq = 1200 + (this.timbreIndex % 6) * 400;
      this.filter.frequency.rampTo(filterFreq, 4);

      // Bass character - alternates
      const bassOsc = this.timbreIndex % 2 === 0 ? 'triangle' : 'sine';
      this.bassSynth.set({ oscillator: { type: bassOsc } });

      // Reverb character - random decay and wet amount
      const reverbDecay = 2 + Math.random() * 5;
      const reverbWet = 0.15 + Math.random() * 0.35;
      this.reverb.decay = reverbDecay;
      this.reverb.wet.rampTo(reverbWet, 2);

      // Delay time variations
      const delayTimes = ['8n.', '4n', '8n', '16n.', '4n.', '2n'];
      const delayTime = delayTimes[this.timbreIndex % delayTimes.length];
      this.delay.delayTime.rampTo(delayTime, 2);

    } catch (e) {
      // Ignore errors from synth modifications
    }
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

    // Change progression based on evolution phase and tension
    if (this.chordIndex === 0) {
      // More frequent progression changes at higher evolution
      const changeChance = 0.2 + this.evolutionPhase * 0.08;

      if (Math.random() < changeChance) {
        // Pick progression based on tension + evolution
        if (this.evolutionPhase >= 7 && Math.random() < 0.4) {
          // Late evolution: use exotic progressions
          const exotic = ['chromatic', 'spacious', 'descending'];
          const pick = exotic[Math.floor(Math.random() * exotic.length)];
          this.currentProgressionName = pick;
          this.currentProgression = CHORD_PROGRESSIONS[pick];
        } else if (this.tension > 0.6) {
          this.currentProgressionName = 'tense';
          this.currentProgression = CHORD_PROGRESSIONS.tense;
        } else if (this.tension < 0.3 && this.evolutionPhase >= 3) {
          this.currentProgressionName = 'ethereal';
          this.currentProgression = CHORD_PROGRESSIONS.ethereal;
        } else if (this.evolutionPhase >= 5 && Math.random() < 0.3) {
          this.currentProgressionName = 'descending';
          this.currentProgression = CHORD_PROGRESSIONS.descending;
        } else {
          this.currentProgressionName = 'dark';
          this.currentProgression = CHORD_PROGRESSIONS.dark;
        }
        console.log(`[Audio] Chord progression: ${this.currentProgressionName}`);
      }
    }

    // At high evolution, sometimes add chromatic passing chords
    if (this.evolutionPhase >= 6 && Math.random() < 0.2) {
      // Insert a chromatic approach chord
      const chromaticShift = Math.random() > 0.5 ? 1 : -1;
      this.currentProgression[this.chordIndex] = this.currentProgression[this.chordIndex].map(
        d => d + chromaticShift
      );
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

  // === TEXTURE SYSTEM ===

  private startTextureCycle() {
    // Change texture every 20-40 seconds
    setInterval(() => {
      if (!this.initialized) return;
      this.cycleTexture();
    }, 20000 + Math.random() * 20000);
  }

  private cycleTexture() {
    this.textureIndex = (this.textureIndex + 1) % this.textureSequence.length;
    this.currentTexture = this.textureSequence[this.textureIndex];
    console.log(`[Audio] Texture: ${this.currentTexture}`);
  }

  // Play a phrase based on current texture mode
  private playTexturedPhrase(intensity: 'low' | 'medium' | 'high', octave: number = 3) {
    switch (this.currentTexture) {
      case 'melody':
        this.playMelodicLine(intensity, octave);
        break;
      case 'chords':
        this.playChordTexture(intensity, octave);
        break;
      case 'arps':
        this.playArpTexture(intensity, octave);
        break;
    }
  }

  // Single notes with rests - slower, more intentional
  private playMelodicLine(intensity: 'low' | 'medium' | 'high', octave: number) {
    const now = Tone.now();
    const chord = this.currentProgression[this.chordIndex];

    // Pick notes from current chord + passing tones
    const noteCount = intensity === 'high' ? 4 : intensity === 'medium' ? 3 : 2;
    const durations = intensity === 'high'
      ? ['8n', '8n', '4n', '2n']
      : intensity === 'medium'
        ? ['4n', '8n', '2n']
        : ['2n', '4n'];

    let timeOffset = 0;
    const velocity = intensity === 'high' ? 0.8 : intensity === 'medium' ? 0.65 : 0.5;

    for (let i = 0; i < noteCount; i++) {
      // Use chord tones with occasional passing tones
      const degree = i < chord.length ? chord[i] : chord[0] + (Math.random() > 0.5 ? 2 : -2);
      const note = this.getNote(degree, octave);
      const dur = durations[i % durations.length];

      try {
        // Alternate between lead and bell for variety
        const synth = i % 2 === 0 ? this.leadSynth : this.bellSynth;
        synth.triggerAttackRelease(note, dur, now + timeOffset, velocity * (0.8 + Math.random() * 0.2));
      } catch (e) {}

      timeOffset += Tone.Time(dur).toSeconds();

      // Add rest between notes (melodic breathing)
      if (Math.random() < 0.4) {
        timeOffset += Tone.Time('8n').toSeconds();
      }
    }
  }

  // Chord stabs or sustained pads
  private playChordTexture(intensity: 'low' | 'medium' | 'high', octave: number) {
    const now = Tone.now();
    const chord = this.currentProgression[this.chordIndex];
    const notes = chord.map(d => this.getNote(d, octave));

    const velocity = intensity === 'high' ? 0.75 : intensity === 'medium' ? 0.6 : 0.45;

    try {
      if (intensity === 'high') {
        // Rhythmic stab
        this.padSynth.triggerAttackRelease(notes, '8n', now, velocity);
        // Echo stab
        setTimeout(() => {
          this.padSynth.triggerAttackRelease(notes, '8n', Tone.now(), velocity * 0.6);
        }, 300);
      } else if (intensity === 'medium') {
        // Sustained chord
        this.padSynth.triggerAttackRelease(notes, '2n', now, velocity);
      } else {
        // Soft swell - just root and fifth
        const thinNotes = [notes[0], notes[2] || notes[1]];
        this.padSynth.triggerAttackRelease(thinNotes, '1n', now, velocity);
      }

      // Occasionally add a bell accent on top
      if (Math.random() < 0.3) {
        const topNote = this.getNote(chord[chord.length - 1], octave + 1);
        this.bellSynth.triggerAttackRelease(topNote, '4n', now + 0.1, velocity * 0.5);
      }
    } catch (e) {}
  }

  // Arpeggios (existing behavior)
  private playArpTexture(intensity: 'low' | 'medium' | 'high', octave: number) {
    const pattern = intensity === 'high'
      ? this.pickRandomArp()
      : intensity === 'medium'
        ? ['rise', 'shimmer', 'cascade'][Math.floor(Math.random() * 3)]
        : ['pulse', 'stab'][Math.floor(Math.random() * 2)];

    const velocity = intensity === 'high' ? 0.8 : intensity === 'medium' ? 0.65 : 0.5;
    this.playArpeggio(pattern, this.arpSynth, octave, velocity);
  }

  // === MELODIC GENERATION ===

  private getArpPattern(baseName: string): ArpPattern {
    const base = BASE_ARPS[baseName] || BASE_ARPS.rise;

    // At low mutation, return base pattern
    if (this.arpMutationLevel < 0.1) return base;

    // Mutate the pattern based on evolution level
    const mutatedDegrees = base.degrees.map((d, i) => {
      if (Math.random() < this.arpMutationLevel * 0.4) {
        // Add interval variation
        const variation = Math.floor((Math.random() - 0.5) * 7 * this.arpMutationLevel);
        return d + variation;
      }
      return d;
    });

    // At higher evolution, extend the pattern
    if (this.evolutionPhase >= 4 && Math.random() < 0.3) {
      const extraNotes = Math.floor(this.evolutionPhase / 2);
      for (let i = 0; i < extraNotes; i++) {
        const lastDegree = mutatedDegrees[mutatedDegrees.length - 1];
        mutatedDegrees.push(lastDegree + (Math.random() > 0.5 ? 2 : -2));
      }
    }

    // Octave spread - shift some notes up or down
    const spreadDegrees = mutatedDegrees.map(d => {
      if (Math.random() < this.octaveSpread * 0.2) {
        return d + (Math.random() > 0.5 ? 7 : -7);
      }
      return d;
    });

    // Duration mutation at higher levels
    const durations = [...base.durations];
    while (durations.length < spreadDegrees.length) {
      durations.push(durations[durations.length - 1]);
    }
    if (this.polyrhythmLevel > 0.3) {
      const rhythmOptions = ['32n', '16n', '16n', '8n', '8n', '8n.', '4n', '4n.'];
      for (let i = 0; i < durations.length; i++) {
        if (Math.random() < this.polyrhythmLevel * 0.3) {
          durations[i] = rhythmOptions[Math.floor(Math.random() * rhythmOptions.length)];
        }
      }
    }

    // Velocity humanization
    const velocities = [...base.velocities];
    while (velocities.length < spreadDegrees.length) {
      velocities.push(velocities[velocities.length - 1]);
    }
    const humanizedVelocities = velocities.map(v =>
      Math.max(0.3, Math.min(1, v + (Math.random() - 0.5) * 0.3))
    );

    return { degrees: spreadDegrees, durations, velocities: humanizedVelocities };
  }

  private pickRandomArp(): string {
    // Higher evolution = more exotic patterns
    const available = this.evolutionPhase < 3
      ? ['rise', 'fall', 'pulse', 'cascade', 'shimmer', 'stab']
      : ARP_NAMES;
    return available[Math.floor(Math.random() * available.length)];
  }

  private playArpeggio(patternName: string | ArpPattern, synth: Tone.PolySynth, baseOctave: number, velocity: number = 1) {
    const pattern = typeof patternName === 'string'
      ? this.getArpPattern(patternName)
      : patternName;

    const now = Tone.now();

    // Add octave variation based on evolution
    const octaveOffset = this.octaveSpread > 0.5
      ? Math.floor((Math.random() - 0.5) * this.octaveSpread)
      : 0;

    let timeOffset = 0;
    for (let i = 0; i < pattern.degrees.length; i++) {
      const note = this.getNote(pattern.degrees[i], baseOctave + octaveOffset);
      const dur = pattern.durations[i % pattern.durations.length];
      const vel = (pattern.velocities[i % pattern.velocities.length] || 0.7) * velocity;

      try {
        synth.triggerAttackRelease(note, dur, now + timeOffset, vel);
      } catch (e) {
        // Ignore timing errors
      }

      // Calculate time offset from duration
      timeOffset += Tone.Time(dur).toSeconds();
    }

    // At high evolution, sometimes layer a second pattern (less frequently)
    if (this.evolutionPhase >= 7 && Math.random() < 0.12 && this.activity < 0.6) {
      setTimeout(() => {
        const secondPattern = this.getArpPattern(this.pickRandomArp());
        this.playArpeggioRaw(secondPattern, this.bellSynth, baseOctave + 1, velocity * 0.4);
      }, 300);
    }
  }

  private playArpeggioRaw(pattern: ArpPattern, synth: Tone.PolySynth, baseOctave: number, velocity: number) {
    const now = Tone.now();
    let timeOffset = 0;
    for (let i = 0; i < pattern.degrees.length; i++) {
      const note = this.getNote(pattern.degrees[i], baseOctave);
      const dur = pattern.durations[i % pattern.durations.length];
      const vel = (pattern.velocities[i % pattern.velocities.length] || 0.7) * velocity;
      try {
        synth.triggerAttackRelease(note, dur, now + timeOffset, vel);
      } catch (e) {}
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
    if (!this.throttle('malware', 200)) return;

    this.addTension(0.08);
    this.addActivity(0.1);

    // Use current texture mode
    this.playTexturedPhrase('medium', 4);

    // Pluck accent
    const h = hash(hit.url || 'malware');
    this.pluckSynth.triggerAttack(this.getNote(h % 7, 3), Tone.now());
  }

  playHoneypotAttack(attack: DShieldAttack) {
    if (!this.initialized) return;
    if (!this.throttle('honeypot', 100)) return;

    this.addTension(0.04);
    this.addActivity(0.08);

    // Use current texture mode - low intensity for frequent events
    this.playTexturedPhrase('low', 3);
  }

  playBotnetC2(c2: FeodoC2) {
    if (!this.initialized) return;
    if (!this.throttle('c2', 180)) return;

    this.addTension(0.12);
    this.addActivity(0.12);

    // Use current texture mode - medium intensity
    this.playTexturedPhrase('medium', 2);

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

    // Ransomware: always dramatic - high intensity
    this.playTexturedPhrase('high', 4);

    // Heavy bass drop
    setTimeout(() => {
      this.bassSynth.triggerAttackRelease(this.getNote(0, 0), '2n', Tone.now());
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

    // Phishing: use current texture - low intensity
    this.playTexturedPhrase('low', 4);

    // Slightly off bell for targeted brands
    if (phish.targetBrand) {
      const h = hash(phish.domain || 'phish');
      setTimeout(() => {
        this.playBell((h + 1) % 7, 4);
      }, 200);
    }
  }

  playMaliciousCert(entry: SSLBlacklistEntry) {
    if (!this.initialized) return;
    if (!this.throttle('cert', 140)) return;

    this.addTension(0.05);
    this.addActivity(0.05);

    // Cert: use current texture - low intensity
    this.playTexturedPhrase('low', 4);
  }

  playBruteforce(attack: BruteforceAttack) {
    if (!this.initialized) return;
    if (!this.throttle('brute', 80)) return;

    this.addTension(0.06);
    this.addActivity(0.1);

    // Brute force: use current texture - low intensity
    this.playTexturedPhrase('low', 3);
  }

  playTorNode(node: TorExitNode) {
    if (!this.initialized) return;
    if (!this.throttle('tor', 200)) return;

    // Tor: ethereal, mysterious - use current texture
    this.addActivity(0.03);
    this.playTexturedPhrase('low', 4);

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

    // Noise floor volume - increases with evolution
    this.noiseGain.gain.rampTo(0.01 + scanLevel * 0.03 + this.evolutionPhase * 0.003, 1);
  }

  playBreach(breach: HIBPBreach) {
    if (!this.initialized) return;
    if (!this.throttle('breach', 250)) return;

    this.addTension(0.2);
    this.addActivity(0.15);

    // Breach: high intensity texture
    this.playTexturedPhrase('high', 5);

    // Low rumble
    this.bassSynth.triggerAttackRelease(this.getNote(0, 0), '1n', Tone.now());

    // Major breach: extra chord impact
    if (breach.pwnCount > 1000000) {
      setTimeout(() => {
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

    // IP hijack: medium intensity texture
    this.playTexturedPhrase('medium', 2);
  }

  playBGPEvent(event: BGPEvent) {
    if (!this.initialized) return;
    if (!this.throttle('bgp', 400)) return;

    const tensionMap: Record<string, number> = { critical: 0.15, high: 0.1, medium: 0.05, low: 0.02 };
    this.addTension(tensionMap[event.severity] || 0.05);
    this.addActivity(0.1);

    // BGP events use intensity based on type
    if (event.eventType === 'hijack') {
      this.playTexturedPhrase('high', 3);
    } else if (event.eventType === 'leak') {
      this.playTexturedPhrase('medium', 4);
    } else {
      this.playTexturedPhrase('low', 3);
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
