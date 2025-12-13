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

// Mobile detection
function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth < 768);
}

export class AudioEngine {
  private initialized = false;
  private isMobileDevice = false;

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

  // New atmospheric synths
  private breathSynth!: Tone.PolySynth;     // Quiet Breath - soft pad for low tension
  private breathLFO!: Tone.LFO;
  private breathGain!: Tone.Gain;
  private growlSynth!: Tone.MonoSynth;      // Growl Bass - aggressive bass for critical events
  private growlFilter!: Tone.Filter;
  private growlDistortion!: Tone.Distortion;
  private swellSynth!: Tone.PolySynth;      // Reverse Swell - anticipation before big events
  private swellReverb!: Tone.Reverb;
  private ghostSynth!: Tone.PolySynth;      // Harmonic Ghost - echoes during quiet
  private ghostDelay!: Tone.PingPongDelay;

  // Dramatic impact synths
  private subBassSynth!: Tone.MonoSynth;    // Deep sub-bass drops (30-60Hz)
  private subBassFilter!: Tone.Filter;
  private riserSynth!: Tone.MonoSynth;      // Rising pitch sweep before impacts
  private riserFilter!: Tone.Filter;
  private impactNoise!: Tone.NoiseSynth;    // Percussive noise burst
  private impactGain!: Tone.Gain;
  private tensionDrone!: Tone.MonoSynth;    // Continuous tension drone
  private tensionDroneGain!: Tone.Gain;
  private tensionDroneLFO!: Tone.LFO;

  // Continuous evolving elements
  private evolvingBass!: Tone.MonoSynth;    // Modulating bassline that evolves
  private evolvingBassFilter!: Tone.Filter;
  private evolvingBassLFO!: Tone.LFO;       // Filter modulation
  private evolvingBassGain!: Tone.Gain;
  private evolvingBassActive = false;
  private lastBassNoteTime = 0;
  private lastGrowlTime = 0;
  private lastSwellTime = 0;
  private lastPeriodicDramaTime = 0;

  // Voice Choir System - layered evolving pads with formant filtering
  private voiceLow!: Tone.MonoSynth;         // Bass voice
  private voiceMid!: Tone.MonoSynth;         // Tenor voice
  private voiceHigh!: Tone.MonoSynth;        // Soprano voice
  private voiceFilterLow1!: Tone.Filter;     // Formant 1 for each voice
  private voiceFilterLow2!: Tone.Filter;     // Formant 2
  private voiceFilterMid1!: Tone.Filter;
  private voiceFilterMid2!: Tone.Filter;
  private voiceFilterHigh1!: Tone.Filter;
  private voiceFilterHigh2!: Tone.Filter;
  private voiceGainLow!: Tone.Gain;
  private voiceGainMid!: Tone.Gain;
  private voiceGainHigh!: Tone.Gain;
  private voiceVibratoLow!: Tone.LFO;        // Slow vibrato
  private voiceVibratoMid!: Tone.LFO;
  private voiceVibratoHigh!: Tone.LFO;
  private voiceReverb!: Tone.Reverb;
  private voiceChorus!: Tone.Chorus;

  // Voice state
  private voicePhase = 0;                    // 0-1 through voice evolution cycle
  private voiceCycleLength = 35;             // Seconds per full evolution
  private currentVowelIndex = 0;
  private voiceActiveNotes: { low: string | null, mid: string | null, high: string | null } = { low: null, mid: null, high: null };
  private lastVoiceTrigger = 0;
  private voiceIntensity = 0;                // 0-1, builds with events

  // Shard Rain Layer - ambient reactive texture
  private shardSynth!: Tone.PolySynth;       // High-pitched tiny notes
  private shardFilter!: Tone.Filter;
  private shardDelay!: Tone.PingPongDelay;
  private shardGain!: Tone.Gain;
  private shardReverb!: Tone.Reverb;
  private lastShardTime = 0;
  private shardDensity = 0.3;                // 0-1, increases with activity
  private shardBrightness = 0.5;             // 0-1, increases with tension

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

  // Quiet Breath state
  private lowTensionDuration = 0;      // How long tension has been low
  private breathActive = false;
  private lastBreathTime = 0;

  // Harmonic Ghost state
  private noteHistory: Array<{ note: string; time: number }> = [];
  private ghostActive = false;
  private lastGhostTime = 0;
  private quietDuration = 0;           // How long since last event

  constructor() {}

  async init() {
    if (this.initialized) return;

    this.isMobileDevice = isMobile();

    if (this.isMobileDevice) {
      console.log('[Audio] Mobile mode - reduced features for stability');
    }

    await Tone.start();
    console.log('[Audio v5] Initializing generative music engine...');

    Tone.getTransport().bpm.value = this.bpm;

    // Polyphony limits - much lower on mobile
    const maxPoly = this.isMobileDevice ? 4 : 12;
    const maxPolyLow = this.isMobileDevice ? 2 : 8;

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
      oscillator: { type: this.isMobileDevice ? 'triangle' : 'triangle8' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.6 },
      volume: -10,
    });
    this.leadSynth.maxPolyphony = maxPoly;
    this.leadSynth.connect(this.chorus);

    // Pad - lush, sustained
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: this.isMobileDevice ? 'sine' : 'sine4' },
      envelope: { attack: 1.5, decay: 2, sustain: 0.6, release: 3 },
      volume: -16,
    });
    this.padSynth.maxPolyphony = maxPoly;
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
    this.arpSynth.maxPolyphony = this.isMobileDevice ? 6 : 24;
    this.arpSynth.connect(this.delay);

    // Bell - glassy
    this.bellSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1 },
      volume: -18,
    });
    this.bellSynth.maxPolyphony = maxPoly;
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
    this.droneSynth.maxPolyphony = maxPolyLow;
    this.droneSynth.connect(this.reverb);

    // Enhanced noise floor with filter and LFO modulation
    this.noiseGain = new Tone.Gain(0.025);
    this.noiseGain.connect(this.reverb);

    // Lowpass filter - opens with tension
    const noiseFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 600,
      Q: 0.7,
    });
    noiseFilter.connect(this.noiseGain);

    // Slow LFO for breathing movement on filter
    const noiseLFO = new Tone.LFO({
      frequency: 0.04,
      min: 400,
      max: 1000,
    });
    noiseLFO.connect(noiseFilter.frequency);
    noiseLFO.start();

    // Pink noise for softer texture
    this.noiseSynth = new Tone.Noise('pink');
    this.noiseSynth.connect(noiseFilter);
    this.noiseSynth.start();

    // Store for tension control
    (this as any).noiseFilter = noiseFilter;
    (this as any).noiseLFO = noiseLFO;

    // === NEW ATMOSPHERIC SYNTHS ===

    // Quiet Breath - soft breathing pad with LFO modulation
    this.breathGain = new Tone.Gain(0);
    this.breathGain.connect(this.reverb);

    this.breathSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine4' },
      envelope: { attack: 3, decay: 2, sustain: 0.4, release: 4 },
      volume: -12,
    });
    this.breathSynth.maxPolyphony = 4;
    this.breathSynth.connect(this.breathGain);

    this.breathLFO = new Tone.LFO({
      frequency: 0.08, // Very slow breathing
      min: 0,
      max: 0.85,
    });
    this.breathLFO.connect(this.breathGain.gain);
    this.breathLFO.start();

    // Growl Bass - aggressive filtered bass for critical events
    this.growlDistortion = new Tone.Distortion({
      distortion: 0.4,
      wet: 0.3,
    });
    this.growlDistortion.connect(this.masterComp);

    this.growlFilter = new Tone.Filter({
      frequency: 200,
      type: 'lowpass',
      rolloff: -24,
      Q: 4,
    });
    this.growlFilter.connect(this.growlDistortion);

    this.growlSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.8 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.2,
        release: 0.5,
        baseFrequency: 60,
        octaves: 3,
      },
      volume: -6,
    });
    this.growlSynth.connect(this.growlFilter);

    // Reverse Swell - anticipation pad with very long attack
    this.swellReverb = new Tone.Reverb({
      decay: 6,
      wet: 0.8,
      preDelay: 0.2,
    });
    await this.swellReverb.ready;
    this.swellReverb.connect(this.masterComp);

    this.swellSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 2.5, decay: 1, sustain: 0.8, release: 3 },
      volume: -10,
    });
    this.swellSynth.maxPolyphony = 6;
    this.swellSynth.connect(this.swellReverb);

    // Harmonic Ghost - ethereal delayed echoes
    this.ghostDelay = new Tone.PingPongDelay({
      delayTime: '4n.',
      feedback: 0.5,
      wet: 0.8,
    });
    this.ghostDelay.connect(this.reverb);

    this.ghostSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 1.5, sustain: 0.2, release: 2 },
      volume: -18,
    });
    this.ghostSynth.maxPolyphony = 8;
    this.ghostSynth.connect(this.ghostDelay);

    // === DRAMATIC IMPACT SYNTHS ===

    // Sub-bass - deep rumbling drops you feel in your chest
    this.subBassFilter = new Tone.Filter({
      frequency: 80,
      type: 'lowpass',
      rolloff: -24,
    });
    this.subBassFilter.connect(this.masterComp);

    this.subBassSynth = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 1.5 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.2,
        release: 1,
        baseFrequency: 30,
        octaves: 1,
      },
      volume: 0, // Loud!
    });
    this.subBassSynth.connect(this.subBassFilter);

    // Riser - pitch sweep building tension
    this.riserFilter = new Tone.Filter({
      frequency: 500,
      type: 'bandpass',
      Q: 2,
    });
    this.riserFilter.connect(this.reverb);

    this.riserSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 2, decay: 0.5, sustain: 0.8, release: 0.5 },
      filterEnvelope: {
        attack: 2,
        decay: 0.3,
        sustain: 0.5,
        release: 0.5,
        baseFrequency: 200,
        octaves: 4,
      },
      volume: -8,
    });
    this.riserSynth.connect(this.riserFilter);

    // Impact noise burst - percussive hit
    this.impactGain = new Tone.Gain(0.8);
    this.impactGain.connect(this.masterComp);

    this.impactNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      volume: -6,
    });
    this.impactNoise.connect(this.impactGain);

    // Tension drone - continuous low frequency that builds
    this.tensionDroneGain = new Tone.Gain(0);
    this.tensionDroneGain.connect(this.masterComp);

    this.tensionDrone = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 2, decay: 1, sustain: 1, release: 3 },
      filterEnvelope: {
        attack: 0.5,
        decay: 0.5,
        sustain: 0.5,
        release: 2,
        baseFrequency: 40,
        octaves: 1,
      },
      volume: -10,
    });
    this.tensionDrone.connect(this.tensionDroneGain);

    this.tensionDroneLFO = new Tone.LFO({
      frequency: 0.1,
      min: 0,
      max: 0.7,
    });
    this.tensionDroneLFO.connect(this.tensionDroneGain.gain);
    this.tensionDroneLFO.start();

    // === DESKTOP-ONLY HEAVY LAYERS ===
    // These are skipped on mobile for performance
    if (!this.isMobileDevice) {
      // === EVOLVING BASS ===
      // Continuous modulating bassline that evolves with activity
      this.evolvingBassGain = new Tone.Gain(0);
      this.evolvingBassGain.connect(this.masterComp);

      this.evolvingBassFilter = new Tone.Filter({
        frequency: 200,
        type: 'lowpass',
        rolloff: -24,
        Q: 3,
      });
      this.evolvingBassFilter.connect(this.evolvingBassGain);

      this.evolvingBass = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.1, decay: 0.4, sustain: 0.6, release: 0.8 },
        filterEnvelope: {
          attack: 0.05,
          decay: 0.3,
          sustain: 0.4,
          release: 0.5,
          baseFrequency: 60,
          octaves: 2.5,
        },
        volume: -4,
      });
      this.evolvingBass.connect(this.evolvingBassFilter);

      // LFO modulates filter for that classic evolving sound
      this.evolvingBassLFO = new Tone.LFO({
        frequency: 0.15, // Slow wobble
        min: 100,
        max: 600,
      });
      this.evolvingBassLFO.connect(this.evolvingBassFilter.frequency);
      this.evolvingBassLFO.start();

      // === SHARD RAIN LAYER ===
      // Ambient reactive texture - tiny high-pitched drops
      this.shardReverb = new Tone.Reverb({
        decay: 4,
        wet: 0.7,
        preDelay: 0.1,
      });
      await this.shardReverb.ready;
      this.shardReverb.connect(this.masterComp);

      this.shardGain = new Tone.Gain(0.15);
      this.shardGain.connect(this.shardReverb);

      this.shardDelay = new Tone.PingPongDelay({
        delayTime: '8n.',
        feedback: 0.3,
        wet: 0.4,
      });
      this.shardDelay.connect(this.shardGain);

      this.shardFilter = new Tone.Filter({
        type: 'highpass',
        frequency: 2000,
        Q: 1,
      });
      this.shardFilter.connect(this.shardDelay);

      this.shardSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.002,
          decay: 0.1,
          sustain: 0,
          release: 0.3,
        },
        volume: -12,
      });
      this.shardSynth.maxPolyphony = 16;
      this.shardSynth.connect(this.shardFilter);

      // === VOICE CHOIR SYSTEM ===
      // Layered pads with formant filtering for voice-like quality
      this.voiceReverb = new Tone.Reverb({
        decay: 6,
        wet: 0.6,
        preDelay: 0.2,
      });
      await this.voiceReverb.ready;
      this.voiceReverb.connect(this.masterComp);

      this.voiceChorus = new Tone.Chorus({
        frequency: 0.5,
        delayTime: 3.5,
        depth: 0.4,
        wet: 0.3,
      });
      this.voiceChorus.connect(this.voiceReverb);
      this.voiceChorus.start();

      // Formant frequencies for vowel sounds (Hz)
      // 'ah' sound: F1=800, F2=1200
      const createVoice = (octaveOffset: number, formant1: number, formant2: number) => {
        const gain = new Tone.Gain(0);
        gain.connect(this.voiceChorus);

        const filter2 = new Tone.Filter({ type: 'bandpass', frequency: formant2, Q: 5 });
        filter2.connect(gain);

        const filter1 = new Tone.Filter({ type: 'bandpass', frequency: formant1, Q: 8 });
        filter1.connect(filter2);

        const synth = new Tone.MonoSynth({
          oscillator: { type: 'sawtooth8' },
          envelope: { attack: 2, decay: 1, sustain: 0.7, release: 4 },
          filterEnvelope: { attack: 1, decay: 0.5, sustain: 0.8, release: 3, baseFrequency: 200, octaves: 2 },
          volume: -8,
        });
        synth.connect(filter1);

        // Slow vibrato
        const vibrato = new Tone.LFO({ frequency: 4 + Math.random() * 2, min: -10, max: 10 });
        vibrato.connect(synth.detune);
        vibrato.start();

        return { synth, filter1, filter2, gain, vibrato };
      };

      // Low voice (bass) - deeper formants
      const lowVoice = createVoice(0, 600, 1000);
      this.voiceLow = lowVoice.synth;
      this.voiceFilterLow1 = lowVoice.filter1;
      this.voiceFilterLow2 = lowVoice.filter2;
      this.voiceGainLow = lowVoice.gain;
      this.voiceVibratoLow = lowVoice.vibrato;

      // Mid voice (tenor) - mid formants
      const midVoice = createVoice(1, 800, 1200);
      this.voiceMid = midVoice.synth;
      this.voiceFilterMid1 = midVoice.filter1;
      this.voiceFilterMid2 = midVoice.filter2;
      this.voiceGainMid = midVoice.gain;
      this.voiceVibratoMid = midVoice.vibrato;

      // High voice (soprano) - higher formants
      const highVoice = createVoice(2, 1000, 1400);
      this.voiceHigh = highVoice.synth;
      this.voiceFilterHigh1 = highVoice.filter1;
      this.voiceFilterHigh2 = highVoice.filter2;
      this.voiceGainHigh = highVoice.gain;
      this.voiceVibratoHigh = highVoice.vibrato;
    }

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
    const note = this.getNote(h % 7, 3);
    this.pluckSynth.triggerAttack(note, Tone.now());
    this.recordNote(note);
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
    this.recordNote(note);

    // Extra layer for online C2
    if (c2.status === 'online') {
      this.playBell(4, 4);
      this.addTension(0.08);

      // Variety in online C2 response
      const effect = Math.random();
      if (effect < 0.3) {
        this.playGrowlBass();
      } else if (effect < 0.5) {
        this.playOminousCluster();
      } else if (effect < 0.7) {
        this.playCascade();
      } else {
        this.playDeepThrob();
      }
    }
  }

  playRansomwareVictim(victim: RansomwareVictim) {
    if (!this.initialized) return;
    if (!this.throttle('ransomware', 300)) return;

    this.addTension(0.35);
    this.addActivity(0.25);

    console.log('[Audio] RANSOMWARE - Full dramatic sequence');

    // Varied dramatic approaches
    const approach = Math.floor(Math.random() * 4);

    if (approach === 0) {
      // Classic: riser into impact
      this.playDramaticHit();
      setTimeout(() => this.playStinger('danger'), 2000);
    } else if (approach === 1) {
      // Escalation into chaos
      this.playEscalation();
      setTimeout(() => {
        this.playGlitchBurst();
        this.playDeepThrob();
      }, 1500);
      setTimeout(() => this.playStinger('breach'), 2500);
    } else if (approach === 2) {
      // Noise sweep into impact
      this.playNoiseSweep('up');
      setTimeout(() => {
        this.playImpactHit();
        this.playOminousCluster();
      }, 2000);
    } else {
      // Rhythmic build into hit
      this.playRhythmicPulse(2.5);
      setTimeout(() => {
        this.playDramaticHit();
      }, 2500);
    }

    // Textured phrase
    setTimeout(() => {
      this.playTexturedPhrase('high', 4);
    }, 300);

    // Shard burst for extra intensity
    this.playShardBurst(12, 300);

    // Voice swell for emotional weight
    this.playVoiceSwell();

    // Record notes for ghost echoes
    this.recordNote(this.getNote(0, 2));
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

    const isMajorBreach = breach.pwnCount > 1000000;
    this.addTension(isMajorBreach ? 0.3 : 0.2);
    this.addActivity(0.15);

    console.log(`[Audio] BREACH - ${breach.title} (${breach.pwnCount} pwned)`);

    // Major breaches get full dramatic treatment
    if (isMajorBreach) {
      // Full dramatic hit sequence
      this.playDramaticHit();

      // Breach stinger after impact
      setTimeout(() => {
        this.playStinger('breach');
      }, 2000);

      // Extra textured phrase
      setTimeout(() => {
        this.playTexturedPhrase('high', 5);
      }, 300);
    } else {
      // Regular breaches: swell into stinger
      this.playReverseSwell();

      setTimeout(() => {
        this.playStinger('alert');
        this.playGrowlBass();
      }, 500);

      // Textured phrase
      this.playTexturedPhrase('high', 5);
    }

    // Low rumble for all breaches
    this.bassSynth.triggerAttackRelease(this.getNote(0, 0), '1n', Tone.now());

    // Shard cascade for breaches
    setTimeout(() => this.playShardCascade(), 500);

    // Voice swell for emotional weight
    this.playVoiceSwell();

    // Record for ghost echoes
    this.recordNote(this.getNote(0, 1));
  }

  playSpamhaus(drop: SpamhausDrop) {
    if (!this.initialized) return;
    if (!this.throttle('spamhaus', 160)) return;

    this.addTension(0.08);
    this.addActivity(0.08);

    // IP hijack: medium intensity texture
    this.playTexturedPhrase('medium', 2);

    // Occasional dramatic accents for IP hijacks
    const effect = Math.random();
    if (effect < 0.2) {
      this.playGlitchBurst();
    } else if (effect < 0.35) {
      setTimeout(() => this.playCascade(), 300);
    } else if (effect < 0.5) {
      this.playDeepThrob();
    }
  }

  playBGPEvent(event: BGPEvent) {
    if (!this.initialized) return;
    if (!this.throttle('bgp', 400)) return;

    const tensionMap: Record<string, number> = { critical: 0.15, high: 0.1, medium: 0.05, low: 0.02 };
    this.addTension(tensionMap[event.severity] || 0.05);
    this.addActivity(0.1);

    const note = this.getNote(0, 3);
    this.recordNote(note);

    // BGP events use intensity based on type
    if (event.eventType === 'hijack') {
      this.playTexturedPhrase('high', 3);

      // Critical severity hijacks get dramatic treatment
      if (event.severity === 'critical') {
        const effect = Math.random();
        if (effect < 0.25) {
          this.playGrowlBass();
          this.playReverseSwell();
        } else if (effect < 0.5) {
          this.playDeepThrob();
          setTimeout(() => this.playHarmonicShift(), 1500);
        } else if (effect < 0.75) {
          this.playNoiseSweep('down');
          setTimeout(() => this.playOminousCluster(), 2000);
        } else {
          this.playEscalation();
        }
      } else if (event.severity === 'high' && Math.random() < 0.4) {
        // High severity occasionally gets something dramatic
        this.playCascade();
      }
    } else if (event.eventType === 'leak') {
      this.playTexturedPhrase('medium', 4);
      // Occasional shimmer for leaks
      if (Math.random() < 0.3) {
        this.playShimmerRise();
      }
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

    // Track quiet periods for ghost echoes
    this.quietDuration += deltaTime;

    const now = Date.now();

    // === EVOLVING BASS ===
    // Continuous modulating bassline - always present when there's activity
    this.updateEvolvingBass(now);

    // === SHARD RAIN ===
    // Continuous ambient texture layer
    this.updateShardRain(now);

    // === VOICE CHOIR ===
    // Evolving voice-like pads
    this.updateVoiceChoir(now);

    // === PERIODIC SWELLS ===
    // Swells happen every 15-25 seconds during activity
    if (this.activity > 0.1 && now - this.lastSwellTime > 15000 + Math.random() * 10000) {
      this.playReverseSwell();
      this.lastSwellTime = now;
      console.log('[Audio] Periodic swell');
    }

    // === PERIODIC DRAMA ===
    // Every 18-30 seconds, add some dramatic element based on tension
    if (now - this.lastPeriodicDramaTime > 18000 + Math.random() * 12000) {
      this.triggerPeriodicDrama();
      this.lastPeriodicDramaTime = now;
    }

    // === QUIET BREATH ===
    // Activates when tension is low - lower threshold, faster trigger
    if (this.tension < 0.25) {
      this.lowTensionDuration += deltaTime;
    } else {
      this.lowTensionDuration = Math.max(0, this.lowTensionDuration - deltaTime * 0.5);
    }

    // Trigger quiet breath after 3 seconds of low tension (was 5), 8 sec cooldown (was 12)
    if (this.lowTensionDuration > 3 && !this.breathActive && now - this.lastBreathTime > 8000) {
      this.startQuietBreath();
    }

    // === HARMONIC GHOST ===
    // Activates during quieter periods - lower thresholds
    if (this.quietDuration > 6 && !this.ghostActive && now - this.lastGhostTime > 10000 && this.noteHistory.length >= 2) {
      this.playHarmonicGhost();
    }

    // === TENSION DRONE ===
    this.updateTensionDrone();

    // Clean old notes from history
    const cutoff = now - 60000;
    this.noteHistory = this.noteHistory.filter(n => n.time > cutoff);
  }

  private updateEvolvingBass(now: number) {
    if (this.isMobileDevice) return; // Disabled on mobile

    // Evolving bass becomes active when there's any activity
    const targetGain = this.activity > 0.05 ? 0.25 + this.tension * 0.4 : 0;
    this.evolvingBassGain.gain.rampTo(targetGain, 1.5);

    // Very slow LFO for gradual evolution
    const lfoSpeed = 0.03 + this.tension * 0.12; // Much slower
    this.evolvingBassLFO.frequency.rampTo(lfoSpeed, 2);

    // Filter range opens with tension
    const filterMax = 200 + this.tension * 600;
    this.evolvingBassLFO.max = filterMax;

    // Play bass notes less frequently - 6-12 seconds between notes
    const noteInterval = 8000 + Math.random() * 4000 - this.tension * 2000;
    if (this.activity > 0.05 && now - this.lastBassNoteTime > noteInterval) {
      this.playEvolvingBassNote();
      this.lastBassNoteTime = now;
    }
  }

  private playEvolvingBassNote() {
    try {
      // Pick a bass note from current chord
      const chord = this.currentProgression[this.chordIndex];
      const degree = chord[Math.floor(Math.random() * chord.length)];
      const octave = 0; // Always very low for rumble

      const note = this.getNote(degree, octave);

      // Longer durations with dramatic filter sweeps
      const evolutionType = Math.floor(Math.random() * 5);
      const now = Tone.now();

      // Randomize synth character
      this.evolvingBass.oscillator.type = ['sawtooth', 'square', 'triangle', 'sawtooth8', 'square4'][evolutionType] as OscillatorType;

      if (evolutionType === 0) {
        // Long slow swell (4-6 seconds)
        this.evolvingBass.triggerAttackRelease(note, '1n', now);
        this.evolvingBassFilter.frequency.setValueAtTime(60, now);
        this.evolvingBassFilter.frequency.rampTo(400 + Math.random() * 400, 2.5);
        this.evolvingBassFilter.frequency.rampTo(80, 3);
      } else if (evolutionType === 1) {
        // Reverse sweep - opens then closes
        this.evolvingBass.triggerAttackRelease(note, '2n.', now);
        this.evolvingBassFilter.frequency.setValueAtTime(800, now);
        this.evolvingBassFilter.frequency.rampTo(100, 2);
      } else if (evolutionType === 2) {
        // Double sweep with octave drop
        const note2 = this.getNote(degree - 7, 0);
        this.evolvingBass.triggerAttackRelease(note, '4n', now);
        this.evolvingBassFilter.frequency.setValueAtTime(150, now);
        this.evolvingBassFilter.frequency.rampTo(600, 0.8);
        setTimeout(() => {
          try {
            this.evolvingBass.triggerAttackRelease(note2, '1n', Tone.now());
            this.evolvingBassFilter.frequency.setValueAtTime(400, Tone.now());
            this.evolvingBassFilter.frequency.rampTo(60, 3);
          } catch (e) {}
        }, 1000);
      } else if (evolutionType === 3) {
        // Pulsing drone - filter wobbles while note sustains
        this.evolvingBass.triggerAttackRelease(note, '1m', now);
        // Manual filter wobble
        let wobbleCount = 0;
        const wobble = () => {
          if (wobbleCount++ < 6) {
            try {
              const freq = 100 + Math.sin(wobbleCount * 0.8) * 200 + 200;
              this.evolvingBassFilter.frequency.rampTo(freq, 0.5);
              setTimeout(wobble, 600 + Math.random() * 400);
            } catch (e) {}
          }
        };
        wobble();
      } else {
        // Growling slide - pitch bends down with filter
        const highNote = this.getNote(degree + 5, 1);
        this.evolvingBass.triggerAttack(highNote, now);
        this.evolvingBassFilter.frequency.setValueAtTime(500, now);
        setTimeout(() => {
          try {
            this.evolvingBass.frequency.rampTo(Tone.Frequency(note).toFrequency(), 2);
            this.evolvingBassFilter.frequency.rampTo(80, 2.5);
          } catch (e) {}
        }, 100);
        setTimeout(() => {
          try { this.evolvingBass.triggerRelease(Tone.now()); } catch (e) {}
        }, 3500);
      }

      this.recordNote(note);
    } catch (e) {}
  }

  // === SHARD RAIN METHODS ===

  private updateShardRain(now: number) {
    if (this.isMobileDevice) return; // Disabled on mobile

    // Update density based on activity (0.1 to 0.9)
    this.shardDensity = 0.1 + this.activity * 0.6 + this.tension * 0.2;

    // Update brightness based on tension
    this.shardBrightness = 0.3 + this.tension * 0.7;

    // Adjust filter based on brightness (higher = brighter)
    const targetFreq = 1500 + this.shardBrightness * 3000;
    this.shardFilter.frequency.rampTo(targetFreq, 0.5);

    // Adjust volume based on density
    const targetGain = 0.08 + this.shardDensity * 0.15;
    this.shardGain.gain.rampTo(targetGain, 0.3);

    // Calculate interval between shards based on density
    // High density = 50-150ms, low density = 300-800ms
    const baseInterval = 400 - this.shardDensity * 300;
    const variance = 200 - this.shardDensity * 150;
    const interval = baseInterval + Math.random() * variance;

    // Time to play a shard?
    if (now - this.lastShardTime > interval) {
      this.playShard();
      this.lastShardTime = now;
    }
  }

  private playShard() {
    if (!this.initialized) return;

    try {
      // Pick a note from current scale, high octaves
      const octave = 5 + Math.floor(Math.random() * 2); // Octave 5-6
      const degree = Math.floor(Math.random() * 7); // Random scale degree
      const note = this.getNote(degree, octave);

      // Very short, quiet notes
      const velocity = 0.2 + Math.random() * 0.3 * this.shardBrightness;
      this.shardSynth.triggerAttackRelease(note, '32n', Tone.now(), velocity);
    } catch (e) {}
  }

  // Burst of shards - triggered by events
  playShardBurst(count: number = 8, spread: number = 400) {
    if (!this.initialized) return;
    console.log(`[Audio] Shard burst (${count} shards)`);

    try {
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const octave = 5 + Math.floor(Math.random() * 2);
          const degree = Math.floor(Math.random() * 7);
          const note = this.getNote(degree, octave);
          const velocity = 0.3 + Math.random() * 0.4;
          this.shardSynth.triggerAttackRelease(note, '16n', Tone.now(), velocity);
        }, Math.random() * spread);
      }
    } catch (e) {}
  }

  // Cascade of shards - descending pattern
  playShardCascade() {
    if (!this.initialized) return;
    console.log('[Audio] Shard cascade');

    try {
      const degrees = [7, 6, 5, 4, 3, 2, 1, 0, -1, -2];
      degrees.forEach((deg, i) => {
        setTimeout(() => {
          const octave = 6 - Math.floor(i / 4);
          const note = this.getNote(deg, octave);
          const velocity = 0.4 - i * 0.03;
          this.shardSynth.triggerAttackRelease(note, '16n', Tone.now(), velocity);
        }, i * 60);
      });
    } catch (e) {}
  }

  // Shimmer cluster - simultaneous high notes
  playShardCluster() {
    if (!this.initialized) return;
    console.log('[Audio] Shard cluster');

    try {
      const notes = [
        this.getNote(0, 6),
        this.getNote(2, 6),
        this.getNote(4, 6),
        this.getNote(7, 6),
      ];
      notes.forEach((note, i) => {
        setTimeout(() => {
          this.shardSynth.triggerAttackRelease(note, '8n', Tone.now(), 0.35);
        }, i * 30);
      });
    } catch (e) {}
  }

  // === VOICE CHOIR METHODS ===

  private updateVoiceChoir(now: number) {
    if (this.isMobileDevice) return; // Disabled on mobile

    // Voice intensity decays slowly
    this.voiceIntensity = Math.max(0, this.voiceIntensity - 0.001);

    // Update voice gains based on intensity
    const baseGain = 0.15 + this.voiceIntensity * 0.35;
    this.voiceGainLow.gain.rampTo(baseGain * 0.8, 0.5);
    this.voiceGainMid.gain.rampTo(baseGain * 0.6, 0.5);
    this.voiceGainHigh.gain.rampTo(baseGain * 0.4, 0.5);

    // Evolve formants slowly over time
    this.voicePhase += 0.0001;
    if (this.voicePhase > 1) this.voicePhase = 0;

    // Shift formants based on phase (creates vowel morphing)
    const vowelMorph = Math.sin(this.voicePhase * Math.PI * 2);
    const f1Shift = vowelMorph * 200;  // F1 shifts ±200Hz
    const f2Shift = vowelMorph * 300;  // F2 shifts ±300Hz

    this.voiceFilterLow1.frequency.rampTo(600 + f1Shift * 0.5, 2);
    this.voiceFilterLow2.frequency.rampTo(1000 + f2Shift * 0.5, 2);
    this.voiceFilterMid1.frequency.rampTo(800 + f1Shift, 2);
    this.voiceFilterMid2.frequency.rampTo(1200 + f2Shift, 2);
    this.voiceFilterHigh1.frequency.rampTo(1000 + f1Shift * 1.2, 2);
    this.voiceFilterHigh2.frequency.rampTo(1400 + f2Shift * 1.2, 2);

    // Trigger new notes periodically (every 15-25 seconds when active)
    const noteInterval = 18000 + Math.random() * 7000;
    if (this.voiceIntensity > 0.1 && now - this.lastVoiceTrigger > noteInterval) {
      this.playVoiceChord();
      this.lastVoiceTrigger = now;
    }
  }

  private playVoiceChord() {
    if (!this.initialized) return;
    console.log('[Audio] Voice chord');

    try {
      const chord = this.currentProgression[this.chordIndex];
      const root = chord[0];

      // Low voice - root, very low
      const lowNote = this.getNote(root, 2);
      this.voiceLow.triggerAttackRelease(lowNote, '2m', Tone.now());
      this.voiceActiveNotes.low = lowNote;

      // Mid voice - third or fifth
      const midDegree = chord[1] || root + 3;
      const midNote = this.getNote(midDegree, 3);
      setTimeout(() => {
        this.voiceMid.triggerAttackRelease(midNote, '2m', Tone.now());
        this.voiceActiveNotes.mid = midNote;
      }, 500);

      // High voice - fifth or seventh
      const highDegree = chord[2] || root + 7;
      const highNote = this.getNote(highDegree, 4);
      setTimeout(() => {
        this.voiceHigh.triggerAttackRelease(highNote, '2m', Tone.now());
        this.voiceActiveNotes.high = highNote;
      }, 1000);

      this.recordNote(lowNote);
    } catch (e) {}
  }

  // Trigger voice swell - called by events
  playVoiceSwell() {
    if (!this.initialized || this.isMobileDevice) return;
    console.log('[Audio] Voice swell');

    // Boost intensity
    this.voiceIntensity = Math.min(1, this.voiceIntensity + 0.3);

    // Trigger a chord if we haven't recently
    const now = Date.now();
    if (now - this.lastVoiceTrigger > 8000) {
      this.playVoiceChord();
      this.lastVoiceTrigger = now;
    }
  }

  private triggerPeriodicDrama() {
    console.log(`[Audio] Periodic drama - tension: ${this.tension.toFixed(2)}`);

    // High tension: intense effects
    if (this.tension > 0.5) {
      const choice = Math.floor(Math.random() * 6);
      switch (choice) {
        case 0:
          this.playGrowlBass();
          setTimeout(() => this.playStinger('danger'), 800);
          break;
        case 1:
          this.playEscalation();
          break;
        case 2:
          this.playGlitchBurst();
          setTimeout(() => this.playDeepThrob(), 500);
          break;
        case 3:
          this.playNoiseSweep('up');
          setTimeout(() => this.playStinger('alert'), 2000);
          break;
        case 4:
          this.playRhythmicPulse(3);
          this.playShardBurst(6, 200);
          break;
        case 5:
          this.playHarmonicShift();
          setTimeout(() => this.playShardCluster(), 300);
          break;
      }

    // Medium tension: building effects
    } else if (this.tension > 0.25) {
      const choice = Math.floor(Math.random() * 6);
      switch (choice) {
        case 0:
          this.playReverseSwell();
          setTimeout(() => this.playGrowlBass(), 1500);
          break;
        case 1:
          this.playOminousCluster();
          break;
        case 2:
          this.playCascade();
          break;
        case 3:
          this.playShimmerRise();
          this.playShardCascade();
          break;
        case 4:
          this.playNoiseSweep('down');
          setTimeout(() => this.playShardBurst(5, 300), 1500);
          break;
        case 5:
          this.playDeepThrob();
          setTimeout(() => this.playReverseSwell(), 1800);
          break;
      }

    // Low tension: atmospheric effects
    } else {
      const choice = Math.floor(Math.random() * 5);
      switch (choice) {
        case 0:
          this.playReverseSwell();
          break;
        case 1:
          this.playShimmerRise();
          break;
        case 2:
          this.playCascade();
          break;
        case 3:
          // Just a gentle harmonic wash
          const chord = [
            this.getNote(0, 3),
            this.getNote(7, 3),
            this.getNote(12, 3),
          ];
          this.padSynth.triggerAttackRelease(chord, '1m', Tone.now(), 0.35);
          break;
        case 4:
          // Gentle shard cluster
          this.playShardCluster();
          break;
      }
    }
  }

  // === ATMOSPHERIC METHODS ===

  private startQuietBreath() {
    if (this.breathActive) return;

    this.breathActive = true;
    this.lastBreathTime = Date.now();
    console.log('[Audio] Quiet Breath activated');

    try {
      // Play soft sustained chord on root - long duration
      const notes = [
        this.getNote(0, 2),
        this.getNote(4, 2),
        this.getNote(7, 2),
      ];
      this.breathSynth.triggerAttackRelease(notes, '1m', Tone.now());

      // Add a second layer slightly detuned for richness
      setTimeout(() => {
        const notes2 = [
          this.getNote(0, 3),
          this.getNote(7, 3),
        ];
        this.breathSynth.triggerAttackRelease(notes2, '2n', Tone.now(), 0.4);
      }, 2000);

      // Schedule breath release
      setTimeout(() => {
        this.breathActive = false;
      }, 10000);
    } catch (e) {}
  }

  private playGrowlBass() {
    if (!this.initialized) return;

    // 12 second cooldown between growls
    const nowMs = Date.now();
    if (nowMs - this.lastGrowlTime < 12000) return;
    this.lastGrowlTime = nowMs;

    const now = Tone.now();
    console.log('[Audio] Growl Bass triggered');

    try {
      // Randomize the growl character
      const pattern = Math.floor(Math.random() * 4);
      const rootDegree = [0, -3, -5, 3][Math.floor(Math.random() * 4)];
      const octave = Math.random() > 0.3 ? 1 : 0;

      // Vary filter sweep
      const startFreq = 60 + Math.random() * 100;
      const peakFreq = 400 + Math.random() * 800;
      const endFreq = 100 + Math.random() * 150;

      this.growlFilter.frequency.setValueAtTime(startFreq, now);
      this.growlFilter.frequency.rampTo(peakFreq, 0.15 + Math.random() * 0.2);
      this.growlFilter.frequency.rampTo(endFreq, 0.3 + Math.random() * 0.3);

      // Different patterns
      if (pattern === 0) {
        // Single growl
        const bassNote = this.getNote(rootDegree, octave);
        this.growlSynth.triggerAttackRelease(bassNote, '4n', now);
      } else if (pattern === 1) {
        // Double hit
        const note1 = this.getNote(rootDegree, octave);
        const note2 = this.getNote(rootDegree - 2, octave);
        this.growlSynth.triggerAttackRelease(note1, '8n', now);
        setTimeout(() => {
          this.growlSynth.triggerAttackRelease(note2, '8n', Tone.now());
        }, 120 + Math.random() * 80);
      } else if (pattern === 2) {
        // Slide down
        const note1 = this.getNote(rootDegree + 5, octave);
        const note2 = this.getNote(rootDegree, octave);
        this.growlSynth.triggerAttackRelease(note1, '16n', now);
        setTimeout(() => {
          this.growlSynth.triggerAttackRelease(note2, '4n', Tone.now());
        }, 80);
      } else {
        // Triplet stab
        const note = this.getNote(rootDegree, octave);
        this.growlSynth.triggerAttackRelease(note, '16n', now);
        setTimeout(() => {
          this.growlSynth.triggerAttackRelease(note, '16n', Tone.now(), 0.7);
        }, 100);
        setTimeout(() => {
          this.growlSynth.triggerAttackRelease(note, '8n', Tone.now(), 0.9);
        }, 200);
      }
    } catch (e) {}
  }

  private playReverseSwell() {
    if (!this.initialized) return;

    const now = Date.now();
    if (now - this.lastSwellTime < 8000) return; // 8 second cooldown
    this.lastSwellTime = now;

    console.log('[Audio] Reverse Swell triggered');

    try {
      // Build anticipation with rising chord
      const swellNotes = [
        this.getNote(0, 3),
        this.getNote(3, 3),
        this.getNote(7, 3),
        this.getNote(10, 3), // Add 7th for tension
      ];

      this.swellSynth.triggerAttackRelease(swellNotes, '2n', Tone.now());
    } catch (e) {}
  }

  private playHarmonicGhost() {
    if (this.noteHistory.length < 2) return;
    if (this.ghostActive) return;

    this.ghostActive = true;
    this.lastGhostTime = Date.now();
    console.log('[Audio] Harmonic Ghost activated');

    try {
      // Pick random notes from history
      const ghostNotes: string[] = [];
      const count = Math.min(4, this.noteHistory.length);

      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * this.noteHistory.length);
        ghostNotes.push(this.noteHistory[idx].note);
      }

      // Play with staggered timing
      ghostNotes.forEach((note, i) => {
        setTimeout(() => {
          try {
            // Transpose up an octave for ethereal quality
            const octave = parseInt(note.slice(-1)) + 1;
            const pitch = note.slice(0, -1);
            const transposed = pitch + Math.min(6, octave);
            this.ghostSynth.triggerAttackRelease(transposed, '2n', Tone.now(), 0.3);
          } catch (e) {}
        }, i * 800);
      });

      // Release ghost mode
      setTimeout(() => {
        this.ghostActive = false;
      }, 8000);
    } catch (e) {
      this.ghostActive = false;
    }
  }

  // Record note for ghost echoes
  private recordNote(note: string) {
    this.noteHistory.push({ note, time: Date.now() });
    this.quietDuration = 0; // Reset quiet timer on any note
  }

  // === DRAMATIC IMPACT METHODS ===

  // Deep sub-bass drop - you feel this in your chest
  playSubBassDrop() {
    if (!this.initialized) return;
    console.log('[Audio] Sub-bass drop');

    try {
      const note = this.getNote(0, 0); // Very low
      this.subBassSynth.triggerAttackRelease(note, '2n', Tone.now());

      // Add a second hit slightly delayed for weight
      setTimeout(() => {
        const note2 = this.getNote(-5, 0);
        this.subBassSynth.triggerAttackRelease(note2, '4n', Tone.now(), 0.7);
      }, 150);
    } catch (e) {}
  }

  // Riser - tension building sweep
  playRiser(duration: number = 2) {
    if (!this.initialized) return;
    console.log('[Audio] Riser triggered');

    try {
      const now = Tone.now();

      // Pitch sweep from low to high
      const startNote = this.getNote(0, 2);
      const endNote = this.getNote(0, 5);

      this.riserSynth.triggerAttack(startNote, now);
      this.riserSynth.frequency.rampTo(Tone.Frequency(endNote).toFrequency(), duration);

      // Filter opens as pitch rises
      this.riserFilter.frequency.setValueAtTime(200, now);
      this.riserFilter.frequency.rampTo(4000, duration);

      // Release after duration
      setTimeout(() => {
        this.riserSynth.triggerRelease(Tone.now());
      }, duration * 1000);
    } catch (e) {}
  }

  // Impact hit - percussive noise burst with sub-bass
  playImpactHit() {
    if (!this.initialized) return;
    console.log('[Audio] Impact hit');

    try {
      // Noise burst
      this.impactNoise.triggerAttackRelease('8n', Tone.now());

      // Sub-bass thump
      const note = this.getNote(0, 0);
      this.subBassSynth.triggerAttackRelease(note, '8n', Tone.now());

      // Growl layer
      this.playGrowlBass();
    } catch (e) {}
  }

  // Full dramatic sequence - riser into impact
  playDramaticHit() {
    if (!this.initialized) return;
    console.log('[Audio] Dramatic hit sequence');

    // Start with riser
    this.playRiser(1.5);

    // Impact at the peak
    setTimeout(() => {
      this.playImpactHit();
      this.playSubBassDrop();
    }, 1500);

    // Dissonant chord for unease
    setTimeout(() => {
      const dissonant = [
        this.getNote(0, 2),
        this.getNote(1, 2),
        this.getNote(6, 2),
      ];
      this.padSynth.triggerAttackRelease(dissonant, '1n', Tone.now(), 0.6);
    }, 1700);
  }

  // Stinger - short dramatic musical phrase
  playStinger(type: 'danger' | 'alert' | 'breach' = 'danger') {
    if (!this.initialized) return;
    console.log(`[Audio] Stinger: ${type}`);

    try {
      const now = Tone.now();

      if (type === 'danger') {
        // Descending tritones
        const notes = [
          [this.getNote(6, 4), this.getNote(0, 4)],
          [this.getNote(5, 3), this.getNote(-1, 3)],
        ];
        this.leadSynth.triggerAttackRelease(notes[0], '8n', now, 0.9);
        setTimeout(() => {
          this.leadSynth.triggerAttackRelease(notes[1], '4n', Tone.now(), 0.8);
          this.playSubBassDrop();
        }, 200);

      } else if (type === 'alert') {
        // Rising minor 2nds
        const notes = [
          this.getNote(0, 4),
          this.getNote(1, 4),
          this.getNote(0, 5),
        ];
        notes.forEach((note, i) => {
          setTimeout(() => {
            this.bellSynth.triggerAttackRelease(note, '16n', Tone.now(), 0.8);
          }, i * 100);
        });

      } else if (type === 'breach') {
        // Heavy descending power chords
        this.playImpactHit();
        setTimeout(() => {
          const chord1 = [this.getNote(0, 2), this.getNote(7, 2)];
          this.padSynth.triggerAttackRelease(chord1, '4n', Tone.now(), 0.9);
        }, 100);
        setTimeout(() => {
          const chord2 = [this.getNote(-2, 2), this.getNote(5, 2)];
          this.padSynth.triggerAttackRelease(chord2, '2n', Tone.now(), 0.8);
          this.playSubBassDrop();
        }, 400);
      }
    } catch (e) {}
  }

  // === ADDITIONAL TENSION BUILDERS ===

  // Ominous cluster - dissonant sustained chord that slowly resolves
  private playOminousCluster() {
    if (!this.initialized) return;
    console.log('[Audio] Ominous cluster');

    try {
      // Cluster of close intervals
      const cluster = [
        this.getNote(0, 3),
        this.getNote(1, 3),
        this.getNote(3, 3),
        this.getNote(6, 3),  // Tritone for tension
      ];
      this.padSynth.triggerAttackRelease(cluster, '1m', Tone.now(), 0.5);

      // Slowly resolve to consonance
      setTimeout(() => {
        const resolve = [
          this.getNote(0, 3),
          this.getNote(3, 3),
          this.getNote(7, 3),
        ];
        this.padSynth.triggerAttackRelease(resolve, '2n', Tone.now(), 0.4);
      }, 3000);
    } catch (e) {}
  }

  // Cascade - descending arpeggiated figure
  private playCascade() {
    if (!this.initialized) return;
    console.log('[Audio] Cascade');

    try {
      const degrees = [7, 5, 3, 0, -2, -5, -7];
      degrees.forEach((deg, i) => {
        setTimeout(() => {
          const note = this.getNote(deg, 3 - Math.floor(i / 3));
          this.bellSynth.triggerAttackRelease(note, '8n', Tone.now(), 0.7 - i * 0.08);
        }, i * 120);
      });

      // End with low pad
      setTimeout(() => {
        const chord = [this.getNote(0, 2), this.getNote(7, 2)];
        this.padSynth.triggerAttackRelease(chord, '2n', Tone.now(), 0.5);
      }, degrees.length * 120 + 100);
    } catch (e) {}
  }

  // Rhythmic pulse - repeating pattern that builds
  private playRhythmicPulse(duration: number = 4) {
    if (!this.initialized) return;
    console.log('[Audio] Rhythmic pulse');

    try {
      const beatInterval = 200; // ms
      const beats = Math.floor(duration * 1000 / beatInterval);
      const degrees = [0, 0, 3, 0, 5, 0, 3, 7];

      for (let i = 0; i < beats; i++) {
        setTimeout(() => {
          const deg = degrees[i % degrees.length];
          const velocity = 0.4 + (i / beats) * 0.4; // Build intensity
          const note = this.getNote(deg, 2);
          this.pluckSynth.triggerAttack(note, Tone.now());
        }, i * beatInterval);
      }

      // Climax
      setTimeout(() => {
        const chord = [
          this.getNote(0, 3),
          this.getNote(3, 3),
          this.getNote(7, 3),
        ];
        this.leadSynth.triggerAttackRelease(chord, '4n', Tone.now(), 0.8);
      }, beats * beatInterval);
    } catch (e) {}
  }

  // Tension escalation - rising sequence that doesn't resolve
  private playEscalation() {
    if (!this.initialized) return;
    console.log('[Audio] Escalation');

    try {
      // Rising chromatic tension
      const steps = [0, 1, 2, 3, 4, 5];
      steps.forEach((step, i) => {
        setTimeout(() => {
          const note = this.getNote(step, 3);
          this.leadSynth.triggerAttackRelease(note, '8n', Tone.now(), 0.6 + i * 0.06);

          // Add octave on later steps
          if (i > 2) {
            const high = this.getNote(step, 4);
            this.bellSynth.triggerAttackRelease(high, '16n', Tone.now(), 0.4);
          }
        }, i * 250);
      });

      // Leave unresolved with dissonant sustain
      setTimeout(() => {
        const unresolved = [this.getNote(5, 3), this.getNote(6, 3)];
        this.padSynth.triggerAttackRelease(unresolved, '1n', Tone.now(), 0.5);
      }, steps.length * 250);
    } catch (e) {}
  }

  // Noise sweep - filtered noise that sweeps up or down
  private playNoiseSweep(direction: 'up' | 'down' = 'up') {
    if (!this.initialized) return;
    console.log(`[Audio] Noise sweep ${direction}`);

    try {
      // Increase noise
      this.noiseGain.gain.rampTo(0.15, 0.1);

      // Sweep the master filter
      const startFreq = direction === 'up' ? 200 : 3000;
      const endFreq = direction === 'up' ? 3000 : 200;

      this.filter.frequency.setValueAtTime(startFreq, Tone.now());
      this.filter.frequency.rampTo(endFreq, 2);

      // Fade out noise
      setTimeout(() => {
        this.noiseGain.gain.rampTo(0.02, 1);
        this.filter.frequency.rampTo(1200 + this.tension * 2000, 0.5);
      }, 2000);
    } catch (e) {}
  }

  // Harmonic shift - sudden key change moment
  private playHarmonicShift() {
    if (!this.initialized) return;
    console.log('[Audio] Harmonic shift');

    try {
      // Play chord in distant key (tritone away)
      const shiftedNotes = [
        this.getNote(6, 3),  // Tritone
        this.getNote(9, 3),  // Minor 3rd above tritone
        this.getNote(13, 3), // 5th above tritone
      ];
      this.padSynth.triggerAttackRelease(shiftedNotes, '2n.', Tone.now(), 0.6);

      // Bell accent
      this.bellSynth.triggerAttackRelease(this.getNote(6, 4), '8n', Tone.now(), 0.5);

      // Return home after delay
      setTimeout(() => {
        const homeChord = [
          this.getNote(0, 3),
          this.getNote(3, 3),
          this.getNote(7, 3),
        ];
        this.padSynth.triggerAttackRelease(homeChord, '2n', Tone.now(), 0.5);
      }, 2000);
    } catch (e) {}
  }

  // Glitch burst - rapid stuttering notes
  private playGlitchBurst() {
    if (!this.initialized) return;
    console.log('[Audio] Glitch burst');

    try {
      const note = this.getNote(0, 3);
      const intervals = [50, 50, 100, 50, 50, 150, 50, 100];
      let time = 0;

      intervals.forEach((interval, i) => {
        setTimeout(() => {
          this.leadSynth.triggerAttackRelease(note, '32n', Tone.now(), 0.7 - i * 0.05);
        }, time);
        time += interval;
      });
    } catch (e) {}
  }

  // Deep throb - sub-bass pulse
  private playDeepThrob() {
    if (!this.initialized) return;
    console.log('[Audio] Deep throb');

    try {
      const note = this.getNote(0, 0);
      // Three slow pulses
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.subBassSynth.triggerAttackRelease(note, '4n', Tone.now(), 0.8 - i * 0.15);
        }, i * 600);
      }
    } catch (e) {}
  }

  // Shimmer rise - high harmonics building
  private playShimmerRise() {
    if (!this.initialized) return;
    console.log('[Audio] Shimmer rise');

    try {
      const notes = [
        this.getNote(0, 5),
        this.getNote(3, 5),
        this.getNote(7, 5),
        this.getNote(10, 5),
        this.getNote(12, 5),
      ];

      notes.forEach((note, i) => {
        setTimeout(() => {
          this.bellSynth.triggerAttackRelease(note, '2n', Tone.now(), 0.3 + i * 0.1);
        }, i * 400);
      });
    } catch (e) {}
  }

  // Update tension drone intensity based on current tension
  private updateTensionDrone() {
    if (!this.initialized) return;

    // Drone kicks in at lower tension now (was 0.4, now 0.15)
    const targetGain = this.tension > 0.15 ? (this.tension - 0.1) * 0.8 : 0;
    this.tensionDroneGain.gain.rampTo(targetGain, 0.5);

    // Start drone at lower threshold (was 0.5, now 0.2)
    if (this.tension > 0.2 && !this.tensionDrone.envelope.value) {
      const note = this.getNote(0, 1);
      this.tensionDrone.triggerAttack(note, Tone.now());
      console.log('[Audio] Tension drone started');
    } else if (this.tension < 0.1 && this.tensionDrone.envelope.value > 0) {
      this.tensionDrone.triggerRelease(Tone.now());
      console.log('[Audio] Tension drone stopped');
    }

    // LFO speed increases with tension - more noticeable modulation
    this.tensionDroneLFO.frequency.rampTo(0.08 + this.tension * 0.5, 0.5);
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
    this.breathLFO.stop();
    this.tensionDroneLFO.stop();

    this.leadSynth.dispose();
    this.padSynth.dispose();
    this.bassSynth.dispose();
    this.arpSynth.dispose();
    this.bellSynth.dispose();
    this.pluckSynth.dispose();
    this.droneSynth.dispose();
    this.noiseSynth.dispose();
    this.noiseGain.dispose();

    // Dispose atmospheric synths
    this.breathSynth.dispose();
    this.breathLFO.dispose();
    this.breathGain.dispose();
    this.growlSynth.dispose();
    this.growlFilter.dispose();
    this.growlDistortion.dispose();
    this.swellSynth.dispose();
    this.swellReverb.dispose();
    this.ghostSynth.dispose();
    this.ghostDelay.dispose();

    // Dispose dramatic impact synths
    this.subBassSynth.dispose();
    this.subBassFilter.dispose();
    this.riserSynth.dispose();
    this.riserFilter.dispose();
    this.impactNoise.dispose();
    this.impactGain.dispose();
    this.tensionDrone.dispose();
    this.tensionDroneGain.dispose();
    this.tensionDroneLFO.dispose();

    // Dispose desktop-only layers (not initialized on mobile)
    if (!this.isMobileDevice) {
      // Dispose evolving bass
      this.evolvingBassLFO.stop();
      this.evolvingBass.dispose();
      this.evolvingBassFilter.dispose();
      this.evolvingBassLFO.dispose();
      this.evolvingBassGain.dispose();

      // Dispose shard rain
      this.shardSynth.dispose();
      this.shardFilter.dispose();
      this.shardDelay.dispose();
      this.shardGain.dispose();
      this.shardReverb.dispose();

      // Dispose voice choir
      this.voiceVibratoLow.stop();
      this.voiceVibratoMid.stop();
      this.voiceVibratoHigh.stop();
      this.voiceLow.dispose();
      this.voiceMid.dispose();
      this.voiceHigh.dispose();
      this.voiceFilterLow1.dispose();
      this.voiceFilterLow2.dispose();
      this.voiceFilterMid1.dispose();
      this.voiceFilterMid2.dispose();
      this.voiceFilterHigh1.dispose();
      this.voiceFilterHigh2.dispose();
      this.voiceGainLow.dispose();
      this.voiceGainMid.dispose();
      this.voiceGainHigh.dispose();
      this.voiceVibratoLow.dispose();
      this.voiceVibratoMid.dispose();
      this.voiceVibratoHigh.dispose();
      this.voiceChorus.dispose();
      this.voiceReverb.dispose();
    }

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
