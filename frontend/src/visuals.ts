// Ghostwire Visual Engine v4
// Surveillance noir aesthetic - emergence from void

import * as THREE from 'three';
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

// === CONSTANTS ===

// Color palettes
export type PaletteKey = 'default' | 'neon' | 'noir' | 'bloodmoon' | 'ice';

interface ColorPalette {
  name: string;
  void: number;
  ambient: number;
  accent: {
    malware: number;
    ransomware: number;
    c2: number;
    honeypot: number;
    phishing: number;
    cert: number;
    bruteforce: number;
    tor: number;
    scanner: number;
    breach: number;
    hijack: number;
    bgp: number;
  };
}

const PALETTES: Record<PaletteKey, ColorPalette> = {
  default: {
    name: 'Ghostwire',
    void: 0x010504,
    ambient: 0x0a1a14,
    accent: {
      malware:    0xff1a2a,  // blood red
      ransomware: 0xff0066,  // hot pink
      c2:         0x9933ff,  // purple
      honeypot:   0xff6600,  // orange
      phishing:   0x00ccff,  // cyan
      cert:       0x6644ff,  // indigo
      bruteforce: 0xffaa00,  // amber
      tor:        0x22aa44,  // green
      scanner:    0x334455,  // muted blue-gray
      breach:     0xff0044,  // crimson
      hijack:     0xff3300,  // orange-red
      bgp:        0xcc00ff,  // magenta
    }
  },
  neon: {
    name: 'Cyberpunk',
    void: 0x0a0015,
    ambient: 0x150030,
    accent: {
      malware:    0xff00ff,  // magenta
      ransomware: 0xff0088,  // hot pink
      c2:         0x00ffff,  // cyan
      honeypot:   0xffff00,  // yellow
      phishing:   0x00ff88,  // mint
      cert:       0x8800ff,  // purple
      bruteforce: 0xff8800,  // orange
      tor:        0x00ff00,  // green
      scanner:    0x4444ff,  // blue
      breach:     0xff0044,  // red
      hijack:     0xff4400,  // orange-red
      bgp:        0xff00aa,  // pink
    }
  },
  noir: {
    name: 'Noir',
    void: 0x000000,
    ambient: 0x0a0a0a,
    accent: {
      malware:    0x00ff44,  // matrix green
      ransomware: 0x00cc33,  // darker green
      c2:         0x00aa22,  // forest green
      honeypot:   0x33ff66,  // lime
      phishing:   0x00dd55,  // emerald
      cert:       0x22cc44,  // green
      bruteforce: 0x44ff44,  // bright green
      tor:        0x00ff00,  // pure green
      scanner:    0x115522,  // dark green
      breach:     0x00ff88,  // mint green
      hijack:     0x33ff33,  // green
      bgp:        0x00ee66,  // green
    }
  },
  bloodmoon: {
    name: 'Blood Moon',
    void: 0x0a0000,
    ambient: 0x1a0505,
    accent: {
      malware:    0xff0000,  // pure red
      ransomware: 0xcc0022,  // crimson
      c2:         0x880044,  // dark red
      honeypot:   0xff2200,  // orange-red
      phishing:   0xaa0033,  // wine
      cert:       0x660022,  // maroon
      bruteforce: 0xff4400,  // red-orange
      tor:        0x990000,  // dark red
      scanner:    0x330011,  // very dark red
      breach:     0xff0033,  // bright red
      hijack:     0xdd0000,  // red
      bgp:        0xaa0044,  // dark pink
    }
  },
  ice: {
    name: 'Arctic',
    void: 0x000508,
    ambient: 0x051520,
    accent: {
      malware:    0x00aaff,  // light blue
      ransomware: 0x0088dd,  // blue
      c2:         0x00ccff,  // cyan
      honeypot:   0x44ddff,  // sky blue
      phishing:   0x00ffff,  // cyan
      cert:       0x2266cc,  // deep blue
      bruteforce: 0x66ccff,  // ice blue
      tor:        0x00ddcc,  // teal
      scanner:    0x224466,  // navy
      breach:     0x0066ff,  // electric blue
      hijack:     0x00aacc,  // turquoise
      bgp:        0x4488ff,  // bright blue
    }
  }
};

// Current active palette (mutable)
let currentPalette: PaletteKey = 'default';

// Monochrome + single accent per threat type
const ACCENT = {
  malware:    new THREE.Color(PALETTES.default.accent.malware),
  ransomware: new THREE.Color(PALETTES.default.accent.ransomware),
  c2:         new THREE.Color(PALETTES.default.accent.c2),
  honeypot:   new THREE.Color(PALETTES.default.accent.honeypot),
  phishing:   new THREE.Color(PALETTES.default.accent.phishing),
  cert:       new THREE.Color(PALETTES.default.accent.cert),
  bruteforce: new THREE.Color(PALETTES.default.accent.bruteforce),
  tor:        new THREE.Color(PALETTES.default.accent.tor),
  scanner:    new THREE.Color(PALETTES.default.accent.scanner),
  breach:     new THREE.Color(PALETTES.default.accent.breach),
  hijack:     new THREE.Color(PALETTES.default.accent.hijack),
  bgp:        new THREE.Color(PALETTES.default.accent.bgp),
};

let VOID_COLOR = PALETTES.default.void;
let AMBIENT_COLOR = PALETTES.default.ambient;

// Layer depths (back to front)
const DEPTH = {
  void: -200,
  map: -150,
  topology: -80,
  ambient: -60,
  threats: -20,
  rain: 10,
};

// Continent shapes as closed polygons for filled shadows
// Each array is [x, y] pairs normalized to [-1, 1]
const CONTINENT_SHAPES: number[][][] = [
  // North America
  [[-0.85, 0.75], [-0.7, 0.8], [-0.5, 0.78], [-0.35, 0.7], [-0.25, 0.55],
   [-0.3, 0.45], [-0.35, 0.35], [-0.5, 0.28], [-0.55, 0.22], [-0.5, 0.15],
   [-0.55, 0.3], [-0.7, 0.35], [-0.85, 0.5], [-0.9, 0.65]],
  // South America
  [[-0.45, 0.12], [-0.35, 0.05], [-0.25, -0.1], [-0.2, -0.3], [-0.22, -0.5],
   [-0.3, -0.65], [-0.38, -0.7], [-0.42, -0.55], [-0.45, -0.35], [-0.5, -0.15],
   [-0.52, 0.0], [-0.48, 0.1]],
  // Europe
  [[-0.12, 0.72], [0.0, 0.7], [0.12, 0.68], [0.2, 0.62], [0.25, 0.52],
   [0.2, 0.48], [0.1, 0.45], [-0.02, 0.48], [-0.1, 0.55], [-0.15, 0.65]],
  // Africa
  [[-0.08, 0.42], [0.05, 0.38], [0.15, 0.28], [0.22, 0.1], [0.22, -0.1],
   [0.18, -0.25], [0.08, -0.38], [-0.02, -0.35], [-0.08, -0.2], [-0.12, 0.0],
   [-0.1, 0.2], [-0.05, 0.35]],
  // Asia (main mass)
  [[0.2, 0.72], [0.4, 0.78], [0.6, 0.75], [0.75, 0.65], [0.85, 0.5],
   [0.88, 0.35], [0.8, 0.25], [0.65, 0.2], [0.5, 0.15], [0.4, 0.2],
   [0.3, 0.35], [0.22, 0.5], [0.2, 0.65]],
  // India
  [[0.42, 0.28], [0.52, 0.22], [0.55, 0.08], [0.5, -0.02], [0.42, 0.05],
   [0.38, 0.18]],
  // Australia
  [[0.6, -0.18], [0.75, -0.2], [0.85, -0.28], [0.88, -0.4], [0.82, -0.48],
   [0.68, -0.48], [0.58, -0.38], [0.55, -0.25]],
  // Japan (small)
  [[0.82, 0.45], [0.88, 0.42], [0.9, 0.35], [0.85, 0.32], [0.8, 0.38]],
  // UK/Ireland
  [[-0.08, 0.62], [-0.02, 0.65], [0.02, 0.62], [0.0, 0.58], [-0.05, 0.58]],
  // Indonesia archipelago
  [[0.58, -0.02], [0.68, -0.05], [0.75, -0.08], [0.72, -0.12], [0.62, -0.1], [0.55, -0.05]],
];

// Country to normalized position [-1, 1]
const COUNTRY_POS: Record<string, [number, number]> = {
  'US': [-0.6, 0.45], 'CA': [-0.55, 0.65], 'MX': [-0.5, 0.25],
  'BR': [-0.35, -0.25], 'AR': [-0.35, -0.55], 'CO': [-0.45, 0.05],
  'UK': [0.0, 0.6], 'DE': [0.1, 0.55], 'FR': [0.02, 0.5], 'NL': [0.05, 0.58],
  'ES': [-0.03, 0.42], 'IT': [0.12, 0.45], 'PL': [0.15, 0.55], 'UA': [0.25, 0.52],
  'RU': [0.45, 0.65], 'CN': [0.6, 0.4], 'JP': [0.8, 0.4], 'KR': [0.72, 0.4],
  'IN': [0.48, 0.2], 'PK': [0.42, 0.3], 'ID': [0.65, -0.05], 'AU': [0.75, -0.35],
  'ZA': [0.1, -0.3], 'NG': [0.05, 0.1], 'EG': [0.15, 0.3],
  'IR': [0.32, 0.35], 'SA': [0.28, 0.25], 'AE': [0.35, 0.22],
};

// Cryptographic character sets for rain
const HEX_CHARS = '0123456789abcdef';
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Short fragments
const CRYPTO_SHORT = [
  '0x', 'ff', 'de', 'ad', 'be', 'ef', 'ca', 'fe', 'ba', 'be', '00', '7f',
  '::1', '::0', '...', '###', '---', '>>>', '<<<', '|||', '&&&', '%%%',
];

// Protocol/command fragments
const CRYPTO_COMMANDS = [
  'RSA-2048', 'AES-256', 'SHA-512', 'MD5SUM', 'ECDSA', 'HMAC',
  'TCP/443', 'UDP/53', 'SYN_SENT', 'ACK_WAIT', 'FIN_WAIT', 'RST',
  'GET /', 'POST /', 'PUT /', 'DELETE', 'OPTIONS', 'CONNECT',
  'NULL', 'VOID', 'DROP', 'EXEC', 'GRANT', 'REVOKE', 'TRUNCATE',
  'chmod 777', 'sudo rm', './exploit', 'nc -lvp', 'curl -X',
  'BEGIN PGP', 'END BLOCK', '---- KEY', 'PRIVATE', 'PUBLIC',
  '[ENCRYPTED]', '[REDACTED]', '[BLOCKED]', '[DENIED]', '[ALERT]',
  'MALWARE:', 'TROJAN:', 'BACKDOOR:', 'ROOTKIT:', 'PAYLOAD:',
  'CVE-2024', 'CVE-2025', 'CRITICAL', 'WARNING', 'SEVERE',
];

// Hash-like patterns (will be generated procedurally too)
const CRYPTO_HASHES = [
  'a3f2b8c9', 'd4e5f6a7', 'b8c9d0e1', 'f2a3b4c5', '9e8d7c6b',
  'deadbeef', 'cafebabe', 'feedface', 'c0ffee00', 'badc0de0',
];

// === INTERFACES ===

// Threat metadata for info panel
interface ThreatMeta {
  ip?: string;
  domain?: string;
  url?: string;
  asn?: number;
  asName?: string;
  malware?: string;
  threat?: string;
  source: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface ThreatNode {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: string;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  intensity: number;
  connections: string[];
  country?: string;
  meta?: ThreatMeta;
  hitCount: number; // For reputation tracking - repeated sources grow larger
}

interface SignalStream {
  chars: string[];           // Characters to display along the stream
  sourceId: string;          // Source node ID
  targetId: string;          // Target node ID
  progress: number;          // 0 to 1 along the line
  speed: number;             // Units per second
  color: THREE.Color;        // Stream color
  opacity: number;           // Base opacity
  trailLength: number;       // How many chars to show trailing
  glitchOffset: number;      // Random jitter
}

interface GlitchEvent {
  type: 'tear' | 'noise' | 'flicker' | 'bar';
  intensity: number;
  duration: number;
  elapsed: number;
  y?: number;
}

interface GlitchText {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  glitchOffset: number;
}

// === SHADERS ===

const VOID_PARTICLE_VERT = `
  attribute float size;
  attribute float alpha;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float time;

  void main() {
    vAlpha = alpha;
    vColor = color;

    vec3 pos = position;
    pos.x += sin(time * 0.3 + position.z * 0.1) * 2.0;
    pos.y += cos(time * 0.2 + position.x * 0.1) * 1.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const VOID_PARTICLE_FRAG = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float fade = smoothstep(0.5, 0.0, dist);
    float glow = exp(-dist * 3.0) * 0.5;

    gl_FragColor = vec4(vColor, (fade + glow) * vAlpha);
  }
`;

const THREAT_PARTICLE_VERT = `
  attribute float size;
  attribute float alpha;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float time;
  uniform float tension;

  void main() {
    vAlpha = alpha;
    vColor = color;

    vec3 pos = position;
    float pulse = 1.0 + sin(time * 4.0 + position.x) * 0.1 * tension;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * pulse * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const THREAT_PARTICLE_FRAG = `
  varying float vAlpha;
  varying vec3 vColor;
  uniform float tension;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float core = smoothstep(0.5, 0.0, dist);
    float glow = exp(-dist * 2.5) * (0.5 + tension * 0.3);
    float halo = exp(-dist * 1.2) * 0.2;

    vec3 col = vColor * (1.0 + glow * 0.5);
    gl_FragColor = vec4(col, (core + glow + halo) * vAlpha);
  }
`;

const TOPOLOGY_VERT = `
  varying vec3 vColor;
  varying float vAlpha;
  attribute float alpha;

  void main() {
    vColor = color;
    vAlpha = alpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TOPOLOGY_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vColor, vAlpha * 0.4);
  }
`;

const POST_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const POST_FRAG = `
  uniform sampler2D tDiffuse;
  uniform float time;
  uniform float tension;
  uniform float tearY;
  uniform float tearIntensity;
  uniform float noiseIntensity;
  uniform float flickerIntensity;
  uniform float barY;
  uniform float barIntensity;
  uniform float bloomIntensity;
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Fast bloom approximation using blur samples
  vec3 sampleBloom(sampler2D tex, vec2 uv, float radius) {
    vec3 bloom = vec3(0.0);
    float total = 0.0;

    // Sample in a cross pattern for performance
    for (float i = -3.0; i <= 3.0; i += 1.0) {
      float weight = 1.0 - abs(i) / 4.0;
      bloom += texture2D(tex, uv + vec2(i * radius, 0.0)).rgb * weight;
      bloom += texture2D(tex, uv + vec2(0.0, i * radius)).rgb * weight;
      total += weight * 2.0;
    }

    return bloom / total;
  }

  void main() {
    vec2 uv = vUv;

    // Barrel distortion
    vec2 center = uv - 0.5;
    float dist = length(center);
    uv = uv + center * dist * dist * 0.03;

    // Horizontal tearing
    if (tearIntensity > 0.0) {
      float tearDist = abs(uv.y - tearY);
      if (tearDist < 0.02) {
        uv.x += (random(vec2(time, uv.y)) - 0.5) * tearIntensity * 0.1;
      }
    }

    // Rolling bar artifact
    if (barIntensity > 0.0) {
      float barDist = abs(uv.y - barY);
      if (barDist < 0.05) {
        float barEffect = 1.0 - barDist / 0.05;
        uv.x += sin(uv.y * 100.0) * barIntensity * barEffect * 0.02;
      }
    }

    // Bounds check
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Chromatic aberration (increases with tension)
    float aberration = 0.002 + tension * 0.004;
    vec4 color;
    color.r = texture2D(tDiffuse, uv + vec2(aberration, 0.0)).r;
    color.g = texture2D(tDiffuse, uv).g;
    color.b = texture2D(tDiffuse, uv - vec2(aberration, 0.0)).b;
    color.a = 1.0;

    // Bloom effect - sample blurred version and add to bright areas
    float bloomAmount = bloomIntensity * (0.3 + tension * 0.4);
    if (bloomAmount > 0.01) {
      vec3 bloom = sampleBloom(tDiffuse, uv, 0.003 + tension * 0.002);
      // Only bloom bright areas (threshold)
      float brightness = dot(bloom, vec3(0.299, 0.587, 0.114));
      float bloomMask = smoothstep(0.3, 0.8, brightness);
      color.rgb += bloom * bloomAmount * bloomMask;
    }

    // Noise injection
    if (noiseIntensity > 0.0) {
      float noise = random(uv + time) * noiseIntensity;
      color.rgb += vec3(noise) * 0.3;
    }

    // Scanlines
    float scanline = sin(uv.y * 400.0 + time * 2.0) * 0.5 + 0.5;
    color.rgb *= 1.0 - scanline * 0.08;

    // Phosphor glow (subtle green tint)
    color.g *= 1.05;

    // Vignette
    float vignette = 1.0 - dist * 0.6;
    color.rgb *= vignette;

    // Flicker
    if (flickerIntensity > 0.0) {
      color.rgb *= 1.0 - flickerIntensity * 0.5;
    }

    // Subtle film grain
    float grain = random(uv * time) * 0.02;
    color.rgb += grain;

    gl_FragColor = color;
  }
`;

// === VISUAL ENGINE ===

export class VisualEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  // Render targets
  private renderTarget: THREE.WebGLRenderTarget;
  private postScene!: THREE.Scene;
  private postCamera!: THREE.OrthographicCamera;
  private postMaterial!: THREE.ShaderMaterial;

  // World map (filled continent shadows)
  private mapMeshes: THREE.Mesh[] = [];
  private mapMaterial!: THREE.MeshBasicMaterial;
  private mapEdgeMaterial!: THREE.LineBasicMaterial;
  private regionGlows: Map<string, { mesh: THREE.Mesh; life: number }> = new Map();

  // Ambient void particles
  private ambientGeometry!: THREE.BufferGeometry;
  private ambientMaterial!: THREE.ShaderMaterial;
  private ambientPoints!: THREE.Points;
  private ambientCount = 2000;

  // Threat nodes
  private nodes: Map<string, ThreatNode> = new Map();
  private threatGeometry!: THREE.BufferGeometry;
  private threatMaterial!: THREE.ShaderMaterial;
  private threatPoints!: THREE.Points;
  private maxNodes = 500;

  // Network topology
  private topologyGeometry!: THREE.BufferGeometry;
  private topologyMaterial!: THREE.ShaderMaterial;
  private topologyLines!: THREE.LineSegments;
  private maxConnections = 2000;

  // Signal streams (2D canvas overlay)
  private streamCanvas!: HTMLCanvasElement;
  private streamCtx!: CanvasRenderingContext2D;
  private streams: SignalStream[] = [];
  private maxStreams = 200; // Increased for more visual activity
  private pendingStreamText: { text: string; color: THREE.Color }[] = [];

  // State
  private time = 0;
  private tension = 0;
  private lastEventTime = 0;
  private nodeIdCounter = 0;

  // Glitch system
  private glitchEvents: GlitchEvent[] = [];
  private glitchCooldown = 0;

  // Interaction system
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private hoveredNode: ThreatNode | null = null;
  private selectedNode: ThreatNode | null = null;
  private highlightedNodes: Set<string> = new Set();
  private nodeIndexMap: string[] = []; // Maps geometry index to node ID

  // Reputation tracking - sources that hit multiple times grow larger
  private sourceReputation: Map<string, { count: number; lastSeen: number; nodeIds: string[] }> = new Map();

  // Callbacks for UI
  private onNodeHover: ((node: ThreatNode | null) => void) | null = null;
  private onNodeSelect: ((node: ThreatNode | null) => void) | null = null;

  // Glitch text overlay system
  private glitchTexts: GlitchText[] = [];

  // Particle trail history for afterglow
  private trailHistory: Map<string, THREE.Vector3[]> = new Map();
  private trailLength = 8;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VOID_COLOR);
    this.scene.fog = new THREE.FogExp2(VOID_COLOR, 0.006);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.z = 100;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Render target for post-processing
    this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

    // Initialize layers
    this.initWorldMap();
    this.initAmbientVoid();
    this.initThreatParticles();
    this.initTopology();
    this.initSignalStreams();
    this.initPostProcessing();
    this.spawnSeedNodes();

    window.addEventListener('resize', this.onResize.bind(this));

    // Mouse interaction
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('click', this.onMouseClick.bind(this));

    // Configure raycaster for point clouds
    this.raycaster.params.Points = { threshold: 3 };
  }

  // Set callback for node hover events
  setOnNodeHover(callback: (node: ThreatNode | null) => void) {
    this.onNodeHover = callback;
  }

  // Set callback for node selection events
  setOnNodeSelect(callback: (node: ThreatNode | null) => void) {
    this.onNodeSelect = callback;
  }

  // Get available palette options
  static getAvailablePalettes(): { key: PaletteKey; name: string }[] {
    return Object.entries(PALETTES).map(([key, palette]) => ({
      key: key as PaletteKey,
      name: palette.name
    }));
  }

  // Switch color palette
  setPalette(key: PaletteKey) {
    if (!PALETTES[key]) return;

    currentPalette = key;
    const palette = PALETTES[key];

    // Update module-level colors
    VOID_COLOR = palette.void;
    AMBIENT_COLOR = palette.ambient;

    // Update ACCENT colors
    ACCENT.malware.setHex(palette.accent.malware);
    ACCENT.ransomware.setHex(palette.accent.ransomware);
    ACCENT.c2.setHex(palette.accent.c2);
    ACCENT.honeypot.setHex(palette.accent.honeypot);
    ACCENT.phishing.setHex(palette.accent.phishing);
    ACCENT.cert.setHex(palette.accent.cert);
    ACCENT.bruteforce.setHex(palette.accent.bruteforce);
    ACCENT.tor.setHex(palette.accent.tor);
    ACCENT.scanner.setHex(palette.accent.scanner);
    ACCENT.breach.setHex(palette.accent.breach);
    ACCENT.hijack.setHex(palette.accent.hijack);
    ACCENT.bgp.setHex(palette.accent.bgp);

    // Update scene background and fog
    this.scene.background = new THREE.Color(VOID_COLOR);
    (this.scene.fog as THREE.FogExp2).color.setHex(VOID_COLOR);

    // Update existing nodes with new colors
    this.updateNodeColors();

    // Update ambient void particles
    this.updateAmbientColors();
  }

  private updateNodeColors() {
    const positions = this.threatGeometry.attributes.position.array as Float32Array;
    const colors = this.threatGeometry.attributes.color.array as Float32Array;

    let i = 0;
    for (const node of this.nodes.values()) {
      // Update node's stored color
      node.color = this.getColorForType(node.type);

      // Update buffer
      colors[i * 3] = node.color.r;
      colors[i * 3 + 1] = node.color.g;
      colors[i * 3 + 2] = node.color.b;
      i++;
    }

    this.threatGeometry.attributes.color.needsUpdate = true;
  }

  private updateAmbientColors() {
    const baseColor = new THREE.Color(AMBIENT_COLOR);
    const colors = this.ambientGeometry.attributes.color.array as Float32Array;

    for (let i = 0; i < this.ambientCount; i++) {
      const variation = 0.3 + Math.random() * 0.7;
      colors[i * 3] = baseColor.r * variation;
      colors[i * 3 + 1] = baseColor.g * variation;
      colors[i * 3 + 2] = baseColor.b * variation;
    }

    this.ambientGeometry.attributes.color.needsUpdate = true;
  }

  private getColorForType(type: string): THREE.Color {
    switch (type) {
      case 'malware': return ACCENT.malware.clone();
      case 'ransomware': return ACCENT.ransomware.clone();
      case 'c2': return ACCENT.c2.clone();
      case 'honeypot': return ACCENT.honeypot.clone();
      case 'phishing': return ACCENT.phishing.clone();
      case 'cert': return ACCENT.cert.clone();
      case 'bruteforce': return ACCENT.bruteforce.clone();
      case 'tor': return ACCENT.tor.clone();
      case 'scanner': return ACCENT.scanner.clone();
      case 'breach': return ACCENT.breach.clone();
      case 'hijack': return ACCENT.hijack.clone();
      case 'bgp': return ACCENT.bgp.clone();
      default: return ACCENT.malware.clone();
    }
  }

  private onMouseMove(event: MouseEvent) {
    // Convert to normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast to find hovered node
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.threatPoints);

    if (intersects.length > 0 && intersects[0].index !== undefined) {
      const nodeId = this.nodeIndexMap[intersects[0].index];
      const node = nodeId ? this.nodes.get(nodeId) : undefined;
      if (node && node !== this.hoveredNode) {
        this.hoveredNode = node;
        this.highlightRelatedNodes(node);
        this.canvas.style.cursor = 'pointer';
        if (this.onNodeHover) this.onNodeHover(node);
      }
    } else if (this.hoveredNode) {
      this.hoveredNode = null;
      this.highlightedNodes.clear();
      this.canvas.style.cursor = 'default';
      if (this.onNodeHover) this.onNodeHover(null);
    }
  }

  private onMouseClick(event: MouseEvent) {
    if (this.hoveredNode) {
      this.selectedNode = this.selectedNode === this.hoveredNode ? null : this.hoveredNode;
      if (this.onNodeSelect) this.onNodeSelect(this.selectedNode);
    } else {
      this.selectedNode = null;
      if (this.onNodeSelect) this.onNodeSelect(null);
    }
  }

  private highlightRelatedNodes(node: ThreatNode) {
    this.highlightedNodes.clear();
    this.highlightedNodes.add(node.id);

    // Highlight nodes with same source (IP/domain)
    const sourceKey = this.getSourceKey(node);
    if (sourceKey) {
      const rep = this.sourceReputation.get(sourceKey);
      if (rep) {
        rep.nodeIds.forEach(id => this.highlightedNodes.add(id));
      }
    }

    // Highlight connected nodes
    node.connections.forEach(id => this.highlightedNodes.add(id));

    // Highlight nodes from same country
    if (node.country) {
      this.nodes.forEach((other, id) => {
        if (other.country === node.country) {
          this.highlightedNodes.add(id);
        }
      });
    }
  }

  private getSourceKey(node: ThreatNode): string | null {
    if (!node.meta) return null;
    return node.meta.ip || node.meta.domain || null;
  }

  // Get selected node for external access
  getSelectedNode(): ThreatNode | null {
    return this.selectedNode;
  }

  // Get hovered node for external access
  getHoveredNode(): ThreatNode | null {
    return this.hoveredNode;
  }

  private initWorldMap() {
    const scale = 80;
    const yScale = 0.6; // Flatten for projection feel

    // Material for filled continent shadows
    this.mapMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a1410,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });

    // Material for continent edges (subtle glow)
    this.mapEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x1a2a20,
      transparent: true,
      opacity: 0.4,
    });

    // Create filled shapes for each continent
    for (const points of CONTINENT_SHAPES) {
      const shape = new THREE.Shape();

      // Start the shape
      shape.moveTo(points[0][0] * scale, points[0][1] * scale * yScale);

      // Draw the rest of the outline
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0] * scale, points[i][1] * scale * yScale);
      }

      // Close the shape
      shape.closePath();

      // Create filled mesh
      const geometry = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geometry, this.mapMaterial);
      mesh.position.z = DEPTH.map;
      this.scene.add(mesh);
      this.mapMeshes.push(mesh);

      // Create edge outline for subtle definition
      const edgePoints: THREE.Vector3[] = [];
      for (const pt of points) {
        edgePoints.push(new THREE.Vector3(pt[0] * scale, pt[1] * scale * yScale, DEPTH.map + 0.1));
      }
      edgePoints.push(edgePoints[0].clone()); // Close loop

      const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);
      const edgeLine = new THREE.Line(edgeGeometry, this.mapEdgeMaterial);
      this.scene.add(edgeLine);
    }
  }

  private initAmbientVoid() {
    const positions = new Float32Array(this.ambientCount * 3);
    const colors = new Float32Array(this.ambientCount * 3);
    const sizes = new Float32Array(this.ambientCount);
    const alphas = new Float32Array(this.ambientCount);

    const baseColor = new THREE.Color(AMBIENT_COLOR);

    for (let i = 0; i < this.ambientCount; i++) {
      // Spread across the void
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = DEPTH.ambient + Math.random() * 100;

      // Monochrome with slight variation
      const variation = 0.8 + Math.random() * 0.4;
      colors[i * 3] = baseColor.r * variation;
      colors[i * 3 + 1] = baseColor.g * variation;
      colors[i * 3 + 2] = baseColor.b * variation;

      sizes[i] = 0.3 + Math.random() * 1.2;
      alphas[i] = 0.1 + Math.random() * 0.3;
    }

    this.ambientGeometry = new THREE.BufferGeometry();
    this.ambientGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.ambientGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.ambientGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.ambientGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    this.ambientMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: VOID_PARTICLE_VERT,
      fragmentShader: VOID_PARTICLE_FRAG,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.ambientPoints = new THREE.Points(this.ambientGeometry, this.ambientMaterial);
    this.scene.add(this.ambientPoints);
  }

  private initThreatParticles() {
    const positions = new Float32Array(this.maxNodes * 3);
    const colors = new Float32Array(this.maxNodes * 3);
    const sizes = new Float32Array(this.maxNodes);
    const alphas = new Float32Array(this.maxNodes);

    this.threatGeometry = new THREE.BufferGeometry();
    this.threatGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.threatGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.threatGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.threatGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    this.threatMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tension: { value: 0 },
      },
      vertexShader: THREAT_PARTICLE_VERT,
      fragmentShader: THREAT_PARTICLE_FRAG,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.threatPoints = new THREE.Points(this.threatGeometry, this.threatMaterial);
    this.scene.add(this.threatPoints);
  }

  private initTopology() {
    const positions = new Float32Array(this.maxConnections * 6);
    const colors = new Float32Array(this.maxConnections * 6);
    const alphas = new Float32Array(this.maxConnections * 2);

    this.topologyGeometry = new THREE.BufferGeometry();
    this.topologyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.topologyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.topologyGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    this.topologyMaterial = new THREE.ShaderMaterial({
      vertexShader: TOPOLOGY_VERT,
      fragmentShader: TOPOLOGY_FRAG,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.topologyLines = new THREE.LineSegments(this.topologyGeometry, this.topologyMaterial);
    this.scene.add(this.topologyLines);
  }

  private initSignalStreams() {
    this.streamCanvas = document.createElement('canvas');
    this.streamCanvas.id = 'signal-streams';
    this.streamCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
    `;
    this.canvas.parentElement?.appendChild(this.streamCanvas);
    this.streamCtx = this.streamCanvas.getContext('2d')!;
    this.streamCanvas.width = window.innerWidth;
    this.streamCanvas.height = window.innerHeight;
  }

  private initPostProcessing() {
    this.postMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        time: { value: 0 },
        tension: { value: 0 },
        tearY: { value: 0 },
        tearIntensity: { value: 0 },
        noiseIntensity: { value: 0 },
        flickerIntensity: { value: 0 },
        barY: { value: 0 },
        barIntensity: { value: 0 },
        bloomIntensity: { value: 0.6 },
      },
      vertexShader: POST_VERT,
      fragmentShader: POST_FRAG,
    });

    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial);
    this.postScene.add(quad);
  }

  // Spawn initial infrastructure nodes so visualization isn't empty
  private spawnSeedNodes() {
    const types: Array<keyof typeof ACCENT> = ['scanner', 'honeypot', 'c2', 'malware', 'tor'];

    // Spawn seed nodes across the scene
    for (let i = 0; i < 25; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const color = ACCENT[type];

      this.createNode(type, color, {
        count: 2,
        size: 1.5,
        life: 30 + Math.random() * 20, // Long-lived seed nodes
        intensity: 0.8,
      });
    }

    // Initial tension for visual activity
    this.tension = 0.3;
  }

  private onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderTarget.setSize(w, h);
    this.streamCanvas.width = w;
    this.streamCanvas.height = h;
  }

  // === NODE MANAGEMENT ===

  private createNode(
    type: string,
    color: THREE.Color,
    opts: {
      country?: string;
      size?: number;
      life?: number;
      intensity?: number;
      count?: number;
      meta?: ThreatMeta;
    } = {}
  ): ThreatNode[] {
    const created: ThreatNode[] = [];
    const count = opts.count || 1;

    // Track source reputation for repeated attacks
    let hitCount = 1;
    let sourceKey: string | null = null;
    if (opts.meta) {
      sourceKey = opts.meta.ip || opts.meta.domain || null;
      if (sourceKey) {
        const existing = this.sourceReputation.get(sourceKey);
        if (existing) {
          existing.count++;
          existing.lastSeen = Date.now();
          hitCount = existing.count;
        } else {
          this.sourceReputation.set(sourceKey, { count: 1, lastSeen: Date.now(), nodeIds: [] });
        }
      }
    }

    // Size boost for repeated sources (logarithmic scaling)
    const reputationBoost = Math.log2(hitCount + 1) * 0.3;

    for (let i = 0; i < count; i++) {
      if (this.nodes.size >= this.maxNodes) {
        // Remove oldest node and clean up reputation tracking
        const oldest = this.nodes.keys().next().value;
        if (oldest) {
          const oldNode = this.nodes.get(oldest);
          if (oldNode?.meta) {
            const oldKey = oldNode.meta.ip || oldNode.meta.domain;
            if (oldKey) {
              const rep = this.sourceReputation.get(oldKey);
              if (rep) {
                rep.nodeIds = rep.nodeIds.filter(id => id !== oldest);
                if (rep.nodeIds.length === 0) this.sourceReputation.delete(oldKey);
              }
            }
          }
          this.nodes.delete(oldest);
        }
      }

      const id = `node_${this.nodeIdCounter++}`;

      // Position based on country or random
      let x: number, y: number;
      if (opts.country && COUNTRY_POS[opts.country]) {
        const [nx, ny] = COUNTRY_POS[opts.country];
        x = nx * 80 + (Math.random() - 0.5) * 10;
        y = ny * 50 + (Math.random() - 0.5) * 6;
      } else {
        x = (Math.random() - 0.5) * 120;
        y = (Math.random() - 0.5) * 70;
      }

      const node: ThreatNode = {
        id,
        position: new THREE.Vector3(x, y, DEPTH.threats + Math.random() * 30),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.02
        ),
        type,
        color: color.clone(),
        life: 0,
        maxLife: opts.life || 5,
        size: (opts.size || 1.5) + reputationBoost,
        intensity: (opts.intensity || 1) + reputationBoost * 0.5,
        connections: [],
        country: opts.country,
        meta: opts.meta,
        hitCount,
      };

      this.nodes.set(id, node);
      created.push(node);

      // Track node ID in reputation
      if (sourceKey) {
        const rep = this.sourceReputation.get(sourceKey);
        if (rep) rep.nodeIds.push(id);
      }

      // Create connections to nearby nodes (cross-type allowed for more connectivity)
      this.nodes.forEach((other, otherId) => {
        if (otherId !== id) {
          const dist = node.position.distanceTo(other.position);
          // Same type connects at longer range, cross-type at shorter range
          const maxDist = other.type === type ? 80 : 50;
          const maxConns = other.type === type ? 5 : 3;
          if (dist < maxDist && node.connections.length < maxConns) {
            node.connections.push(otherId);
            // Bidirectional connection for more streams
            if (other.connections.length < maxConns && !other.connections.includes(id)) {
              other.connections.push(id);
            }
          }
        }
      });
    }

    return created;
  }

  // Queue text to be sent as a stream on the next available connection
  queueStreamText(text: string, color: THREE.Color) {
    this.pendingStreamText.push({ text, color });
  }

  // Generate random cryptographic text for ambient streams
  private generateCryptoText(): string {
    const r = Math.random();
    if (r < 0.2) {
      // Hex string
      let s = '';
      const len = 8 + Math.floor(Math.random() * 16);
      for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)];
      return s;
    } else if (r < 0.35) {
      return CRYPTO_HASHES[Math.floor(Math.random() * CRYPTO_HASHES.length)];
    } else if (r < 0.5) {
      return CRYPTO_COMMANDS[Math.floor(Math.random() * CRYPTO_COMMANDS.length)];
    } else if (r < 0.65) {
      return CRYPTO_SHORT[Math.floor(Math.random() * CRYPTO_SHORT.length)];
    } else if (r < 0.8) {
      // IP:port
      return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}:${Math.floor(Math.random() * 65535)}`;
    } else {
      // Memory address
      return `0x${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`;
    }
  }

  // Spawn a stream on a random active connection
  private spawnStream(text?: string, color?: THREE.Color) {
    if (this.streams.length >= this.maxStreams) {
      this.streams.shift();
    }

    // Find an active connection to use
    const connections: { sourceId: string; targetId: string }[] = [];
    this.nodes.forEach((node, nodeId) => {
      for (const targetId of node.connections) {
        if (this.nodes.has(targetId)) {
          connections.push({ sourceId: nodeId, targetId });
        }
      }
    });

    if (connections.length === 0) return;

    // Pick a random connection
    const conn = connections[Math.floor(Math.random() * connections.length)];
    const sourceNode = this.nodes.get(conn.sourceId);
    const targetNode = this.nodes.get(conn.targetId);
    if (!sourceNode || !targetNode) return;

    // Use provided text or generate random
    const streamText = text || this.generateCryptoText();
    const streamColor = color || sourceNode.color.clone().lerp(targetNode.color, 0.5);

    // Split text into characters
    const chars = streamText.split('');

    this.streams.push({
      chars,
      sourceId: conn.sourceId,
      targetId: conn.targetId,
      progress: 0,
      speed: 0.3 + Math.random() * 0.4 + this.tension * 0.3,
      color: streamColor,
      opacity: 0.6 + Math.random() * 0.3,
      trailLength: Math.min(chars.length, 12),
      glitchOffset: Math.random() * 1000,
    });
  }

  private triggerGlitch(type: GlitchEvent['type'], intensity: number) {
    if (this.glitchCooldown > 0) return;

    this.glitchEvents.push({
      type,
      intensity: Math.min(intensity, 1),
      duration: type === 'flicker' ? 0.05 : 0.1 + Math.random() * 0.2,
      elapsed: 0,
      y: Math.random(),
    });

    this.glitchCooldown = 0.1;
  }

  private illuminateRegion(country: string, color: THREE.Color) {
    if (!COUNTRY_POS[country]) return;

    const [nx, ny] = COUNTRY_POS[country];
    const x = nx * 80;
    const y = ny * 50;

    // Create or refresh region glow
    const existing = this.regionGlows.get(country);
    if (existing) {
      existing.life = 4; // Longer glow duration
      return;
    }

    const geometry = new THREE.CircleGeometry(12, 24); // Bigger glow
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.25, // Brighter
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, DEPTH.map + 1);
    this.scene.add(mesh);
    this.regionGlows.set(country, { mesh, life: 4 });
  }

  // === EVENT HANDLERS ===

  handleMalwareUrl(hit: URLhausHit) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.2);

    this.createNode('malware', ACCENT.malware, {
      count: 8,
      size: 2.5,
      life: 12,
      intensity: 1.8,
      meta: {
        domain: hit.host,
        url: hit.url,
        threat: hit.threat,
        source: 'URLhaus',
        timestamp: hit.dateAdded || new Date().toISOString(),
        details: { tags: hit.tags?.join(', '), status: hit.urlStatus }
      }
    });

    // Stream relevant data
    this.queueStreamText(hit.threat || 'MALWARE', ACCENT.malware);
    this.queueStreamText(hit.host, ACCENT.malware);
    this.queueStreamText(hit.url?.slice(0, 20) || 'DROP', ACCENT.malware);
    if (hit.tags?.length) {
      this.queueStreamText(hit.tags[0], ACCENT.malware);
    }

    this.triggerGlitch('noise', 0.3);
  }

  updateScannerNoise(data: GreyNoiseData) {
    const activity = Math.min(data.scannerCount / 100, 1);

    // Modulate ambient intensity
    const alphas = this.ambientGeometry.attributes.alpha.array as Float32Array;
    for (let i = 0; i < this.ambientCount; i++) {
      alphas[i] = (0.15 + Math.random() * 0.25) * (0.6 + activity * 0.4);
    }
    this.ambientGeometry.attributes.alpha.needsUpdate = true;

    // More frequent scanner nodes
    if (Math.random() < activity * 0.5) {
      this.createNode('scanner', ACCENT.scanner, { count: 2, size: 1.2, life: 15 });
    }
  }

  handleHoneypotAttack(attack: DShieldAttack) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.12);

    this.createNode('honeypot', ACCENT.honeypot, {
      country: attack.country,
      count: 5,
      size: 2,
      life: 10,
      intensity: 1.5,
      meta: {
        ip: attack.sourceIP,
        threat: attack.attackType,
        source: 'DShield',
        timestamp: attack.timestamp || new Date().toISOString(),
        details: { port: attack.targetPort, protocol: attack.protocol, reports: attack.reports }
      }
    });

    this.illuminateRegion(attack.country, ACCENT.honeypot);
    this.queueStreamText(`PORT:${attack.targetPort}`, ACCENT.honeypot);
    this.queueStreamText(attack.sourceIP || attack.country, ACCENT.honeypot);
    this.queueStreamText(attack.attackType || 'PROBE', ACCENT.honeypot);
  }

  handleBotnetC2(c2: FeodoC2) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.25);

    this.createNode('c2', ACCENT.c2, {
      country: c2.country,
      count: 6,
      size: 2.2,
      life: 15,
      intensity: 1.8,
      meta: {
        ip: c2.ip,
        malware: c2.malware,
        asName: c2.asName,
        source: 'Feodo Tracker',
        timestamp: c2.timestamp || new Date().toISOString(),
        details: { port: c2.port, status: c2.status, firstSeen: c2.firstSeen }
      }
    });

    this.illuminateRegion(c2.country, ACCENT.c2);

    this.queueStreamText(c2.malware || 'BOTNET', ACCENT.c2);
    this.queueStreamText(`${c2.ip}:${c2.port}`, ACCENT.c2);
    this.queueStreamText('C2_ACTIVE', ACCENT.c2);
    this.queueStreamText(c2.status?.toUpperCase() || 'ONLINE', ACCENT.c2);

    this.triggerGlitch('tear', 0.4);
  }

  handleRansomwareVictim(victim: RansomwareVictim) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.5);

    const nodeIds = this.createNode('ransomware', ACCENT.ransomware, {
      country: victim.country,
      count: 15,
      size: 3,
      life: 20,
      intensity: 2.5,
    });

    this.illuminateRegion(victim.country, ACCENT.ransomware);

    // Glitch text overlay
    this.spawnGlitchText(victim.group, ACCENT.ransomware);
    this.spawnGlitchText('ENCRYPTED', ACCENT.ransomware);

    // Heavy glitch response
    this.triggerGlitch('bar', 0.8);
    this.triggerGlitch('flicker', 1);
    this.triggerGlitch('noise', 0.6);

    // Stream victim and group data - lots of it for ransomware
    this.queueStreamText(victim.group.toUpperCase(), ACCENT.ransomware);
    this.queueStreamText(victim.victim, ACCENT.ransomware);
    this.queueStreamText('ENCRYPTED', ACCENT.ransomware);
    this.queueStreamText('DATA_EXFIL', ACCENT.ransomware);
    this.queueStreamText(victim.sector || 'TARGET', ACCENT.ransomware);
    this.queueStreamText('RANSOM_NOTE', ACCENT.ransomware);
    this.queueStreamText(victim.country || 'LEAK', ACCENT.ransomware);
  }

  handlePhishing(phish: PhishingURL) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.08);

    this.createNode('phishing', ACCENT.phishing, {
      count: 4,
      size: 1.8,
      life: 8,
      intensity: 1.3,
    });

    this.queueStreamText(phish.targetBrand || 'PHISHING', ACCENT.phishing);
    this.queueStreamText(phish.domain, ACCENT.phishing);
    this.queueStreamText('CREDENTIAL_HARVEST', ACCENT.phishing);
  }

  handleMaliciousCert(entry: SSLBlacklistEntry) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.1);

    this.createNode('cert', ACCENT.cert, {
      count: 4,
      size: 1.8,
      life: 10,
      intensity: 1.4,
    });

    this.queueStreamText(entry.malware, ACCENT.cert);
    this.queueStreamText(entry.sha1?.slice(0, 16) || 'CERT', ACCENT.cert);
    this.queueStreamText('SSL_BLACKLIST', ACCENT.cert);
  }

  handleBruteforce(attack: BruteforceAttack) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.12);

    this.createNode('bruteforce', ACCENT.bruteforce, {
      country: attack.country || undefined,
      count: 5,
      size: 1.8,
      life: 8,
      intensity: 1.5,
    });

    if (attack.country) {
      this.illuminateRegion(attack.country, ACCENT.bruteforce);
    }

    this.queueStreamText(attack.attackType || 'BRUTE', ACCENT.bruteforce);
    this.queueStreamText(attack.ip, ACCENT.bruteforce);
    this.queueStreamText('AUTH_FAIL', ACCENT.bruteforce);

    if (Math.random() > 0.7) {
      this.triggerGlitch('tear', 0.2);
    }
  }

  handleTorNode(node: TorExitNode) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.03);

    this.createNode('tor', ACCENT.tor, {
      country: node.country,
      count: 3,
      size: 1.5,
      life: 20,
      intensity: 1,
    });

    this.illuminateRegion(node.country, ACCENT.tor);

    this.queueStreamText(node.nickname || 'TORNODE', ACCENT.tor);
    this.queueStreamText('DARKWEB', ACCENT.tor);
  }

  handleBreach(breach: HIBPBreach) {
    this.lastEventTime = this.time;
    // Breaches cause high visual tension
    this.tension = Math.min(1, this.tension + 0.15);

    // Large burst of particles for data breach
    const intensity = Math.min(breach.pwnCount / 1000000, 3) + 1;
    const nodes = this.createNode('breach', ACCENT.breach, {
      count: Math.floor(8 * intensity),
      size: 2.5,
      life: 25,
      intensity: intensity,
      meta: {
        domain: breach.domain,
        threat: breach.title,
        source: 'Have I Been Pwned',
        timestamp: breach.addedDate || new Date().toISOString(),
        details: {
          pwnCount: breach.pwnCount.toLocaleString(),
          breachDate: breach.breachDate,
          dataClasses: breach.dataClasses?.slice(0, 5).join(', '),
          verified: breach.isVerified ? 'Yes' : 'No'
        }
      }
    });

    // Trigger glitch effect for breaches
    if (breach.pwnCount > 100000) {
      this.triggerGlitch('noise', 0.8);
      this.triggerGlitch('flicker', 0.6);

      // Glitch text for massive breaches
      this.spawnGlitchText('DATA BREACH', ACCENT.breach);
      if (breach.pwnCount > 1000000) {
        this.spawnGlitchText(`${Math.floor(breach.pwnCount / 1000000)}M PWNED`, ACCENT.breach);
      }
    }

    this.queueStreamText('BREACH', ACCENT.breach);
    this.queueStreamText(breach.name.toUpperCase(), ACCENT.breach);
    if (breach.pwnCount > 1000000) {
      this.queueStreamText(`${Math.floor(breach.pwnCount / 1000000)}M_PWNED`, ACCENT.breach);
    }
  }

  handleSpamhaus(drop: SpamhausDrop) {
    this.lastEventTime = this.time;
    this.tension = Math.min(1, this.tension + 0.08);

    // Network hijacks - structured, grid-like particles
    const intensity = Math.log2(drop.numAddresses) / 8; // Scale by address count
    this.createNode('hijack', ACCENT.hijack, {
      count: Math.floor(4 + intensity * 4),
      size: 2.0,
      life: 18,
      intensity: intensity,
      meta: {
        ip: drop.cidr,
        threat: 'IP Hijack',
        source: 'Spamhaus DROP',
        timestamp: drop.timestamp || new Date().toISOString(),
        details: {
          sbl: drop.sbl,
          listType: drop.listType,
          numAddresses: drop.numAddresses.toLocaleString()
        }
      }
    });

    this.queueStreamText('HIJACK', ACCENT.hijack);
    this.queueStreamText(drop.cidr, ACCENT.hijack);
    this.queueStreamText(drop.sbl, ACCENT.hijack);
  }

  handleBGPEvent(bgpEvent: BGPEvent) {
    this.lastEventTime = this.time;

    // Tension based on severity
    const tensionMap = { critical: 0.2, high: 0.12, medium: 0.06, low: 0.03 };
    this.tension = Math.min(1, this.tension + (tensionMap[bgpEvent.severity] || 0.05));

    const intensity = bgpEvent.severity === 'critical' ? 3 :
                     bgpEvent.severity === 'high' ? 2 : 1;

    const nodes = this.createNode('bgp', ACCENT.bgp, {
      count: Math.floor(5 * intensity),
      size: 2.2,
      life: 20,
      intensity: intensity,
      meta: {
        ip: bgpEvent.prefix,
        asn: bgpEvent.asn,
        asName: bgpEvent.asName,
        threat: bgpEvent.eventType,
        source: 'BGPStream',
        timestamp: bgpEvent.timestamp || new Date().toISOString(),
        details: {
          severity: bgpEvent.severity,
          description: bgpEvent.description,
          path: bgpEvent.path?.join(' → '),
          collector: bgpEvent.collector
        }
      }
    });

    // Heavy glitch for hijacks
    if (bgpEvent.eventType === 'hijack') {
      this.triggerGlitch('bar', 0.9);
      this.triggerGlitch('tear', 0.7);
      this.queueStreamText('BGP_HIJACK', ACCENT.bgp);
      this.spawnGlitchText('BGP HIJACK', ACCENT.bgp);
      this.spawnGlitchText(bgpEvent.prefix, ACCENT.bgp);
    } else if (bgpEvent.eventType === 'leak') {
      this.triggerGlitch('noise', 0.4);
      this.queueStreamText('ROUTE_LEAK', ACCENT.bgp);
    } else {
      this.queueStreamText('BGP', ACCENT.bgp);
    }

    this.queueStreamText(bgpEvent.prefix, ACCENT.bgp);
    if (bgpEvent.asName) {
      this.queueStreamText(bgpEvent.asName.toUpperCase(), ACCENT.bgp);
    }
  }

  // === UPDATE LOOP ===

  update(deltaTime: number) {
    this.time += deltaTime;
    // Slower tension decay - keeps visuals active longer
    this.tension = Math.max(0, this.tension - deltaTime * 0.05);
    this.glitchCooldown = Math.max(0, this.glitchCooldown - deltaTime);

    // Process pending stream text from events
    while (this.pendingStreamText.length > 0 && this.streams.length < this.maxStreams) {
      const pending = this.pendingStreamText.shift()!;
      this.spawnStream(pending.text, pending.color);
    }

    // Spawn ambient streams more frequently
    const baseChance = 0.15; // Higher base rate
    const spawnChance = baseChance + this.tension * 0.3;
    if (Math.random() < spawnChance && this.nodes.size > 1) {
      this.spawnStream();
      // Sometimes spawn multiple streams at once during high tension
      if (this.tension > 0.5 && Math.random() < 0.3) {
        this.spawnStream();
      }
    }

    this.updateNodes(deltaTime);
    this.updateTopology();
    this.updateRegionGlows(deltaTime);
    this.updateStreams(deltaTime);
    this.updateGlitches(deltaTime);
    this.updateAmbientTension();
    this.updateCamera();
    this.updateUniforms();
  }

  // Spawn glitch text overlay
  spawnGlitchText(text: string, color: THREE.Color) {
    this.glitchTexts.push({
      text: text.toUpperCase(),
      x: Math.random() * 0.6 + 0.2, // 20%-80% of screen width
      y: Math.random() * 0.6 + 0.2, // 20%-80% of screen height
      life: 0,
      maxLife: 0.8 + Math.random() * 0.4,
      color: `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`,
      size: 16 + Math.random() * 24,
      glitchOffset: Math.random() * 1000,
    });
  }

  private updateNodes(deltaTime: number) {
    const positions = this.threatGeometry.attributes.position.array as Float32Array;
    const colors = this.threatGeometry.attributes.color.array as Float32Array;
    const sizes = this.threatGeometry.attributes.size.array as Float32Array;
    const alphas = this.threatGeometry.attributes.alpha.array as Float32Array;

    let idx = 0;
    const toRemove: string[] = [];

    // Reset index map for this frame
    this.nodeIndexMap.length = 0;

    this.nodes.forEach((node, id) => {
      node.life += deltaTime;

      const lifeRatio = node.life / node.maxLife;

      // Vortex death effect - spiral inward in final 20% of life
      if (lifeRatio > 0.8) {
        const deathProgress = (lifeRatio - 0.8) / 0.2; // 0 to 1 during death
        const spiralSpeed = 8 + deathProgress * 20;
        const spiralRadius = (1 - deathProgress) * 5;

        // Spiral motion toward center
        node.velocity.x += Math.cos(this.time * spiralSpeed) * spiralRadius * deltaTime;
        node.velocity.y += Math.sin(this.time * spiralSpeed) * spiralRadius * deltaTime;
        node.velocity.z -= deathProgress * 2 * deltaTime; // Pull backward

        // Accelerate inward
        node.velocity.multiplyScalar(1 + deathProgress * 0.5);
      }

      if (node.life >= node.maxLife) {
        toRemove.push(id);
        this.trailHistory.delete(id); // Clean up trail
        return;
      }

      // Movement
      node.position.add(node.velocity.clone().multiplyScalar(deltaTime * 60));
      node.velocity.multiplyScalar(0.995);

      // Record trail history for afterglow
      let trail = this.trailHistory.get(id);
      if (!trail) {
        trail = [];
        this.trailHistory.set(id, trail);
      }
      trail.unshift(node.position.clone());
      if (trail.length > this.trailLength) {
        trail.pop();
      }

      // Fade in/out
      const fadeIn = Math.min(node.life * 2, 1);
      const fadeOut = 1 - lifeRatio * lifeRatio;
      let alpha = fadeIn * fadeOut * node.intensity;

      // Rapid fade during vortex death
      if (lifeRatio > 0.8) {
        const deathFade = 1 - ((lifeRatio - 0.8) / 0.2);
        alpha *= deathFade;
      }

      // Check if this node is highlighted
      const isHighlighted = this.highlightedNodes.has(node.id);
      const isSelected = this.selectedNode?.id === node.id;

      // Highlighted nodes pulse and glow
      if (isHighlighted || isSelected) {
        const highlightPulse = 0.8 + Math.sin(this.time * 6) * 0.2;
        alpha *= highlightPulse * 1.5;
      }

      if (idx < this.maxNodes) {
        positions[idx * 3] = node.position.x;
        positions[idx * 3 + 1] = node.position.y;
        positions[idx * 3 + 2] = node.position.z;

        // Brighten highlighted nodes
        const colorBoost = (isHighlighted || isSelected) ? 1.3 : 1;
        colors[idx * 3] = Math.min(node.color.r * colorBoost, 1);
        colors[idx * 3 + 1] = Math.min(node.color.g * colorBoost, 1);
        colors[idx * 3 + 2] = Math.min(node.color.b * colorBoost, 1);

        // Shrink during vortex death
        let sizeMultiplier = 1;
        if (lifeRatio > 0.8) {
          sizeMultiplier = 1 - ((lifeRatio - 0.8) / 0.2) * 0.8;
        }

        // Larger size for highlighted/selected nodes
        const sizeBoost = isSelected ? 1.8 : (isHighlighted ? 1.4 : 1);
        sizes[idx] = node.size * (0.5 + alpha * 0.5) * sizeBoost * sizeMultiplier;
        alphas[idx] = alpha;

        // Track node ID at this geometry index for raycasting
        this.nodeIndexMap[idx] = id;
        idx++;
      }
    });

    toRemove.forEach(id => this.nodes.delete(id));

    // Clear remaining slots
    for (let i = idx; i < this.maxNodes; i++) {
      positions[i * 3 + 2] = -1000;
      sizes[i] = 0;
      alphas[i] = 0;
    }

    this.threatGeometry.attributes.position.needsUpdate = true;
    this.threatGeometry.attributes.color.needsUpdate = true;
    this.threatGeometry.attributes.size.needsUpdate = true;
    this.threatGeometry.attributes.alpha.needsUpdate = true;
  }

  private updateTopology() {
    const positions = this.topologyGeometry.attributes.position.array as Float32Array;
    const colors = this.topologyGeometry.attributes.color.array as Float32Array;
    const alphas = this.topologyGeometry.attributes.alpha.array as Float32Array;

    let segIdx = 0;

    // Pulsing animation for highlighted connections
    const highlightPulse = 0.6 + Math.sin(this.time * 4) * 0.4;

    this.nodes.forEach(node => {
      if (segIdx >= this.maxConnections) return;

      const lifeRatio = node.life / node.maxLife;
      const baseAlpha = (1 - lifeRatio) * 0.3;
      const isHighlighted = this.highlightedNodes.has(node.id);

      for (const targetId of node.connections) {
        if (segIdx >= this.maxConnections) break;

        const target = this.nodes.get(targetId);
        if (!target) continue;

        const targetHighlighted = this.highlightedNodes.has(targetId);
        const bothHighlighted = isHighlighted && targetHighlighted;

        const idx = segIdx * 6;
        positions[idx] = node.position.x;
        positions[idx + 1] = node.position.y;
        positions[idx + 2] = node.position.z;
        positions[idx + 3] = target.position.x;
        positions[idx + 4] = target.position.y;
        positions[idx + 5] = target.position.z;

        // Blend colors - brighter for highlighted connections
        const blendColor = node.color.clone().lerp(target.color, 0.5);
        if (bothHighlighted) {
          // Brighten highlighted connections
          blendColor.multiplyScalar(1.5);
        }
        colors[idx] = blendColor.r;
        colors[idx + 1] = blendColor.g;
        colors[idx + 2] = blendColor.b;
        colors[idx + 3] = blendColor.r;
        colors[idx + 4] = blendColor.g;
        colors[idx + 5] = blendColor.b;

        // Pulsing alpha for highlighted connections
        const connectionAlpha = bothHighlighted
          ? baseAlpha * 3 * highlightPulse
          : baseAlpha;
        alphas[segIdx * 2] = connectionAlpha;
        alphas[segIdx * 2 + 1] = connectionAlpha;

        segIdx++;
      }
    });

    // Draw IoC relationship lines (same source IP/domain across different nodes)
    this.sourceReputation.forEach((rep, sourceKey) => {
      if (rep.nodeIds.length < 2 || segIdx >= this.maxConnections) return;

      // Connect all nodes from same source
      for (let i = 0; i < rep.nodeIds.length - 1 && segIdx < this.maxConnections; i++) {
        const nodeA = this.nodes.get(rep.nodeIds[i]);
        const nodeB = this.nodes.get(rep.nodeIds[i + 1]);
        if (!nodeA || !nodeB) continue;

        const idx = segIdx * 6;
        positions[idx] = nodeA.position.x;
        positions[idx + 1] = nodeA.position.y;
        positions[idx + 2] = nodeA.position.z;
        positions[idx + 3] = nodeB.position.x;
        positions[idx + 4] = nodeB.position.y;
        positions[idx + 5] = nodeB.position.z;

        // Bright accent color for IoC links
        const iocColor = nodeA.color.clone().lerp(nodeB.color, 0.5);
        const isHighlightedIoC = this.highlightedNodes.has(nodeA.id) || this.highlightedNodes.has(nodeB.id);

        if (isHighlightedIoC) {
          iocColor.multiplyScalar(2);
        }

        colors[idx] = iocColor.r;
        colors[idx + 1] = iocColor.g;
        colors[idx + 2] = iocColor.b;
        colors[idx + 3] = iocColor.r;
        colors[idx + 4] = iocColor.g;
        colors[idx + 5] = iocColor.b;

        // IoC lines pulse based on hit count
        const hitPulse = 0.3 + Math.sin(this.time * 3 + rep.count) * 0.2;
        const iocAlpha = isHighlightedIoC ? hitPulse * 2 : hitPulse;
        alphas[segIdx * 2] = iocAlpha;
        alphas[segIdx * 2 + 1] = iocAlpha;

        segIdx++;
      }
    });

    this.topologyGeometry.attributes.position.needsUpdate = true;
    this.topologyGeometry.attributes.color.needsUpdate = true;
    this.topologyGeometry.attributes.alpha.needsUpdate = true;
    this.topologyGeometry.setDrawRange(0, segIdx * 2);
  }

  private updateRegionGlows(deltaTime: number) {
    const toRemove: string[] = [];

    this.regionGlows.forEach((glow, country) => {
      glow.life -= deltaTime;

      if (glow.life <= 0) {
        this.scene.remove(glow.mesh);
        glow.mesh.geometry.dispose();
        (glow.mesh.material as THREE.Material).dispose();
        toRemove.push(country);
      } else {
        (glow.mesh.material as THREE.MeshBasicMaterial).opacity =
          Math.min(glow.life * 0.1, 0.15);
      }
    });

    toRemove.forEach(c => this.regionGlows.delete(c));
  }

  private updateStreams(deltaTime: number) {
    const ctx = this.streamCtx;
    const w = this.streamCanvas.width;
    const h = this.streamCanvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Helper to project 3D to screen
    const toScreen = (pos: THREE.Vector3): { x: number; y: number } | null => {
      const projected = pos.clone().project(this.camera);
      if (projected.z > 1) return null; // Behind camera
      return {
        x: (projected.x * 0.5 + 0.5) * w,
        y: (-projected.y * 0.5 + 0.5) * h,
      };
    };

    // Update and draw streams
    for (let i = this.streams.length - 1; i >= 0; i--) {
      const s = this.streams[i];

      // Update progress
      s.progress += s.speed * deltaTime;

      // Remove completed streams
      if (s.progress > 1.2) {
        this.streams.splice(i, 1);
        continue;
      }

      // Get source and target nodes
      const sourceNode = this.nodes.get(s.sourceId);
      const targetNode = this.nodes.get(s.targetId);

      // If either node is gone, remove stream
      if (!sourceNode || !targetNode) {
        this.streams.splice(i, 1);
        continue;
      }

      // Get screen positions
      const sourceScreen = toScreen(sourceNode.position);
      const targetScreen = toScreen(targetNode.position);
      if (!sourceScreen || !targetScreen) continue;

      // Calculate direction and length
      const dx = targetScreen.x - sourceScreen.x;
      const dy = targetScreen.y - sourceScreen.y;
      const lineLength = Math.sqrt(dx * dx + dy * dy);
      if (lineLength < 10) continue;

      const dirX = dx / lineLength;
      const dirY = dy / lineLength;

      // Draw each character as a trailing stream
      ctx.font = '11px "Courier New", monospace';

      for (let c = 0; c < s.trailLength && c < s.chars.length; c++) {
        // Position along line (head is at progress, trail follows)
        const charProgress = s.progress - (c * 0.03);
        if (charProgress < 0 || charProgress > 1) continue;

        // Interpolate position
        const x = sourceScreen.x + dx * charProgress;
        const y = sourceScreen.y + dy * charProgress;

        // Add subtle glitch jitter
        const jitterX = Math.sin(this.time * 20 + s.glitchOffset + c) * 1;
        const jitterY = Math.cos(this.time * 15 + s.glitchOffset + c * 2) * 0.5;

        // Fade based on position in trail (head brightest)
        const trailFade = 1 - (c / s.trailLength);
        // Fade in at start, fade out at end
        const edgeFade = Math.min(charProgress * 5, 1) * Math.min((1 - charProgress) * 3, 1);
        const alpha = s.opacity * trailFade * edgeFade;

        if (alpha < 0.05) continue;

        // Color
        const r = Math.floor(s.color.r * 255);
        const g = Math.floor(s.color.g * 255);
        const b = Math.floor(s.color.b * 255);

        // Glow effect for head character
        if (c === 0) {
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`;
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillText(s.chars[c], x + jitterX, y + jitterY);
      }
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    // Render particle trails (afterglow effect)
    this.nodes.forEach((node, id) => {
      const trail = this.trailHistory.get(id);
      if (!trail || trail.length < 2) return;

      const r = Math.floor(node.color.r * 255);
      const g = Math.floor(node.color.g * 255);
      const b = Math.floor(node.color.b * 255);

      ctx.beginPath();
      let started = false;

      for (let i = 0; i < trail.length; i++) {
        const screen = toScreen(trail[i]);
        if (!screen) continue;

        if (!started) {
          ctx.moveTo(screen.x, screen.y);
          started = true;
        } else {
          ctx.lineTo(screen.x, screen.y);
        }
      }

      if (started) {
        const alpha = (1 - node.life / node.maxLife) * 0.4;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = node.size * 0.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });

    // Render glitch text overlays
    for (let i = this.glitchTexts.length - 1; i >= 0; i--) {
      const gt = this.glitchTexts[i];
      gt.life += deltaTime;

      if (gt.life >= gt.maxLife) {
        this.glitchTexts.splice(i, 1);
        continue;
      }

      const progress = gt.life / gt.maxLife;
      const alpha = Math.sin(progress * Math.PI); // Fade in and out
      const glitch = Math.sin(this.time * 50 + gt.glitchOffset);

      // Glitchy position offset
      const offsetX = glitch * 3 * (1 - progress);
      const offsetY = Math.cos(this.time * 30 + gt.glitchOffset) * 2 * (1 - progress);

      ctx.font = `bold ${gt.size}px "Courier New", monospace`;
      ctx.fillStyle = gt.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
      ctx.shadowColor = gt.color;
      ctx.shadowBlur = 10;

      // Main text
      ctx.fillText(gt.text, gt.x * w + offsetX, gt.y * h + offsetY);

      // Glitch duplicate slightly offset (chromatic aberration effect)
      if (alpha > 0.3) {
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
        ctx.fillText(gt.text, gt.x * w + offsetX - 2, gt.y * h + offsetY);
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
        ctx.fillText(gt.text, gt.x * w + offsetX + 2, gt.y * h + offsetY);
      }

      ctx.shadowBlur = 0;
    }
  }

  private updateGlitches(deltaTime: number) {
    for (let i = this.glitchEvents.length - 1; i >= 0; i--) {
      const g = this.glitchEvents[i];
      g.elapsed += deltaTime;

      if (g.elapsed >= g.duration) {
        this.glitchEvents.splice(i, 1);
      }
    }
  }

  private updateAmbientTension() {
    // Modulate ambient void particles based on tension
    const positions = this.ambientGeometry.attributes.position.array as Float32Array;
    const colors = this.ambientGeometry.attributes.color.array as Float32Array;
    const alphas = this.ambientGeometry.attributes.alpha.array as Float32Array;
    const sizes = this.ambientGeometry.attributes.size.array as Float32Array;

    const baseColor = new THREE.Color(AMBIENT_COLOR);

    for (let i = 0; i < this.ambientCount; i++) {
      // Tension makes ambient particles more active
      const idx = i * 3;

      // Subtle position drift based on tension
      positions[idx] += Math.sin(this.time + i * 0.1) * this.tension * 0.02;
      positions[idx + 1] += Math.cos(this.time * 0.8 + i * 0.05) * this.tension * 0.015;

      // Tension affects color - shifts toward threat colors at high tension
      const tensionShift = this.tension * 0.3;
      colors[idx] = baseColor.r * (1 - tensionShift) + 0.4 * tensionShift;  // More red
      colors[idx + 1] = baseColor.g * (1 - tensionShift * 0.5);
      colors[idx + 2] = baseColor.b * (1 - tensionShift * 0.3);

      // Particles glow brighter and larger with tension
      const basePulse = Math.sin(this.time * 2 + i * 0.3) * 0.5 + 0.5;
      alphas[i] = (0.15 + basePulse * 0.1) * (1 + this.tension * 0.8);

      // Size pulsing with tension
      const baseSize = 0.3 + (i % 10) * 0.1;
      sizes[i] = baseSize * (1 + this.tension * 0.5 + basePulse * this.tension * 0.3);
    }

    this.ambientGeometry.attributes.position.needsUpdate = true;
    this.ambientGeometry.attributes.color.needsUpdate = true;
    this.ambientGeometry.attributes.alpha.needsUpdate = true;
    this.ambientGeometry.attributes.size.needsUpdate = true;
  }

  private updateCamera() {
    const t = this.time * 0.1;

    // Base camera movement
    let camX = Math.sin(t * 0.7) * 8;
    let camY = Math.cos(t * 0.5) * 5;
    let camZ = 100 + Math.sin(t * 0.3) * 6 - this.tension * 10;

    // Tension-based camera shake
    if (this.tension > 0.3) {
      const shakeIntensity = (this.tension - 0.3) * 3; // 0 to ~2.1
      const shakeFreq = this.time * 30;
      camX += Math.sin(shakeFreq) * shakeIntensity * 0.5;
      camY += Math.cos(shakeFreq * 1.3) * shakeIntensity * 0.3;
      camZ += Math.sin(shakeFreq * 0.7) * shakeIntensity * 0.2;
    }

    this.camera.position.x = camX;
    this.camera.position.y = camY;
    this.camera.position.z = camZ;
    this.camera.lookAt(0, 0, 0);

    // Tension-based fog density (thicker fog = more ominous)
    const baseFogDensity = 0.006;
    const tensionFogBoost = this.tension * 0.003;
    (this.scene.fog as THREE.FogExp2).density = baseFogDensity + tensionFogBoost;
  }

  private updateUniforms() {
    this.ambientMaterial.uniforms.time.value = this.time;
    this.threatMaterial.uniforms.time.value = this.time;
    this.threatMaterial.uniforms.tension.value = this.tension;

    // Post-processing uniforms
    const uniforms = this.postMaterial.uniforms;
    uniforms.time.value = this.time;
    uniforms.tension.value = this.tension;

    // Reset glitch uniforms
    uniforms.tearY.value = 0;
    uniforms.tearIntensity.value = 0;
    uniforms.noiseIntensity.value = 0;
    uniforms.flickerIntensity.value = 0;
    uniforms.barY.value = 0;
    uniforms.barIntensity.value = 0;

    // Apply active glitches
    for (const g of this.glitchEvents) {
      const progress = g.elapsed / g.duration;
      const intensity = g.intensity * (1 - progress);

      switch (g.type) {
        case 'tear':
          uniforms.tearY.value = g.y!;
          uniforms.tearIntensity.value = Math.max(uniforms.tearIntensity.value, intensity);
          break;
        case 'noise':
          uniforms.noiseIntensity.value = Math.max(uniforms.noiseIntensity.value, intensity);
          break;
        case 'flicker':
          uniforms.flickerIntensity.value = Math.max(uniforms.flickerIntensity.value, intensity);
          break;
        case 'bar':
          uniforms.barY.value = (g.y! + g.elapsed * 2) % 1;
          uniforms.barIntensity.value = Math.max(uniforms.barIntensity.value, intensity);
          break;
      }
    }
  }

  render() {
    // Render scene to target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // Post-process to screen
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);
  }

  getStats() {
    return {
      nodes: this.nodes.size,
      streams: this.streams.length,
      tension: this.tension,
      glitches: this.glitchEvents.length,
    };
  }

  dispose() {
    // Map meshes
    for (const mesh of this.mapMeshes) {
      mesh.geometry.dispose();
    }
    this.mapMaterial.dispose();
    this.mapEdgeMaterial.dispose();

    // Geometries
    this.ambientGeometry.dispose();
    this.threatGeometry.dispose();
    this.topologyGeometry.dispose();

    // Materials
    this.ambientMaterial.dispose();
    this.threatMaterial.dispose();
    this.topologyMaterial.dispose();
    this.postMaterial.dispose();

    // Region glows
    this.regionGlows.forEach(g => {
      g.mesh.geometry.dispose();
      (g.mesh.material as THREE.Material).dispose();
    });

    // Render target
    this.renderTarget.dispose();

    // Renderer
    this.renderer.dispose();

    // Canvas overlay
    this.streamCanvas.remove();
  }
}
