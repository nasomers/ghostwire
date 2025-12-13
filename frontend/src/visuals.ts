// Ghostwire Visual Engine v7 - Morphing Formations
// Cycles through different visual structures with smooth transitions

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
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

// === TYPES ===

interface Particle {
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  targetColor: THREE.Color;
  size: number;
  brightness: number;
  targetBrightness: number;
}

interface Formation {
  name: string;
  generate: (count: number, spread: number) => THREE.Vector3[];
  connectionStyle: 'proximity' | 'sequential' | 'radial' | 'grid' | 'none';
  connectionDistance: number;
  particleSize: number;
  cameraDistance: number;
  rotationSpeed: number;
}

interface FloatingLabel {
  element: HTMLDivElement;
  worldPos: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

interface DataFragment {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  text: string;
  color: THREE.Color;
  lifetime: number;
  maxLifetime: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  sourcePosition?: THREE.Vector3;  // For connection line
  mesh?: THREE.Mesh;               // Direct mesh reference for billboard
  connectionLine?: THREE.Line;     // Line connecting to source
}

interface TrailPoint {
  position: THREE.Vector3;
  color: THREE.Color;
  age: number;
  size: number;
}

interface DataPacket {
  startIdx: number;
  endIdx: number;
  progress: number; // 0-1
  speed: number;
  color: THREE.Color;
  size: number;
}

// Holographic HUD panel
interface HUDPanel {
  id: string;
  label: string;
  value: string | number;
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  orbitAngle: number;       // Position around the scene
  orbitRadius: number;      // Distance from center
  orbitHeight: number;      // Y offset
  driftOffset: number;      // For subtle floating motion
  pulseIntensity: number;   // Glow on update (0-1)
  lastValue: string | number;
}

// === THEMES ===

interface Theme {
  name: string;
  void: number;
  ambient: number;
  accent1: number;  // Primary threat color
  accent2: number;  // Secondary
  accent3: number;  // Tertiary
  accent4: number;  // Highlight
  rain: number;     // Data rain color
  visualizer: { hue: number; saturation: number };  // Visualizer bar colors
  bloom: number;    // Bloom intensity multiplier
}

const THEMES: Record<string, Theme> = {
  ghostwire: {
    name: 'Ghostwire',
    void: 0x030506,
    ambient: 0x1a3a4a,
    accent1: 0x00ffcc,  // Cyan
    accent2: 0xff00aa,  // Magenta
    accent3: 0x00aaff,  // Blue
    accent4: 0xffaa00,  // Orange
    rain: 0x00ff88,
    visualizer: { hue: 180, saturation: 70 },
    bloom: 1.0,
  },
  cyberpunk: {
    name: 'Cyberpunk',
    void: 0x0a0015,
    ambient: 0x2a0040,
    accent1: 0xff00ff,  // Hot magenta
    accent2: 0x00ffff,  // Cyan
    accent3: 0xff0080,  // Pink
    accent4: 0xffff00,  // Yellow
    rain: 0xff00ff,
    visualizer: { hue: 300, saturation: 100 },
    bloom: 1.4,
  },
  matrix: {
    name: 'Matrix',
    void: 0x000500,
    ambient: 0x001a00,
    accent1: 0x00ff00,  // Bright green
    accent2: 0x00cc00,  // Medium green
    accent3: 0x00ff66,  // Light green
    accent4: 0xccffcc,  // Pale green
    rain: 0x00ff00,
    visualizer: { hue: 120, saturation: 100 },
    bloom: 1.2,
  },
  bloodmoon: {
    name: 'Blood Moon',
    void: 0x080000,
    ambient: 0x200000,
    accent1: 0xff0000,  // Blood red
    accent2: 0xff3300,  // Orange-red
    accent3: 0xff0044,  // Crimson
    accent4: 0xffaa00,  // Fire orange
    rain: 0xff2200,
    visualizer: { hue: 0, saturation: 100 },
    bloom: 1.3,
  },
  arctic: {
    name: 'Arctic',
    void: 0x000810,
    ambient: 0x102030,
    accent1: 0x00ccff,  // Ice blue
    accent2: 0x88ffff,  // Pale cyan
    accent3: 0x0088ff,  // Deep blue
    accent4: 0xffffff,  // White
    rain: 0x66ccff,
    visualizer: { hue: 200, saturation: 60 },
    bloom: 1.1,
  },
  void: {
    name: 'Void',
    void: 0x000000,
    ambient: 0x080808,
    accent1: 0xffffff,  // White
    accent2: 0x888888,  // Gray
    accent3: 0xaaaaaa,  // Light gray
    accent4: 0x444444,  // Dark gray
    rain: 0x333333,
    visualizer: { hue: 0, saturation: 0 },
    bloom: 0.8,
  },
};

// Current theme (mutable)
let currentTheme: Theme = THEMES.ghostwire;

// Dynamic colors based on current theme
const THREAT_COLORS: Record<string, () => number> = {
  malware: () => currentTheme.accent1,
  ransomware: () => currentTheme.accent2,
  c2: () => currentTheme.accent3,
  honeypot: () => currentTheme.accent4,
  phishing: () => currentTheme.accent1,
  cert: () => currentTheme.accent3,
  bruteforce: () => currentTheme.accent2,
  tor: () => currentTheme.accent4,
  scanner: () => currentTheme.accent3,
  breach: () => 0xffffff,
  hijack: () => currentTheme.accent2,
  bgp: () => currentTheme.accent1,
};

const THREAT_LABELS: Record<string, string> = {
  malware: 'MALWARE',
  ransomware: 'RANSOMWARE',
  c2: 'BOTNET C2',
  honeypot: 'HONEYPOT',
  phishing: 'PHISHING',
  cert: 'BAD CERT',
  bruteforce: 'BRUTE FORCE',
  tor: 'TOR',
  scanner: 'SCANNER',
  breach: 'DATA BREACH',
  hijack: 'IP HIJACK',
  bgp: 'BGP ANOMALY',
};

// === FORMATION GENERATORS ===

const FORMATIONS: Formation[] = [
  // 1. Neural Network - clustered nodes
  {
    name: 'NEURAL NETWORK',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = spread * Math.cbrt(Math.random());
        positions.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.6,
          r * Math.cos(phi) * 0.4
        ));
      }
      return positions;
    },
    connectionStyle: 'proximity',
    connectionDistance: 40,
    particleSize: 1.5,
    cameraDistance: 160,
    rotationSpeed: 0.02,
  },

  // 2. DNA Helix - double spiral
  {
    name: 'DNA HELIX',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      const turns = 4;
      const height = spread * 2;
      for (let i = 0; i < count; i++) {
        const t = i / count;
        const angle = t * Math.PI * 2 * turns;
        const y = (t - 0.5) * height;
        const radius = spread * 0.3;
        // Alternate between two strands
        const strand = i % 2 === 0 ? 0 : Math.PI;
        positions.push(new THREE.Vector3(
          Math.cos(angle + strand) * radius,
          y,
          Math.sin(angle + strand) * radius
        ));
      }
      return positions;
    },
    connectionStyle: 'sequential',
    connectionDistance: 25,
    particleSize: 1.8,
    cameraDistance: 200,
    rotationSpeed: 0.03,
  },

  // 3. Grid Matrix - structured lattice
  {
    name: 'DATA MATRIX',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      const gridSize = Math.ceil(Math.cbrt(count));
      const spacing = spread * 2 / gridSize;
      let idx = 0;
      for (let x = 0; x < gridSize && idx < count; x++) {
        for (let y = 0; y < gridSize && idx < count; y++) {
          for (let z = 0; z < gridSize && idx < count; z++) {
            positions.push(new THREE.Vector3(
              (x - gridSize / 2) * spacing + (Math.random() - 0.5) * spacing * 0.3,
              (y - gridSize / 2) * spacing + (Math.random() - 0.5) * spacing * 0.3,
              (z - gridSize / 2) * spacing * 0.5 + (Math.random() - 0.5) * spacing * 0.2
            ));
            idx++;
          }
        }
      }
      return positions;
    },
    connectionStyle: 'grid',
    connectionDistance: 35,
    particleSize: 1.2,
    cameraDistance: 180,
    rotationSpeed: 0.01,
  },

  // 4. Sphere Shell - pulsing planet
  {
    name: 'SPHERE',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      // Fibonacci sphere distribution
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        positions.push(new THREE.Vector3(
          Math.cos(theta) * radius * spread * 0.8,
          y * spread * 0.8,
          Math.sin(theta) * radius * spread * 0.8
        ));
      }
      return positions;
    },
    connectionStyle: 'proximity',
    connectionDistance: 30,
    particleSize: 1.4,
    cameraDistance: 200,
    rotationSpeed: 0.015,
  },

  // 5. Vortex - spiraling funnel
  {
    name: 'VORTEX',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      for (let i = 0; i < count; i++) {
        const t = i / count;
        const angle = t * Math.PI * 8; // 4 full rotations
        const radius = spread * (0.1 + t * 0.9);
        const y = (t - 0.5) * spread * 1.5;
        positions.push(new THREE.Vector3(
          Math.cos(angle) * radius * 0.6,
          y,
          Math.sin(angle) * radius * 0.6
        ));
      }
      return positions;
    },
    connectionStyle: 'sequential',
    connectionDistance: 20,
    particleSize: 1.6,
    cameraDistance: 180,
    rotationSpeed: 0.04,
  },

  // 6. Ring System - concentric orbits
  {
    name: 'RING SYSTEM',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      const rings = 5;
      const particlesPerRing = Math.floor(count / rings);
      for (let ring = 0; ring < rings; ring++) {
        const radius = spread * 0.2 + (ring / rings) * spread * 0.8;
        const tilt = (ring - rings / 2) * 0.15;
        for (let i = 0; i < particlesPerRing; i++) {
          const angle = (i / particlesPerRing) * Math.PI * 2 + ring * 0.5;
          positions.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius * tilt + (Math.random() - 0.5) * 5,
            Math.sin(angle) * radius * 0.3
          ));
        }
      }
      return positions;
    },
    connectionStyle: 'none',
    connectionDistance: 0,
    particleSize: 1.3,
    cameraDistance: 200,
    rotationSpeed: 0.025,
  },

  // 7. Wave Field - undulating surface
  {
    name: 'WAVE FIELD',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      const gridSize = Math.ceil(Math.sqrt(count));
      const spacing = spread * 2 / gridSize;
      let idx = 0;
      for (let x = 0; x < gridSize && idx < count; x++) {
        for (let z = 0; z < gridSize && idx < count; z++) {
          const xPos = (x - gridSize / 2) * spacing;
          const zPos = (z - gridSize / 2) * spacing;
          const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * spread * 0.3;
          positions.push(new THREE.Vector3(xPos, y, zPos * 0.6));
          idx++;
        }
      }
      return positions;
    },
    connectionStyle: 'grid',
    connectionDistance: 30,
    particleSize: 1.4,
    cameraDistance: 180,
    rotationSpeed: 0.01,
  },

  // 8. Constellation - star field with lines
  {
    name: 'CONSTELLATION',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      // Create clusters of stars
      const clusters = 8;
      const perCluster = Math.floor(count / clusters);
      for (let c = 0; c < clusters; c++) {
        const cx = (Math.random() - 0.5) * spread * 1.5;
        const cy = (Math.random() - 0.5) * spread * 0.8;
        const cz = (Math.random() - 0.5) * spread * 0.5;
        for (let i = 0; i < perCluster; i++) {
          positions.push(new THREE.Vector3(
            cx + (Math.random() - 0.5) * spread * 0.4,
            cy + (Math.random() - 0.5) * spread * 0.3,
            cz + (Math.random() - 0.5) * spread * 0.2
          ));
        }
      }
      return positions;
    },
    connectionStyle: 'proximity',
    connectionDistance: 35,
    particleSize: 2.0,
    cameraDistance: 170,
    rotationSpeed: 0.008,
  },

  // 9. Cube - geometric solid
  {
    name: 'HYPERCUBE',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      const edgeParticles = Math.floor(count / 12); // 12 edges in a cube
      const size = spread * 0.8;

      // Define cube edges
      const corners = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ];
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // front face
        [4, 5], [5, 6], [6, 7], [7, 4], // back face
        [0, 4], [1, 5], [2, 6], [3, 7]  // connecting edges
      ];

      for (const [a, b] of edges) {
        for (let i = 0; i < edgeParticles; i++) {
          const t = i / edgeParticles;
          positions.push(new THREE.Vector3(
            (corners[a][0] * (1 - t) + corners[b][0] * t) * size / 2,
            (corners[a][1] * (1 - t) + corners[b][1] * t) * size / 2,
            (corners[a][2] * (1 - t) + corners[b][2] * t) * size / 2 * 0.6
          ));
        }
      }

      // Fill remaining with random interior points
      while (positions.length < count) {
        positions.push(new THREE.Vector3(
          (Math.random() - 0.5) * size * 0.8,
          (Math.random() - 0.5) * size * 0.8,
          (Math.random() - 0.5) * size * 0.5
        ));
      }

      return positions;
    },
    connectionStyle: 'proximity',
    connectionDistance: 25,
    particleSize: 1.5,
    cameraDistance: 170,
    rotationSpeed: 0.02,
  },

  // 10. Particle Cloud - organic swarm
  {
    name: 'PARTICLE CLOUD',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      // Multiple overlapping gaussian blobs
      const blobs = 5;
      for (let i = 0; i < count; i++) {
        const blob = i % blobs;
        const blobCenter = new THREE.Vector3(
          Math.cos(blob / blobs * Math.PI * 2) * spread * 0.3,
          Math.sin(blob / blobs * Math.PI * 2) * spread * 0.2,
          (blob / blobs - 0.5) * spread * 0.3
        );
        // Gaussian distribution around blob center
        const gaussian = () => {
          let u = 0, v = 0;
          while (u === 0) u = Math.random();
          while (v === 0) v = Math.random();
          return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        };
        positions.push(new THREE.Vector3(
          blobCenter.x + gaussian() * spread * 0.25,
          blobCenter.y + gaussian() * spread * 0.2,
          blobCenter.z + gaussian() * spread * 0.15
        ));
      }
      return positions;
    },
    connectionStyle: 'none',
    connectionDistance: 0,
    particleSize: 1.6,
    cameraDistance: 150,
    rotationSpeed: 0.012,
  },

  // 11. Living Icosahedron - breathing geometric shell
  {
    name: 'ICOSAHEDRON',
    generate: (count, spread) => {
      const positions: THREE.Vector3[] = [];
      // Icosahedron vertices + edge interpolation
      const phi = (1 + Math.sqrt(5)) / 2;
      const icoVerts = [
        [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
        [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
        [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
      ];
      // Icosahedron edges (20 faces, 30 edges)
      const edges = [
        [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
        [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
        [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
        [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
        [4, 5], [2, 11], [6, 10], [8, 7], [9, 1],
        [4, 11], [2, 10], [6, 7], [8, 1], [9, 5],
      ];
      const scale = spread * 0.65;
      // Place particles on vertices and along edges
      const particlesPerEdge = Math.floor((count - 12) / 30);
      // Vertices
      for (const v of icoVerts) {
        positions.push(new THREE.Vector3(v[0] * scale, v[1] * scale, v[2] * scale));
      }
      // Edge particles
      for (const [a, b] of edges) {
        const va = icoVerts[a];
        const vb = icoVerts[b];
        for (let i = 1; i <= particlesPerEdge; i++) {
          const t = i / (particlesPerEdge + 1);
          positions.push(new THREE.Vector3(
            (va[0] + (vb[0] - va[0]) * t) * scale,
            (va[1] + (vb[1] - va[1]) * t) * scale,
            (va[2] + (vb[2] - va[2]) * t) * scale
          ));
        }
      }
      // Fill remaining with random points inside
      while (positions.length < count) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = spread * 0.3 * Math.cbrt(Math.random());
        positions.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ));
      }
      return positions;
    },
    connectionStyle: 'proximity',
    connectionDistance: 30,
    particleSize: 1.5,
    cameraDistance: 180,
    rotationSpeed: 0.015,
  },
];

// === TRIPPY POST-PROCESSING SHADER ===

const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.003 },
    time: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float time;
    varying vec2 vUv;

    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);
      vec2 dir = normalize(center + 0.001);

      // Pulsing chromatic aberration
      float pulse = 1.0 + 0.4 * sin(time * 1.5 + dist * 8.0);
      float aberration = amount * (1.0 + dist * 3.0) * pulse;

      // Spiral distortion (subtle)
      float angle = atan(center.y, center.x);
      float spiral = sin(angle * 3.0 + time * 0.5 + dist * 6.0) * 0.002 * dist;
      vec2 spiralOffset = vec2(cos(angle), sin(angle)) * spiral;

      // Sample with offsets
      float r = texture2D(tDiffuse, vUv + dir * aberration + spiralOffset).r;
      float g = texture2D(tDiffuse, vUv + spiralOffset * 0.5).g;
      float b = texture2D(tDiffuse, vUv - dir * aberration - spiralOffset).b;

      // Scanlines with variation
      float scanline = sin(vUv.y * 600.0 + time * 2.0) * 0.03 + 1.0;

      // Subtle vignette
      float vignette = 1.0 - dist * 0.4;

      // Color shift over time (very subtle)
      float hueShift = sin(time * 0.2) * 0.05;
      r *= 1.0 + hueShift;
      b *= 1.0 - hueShift;

      gl_FragColor = vec4(
        r * scanline * vignette,
        g * scanline * vignette,
        b * scanline * vignette,
        1.0
      );
    }
  `,
};

// === MOBILE DETECTION ===

function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth < 768);
}

// === VISUAL ENGINE ===

export class VisualEngine {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private chromaticPass: ShaderPass;
  private isMobileDevice: boolean;

  // Particles
  private particles: Particle[] = [];
  private particleCount: number;
  private spread = 100;

  // Formations
  private currentFormationIndex = 0;
  private formationTimer = 0;
  private formationDuration = 45; // seconds per formation
  private transitionDuration = 5; // seconds to morph
  private isTransitioning = false;
  private transitionProgress = 0;

  // Rendering
  private particleGeometry!: THREE.BufferGeometry;
  private particleMaterial!: THREE.ShaderMaterial;
  private particlePoints!: THREE.Points;
  private lineGeometry!: THREE.BufferGeometry;
  private lineMaterial!: THREE.ShaderMaterial;
  private lineSegments!: THREE.LineSegments;

  // Labels
  private labelContainer: HTMLDivElement;
  private floatingLabels: FloatingLabel[] = [];

  // 3D Data fragments (floating text in space)
  private dataFragments: DataFragment[] = [];
  private dataFragmentMeshes: THREE.Group;
  private fragmentPool: THREE.Mesh[] = [];
  private maxFragments = 20;  // Reduced for readability

  // Particle trails
  private trailPoints: TrailPoint[] = [];
  private trailGeometry!: THREE.BufferGeometry;
  private trailMaterial!: THREE.ShaderMaterial;
  private trailPoints3D!: THREE.Points;
  private maxTrailPoints = 2000;

  // Data rain
  private rainGeometry!: THREE.BufferGeometry;
  private rainMaterial!: THREE.ShaderMaterial;
  private rainPoints!: THREE.Points;
  private rainCount = 500;

  // Glitch state
  private glitchIntensity = 0;
  private glitchTimer = 0;

  // Audio visualizer (2D bar at bottom)
  private visualizerCanvas!: HTMLCanvasElement;
  private visualizerCtx!: CanvasRenderingContext2D;
  private waveformData: Float32Array = new Float32Array(256);
  private visualizerHue = 180;
  private visualizerSaturation = 70;

  // Data Stream Rain (2D canvas behind 3D scene)
  private dataStreamCanvas!: HTMLCanvasElement;
  private dataStreamCtx!: CanvasRenderingContext2D;
  private dataStreamColumns: Array<{
    x: number;
    y: number;
    speed: number;
    chars: string[];
    length: number;
    brightness: number;
    targetBrightness: number;
  }> = [];
  private dataStreamItems = [
    // Ports
    ':22', ':23', ':25', ':53', ':80', ':110', ':143', ':443', ':445', ':993', ':995',
    ':1433', ':1521', ':3306', ':3389', ':5432', ':5900', ':6379', ':8080', ':8443', ':27017',
    // Protocols
    'SSH', 'FTP', 'SMTP', 'DNS', 'HTTP', 'HTTPS', 'SMB', 'RDP', 'MYSQL', 'MSSQL',
    'TOR', 'IRC', 'TELNET', 'REDIS', 'MONGO', 'POP3', 'IMAP', 'VNC', 'LDAP', 'NTP',
    // Threat indicators
    'SYN', 'ACK', 'RST', 'PSH', 'FIN', 'NULL', 'XMAS', 'SCAN', 'PROBE', 'FLOOD',
  ];
  private dataStreamDensity = 0.6;  // 0-1, scales with activity

  // Data packets traveling along lines
  private dataPackets: DataPacket[] = [];
  private packetGeometry!: THREE.BufferGeometry;
  private packetMaterial!: THREE.ShaderMaterial;
  private packetPoints!: THREE.Points;
  private maxPackets = 100;

  // State
  private time = 0;
  private tension = 0;
  private rotationAngle = 0;
  private dominantColor = new THREE.Color(currentTheme.void);

  // Unified breathing - shared pulse for all elements
  private globalBreathPhase = 0;
  private globalBreathScale = 1;  // Current breath scale (0.97 - 1.03 range)

  // Holographic HUD panels
  private hudPanels: HUDPanel[] = [];
  private hudGroup: THREE.Group = new THREE.Group();
  private hudStats: Record<string, string | number> = {
    threatLevel: 1,
    ransomware: 0,
    eventsPerMin: 0,
    breaches: '0',
  };

  // Living Icosahedron mesh
  private icoMesh!: THREE.LineSegments;
  private icoGeometry!: THREE.BufferGeometry;
  private icoMaterial!: THREE.LineBasicMaterial;
  private icoBasePositions!: Float32Array;
  private icoVertexDisplacement: number[] = [];
  private icoSubdivisionLevel = 0;
  private icoBreathPhase = 0;
  private icoBreathScale = 1;
  private icoTargetSubdivision = 0;
  private icoActivityAccumulator = 0;
  private icoRegionActivity: number[] = []; // Activity per vertex region

  // Morphing container - icosahedron adapts to formation
  private icoMorphTargets!: Float32Array;  // Target positions for current formation
  private icoMorphProgress = 0;            // 0-1 morph interpolation

  // Energy conduit lines - connections from icosahedron to particles
  private conduitGeometry!: THREE.BufferGeometry;
  private conduitMaterial!: THREE.LineBasicMaterial;
  private conduitLines!: THREE.LineSegments;
  private conduitMaxLines = 60;            // Max connections

  // Dissolve/reform effect
  private icoDissolveProgress = 0;         // 0 = solid, 1 = fully dissolved
  private icoDissolving = false;
  private icoReforming = false;
  private dissolvedParticles: Array<{pos: THREE.Vector3, vel: THREE.Vector3, target: THREE.Vector3}> = [];

  // Tesseract for glitch moments
  private tesseractMesh!: THREE.LineSegments;
  private tesseractGeometry!: THREE.BufferGeometry;
  private tesseractMaterial!: THREE.LineBasicMaterial;
  private tesseractRotation4D = { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 };
  private tesseractActive = false;
  private tesseractIntensity = 0;
  private tesseractDisruptionPhase = 0; // For disruption wave animation

  // Camera
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private targetCameraDistance = 160;

  // Mouse drag controls
  private isDragging = false;
  private previousMouseX = 0;
  private previousMouseY = 0;
  private cameraTheta = 0; // horizontal angle
  private cameraPhi = Math.PI / 2; // vertical angle (pi/2 = horizontal)
  private userRotationTheta = 0;
  private userRotationPhi = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isMobileDevice = isMobile();
    this.particleCount = this.isMobileDevice ? 300 : 600;
    this.maxFragments = this.isMobileDevice ? 8 : 20;  // Reduced on mobile

    // Labels
    this.labelContainer = document.createElement('div');
    this.labelContainer.id = 'threat-labels';
    this.labelContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;overflow:hidden;';
    document.body.appendChild(this.labelContainer);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(currentTheme.void);

    // Data fragment container
    this.dataFragmentMeshes = new THREE.Group();
    this.scene.add(this.dataFragmentMeshes);

    // HUD panels group
    this.scene.add(this.hudGroup);

    // Camera
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(0, 0, 160);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: this.isMobileDevice ? 'low-power' : 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.isMobileDevice ? 0.6 : 0.8,  // Reduced further
      0.2,   // Tighter radius
      0.55   // Higher threshold - only very bright things bloom
    );
    this.composer.addPass(this.bloomPass);

    this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
    this.composer.addPass(this.chromaticPass);

    // Initialize particles and rendering
    this.initParticles();
    this.initRendering();
    this.initTrails();
    this.initDataRain();
    // Data stream disabled - interfering with rendering
    // this.initDataStream();
    this.initVisualizer();
    this.initPackets();
    this.initIcosahedron();
    this.initTesseract();
    this.initHUD();

    window.addEventListener('resize', this.onResize.bind(this));

    // Mouse drag controls
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    // Touch support for mobile
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    console.log(`[Visual v7] ${this.particleCount} particles, ${FORMATIONS.length} formations, drag to rotate`);
  }

  // === MOUSE/TOUCH CONTROLS ===

  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
    this.canvas.style.cursor = 'grabbing';
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMouseX;
    const deltaY = e.clientY - this.previousMouseY;

    // Rotate camera based on drag
    this.userRotationTheta += deltaX * 0.005;
    this.userRotationPhi = Math.max(-Math.PI / 3, Math.min(Math.PI / 3,
      this.userRotationPhi + deltaY * 0.005
    ));

    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
  }

  private onMouseUp() {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.previousMouseX = e.touches[0].clientX;
      this.previousMouseY = e.touches[0].clientY;
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - this.previousMouseX;
    const deltaY = e.touches[0].clientY - this.previousMouseY;

    this.userRotationTheta += deltaX * 0.005;
    this.userRotationPhi = Math.max(-Math.PI / 3, Math.min(Math.PI / 3,
      this.userRotationPhi + deltaY * 0.005
    ));

    this.previousMouseX = e.touches[0].clientX;
    this.previousMouseY = e.touches[0].clientY;
    e.preventDefault();
  }

  private onTouchEnd() {
    this.isDragging = false;
  }

  // === INITIALIZATION ===

  private initParticles() {
    const formation = FORMATIONS[this.currentFormationIndex];
    const positions = formation.generate(this.particleCount, this.spread);

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        currentPos: positions[i].clone(),
        targetPos: positions[i].clone(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(currentTheme.ambient),
        targetColor: new THREE.Color(currentTheme.ambient),
        size: formation.particleSize,
        brightness: 0.4,
        targetBrightness: 0.4,
      });
    }
  }

  private initRendering() {
    // Particle geometry
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      positions[i * 3] = p.currentPos.x;
      positions[i * 3 + 1] = p.currentPos.y;
      positions[i * 3 + 2] = p.currentPos.z;
      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;
      sizes[i] = p.size * p.brightness;
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vPulse;
        uniform float pixelRatio;
        uniform float time;

        void main() {
          vColor = color;

          // Multi-frequency pulsing for trippy effect
          float pulse1 = sin(time * 2.5 + position.x * 0.03 + position.y * 0.02);
          float pulse2 = sin(time * 1.7 + position.z * 0.04);
          float pulse3 = sin(time * 0.8 + length(position) * 0.02);
          float pulse = 1.0 + 0.2 * pulse1 + 0.15 * pulse2 + 0.1 * pulse3;
          vPulse = pulse;

          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pulse * 14.0 * (150.0 / -mvPos.z) * pixelRatio;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vPulse;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;

          // Softer, glowier falloff
          float core = smoothstep(0.5, 0.0, d);
          float glow = pow(1.0 - d * 1.6, 2.0);
          float intensity = core * 0.8 + glow * 0.4;

          // Color boost based on pulse
          vec3 boostedColor = vColor * (1.5 + vPulse * 0.5);

          gl_FragColor = vec4(boostedColor, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particlePoints);

    // Line geometry for connections
    this.initLines();
  }

  private initLines() {
    // Pre-allocate for max possible connections
    const maxConnections = this.particleCount * 3;
    const positions = new Float32Array(maxConnections * 6);
    const colors = new Float32Array(maxConnections * 6);

    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.lineGeometry.setDrawRange(0, 0);

    this.lineMaterial = new THREE.ShaderMaterial({
      uniforms: { tension: { value: 0 } },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float tension;
        varying vec3 vColor;
        void main() {
          // Reduced brightness to prevent bloom blowout (was 1.5 + tension * 0.8)
          gl_FragColor = vec4(vColor * (0.6 + tension * 0.25), 0.2 + tension * 0.1);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.lineSegments = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.scene.add(this.lineSegments);
  }

  private initTrails() {
    const positions = new Float32Array(this.maxTrailPoints * 3);
    const colors = new Float32Array(this.maxTrailPoints * 3);
    const sizes = new Float32Array(this.maxTrailPoints);

    this.trailGeometry = new THREE.BufferGeometry();
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.trailGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.trailGeometry.setDrawRange(0, 0);

    this.trailMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = size;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 8.0 * (100.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * vAlpha * 0.6;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.trailPoints3D = new THREE.Points(this.trailGeometry, this.trailMaterial);
    this.scene.add(this.trailPoints3D);
  }

  private initDataRain() {
    const positions = new Float32Array(this.rainCount * 3);
    const chars = new Float32Array(this.rainCount);
    const speeds = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = -50 - Math.random() * 100;
      chars[i] = Math.random();
      speeds[i] = 0.5 + Math.random() * 1.5;
    }

    this.rainGeometry = new THREE.BufferGeometry();
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainGeometry.setAttribute('charIndex', new THREE.BufferAttribute(chars, 1));
    this.rainGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    this.rainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tension: { value: 0 },
        themeColor: { value: new THREE.Color(currentTheme.rain) },
      },
      vertexShader: `
        attribute float charIndex;
        attribute float speed;
        varying float vChar;
        varying float vBrightness;
        uniform float time;
        uniform float tension;

        void main() {
          vChar = charIndex;
          // Animate falling
          vec3 pos = position;
          pos.y = mod(pos.y - time * speed * 30.0, 300.0) - 150.0;

          // Brightness based on position and tension
          vBrightness = 0.15 + tension * 0.3 + sin(time * 2.0 + position.x * 0.1) * 0.1;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (3.0 + tension * 2.0) * (80.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vChar;
        varying float vBrightness;
        uniform vec3 themeColor;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.4) discard;
          // Use theme color with variation
          vec3 color = themeColor * (0.8 + vChar * 0.4);
          float alpha = (1.0 - d * 2.5) * vBrightness;
          gl_FragColor = vec4(color * vBrightness * 2.0, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.scene.add(this.rainPoints);
  }

  private initDataStream() {
    // Create 2D canvas behind the 3D scene for Matrix-style data rain
    this.dataStreamCanvas = document.createElement('canvas');
    this.dataStreamCanvas.id = 'data-stream';
    this.dataStreamCanvas.width = window.innerWidth;
    this.dataStreamCanvas.height = window.innerHeight;
    this.dataStreamCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.4;
    `;
    // Insert before the main canvas so it's behind
    document.body.insertBefore(this.dataStreamCanvas, document.body.firstChild);
    this.dataStreamCtx = this.dataStreamCanvas.getContext('2d')!;

    // Initialize columns - wider spacing for text items
    const columnWidth = 55;
    const columnCount = Math.ceil(window.innerWidth / columnWidth);

    for (let i = 0; i < columnCount; i++) {
      // Not all columns active initially
      if (Math.random() > 0.7) {
        const length = 8 + Math.floor(Math.random() * 12);
        this.dataStreamColumns.push({
          x: i * columnWidth,
          y: Math.random() * -400,  // Start above screen
          speed: 50 + Math.random() * 80,  // pixels per second
          chars: this.generateStreamItems(length),
          length: length,
          brightness: 0.3 + Math.random() * 0.4,
          targetBrightness: 0.3 + Math.random() * 0.4,
        });
      }
    }
  }

  private generateStreamItems(length: number): string[] {
    const items: string[] = [];
    for (let i = 0; i < length; i++) {
      items.push(this.dataStreamItems[Math.floor(Math.random() * this.dataStreamItems.length)]);
    }
    return items;
  }

  private initVisualizer() {
    // Create canvas for 2D audio visualizer at bottom of screen
    this.visualizerCanvas = document.createElement('canvas');
    this.visualizerCanvas.id = 'audio-visualizer';
    this.visualizerCanvas.width = window.innerWidth;
    this.visualizerCanvas.height = 50;
    this.visualizerCanvas.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 50px;
      pointer-events: none;
      z-index: 50;
      opacity: 0.8;
    `;
    document.body.appendChild(this.visualizerCanvas);
    this.visualizerCtx = this.visualizerCanvas.getContext('2d')!;
  }

  private initPackets() {
    const positions = new Float32Array(this.maxPackets * 3);
    const colors = new Float32Array(this.maxPackets * 3);
    const sizes = new Float32Array(this.maxPackets);

    this.packetGeometry = new THREE.BufferGeometry();
    this.packetGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.packetGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.packetGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.packetGeometry.setDrawRange(0, 0);

    this.packetMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vPulse;
        uniform float time;
        void main() {
          vColor = color;
          // Fast pulsing for energy feel
          float pulse = 1.0 + 0.4 * sin(time * 8.0 + position.x * 0.1);
          vPulse = pulse;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pulse * 18.0 * (100.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vPulse;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          // Bright core with glow
          float core = smoothstep(0.5, 0.0, d);
          float ring = smoothstep(0.4, 0.3, d) - smoothstep(0.3, 0.2, d);
          float intensity = core * 1.2 + ring * 0.5;
          gl_FragColor = vec4(vColor * vPulse * 1.5, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.packetPoints = new THREE.Points(this.packetGeometry, this.packetMaterial);
    this.scene.add(this.packetPoints);
  }

  // === LIVING ICOSAHEDRON ===

  private initIcosahedron() {
    // Create subdivided icosahedron wireframe
    const radius = this.spread * 0.7;
    const detail = this.icoSubdivisionLevel; // Start at 0, will increase over time

    const icoGeo = new THREE.IcosahedronGeometry(radius, detail);
    const edges = new THREE.EdgesGeometry(icoGeo);

    // Store base positions for displacement
    this.icoBasePositions = new Float32Array(edges.attributes.position.array);

    // Initialize vertex activity tracking
    const vertexCount = this.icoBasePositions.length / 3;
    this.icoVertexDisplacement = new Array(vertexCount).fill(0);
    this.icoRegionActivity = new Array(12).fill(0); // 12 icosahedron vertices = 12 regions

    // Add color attribute for reactive edges - each vertex gets its own color
    const baseColor = new THREE.Color(currentTheme.accent1);
    const colors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      colors[i * 3] = baseColor.r * 0.5;     // Start dimmer
      colors[i * 3 + 1] = baseColor.g * 0.5;
      colors[i * 3 + 2] = baseColor.b * 0.5;
    }
    edges.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material with vertex colors for reactive edges
    this.icoMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    this.icoGeometry = edges;
    this.icoMesh = new THREE.LineSegments(this.icoGeometry, this.icoMaterial);
    this.icoMesh.renderOrder = 50; // Render after particles
    this.scene.add(this.icoMesh);

    // Initialize morph targets (starts as copy of base positions)
    this.icoMorphTargets = new Float32Array(this.icoBasePositions);

    // Initialize energy conduit lines
    this.initConduitLines();

    console.log('[Visual] Icosahedron initialized with radius', radius, 'vertices:', vertexCount);
  }

  private initConduitLines() {
    // Create geometry for energy conduit lines connecting icosahedron to particles
    const positions = new Float32Array(this.conduitMaxLines * 6); // 2 points per line * 3 coords
    const colors = new Float32Array(this.conduitMaxLines * 6);    // Color per vertex

    this.conduitGeometry = new THREE.BufferGeometry();
    this.conduitGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.conduitGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.conduitGeometry.setDrawRange(0, 0);

    this.conduitMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    this.conduitLines = new THREE.LineSegments(this.conduitGeometry, this.conduitMaterial);
    this.conduitLines.renderOrder = 45;
    this.scene.add(this.conduitLines);
  }

  private initTesseract() {
    // 4D hypercube vertices (16 vertices in 4D)
    const tesseractVertices4D: [number, number, number, number][] = [];
    for (let i = 0; i < 16; i++) {
      tesseractVertices4D.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1,
      ]);
    }

    // Tesseract edges: connect vertices that differ in exactly one coordinate
    const tesseractEdges: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (tesseractVertices4D[i][k] !== tesseractVertices4D[j][k]) diff++;
        }
        if (diff === 1) tesseractEdges.push([i, j]);
      }
    }

    // Store for later projection
    (this as any).tesseractVertices4D = tesseractVertices4D;
    (this as any).tesseractEdges = tesseractEdges;

    // Create geometry (will be updated each frame when active)
    const positions = new Float32Array(tesseractEdges.length * 6); // 2 points per edge * 3 coords
    this.tesseractGeometry = new THREE.BufferGeometry();
    this.tesseractGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.tesseractMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(currentTheme.accent2),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });

    this.tesseractMesh = new THREE.LineSegments(this.tesseractGeometry, this.tesseractMaterial);
    this.tesseractMesh.scale.setScalar(this.spread * 0.7); // Larger for more visibility
    this.tesseractMesh.renderOrder = 100; // Render on top
    this.scene.add(this.tesseractMesh);
  }

  private projectTesseract() {
    // Project 4D to 3D using stereographic projection
    const vertices4D = (this as any).tesseractVertices4D as [number, number, number, number][];
    const edges = (this as any).tesseractEdges as [number, number][];
    const rot = this.tesseractRotation4D;

    // Apply 4D rotations and project to 3D
    const project4Dto3D = (v: [number, number, number, number]): THREE.Vector3 => {
      let [x, y, z, w] = v;

      // XY rotation
      const cosXY = Math.cos(rot.xy), sinXY = Math.sin(rot.xy);
      [x, y] = [x * cosXY - y * sinXY, x * sinXY + y * cosXY];

      // XZ rotation
      const cosXZ = Math.cos(rot.xz), sinXZ = Math.sin(rot.xz);
      [x, z] = [x * cosXZ - z * sinXZ, x * sinXZ + z * cosXZ];

      // XW rotation (the "4D" rotation)
      const cosXW = Math.cos(rot.xw), sinXW = Math.sin(rot.xw);
      [x, w] = [x * cosXW - w * sinXW, x * sinXW + w * cosXW];

      // YZ rotation
      const cosYZ = Math.cos(rot.yz), sinYZ = Math.sin(rot.yz);
      [y, z] = [y * cosYZ - z * sinYZ, y * sinYZ + z * cosYZ];

      // YW rotation
      const cosYW = Math.cos(rot.yw), sinYW = Math.sin(rot.yw);
      [y, w] = [y * cosYW - w * sinYW, y * sinYW + w * cosYW];

      // ZW rotation
      const cosZW = Math.cos(rot.zw), sinZW = Math.sin(rot.zw);
      [z, w] = [z * cosZW - w * sinZW, z * sinZW + w * cosZW];

      // Stereographic projection from 4D to 3D
      const distance = 3;
      const scale = distance / (distance - w);
      return new THREE.Vector3(x * scale, y * scale, z * scale);
    };

    // Update geometry
    const positions = this.tesseractGeometry.attributes.position.array as Float32Array;
    let idx = 0;
    for (const [a, b] of edges) {
      const va = project4Dto3D(vertices4D[a]);
      const vb = project4Dto3D(vertices4D[b]);
      positions[idx++] = va.x;
      positions[idx++] = va.y;
      positions[idx++] = va.z;
      positions[idx++] = vb.x;
      positions[idx++] = vb.y;
      positions[idx++] = vb.z;
    }
    this.tesseractGeometry.attributes.position.needsUpdate = true;
  }

  // === UNIFIED BREATHING ===

  private updateGlobalBreath(dt: number) {
    // Breath speed increases with tension - calm is slow, tense is fast
    const breathSpeed = 0.4 + this.tension * 1.2;
    this.globalBreathPhase += dt * breathSpeed;

    // Breath amplitude also increases with tension
    const breathAmount = 0.02 + this.tension * 0.04;
    this.globalBreathScale = 1 + Math.sin(this.globalBreathPhase) * breathAmount;
  }

  private updateIcosahedron(dt: number) {
    if (!this.icoMesh) return;

    // === DISSOLVE/REFORM EFFECT ===
    this.updateDissolveReform(dt);

    // Hide icosahedron when fully dissolved
    if (this.icoDissolveProgress > 0.8) {
      this.icoMaterial.opacity = Math.max(0, 1 - this.icoDissolveProgress * 2) * 0.6;
    }

    // Use global breath for icosahedron scale - unified with all elements
    // Add disruption shake when tesseract is active
    let scale = this.globalBreathScale;
    if (this.tesseractActive && this.tesseractIntensity > 0) {
      const shake = Math.sin(this.time * 30) * this.tesseractIntensity * 0.02;
      scale += shake;
    }
    this.icoMesh.scale.setScalar(scale);

    // Rotate slowly with the main scene
    this.icoMesh.rotation.y = this.rotationAngle * 0.5;
    this.icoMesh.rotation.x = Math.sin(this.time * 0.1) * 0.1;

    // === MORPHING ===
    // Interpolate positions toward morph targets (unless disrupted)
    if (!this.tesseractActive && !this.icoDissolving) {
      this.applyMorphing(dt);
    }

    // === TESSERACT DISRUPTION ===
    // When tesseract is active, distort icosahedron vertices
    if (this.tesseractActive && this.tesseractIntensity > 0.1) {
      this.applyIcosahedronDisruption(dt);
    }

    // Accumulate activity for subdivision growth
    this.icoActivityAccumulator += this.tension * dt * 0.1;
    if (this.icoActivityAccumulator > 20 && this.icoSubdivisionLevel < 2) {
      this.subdivideIcosahedron();
      this.icoActivityAccumulator = 0;
    }

    // Update opacity based on formation and dissolve state
    if (!this.icoDissolving && !this.icoReforming) {
      const isIcoFormation = FORMATIONS[this.currentFormationIndex]?.name === 'ICOSAHEDRON';
      const targetOpacity = isIcoFormation ? 0.85 : 0.6;
      this.icoMaterial.opacity += (targetOpacity - this.icoMaterial.opacity) * dt * 2;
    }

    // === REACTIVE EDGES ===
    this.updateReactiveEdges(dt);

    // === ENERGY CONDUIT LINES ===
    this.updateConduitLines(dt);

    // Decay region activity
    for (let i = 0; i < this.icoRegionActivity.length; i++) {
      this.icoRegionActivity[i] *= 0.98;
    }
  }

  private applyMorphing(dt: number) {
    const positions = this.icoGeometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;
    const morphSpeed = dt * 1.5; // Smooth morphing

    for (let i = 0; i < vertexCount; i++) {
      const targetX = this.icoMorphTargets[i * 3];
      const targetY = this.icoMorphTargets[i * 3 + 1];
      const targetZ = this.icoMorphTargets[i * 3 + 2];

      positions[i * 3] += (targetX - positions[i * 3]) * morphSpeed;
      positions[i * 3 + 1] += (targetY - positions[i * 3 + 1]) * morphSpeed;
      positions[i * 3 + 2] += (targetZ - positions[i * 3 + 2]) * morphSpeed;
    }

    this.icoGeometry.attributes.position.needsUpdate = true;
  }

  private updateDissolveReform(dt: number) {
    if (this.icoDissolving) {
      this.icoDissolveProgress += dt * 0.8; // Dissolve over ~1.25 seconds

      // Update dissolved particle positions
      for (const p of this.dissolvedParticles) {
        p.pos.add(p.vel.clone().multiplyScalar(dt));
        p.vel.multiplyScalar(0.95); // Damping
      }

      // Start reforming when dissolve is complete
      if (this.icoDissolveProgress >= 1) {
        this.icoDissolving = false;
        this.icoReforming = true;
        this.icoDissolveProgress = 1;

        // Set reform targets based on new morph targets
        const sampleRate = Math.max(1, Math.floor(this.icoMorphTargets.length / 3 / 30));
        let idx = 0;
        for (let i = 0; i < this.icoMorphTargets.length / 3 && idx < this.dissolvedParticles.length; i += sampleRate) {
          this.dissolvedParticles[idx].target.set(
            this.icoMorphTargets[i * 3],
            this.icoMorphTargets[i * 3 + 1],
            this.icoMorphTargets[i * 3 + 2]
          );
          idx++;
        }
      }
    }

    if (this.icoReforming) {
      this.icoDissolveProgress -= dt * 0.6; // Reform over ~1.67 seconds

      // Move dissolved particles toward targets
      for (const p of this.dissolvedParticles) {
        const dir = p.target.clone().sub(p.pos);
        p.pos.add(dir.multiplyScalar(dt * 3));
      }

      // Complete reform
      if (this.icoDissolveProgress <= 0) {
        this.icoReforming = false;
        this.icoDissolveProgress = 0;
        this.dissolvedParticles = [];
      }
    }
  }

  private updateConduitLines(dt: number) {
    if (!this.conduitGeometry) return;

    const icoPositions = this.icoGeometry.attributes.position.array as Float32Array;
    const particlePositions = this.particleGeometry.attributes.position.array as Float32Array;
    const conduitPositions = this.conduitGeometry.attributes.position.array as Float32Array;
    const conduitColors = this.conduitGeometry.attributes.color.array as Float32Array;

    const icoVertexCount = icoPositions.length / 3;
    const connectionDist = 40; // Max distance for conduit connection
    let lineCount = 0;

    const accent1 = new THREE.Color(currentTheme.accent1);
    const accent2 = new THREE.Color(currentTheme.accent2);

    // Sample icosahedron vertices (every 4th to reduce line count)
    for (let v = 0; v < icoVertexCount && lineCount < this.conduitMaxLines; v += 4) {
      const vx = icoPositions[v * 3] * this.globalBreathScale;
      const vy = icoPositions[v * 3 + 1] * this.globalBreathScale;
      const vz = icoPositions[v * 3 + 2] * this.globalBreathScale;

      // Find closest particle
      let closestDist = Infinity;
      let closestIdx = -1;

      // Sample particles (every 20th for performance)
      for (let p = 0; p < this.particleCount; p += 20) {
        const px = particlePositions[p * 3];
        const py = particlePositions[p * 3 + 1];
        const pz = particlePositions[p * 3 + 2];

        const dx = vx - px;
        const dy = vy - py;
        const dz = vz - pz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < closestDist && dist < connectionDist) {
          closestDist = dist;
          closestIdx = p;
        }
      }

      if (closestIdx >= 0) {
        const px = particlePositions[closestIdx * 3];
        const py = particlePositions[closestIdx * 3 + 1];
        const pz = particlePositions[closestIdx * 3 + 2];

        // Set line positions
        const idx = lineCount * 6;
        conduitPositions[idx] = vx;
        conduitPositions[idx + 1] = vy;
        conduitPositions[idx + 2] = vz;
        conduitPositions[idx + 3] = px;
        conduitPositions[idx + 4] = py;
        conduitPositions[idx + 5] = pz;

        // Color based on distance (closer = brighter)
        const proximity = 1 - closestDist / connectionDist;
        const pulse = 0.5 + Math.sin(this.time * 3 + v * 0.1) * 0.3; // Pulsing glow

        // Blend colors with pulse
        const r = (accent1.r * 0.5 + accent2.r * 0.5) * proximity * pulse;
        const g = (accent1.g * 0.5 + accent2.g * 0.5) * proximity * pulse;
        const b = (accent1.b * 0.5 + accent2.b * 0.5) * proximity * pulse;

        conduitColors[idx] = r;
        conduitColors[idx + 1] = g;
        conduitColors[idx + 2] = b;
        conduitColors[idx + 3] = r * 0.5;
        conduitColors[idx + 4] = g * 0.5;
        conduitColors[idx + 5] = b * 0.5;

        lineCount++;
      }
    }

    this.conduitGeometry.attributes.position.needsUpdate = true;
    this.conduitGeometry.attributes.color.needsUpdate = true;
    this.conduitGeometry.setDrawRange(0, lineCount * 2);

    // Conduit opacity based on activity
    this.conduitMaterial.opacity = 0.2 + this.tension * 0.3;
  }

  private applyIcosahedronDisruption(dt: number) {
    const positions = this.icoGeometry.attributes.position.array as Float32Array;
    const colors = this.icoGeometry.attributes.color?.array as Float32Array | undefined;
    const vertexCount = positions.length / 3;

    // Update disruption phase for wave effect
    this.tesseractDisruptionPhase += dt * 8;

    const intensity = this.tesseractIntensity;
    const disruptColor = new THREE.Color(currentTheme.accent2);

    for (let i = 0; i < vertexCount; i++) {
      const baseX = this.icoBasePositions[i * 3];
      const baseY = this.icoBasePositions[i * 3 + 1];
      const baseZ = this.icoBasePositions[i * 3 + 2];

      // Calculate distance from center for wave effect
      const dist = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
      const wave = Math.sin(this.tesseractDisruptionPhase + dist * 0.1) * intensity;

      // Direction from center (for push/pull)
      const len = dist || 1;
      const nx = baseX / len;
      const ny = baseY / len;
      const nz = baseZ / len;

      // Displacement: push outward with wave, add some chaotic jitter
      const jitter = (Math.random() - 0.5) * intensity * 3;
      const displacement = wave * 8 + jitter;

      positions[i * 3] = baseX + nx * displacement;
      positions[i * 3 + 1] = baseY + ny * displacement;
      positions[i * 3 + 2] = baseZ + nz * displacement;

      // Flash colors during disruption
      if (colors) {
        const flash = Math.abs(wave) * 2;
        colors[i * 3] = Math.min(1.5, colors[i * 3] + disruptColor.r * flash * dt * 10);
        colors[i * 3 + 1] = Math.min(1.5, colors[i * 3 + 1] + disruptColor.g * flash * dt * 10);
        colors[i * 3 + 2] = Math.min(1.5, colors[i * 3 + 2] + disruptColor.b * flash * dt * 10);
      }
    }

    this.icoGeometry.attributes.position.needsUpdate = true;
    if (colors) this.icoGeometry.attributes.color.needsUpdate = true;
  }

  private restoreIcosahedronPositions(dt: number) {
    const positions = this.icoGeometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;

    // Smoothly restore to base positions
    const restoreSpeed = dt * 2;

    for (let i = 0; i < vertexCount; i++) {
      positions[i * 3] += (this.icoBasePositions[i * 3] - positions[i * 3]) * restoreSpeed;
      positions[i * 3 + 1] += (this.icoBasePositions[i * 3 + 1] - positions[i * 3 + 1]) * restoreSpeed;
      positions[i * 3 + 2] += (this.icoBasePositions[i * 3 + 2] - positions[i * 3 + 2]) * restoreSpeed;
    }

    this.icoGeometry.attributes.position.needsUpdate = true;
  }

  private updateReactiveEdges(dt: number) {
    if (!this.icoGeometry.attributes.color) return;

    const icoPositions = this.icoGeometry.attributes.position.array as Float32Array;
    const icoColors = this.icoGeometry.attributes.color.array as Float32Array;
    const particlePositions = this.particleGeometry.attributes.position.array as Float32Array;
    const vertexCount = icoPositions.length / 3;

    const baseColor = new THREE.Color(currentTheme.accent1);
    const hotColor = new THREE.Color(currentTheme.accent2); // Brighter color for nearby particles
    const proximityThreshold = 25; // Distance at which particles start affecting edges
    const maxBrightness = 2.0; // How bright edges can get

    // Sample a subset of particles for performance (every 10th particle)
    const sampleStep = 10;
    const sampleCount = Math.floor(this.particleCount / sampleStep);

    // For each icosahedron vertex, check proximity to particles
    for (let v = 0; v < vertexCount; v++) {
      const vx = icoPositions[v * 3] * this.globalBreathScale;
      const vy = icoPositions[v * 3 + 1] * this.globalBreathScale;
      const vz = icoPositions[v * 3 + 2] * this.globalBreathScale;

      let closestDist = Infinity;

      // Check distance to sampled particles
      for (let p = 0; p < sampleCount; p++) {
        const pi = p * sampleStep;
        const px = particlePositions[pi * 3];
        const py = particlePositions[pi * 3 + 1];
        const pz = particlePositions[pi * 3 + 2];

        const dx = vx - px;
        const dy = vy - py;
        const dz = vz - pz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < closestDist) {
          closestDist = dist;
        }
      }

      // Calculate brightness based on proximity
      const proximity = Math.max(0, 1 - closestDist / proximityThreshold);
      const brightness = 0.4 + proximity * (maxBrightness - 0.4);

      // Blend between base color and hot color based on proximity
      const r = baseColor.r * (1 - proximity) + hotColor.r * proximity;
      const g = baseColor.g * (1 - proximity) + hotColor.g * proximity;
      const b = baseColor.b * (1 - proximity) + hotColor.b * proximity;

      // Smooth transition to target color
      const lerpSpeed = dt * 4;
      icoColors[v * 3] += (r * brightness - icoColors[v * 3]) * lerpSpeed;
      icoColors[v * 3 + 1] += (g * brightness - icoColors[v * 3 + 1]) * lerpSpeed;
      icoColors[v * 3 + 2] += (b * brightness - icoColors[v * 3 + 2]) * lerpSpeed;
    }

    this.icoGeometry.attributes.color.needsUpdate = true;
  }

  private subdivideIcosahedron() {
    if (this.icoSubdivisionLevel >= 2) return;

    this.icoSubdivisionLevel++;
    console.log(`[Visual] Icosahedron subdivided to level ${this.icoSubdivisionLevel}`);

    // Recreate geometry with higher detail
    const radius = this.spread * 0.7;
    const icoGeo = new THREE.IcosahedronGeometry(radius, this.icoSubdivisionLevel);
    const edges = new THREE.EdgesGeometry(icoGeo);

    // Add color attribute for reactive edges
    const vertexCount = edges.attributes.position.count;
    const baseColor = new THREE.Color(currentTheme.accent1);
    const colors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      colors[i * 3] = baseColor.r * 0.5;
      colors[i * 3 + 1] = baseColor.g * 0.5;
      colors[i * 3 + 2] = baseColor.b * 0.5;
    }
    edges.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Dispose old geometry
    this.icoGeometry.dispose();

    // Update
    this.icoGeometry = edges;
    this.icoBasePositions = new Float32Array(edges.attributes.position.array);
    this.icoMesh.geometry = this.icoGeometry;

    // Update vertex tracking
    this.icoVertexDisplacement = new Array(vertexCount).fill(0);
  }

  private updateTesseract(dt: number) {
    if (!this.tesseractMesh) return;

    // Fade in/out based on active state - full brightness when active
    const targetOpacity = this.tesseractActive ? 1.0 * this.tesseractIntensity : 0;
    this.tesseractMaterial.opacity += (targetOpacity - this.tesseractMaterial.opacity) * dt * 8;

    if (this.tesseractMaterial.opacity < 0.01) return;

    // Rotate through 4D space - different rotation speeds for trippy effect
    const baseSpeed = 0.4 + this.tesseractIntensity * 0.6;
    this.tesseractRotation4D.xy += dt * baseSpeed * 0.7;
    this.tesseractRotation4D.xz += dt * baseSpeed * 0.5;
    this.tesseractRotation4D.xw += dt * baseSpeed * 1.1; // This is the "impossible" rotation
    this.tesseractRotation4D.yz += dt * baseSpeed * 0.3;
    this.tesseractRotation4D.yw += dt * baseSpeed * 0.8;
    this.tesseractRotation4D.zw += dt * baseSpeed * 0.6;

    // Project and update geometry
    this.projectTesseract();

    // Decay intensity - slower fade for more visibility (8 seconds)
    if (this.tesseractActive) {
      this.tesseractIntensity -= dt * 0.125;
      if (this.tesseractIntensity <= 0) {
        this.tesseractActive = false;
        this.tesseractIntensity = 0;
      }
    }
  }

  // Trigger tesseract glitch on critical events
  triggerTesseractGlitch(intensity: number = 1) {
    this.tesseractActive = true;
    this.tesseractIntensity = Math.min(1, this.tesseractIntensity + intensity);
    console.log('[Visual] Tesseract glitch triggered');
  }

  // === HOLOGRAPHIC HUD ===

  private initHUD() {
    // Create HUD panels for key stats - orbital scatter positioning
    const panelConfigs = [
      { id: 'threatLevel', label: 'THREAT LEVEL', orbitAngle: -0.4, orbitRadius: 180, orbitHeight: 60 },
      { id: 'ransomware', label: 'RANSOMWARE', orbitAngle: 0.3, orbitRadius: 190, orbitHeight: 40 },
      { id: 'eventsPerMin', label: 'EVENTS/MIN', orbitAngle: 0.9, orbitRadius: 175, orbitHeight: -30 },
      { id: 'breaches', label: 'BREACHES', orbitAngle: -1.0, orbitRadius: 185, orbitHeight: -50 },
    ];

    panelConfigs.forEach((config, i) => {
      const panel = this.createHUDPanel(config.id, config.label, config.orbitAngle, config.orbitRadius, config.orbitHeight);
      this.hudPanels.push(panel);
    });
  }

  private createHUDPanel(id: string, label: string, orbitAngle: number, orbitRadius: number, orbitHeight: number): HUDPanel {
    // Create canvas for glass panel texture (high resolution for crisp text)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Create sprite with canvas texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.NormalBlending,  // Changed from Additive to prevent bloom blowout
      depthWrite: false,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(40, 20, 1);
    this.hudGroup.add(sprite);

    const panel: HUDPanel = {
      id,
      label,
      value: this.hudStats[id] ?? 0,
      sprite,
      canvas,
      ctx,
      orbitAngle,
      orbitRadius,
      orbitHeight,
      driftOffset: Math.random() * Math.PI * 2,
      pulseIntensity: 0,
      lastValue: this.hudStats[id] ?? 0,
    };

    // Initial render
    this.renderHUDPanel(panel);

    return panel;
  }

  private renderHUDPanel(panel: HUDPanel) {
    const { ctx, canvas, label, value, pulseIntensity } = panel;
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    const borderGlow = 0.3 + pulseIntensity * 0.3;
    const pad = 16;

    // Dark background panel (no shadow blur - crisp edges)
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(5, 12, 20, 0.9)`;
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 12);
    ctx.fill();

    // Border
    ctx.strokeStyle = `rgba(${this.getThemeRGB()}, ${borderGlow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 12);
    ctx.stroke();

    // Subtle scan lines
    ctx.fillStyle = `rgba(${this.getThemeRGB()}, 0.02)`;
    for (let y = pad + 10; y < h - pad - 10; y += 6) {
      ctx.fillRect(pad + 8, y, w - pad * 2 - 16, 1);
    }

    // Corner brackets (scaled for 512x256)
    const bracketLen = 24;
    ctx.strokeStyle = `rgba(${this.getThemeRGB()}, ${0.4 + pulseIntensity * 0.4})`;
    ctx.lineWidth = 3;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(pad, pad + bracketLen);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + bracketLen, pad);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - pad - bracketLen, pad);
    ctx.lineTo(w - pad, pad);
    ctx.lineTo(w - pad, pad + bracketLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(pad, h - pad - bracketLen);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(pad + bracketLen, h - pad);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - pad - bracketLen, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.lineTo(w - pad, h - pad - bracketLen);
    ctx.stroke();

    // Label (crisp, no shadow)
    ctx.shadowBlur = 0;
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(${this.getThemeRGB()}, 0.6)`;
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, pad + 45);

    // Value - crisp text with dark stroke for contrast
    let displayValue: string;
    if (panel.id === 'threatLevel') {
      displayValue = `LEVEL ${value}`;
    } else if (typeof value === 'number') {
      displayValue = value.toLocaleString();
    } else {
      displayValue = String(value);
    }

    ctx.font = 'bold 56px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    // Dark stroke for contrast (draw text twice - stroke then fill)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 5;
    ctx.strokeText(String(displayValue), w / 2, h - pad - 55);

    // Light gray fill (not pure white to avoid bloom)
    ctx.fillStyle = `rgba(180, 195, 210, ${0.95 + pulseIntensity * 0.05})`;
    ctx.fillText(String(displayValue), w / 2, h - pad - 55);

    // Subtle colored underline accent
    const textWidth = ctx.measureText(String(displayValue)).width;
    ctx.fillStyle = `rgba(${this.getThemeRGB()}, ${0.3 + pulseIntensity * 0.4})`;
    ctx.fillRect(w / 2 - textWidth / 2, h - pad - 40, textWidth, 2);

    // Update texture
    (panel.sprite.material as THREE.SpriteMaterial).map!.needsUpdate = true;
  }

  private getThemeRGB(): string {
    const color = new THREE.Color(currentTheme.accent1);
    return `${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}`;
  }

  private updateHUD(deltaTime: number) {
    const baseAngle = this.time * 0.05; // Slow drift

    this.hudPanels.forEach((panel) => {
      // Check for value changes and trigger pulse
      const newValue = this.hudStats[panel.id];
      if (newValue !== panel.lastValue) {
        panel.pulseIntensity = 1;
        panel.lastValue = newValue;
        panel.value = newValue;
      }

      // Decay pulse
      panel.pulseIntensity = Math.max(0, panel.pulseIntensity - deltaTime * 2);

      // Calculate orbital position with drift
      const drift = Math.sin(this.time * 0.3 + panel.driftOffset) * 5;
      const angle = panel.orbitAngle + baseAngle * 0.1;

      // Position in world space
      panel.sprite.position.x = Math.sin(angle) * panel.orbitRadius;
      panel.sprite.position.y = panel.orbitHeight + Math.sin(this.time * 0.5 + panel.driftOffset) * 3;
      panel.sprite.position.z = Math.cos(angle) * panel.orbitRadius * 0.3 + drift;

      // Billboard: sprites automatically face camera, but we can adjust scale based on distance
      const distToCamera = panel.sprite.position.distanceTo(this.camera.position);
      const scaleFactor = Math.min(1.2, Math.max(0.8, 150 / distToCamera));
      panel.sprite.scale.set(40 * scaleFactor, 20 * scaleFactor, 1);

      // Re-render if pulsing or periodically for scan line animation
      if (panel.pulseIntensity > 0.01 || Math.floor(this.time * 4) !== Math.floor((this.time - deltaTime) * 4)) {
        this.renderHUDPanel(panel);
      }
    });
  }

  // Public method to update HUD stats from main.ts
  updateHUDStats(stats: { threatLevel?: number; ransomware?: number; eventsPerMin?: number; breaches?: string }) {
    if (stats.threatLevel !== undefined) this.hudStats.threatLevel = stats.threatLevel;
    if (stats.ransomware !== undefined) this.hudStats.ransomware = stats.ransomware;
    if (stats.eventsPerMin !== undefined) this.hudStats.eventsPerMin = stats.eventsPerMin;
    if (stats.breaches !== undefined) this.hudStats.breaches = stats.breaches;
  }

  // Spawn a data packet that travels along a connection line
  private spawnPacket(startIdx: number, color: THREE.Color) {
    if (this.dataPackets.length >= this.maxPackets) return;

    // Find a nearby particle to travel to
    const particlePositions = this.particleGeometry.attributes.position.array as Float32Array;
    const formation = FORMATIONS[this.currentFormationIndex];
    const maxDist = formation.connectionDistance * 1.5;

    const sx = particlePositions[startIdx * 3];
    const sy = particlePositions[startIdx * 3 + 1];
    const sz = particlePositions[startIdx * 3 + 2];

    // Find closest particles
    let bestIdx = -1;
    let bestDist = Infinity;
    const searchRange = Math.min(50, this.particleCount);

    for (let i = 0; i < searchRange; i++) {
      const idx = Math.floor(Math.random() * this.particleCount);
      if (idx === startIdx) continue;

      const dx = sx - particlePositions[idx * 3];
      const dy = sy - particlePositions[idx * 3 + 1];
      const dz = sz - particlePositions[idx * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < maxDist && dist < bestDist && dist > 10) {
        bestDist = dist;
        bestIdx = idx;
      }
    }

    if (bestIdx === -1) return;

    this.dataPackets.push({
      startIdx,
      endIdx: bestIdx,
      progress: 0,
      speed: 0.8 + Math.random() * 0.6,
      color: color.clone(),
      size: 1.5 + Math.random() * 1.0,
    });

    // Sometimes chain packets
    if (Math.random() < 0.3 && this.dataPackets.length < this.maxPackets - 5) {
      setTimeout(() => {
        this.spawnPacket(bestIdx, color.clone().multiplyScalar(0.8));
      }, 100 + Math.random() * 200);
    }
  }

  // === FORMATION TRANSITIONS ===

  private startTransition() {
    this.isTransitioning = true;
    this.transitionProgress = 0;

    // Start dissolve effect for icosahedron
    this.startIcoDissolve();

    // Pick next formation
    this.currentFormationIndex = (this.currentFormationIndex + 1) % FORMATIONS.length;
    const formation = FORMATIONS[this.currentFormationIndex];
    const newPositions = formation.generate(this.particleCount, this.spread);

    // Set new targets
    for (let i = 0; i < this.particleCount; i++) {
      this.particles[i].targetPos.copy(newPositions[i]);
      this.particles[i].size = formation.particleSize;
    }

    this.targetCameraDistance = formation.cameraDistance;

    // Calculate new morph targets for icosahedron
    this.calculateMorphTargets(formation.name);
  }

  private startIcoDissolve() {
    if (this.icoDissolving) return;

    this.icoDissolving = true;
    this.icoReforming = false;
    this.icoDissolveProgress = 0;
    this.dissolvedParticles = [];

    // Create dissolved particles from icosahedron vertices
    const positions = this.icoGeometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;

    // Sample every few vertices to create floating particles
    const sampleRate = Math.max(1, Math.floor(vertexCount / 30));
    for (let i = 0; i < vertexCount; i += sampleRate) {
      const x = positions[i * 3] * this.globalBreathScale;
      const y = positions[i * 3 + 1] * this.globalBreathScale;
      const z = positions[i * 3 + 2] * this.globalBreathScale;

      this.dissolvedParticles.push({
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        target: new THREE.Vector3(x, y, z), // Will be updated when reforming
      });
    }
  }

  private calculateMorphTargets(formationName: string) {
    // Calculate how icosahedron should morph to match formation
    const vertexCount = this.icoBasePositions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const baseX = this.icoBasePositions[i * 3];
      const baseY = this.icoBasePositions[i * 3 + 1];
      const baseZ = this.icoBasePositions[i * 3 + 2];

      let targetX = baseX;
      let targetY = baseY;
      let targetZ = baseZ;

      // Morph based on formation type
      switch (formationName) {
        case 'DNA HELIX':
          // Elongate vertically, narrow horizontally
          targetX = baseX * 0.6;
          targetY = baseY * 1.8;
          targetZ = baseZ * 0.6;
          break;

        case 'HYPERCUBE':
          // Make more cubic/angular
          const len = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
          const maxCoord = Math.max(Math.abs(baseX), Math.abs(baseY), Math.abs(baseZ));
          const cubeFactor = maxCoord / len;
          targetX = baseX * (0.7 + cubeFactor * 0.4);
          targetY = baseY * (0.7 + cubeFactor * 0.4);
          targetZ = baseZ * (0.7 + cubeFactor * 0.4);
          break;

        case 'SPHERE':
          // More spherical - smooth out
          const sphereLen = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
          const targetLen = this.spread * 0.7;
          targetX = (baseX / sphereLen) * targetLen;
          targetY = (baseY / sphereLen) * targetLen;
          targetZ = (baseZ / sphereLen) * targetLen;
          break;

        case 'RING SYSTEM':
        case 'VORTEX':
          // Flatten vertically, expand horizontally
          targetX = baseX * 1.3;
          targetY = baseY * 0.4;
          targetZ = baseZ * 1.3;
          break;

        case 'WAVE FIELD':
          // Add wave distortion
          const wave = Math.sin(baseX * 0.1 + baseZ * 0.1) * 10;
          targetY = baseY + wave;
          break;

        case 'DATA MATRIX':
          // Grid-like, more structured
          targetX = Math.round(baseX / 20) * 20 + (baseX - Math.round(baseX / 20) * 20) * 0.3;
          targetY = Math.round(baseY / 20) * 20 + (baseY - Math.round(baseY / 20) * 20) * 0.3;
          targetZ = Math.round(baseZ / 20) * 20 + (baseZ - Math.round(baseZ / 20) * 20) * 0.3;
          break;

        case 'CONSTELLATION':
        case 'PARTICLE CLOUD':
          // Slightly expanded, more diffuse
          targetX = baseX * 1.2;
          targetY = baseY * 1.2;
          targetZ = baseZ * 1.2;
          break;

        case 'NEURAL NETWORK':
          // Organic, slightly blobby
          const noise = Math.sin(baseX * 0.15) * Math.cos(baseY * 0.15) * Math.sin(baseZ * 0.15) * 8;
          targetX = baseX + noise * 0.3;
          targetY = baseY + noise * 0.3;
          targetZ = baseZ + noise * 0.3;
          break;

        case 'ICOSAHEDRON':
        default:
          // Standard icosahedron - no morph
          break;
      }

      this.icoMorphTargets[i * 3] = targetX;
      this.icoMorphTargets[i * 3 + 1] = targetY;
      this.icoMorphTargets[i * 3 + 2] = targetZ;
    }

    console.log(`[Visual] Morph targets calculated for ${formationName}`);
  }

  private updateGlitchIntensity() {
  }

  // === UPDATE ===

  update(deltaTime: number) {
    this.time += deltaTime;
    this.tension = Math.max(0, this.tension - deltaTime * 0.05);

    // Update global breath - shared pulse for all elements
    this.updateGlobalBreath(deltaTime);

    // Formation timer
    this.formationTimer += deltaTime;
    if (this.formationTimer >= this.formationDuration && !this.isTransitioning) {
      this.startTransition();
      this.formationTimer = 0;
    }

    // Transition progress
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.isTransitioning = false;
      }
    }

    // Update particles
    this.updateParticles(deltaTime);

    // Update connections
    this.updateConnections();

    // Update camera
    this.updateCamera(deltaTime);

    // Update labels
    this.updateLabels(deltaTime);

    // Update glitch intensity based on tension
    this.updateGlitchIntensity();

    // Update trails
    this.updateTrails(deltaTime);

    // Update data rain
    this.updateDataRain(deltaTime);

    // Data stream disabled
    // this.updateDataStream(deltaTime);

    // Update audio visualizer
    this.updateVisualizer(deltaTime);

    // Update data fragments
    this.updateDataFragments(deltaTime);

    // Update data packets
    this.updatePackets(deltaTime);

    // Update living icosahedron
    this.updateIcosahedron(deltaTime);

    // Update tesseract glitch
    this.updateTesseract(deltaTime);

    // Update holographic HUD
    this.updateHUD(deltaTime);

    // Update glitch
    this.updateGlitch(deltaTime);

    // Update uniforms
    this.particleMaterial.uniforms.time.value = this.time;
    this.lineMaterial.uniforms.tension.value = this.tension;
    this.trailMaterial.uniforms.time.value = this.time;
    this.rainMaterial.uniforms.time.value = this.time;
    this.rainMaterial.uniforms.tension.value = this.tension;

    // Post-processing - subtle bloom with chromatic aberration
    const glitchBoost = this.glitchIntensity * 0.2;
    const themeBloom = currentTheme.bloom ?? 1.0;
    this.bloomPass.strength = (0.5 + this.tension * 0.3 + Math.sin(this.time * 0.5) * 0.05 + glitchBoost) * themeBloom;
    this.chromaticPass.uniforms.amount.value = 0.0015 + this.tension * 0.003 + this.glitchIntensity * 0.01;
    this.chromaticPass.uniforms.time.value = this.time;

    // Background
    this.dominantColor.lerp(new THREE.Color(currentTheme.void), deltaTime * 0.3);
    this.scene.background = this.dominantColor.clone().multiplyScalar(0.15);
  }

  private updateTrails(dt: number) {
    // Age existing trail points
    for (let i = this.trailPoints.length - 1; i >= 0; i--) {
      this.trailPoints[i].age += dt;
      if (this.trailPoints[i].age > 3) {
        this.trailPoints.splice(i, 1);
      }
    }

    // Sample some particles for trails
    if (this.tension > 0.2) {
      const sampleRate = Math.floor(10 * this.tension);
      const particlePositions = this.particleGeometry.attributes.position.array as Float32Array;
      const particleColors = this.particleGeometry.attributes.color.array as Float32Array;

      for (let i = 0; i < sampleRate && this.trailPoints.length < this.maxTrailPoints; i++) {
        const idx = Math.floor(Math.random() * this.particleCount);
        if (this.particles[idx].brightness > 0.6) {
          this.trailPoints.push({
            position: new THREE.Vector3(
              particlePositions[idx * 3],
              particlePositions[idx * 3 + 1],
              particlePositions[idx * 3 + 2]
            ),
            color: new THREE.Color(
              particleColors[idx * 3],
              particleColors[idx * 3 + 1],
              particleColors[idx * 3 + 2]
            ),
            age: 0,
            size: this.particles[idx].brightness,
          });
        }
      }
    }

    // Update trail geometry
    const positions = this.trailGeometry.attributes.position as THREE.BufferAttribute;
    const colors = this.trailGeometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.trailGeometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < this.trailPoints.length; i++) {
      const tp = this.trailPoints[i];
      const fade = 1 - tp.age / 3;

      positions.array[i * 3] = tp.position.x;
      positions.array[i * 3 + 1] = tp.position.y;
      positions.array[i * 3 + 2] = tp.position.z;

      colors.array[i * 3] = tp.color.r * fade;
      colors.array[i * 3 + 1] = tp.color.g * fade;
      colors.array[i * 3 + 2] = tp.color.b * fade;

      sizes.array[i] = tp.size * fade;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
    this.trailGeometry.setDrawRange(0, this.trailPoints.length);
  }

  private updateDataRain(dt: number) {
    // Rain is animated in shader, just keep it visible
    this.rainPoints.visible = true;
  }

  private updateDataStream(dt: number) {
    if (!this.dataStreamCtx) return;

    const ctx = this.dataStreamCtx;
    const width = this.dataStreamCanvas.width;
    const height = this.dataStreamCanvas.height;

    // Semi-transparent clear for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 0, width, height);

    // Update density based on activity
    this.dataStreamDensity = 0.25 + this.tension * 0.4;

    // Maybe spawn new columns based on density
    const columnWidth = 55;
    const maxColumns = Math.ceil(width / columnWidth);
    if (this.dataStreamColumns.length < maxColumns * this.dataStreamDensity && Math.random() < 0.015 + this.tension * 0.02) {
      // Find an empty x position
      const usedX = new Set(this.dataStreamColumns.map(c => Math.floor(c.x / columnWidth)));
      const availableSlots: number[] = [];
      for (let i = 0; i < maxColumns; i++) {
        if (!usedX.has(i)) availableSlots.push(i);
      }
      if (availableSlots.length > 0) {
        const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        const length = 6 + Math.floor(Math.random() * 10);
        this.dataStreamColumns.push({
          x: slot * columnWidth,
          y: -length * 20,
          speed: 40 + Math.random() * 60 + this.tension * 30,
          chars: this.generateStreamItems(length),
          length: length,
          brightness: 0.35 + Math.random() * 0.25 + this.tension * 0.15,
          targetBrightness: 0.35 + Math.random() * 0.25,
        });
      }
    }

    // Get theme color for rain
    const rainColor = currentTheme.rain;
    const r = (rainColor >> 16) & 0xff;
    const g = (rainColor >> 8) & 0xff;
    const b = rainColor & 0xff;

    // Update and draw columns
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    const itemHeight = 18; // Spacing between items

    for (let i = this.dataStreamColumns.length - 1; i >= 0; i--) {
      const col = this.dataStreamColumns[i];

      // Move down
      col.y += col.speed * dt;

      // Smooth brightness transitions
      col.brightness += (col.targetBrightness - col.brightness) * dt * 2;

      // Occasionally change target brightness
      if (Math.random() < 0.01) {
        col.targetBrightness = 0.3 + Math.random() * 0.3 + this.tension * 0.15;
      }

      // Occasionally change an item
      if (Math.random() < 0.02) {
        const itemIndex = Math.floor(Math.random() * col.chars.length);
        col.chars[itemIndex] = this.dataStreamItems[Math.floor(Math.random() * this.dataStreamItems.length)];
      }

      // Draw items
      for (let j = 0; j < col.chars.length; j++) {
        const itemY = col.y + j * itemHeight;

        // Skip if off screen
        if (itemY < -20 || itemY > height + 20) continue;

        // Calculate fade based on position in column
        let alpha: number;
        if (j === 0) {
          // Head item is brightest (white/bright)
          alpha = col.brightness * 1.3;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha, 1)})`;
        } else if (j === 1) {
          // Second item slightly less bright
          alpha = col.brightness * 1.0;
          ctx.fillStyle = `rgba(${Math.min(r + 80, 255)}, ${Math.min(g + 80, 255)}, ${Math.min(b + 80, 255)}, ${alpha})`;
        } else {
          // Fade towards tail
          const fadePos = (j - 1) / (col.chars.length - 1);
          alpha = col.brightness * (1 - fadePos * 0.85);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(alpha, 0.05)})`;
        }

        ctx.fillText(col.chars[j], col.x + columnWidth / 2, itemY);
      }

      // Remove if completely off screen
      if (col.y > height + col.length * itemHeight) {
        this.dataStreamColumns.splice(i, 1);
      }
    }
  }

  private updateVisualizer(dt: number) {
    if (!this.visualizerCtx) return;

    const ctx = this.visualizerCtx;
    const width = this.visualizerCanvas.width;
    const height = this.visualizerCanvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get waveform data (or simulate if not available)
    const barCount = 64;
    const barWidth = width / barCount - 2;
    const barGap = 2;

    for (let i = 0; i < barCount; i++) {
      // Simulate waveform with tension and time - creates reactive bars
      const wave1 = Math.sin(this.time * 4 + i * 0.2) * 0.3;
      const wave2 = Math.cos(this.time * 2.5 + i * 0.15) * 0.2;
      const wave3 = Math.sin(this.time * 6 + i * 0.4) * 0.15 * this.tension;
      const tensionBoost = this.tension * 0.5;

      // Base activity level + waves
      let value = 0.1 + tensionBoost + wave1 + wave2 + wave3;
      value = Math.max(0.05, Math.min(1, value));

      // Use actual waveform data if available
      if (this.waveformData && this.waveformData.length > 0) {
        const dataIndex = Math.floor((i / barCount) * this.waveformData.length);
        const audioValue = (this.waveformData[dataIndex] + 1) / 2; // normalize -1..1 to 0..1
        value = value * 0.3 + audioValue * 0.7;
      }

      const barHeight = value * height * 0.9;
      const x = i * (barWidth + barGap);
      const y = height - barHeight;

      // Color gradient that shifts over time
      const timeShift = (this.time * 10) % 360; // Slow color rotation
      const hue = (this.visualizerHue + timeShift + this.tension * 40 + (i / barCount) * 30) % 360;
      const saturation = Math.min(100, this.visualizerSaturation + this.tension * 20 + 10);
      const lightness = 45 + value * 25;

      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + value * 0.4})`;

      // Draw bar with slight glow effect
      ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`;
      ctx.shadowBlur = 8;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  private updateDataFragments(dt: number) {
    // Update existing fragments
    for (let i = this.dataFragments.length - 1; i >= 0; i--) {
      const frag = this.dataFragments[i];
      frag.lifetime += dt;

      if (frag.lifetime >= frag.maxLifetime) {
        // Remove fragment and its mesh
        if (frag.mesh) {
          this.dataFragmentMeshes.remove(frag.mesh);
          frag.mesh.geometry.dispose();
          (frag.mesh.material as THREE.Material).dispose();
        }
        // Remove connection line
        if (frag.connectionLine) {
          this.scene.remove(frag.connectionLine);
          frag.connectionLine.geometry.dispose();
          (frag.connectionLine.material as THREE.Material).dispose();
        }
        this.dataFragments.splice(i, 1);
        continue;
      }

      const lifeRatio = frag.lifetime / frag.maxLifetime;

      // Accelerate drift as fragment ages (moves away faster over time)
      const driftMultiplier = 1 + lifeRatio * 2;
      frag.position.add(frag.velocity.clone().multiplyScalar(dt * driftMultiplier));

      // Update mesh if exists
      if (frag.mesh) {
        frag.mesh.position.copy(frag.position);

        // Billboard mode - always face camera
        frag.mesh.quaternion.copy(this.camera.quaternion);

        // Fade out - start earlier (40% of life) for smoother decay
        const fadeStart = 0.4;
        const fade = lifeRatio > fadeStart ? 1 - (lifeRatio - fadeStart) / (1 - fadeStart) : 1;
        // Also scale down as it fades
        const scaleDown = 1 - lifeRatio * 0.3;
        frag.mesh.scale.setScalar(scaleDown);
        (frag.mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.85;
      }

      // Update connection line - keep visible, fade near end
      if (frag.connectionLine && frag.sourcePosition) {
        const positions = frag.connectionLine.geometry.attributes.position as THREE.BufferAttribute;
        positions.setXYZ(1, frag.position.x, frag.position.y, frag.position.z);
        positions.needsUpdate = true;

        // Connection line stays visible, fades in last 40% of life
        const lineFadeStart = 0.6;
        const lineFade = lifeRatio > lineFadeStart ? 1 - (lifeRatio - lineFadeStart) / (1 - lineFadeStart) : 1;
        (frag.connectionLine.material as THREE.LineBasicMaterial).opacity = lineFade * 0.7;
      }
    }
  }

  private updateGlitch(dt: number) {
    // Decay glitch intensity
    this.glitchIntensity = Math.max(0, this.glitchIntensity - dt * 2);
    this.glitchTimer += dt;
  }

  private updatePackets(dt: number) {
    const particlePositions = this.particleGeometry.attributes.position.array as Float32Array;
    const positions = this.packetGeometry.attributes.position as THREE.BufferAttribute;
    const colors = this.packetGeometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.packetGeometry.attributes.size as THREE.BufferAttribute;

    // Update and remove completed packets
    for (let i = this.dataPackets.length - 1; i >= 0; i--) {
      const packet = this.dataPackets[i];
      packet.progress += dt * packet.speed;

      if (packet.progress >= 1) {
        this.dataPackets.splice(i, 1);
        continue;
      }

      // Interpolate position between start and end particles
      const startX = particlePositions[packet.startIdx * 3];
      const startY = particlePositions[packet.startIdx * 3 + 1];
      const startZ = particlePositions[packet.startIdx * 3 + 2];
      const endX = particlePositions[packet.endIdx * 3];
      const endY = particlePositions[packet.endIdx * 3 + 1];
      const endZ = particlePositions[packet.endIdx * 3 + 2];

      // Ease in-out for smoother motion
      const t = packet.progress;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      // Add slight arc to the path
      const arc = Math.sin(t * Math.PI) * 5;

      positions.array[i * 3] = startX + (endX - startX) * ease;
      positions.array[i * 3 + 1] = startY + (endY - startY) * ease + arc;
      positions.array[i * 3 + 2] = startZ + (endZ - startZ) * ease;

      // Fade out near end
      const fade = t > 0.7 ? (1 - t) / 0.3 : 1;
      colors.array[i * 3] = packet.color.r * fade;
      colors.array[i * 3 + 1] = packet.color.g * fade;
      colors.array[i * 3 + 2] = packet.color.b * fade;

      sizes.array[i] = packet.size * fade;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
    this.packetGeometry.setDrawRange(0, this.dataPackets.length);
    this.packetMaterial.uniforms.time.value = this.time;
  }

  // Spawn a 3D data fragment (internal, smaller)
  private spawnDataFragment(text: string, position: THREE.Vector3, color: THREE.Color, sourcePos?: THREE.Vector3) {
    if (this.dataFragments.length >= this.maxFragments) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 32;

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 18px JetBrains Mono, monospace';
    ctx.fillStyle = `#${color.getHexString()}`;
    ctx.textAlign = 'center';
    ctx.fillText(text.substring(0, 30), canvas.width / 2, 22);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(40, 5);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    this.dataFragmentMeshes.add(mesh);

    // Create connection line to source if provided
    let connectionLine: THREE.Line | undefined;
    const sourcePosition = sourcePos?.clone();
    if (sourcePosition) {
      const lineColor = color.clone();
      lineColor.offsetHSL(0, 0, 0.2);
      const lineMat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        sourcePosition,
        position.clone(),
      ]);
      connectionLine = new THREE.Line(lineGeo, lineMat);
      this.scene.add(connectionLine);
    }

    this.dataFragments.push({
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        5 + Math.random() * 10,
        (Math.random() - 0.5) * 5
      ),
      text,
      color,
      lifetime: 0,
      maxLifetime: 3 + Math.random() * 2,  // 3-5 seconds
      scale: 1,
      rotation: (Math.random() - 0.5) * 0.3,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
      mesh,  // Store mesh reference for cleanup!
      sourcePosition,
      connectionLine,
    });
  }

  // Public: Spawn event text fragment at periphery (for threat feed)
  spawnEventFragment(type: string, content: string, severity: 'critical' | 'high' | 'medium' | 'low' = 'medium', sourcePos?: THREE.Vector3) {
    if (this.dataFragments.length >= this.maxFragments) return;

    // Severity colors
    const severityColors: Record<string, number> = {
      critical: 0xff0044,
      high: 0xff6600,
      medium: currentTheme.accent1,
      low: currentTheme.accent3,
    };
    const color = new THREE.Color(severityColors[severity] || currentTheme.accent1);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    // Create canvas with enhanced styling
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 80;

    const w = canvas.width;
    const h = canvas.height;
    const pad = 12;
    const stripeWidth = 4;

    // Dark background panel
    ctx.fillStyle = `rgba(5, 10, 15, 0.85)`;
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 4);
    ctx.fill();

    // Severity stripe on left edge
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
    ctx.fillRect(pad, pad, stripeWidth, h - pad * 2);

    // Corner brackets
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
    ctx.lineWidth = 2;
    const bracketLen = 12;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(pad, pad + bracketLen);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + bracketLen, pad);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - pad - bracketLen, pad);
    ctx.lineTo(w - pad, pad);
    ctx.lineTo(w - pad, pad + bracketLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(pad, h - pad - bracketLen);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(pad + bracketLen, h - pad);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - pad - bracketLen, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.lineTo(w - pad, h - pad - bracketLen);
    ctx.stroke();

    // Type label (dimmer, smaller)
    ctx.font = '600 11px JetBrains Mono, monospace';
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
    ctx.textAlign = 'left';
    ctx.fillText(type.toUpperCase(), pad + stripeWidth + 10, pad + 18);

    // Content text (brighter, larger)
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
    ctx.shadowBlur = 6;
    ctx.font = 'bold 20px JetBrains Mono, monospace';
    ctx.fillStyle = `rgba(255, 255, 255, 0.95)`;
    ctx.fillText(content.substring(0, 35), pad + stripeWidth + 10, h - pad - 16);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Panel geometry
    const geometry = new THREE.PlaneGeometry(70, 11);
    const mesh = new THREE.Mesh(geometry, material);

    // Spawn at random position on the periphery
    const angle = Math.random() * Math.PI * 2;
    const radius = 110 + Math.random() * 30;
    const height = (Math.random() - 0.5) * 60;

    const position = new THREE.Vector3(
      Math.sin(angle) * radius,
      height,
      Math.cos(angle) * radius * 0.4
    );
    mesh.position.copy(position);

    this.dataFragmentMeshes.add(mesh);

    // Create connection line to source if provided
    let connectionLine: THREE.Line | undefined;
    const sourcePosition = sourcePos?.clone();
    if (sourcePosition) {
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        sourcePosition,
        position
      ]);
      // Brighter line color for visibility
      const lineColor = color.clone();
      lineColor.offsetHSL(0, 0, 0.2);  // Lighten
      const lineMat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0.7,  // Much more visible
        blending: THREE.AdditiveBlending,
      });
      connectionLine = new THREE.Line(lineGeom, lineMat);
      this.scene.add(connectionLine);
    }

    this.dataFragments.push({
      position: position.clone(),
      velocity: new THREE.Vector3(
        Math.sin(angle) * 8,     // Faster outward drift
        4 + Math.random() * 4,  // Faster upward drift
        Math.cos(angle) * 6
      ),
      text: content,
      color,
      lifetime: 0,
      maxLifetime: 3 + Math.random() * 2,  // Shorter lifetime: 3-5 seconds
      scale: 1,
      rotation: 0,
      rotationSpeed: 0,
      sourcePosition,
      mesh,
      connectionLine,
    });
  }

  // Trigger glitch effect
  triggerGlitch(intensity: number = 0.5) {
    this.glitchIntensity = Math.min(1, this.glitchIntensity + intensity);
  }

  private updateParticles(dt: number) {
    const positions = this.particleGeometry.attributes.position as THREE.BufferAttribute;
    const colors = this.particleGeometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.particleGeometry.attributes.size as THREE.BufferAttribute;

    const formation = FORMATIONS[this.currentFormationIndex];

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      // Smooth transition to target position
      const lerpSpeed = this.isTransitioning ? 2 : 4;
      p.currentPos.lerp(p.targetPos, dt * lerpSpeed);

      // Add some organic movement
      const noiseX = Math.sin(this.time * 0.5 + i * 0.1) * 0.3;
      const noiseY = Math.cos(this.time * 0.4 + i * 0.15) * 0.2;
      const noiseZ = Math.sin(this.time * 0.3 + i * 0.2) * 0.15;

      // Rotate around center
      const rotatedPos = p.currentPos.clone();
      const cos = Math.cos(this.rotationAngle);
      const sin = Math.sin(this.rotationAngle);
      const x = rotatedPos.x * cos - rotatedPos.z * sin;
      const z = rotatedPos.x * sin + rotatedPos.z * cos;

      // Apply global breath - particles expand/contract with icosahedron
      let breathedX = x * this.globalBreathScale;
      let breathedY = rotatedPos.y * this.globalBreathScale;
      let breathedZ = z * this.globalBreathScale;

      // === TESSERACT DISRUPTION ===
      // Scatter particles outward when tesseract is active
      if (this.tesseractActive && this.tesseractIntensity > 0.1) {
        const dist = Math.sqrt(breathedX * breathedX + breathedY * breathedY + breathedZ * breathedZ);
        const len = dist || 1;

        // Outward push - stronger near center
        const pushStrength = this.tesseractIntensity * 15 * (1 - dist / (this.spread * 2));
        const scatter = Math.sin(this.time * 20 + i * 0.5) * this.tesseractIntensity * 3;

        breathedX += (breathedX / len) * (pushStrength + scatter);
        breathedY += (breathedY / len) * (pushStrength + scatter * 0.5);
        breathedZ += (breathedZ / len) * (pushStrength + scatter);

        // Add chaotic jitter
        breathedX += (Math.random() - 0.5) * this.tesseractIntensity * 4;
        breathedY += (Math.random() - 0.5) * this.tesseractIntensity * 4;
        breathedZ += (Math.random() - 0.5) * this.tesseractIntensity * 4;
      }

      positions.array[i * 3] = breathedX + noiseX;
      positions.array[i * 3 + 1] = breathedY + noiseY;
      positions.array[i * 3 + 2] = breathedZ + noiseZ;

      // Color transition
      p.color.lerp(p.targetColor, dt * 3);
      p.brightness += (p.targetBrightness - p.brightness) * dt * 5;

      colors.array[i * 3] = p.color.r * p.brightness;
      colors.array[i * 3 + 1] = p.color.g * p.brightness;
      colors.array[i * 3 + 2] = p.color.b * p.brightness;

      sizes.array[i] = p.size * (0.5 + p.brightness * 0.5);

      // Decay color back to ambient
      if (p.targetBrightness > 0.5) {
        p.targetBrightness -= dt * 0.8;
        if (p.targetBrightness <= 0.5) {
          p.targetColor.set(currentTheme.ambient);
        }
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;

    // Rotate
    this.rotationAngle += formation.rotationSpeed * dt;
  }

  private updateConnections() {
    const formation = FORMATIONS[this.currentFormationIndex];
    if (formation.connectionStyle === 'none') {
      this.lineGeometry.setDrawRange(0, 0);
      return;
    }

    const positions = this.lineGeometry.attributes.position as THREE.BufferAttribute;
    const colors = this.lineGeometry.attributes.color as THREE.BufferAttribute;
    let lineCount = 0;
    const maxLines = this.particleCount * 3;

    const particlePositions = this.particleGeometry.attributes.position.array as Float32Array;

    // Get theme accent color for lines
    const accent = new THREE.Color(currentTheme.accent1);
    const baseIntensity = 0.25 + this.tension * 0.15;

    if (formation.connectionStyle === 'proximity') {
      // Connect nearby particles
      for (let i = 0; i < this.particleCount && lineCount < maxLines; i++) {
        const ix = particlePositions[i * 3];
        const iy = particlePositions[i * 3 + 1];
        const iz = particlePositions[i * 3 + 2];

        for (let j = i + 1; j < this.particleCount && lineCount < maxLines; j++) {
          const jx = particlePositions[j * 3];
          const jy = particlePositions[j * 3 + 1];
          const jz = particlePositions[j * 3 + 2];

          const dx = ix - jx, dy = iy - jy, dz = iz - jz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < formation.connectionDistance) {
            const idx = lineCount * 6;
            positions.array[idx] = ix;
            positions.array[idx + 1] = iy;
            positions.array[idx + 2] = iz;
            positions.array[idx + 3] = jx;
            positions.array[idx + 4] = jy;
            positions.array[idx + 5] = jz;

            const alpha = 1 - dist / formation.connectionDistance;
            const intensity = baseIntensity * alpha;
            colors.array[idx] = accent.r * intensity;
            colors.array[idx + 1] = accent.g * intensity;
            colors.array[idx + 2] = accent.b * intensity;
            colors.array[idx + 3] = accent.r * intensity;
            colors.array[idx + 4] = accent.g * intensity;
            colors.array[idx + 5] = accent.b * intensity;

            lineCount++;
          }
        }
      }
    } else if (formation.connectionStyle === 'sequential') {
      // Connect in sequence
      for (let i = 0; i < this.particleCount - 1 && lineCount < maxLines; i++) {
        const idx = lineCount * 6;
        positions.array[idx] = particlePositions[i * 3];
        positions.array[idx + 1] = particlePositions[i * 3 + 1];
        positions.array[idx + 2] = particlePositions[i * 3 + 2];
        positions.array[idx + 3] = particlePositions[(i + 1) * 3];
        positions.array[idx + 4] = particlePositions[(i + 1) * 3 + 1];
        positions.array[idx + 5] = particlePositions[(i + 1) * 3 + 2];

        const intensity = baseIntensity * 1.2;
        colors.array[idx] = accent.r * intensity;
        colors.array[idx + 1] = accent.g * intensity;
        colors.array[idx + 2] = accent.b * intensity;
        colors.array[idx + 3] = accent.r * intensity;
        colors.array[idx + 4] = accent.g * intensity;
        colors.array[idx + 5] = accent.b * intensity;

        lineCount++;
      }
    } else if (formation.connectionStyle === 'grid') {
      // Grid connections (simplified - connect to neighbors)
      const gridSize = Math.ceil(Math.sqrt(this.particleCount));
      for (let i = 0; i < this.particleCount && lineCount < maxLines; i++) {
        const neighbors = [i + 1, i + gridSize];
        for (const j of neighbors) {
          if (j < this.particleCount && lineCount < maxLines) {
            const ix = particlePositions[i * 3];
            const iy = particlePositions[i * 3 + 1];
            const iz = particlePositions[i * 3 + 2];
            const jx = particlePositions[j * 3];
            const jy = particlePositions[j * 3 + 1];
            const jz = particlePositions[j * 3 + 2];

            const dx = ix - jx, dy = iy - jy, dz = iz - jz;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < formation.connectionDistance) {
              const idx = lineCount * 6;
              positions.array[idx] = ix;
              positions.array[idx + 1] = iy;
              positions.array[idx + 2] = iz;
              positions.array[idx + 3] = jx;
              positions.array[idx + 4] = jy;
              positions.array[idx + 5] = jz;

              const intensity = baseIntensity;
              colors.array[idx] = accent.r * intensity;
              colors.array[idx + 1] = accent.g * intensity;
              colors.array[idx + 2] = accent.b * intensity;
              colors.array[idx + 3] = accent.r * intensity;
              colors.array[idx + 4] = accent.g * intensity;
              colors.array[idx + 5] = accent.b * intensity;

              lineCount++;
            }
          }
        }
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    this.lineGeometry.setDrawRange(0, lineCount * 2);
  }

  private updateCamera(dt: number) {
    const formation = FORMATIONS[this.currentFormationIndex];

    // Automatic drift (slow)
    const driftAngle = this.time * 0.03;
    const driftRadius = 15 + this.tension * 8;

    // Combine automatic drift with user rotation
    const totalTheta = driftAngle + this.userRotationTheta;
    const totalPhi = (Math.PI / 2) + this.userRotationPhi;

    // Spherical to Cartesian conversion
    const dist = this.targetCameraDistance + Math.sin(driftAngle * 0.3) * 10;
    const targetX = dist * Math.sin(totalPhi) * Math.cos(totalTheta) + Math.cos(driftAngle * 1.3) * driftRadius * 0.3;
    const targetY = dist * Math.cos(totalPhi) + Math.sin(driftAngle * 0.7) * driftRadius * 0.2;
    const targetZ = dist * Math.sin(totalPhi) * Math.sin(totalTheta);

    this.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), dt * 2);
    this.camera.lookAt(this.cameraTarget);
  }

  private updateLabels(dt: number) {
    for (let i = this.floatingLabels.length - 1; i >= 0; i--) {
      const label = this.floatingLabels[i];
      label.lifetime += dt;

      if (label.lifetime >= label.maxLifetime) {
        label.element.style.opacity = '0';
        setTimeout(() => label.element.remove(), 300);
        this.floatingLabels.splice(i, 1);
        continue;
      }

      const projected = label.worldPos.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      if (projected.z < 1) {
        label.element.style.left = `${x}px`;
        label.element.style.top = `${y}px`;
        if (label.lifetime > label.maxLifetime - 0.5) {
          label.element.style.opacity = String((label.maxLifetime - label.lifetime) / 0.5);
        }
      } else {
        label.element.style.opacity = '0';
      }
    }
  }

  render() {
    this.composer.render();
  }

  // === THREAT HANDLERS ===

  private spawnThreat(threatType: string, burstSize: number = 1, label?: string, extraData?: string): THREE.Vector3 | null {
    const colorFn = THREAT_COLORS[threatType];
    const color = new THREE.Color(colorFn ? colorFn() : 0xffffff);
    this.tension = Math.min(1, this.tension + 0.06 * burstSize);
    this.dominantColor.lerp(color, 0.2);

    // Trigger glitch on high-severity events
    if (threatType === 'ransomware' || threatType === 'breach') {
      this.triggerGlitch(0.8);
    } else if (threatType === 'c2' || threatType === 'hijack') {
      this.triggerGlitch(0.4);
    }

    let spawnPos: THREE.Vector3 | null = null;

    const affectedIndices: number[] = [];
    for (let i = 0; i < burstSize; i++) {
      const idx = Math.floor(Math.random() * this.particleCount);
      const p = this.particles[idx];
      p.targetColor.copy(color);
      p.targetBrightness = 1.5;
      affectedIndices.push(idx);

      if (i === 0) {
        spawnPos = p.currentPos.clone();

        this.addFloatingLabel(
          p.currentPos,
          label || THREAT_LABELS[threatType] || threatType.toUpperCase(),
          color
        );
      }
    }

    // Spawn data packets traveling between affected nodes (reduced on mobile)
    if (affectedIndices.length > 0) {
      const packetCount = this.isMobileDevice
        ? Math.min(1, Math.ceil(burstSize / 3))
        : Math.min(3, Math.ceil(burstSize / 2));
      for (let i = 0; i < packetCount; i++) {
        const startIdx = affectedIndices[Math.floor(Math.random() * affectedIndices.length)];
        this.spawnPacket(startIdx, color);
      }
    }

    // Spawn 3D floating data fragment with extra info
    if (spawnPos && extraData && Math.random() < 0.7) {
      // Offset the fragment position from the source
      const fragmentPos = spawnPos.clone();
      fragmentPos.x += (Math.random() - 0.5) * 15;
      fragmentPos.y += 5 + Math.random() * 10;
      fragmentPos.z += (Math.random() - 0.5) * 10;
      // Pass source position for connection line
      this.spawnDataFragment(extraData, fragmentPos, color, spawnPos);
    }

    return spawnPos;
  }

  private addFloatingLabel(worldPos: THREE.Vector3, text: string, color: THREE.Color) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position: absolute;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: bold;
      color: #${color.getHexString()};
      text-shadow: 0 0 10px #${color.getHexString()}, 0 0 20px #${color.getHexString()};
      white-space: nowrap;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    `;
    this.labelContainer.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    this.floatingLabels.push({
      element: el,
      worldPos: worldPos.clone(),
      lifetime: 0,
      maxLifetime: 2.5,
    });
  }

  // Public: Spawn a geographic country label near an event
  spawnGeoLabel(worldPos: THREE.Vector3, country: string, severity: 'critical' | 'high' | 'medium' | 'low' = 'medium') {
    if (!country || country.length < 2) return;

    // Limit concurrent geo labels (reduced on mobile)
    const maxGeoLabels = this.isMobileDevice ? 4 : 8;
    const geoLabelCount = this.floatingLabels.filter(l => l.element.classList.contains('geo-label')).length;
    if (geoLabelCount >= maxGeoLabels) return;

    // Severity colors
    const severityColors: Record<string, string> = {
      critical: '#ff0044',
      high: '#ff6600',
      medium: '#33ff66',
      low: '#44aaaa',
    };
    const color = severityColors[severity] || severityColors.medium;

    const el = document.createElement('div');
    el.className = 'geo-label';
    el.innerHTML = `<span class="geo-icon">◎</span> ${country.toUpperCase()}`;
    el.style.cssText = `
      position: absolute;
      font-family: 'JetBrains Mono', monospace;
      font-size: ${severity === 'critical' ? '14px' : severity === 'high' ? '12px' : '11px'};
      font-weight: 600;
      letter-spacing: 0.1em;
      color: ${color};
      text-shadow: 0 0 8px ${color}, 0 0 16px ${color}40;
      white-space: nowrap;
      opacity: 0;
      transform: translateY(8px) scale(0.9);
      transition: opacity 0.3s ease-out, transform 0.3s ease-out;
      pointer-events: none;
      z-index: 20;
    `;

    this.labelContainer.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    });

    // Offset slightly upward so it appears above the event
    const offsetPos = worldPos.clone();
    offsetPos.y += 15;

    this.floatingLabels.push({
      element: el,
      worldPos: offsetPos,
      lifetime: 0,
      maxLifetime: severity === 'critical' ? 4 : severity === 'high' ? 3.5 : 3,
    });
  }

  // Public handlers - with 3D data fragments (return spawn position for connection lines)
  handleMalwareUrl(hit: URLhausHit): THREE.Vector3 | null {
    let domain = 'unknown';
    try {
      if (hit.url) domain = new URL(hit.url).hostname;
    } catch { /* invalid URL */ }
    const info = hit.threat || domain;
    // Generate hex-like hash fragment for visual interest
    const hexFragment = Math.random().toString(16).substring(2, 10).toUpperCase();
    const pos = this.spawnThreat('malware', 3, `MALWARE: ${info}`, `0x${hexFragment}`);
    if (hit.url && Math.random() < 0.5) {
      this.spawnThreat('malware', 1, domain, hit.url?.substring(0, 40));
    }
    return pos;
  }

  handleGreyNoise(data: GreyNoiseData): THREE.Vector3 | null {
    return this.spawnThreat('scanner', 1, `SCAN: ${data.scannerCount || '?'}`, data.topTags?.[0]);
  }

  updateScannerNoise(data: GreyNoiseData) {
    if (data.scannerCount > 0) {
      const count = Math.min(2, Math.floor(data.scannerCount / 200));
      this.spawnThreat('scanner', count, `${data.scannerCount} scanners`);
    }
  }

  handleHoneypotAttack(attack: DShieldAttack): THREE.Vector3 | null {
    const info = attack.sourceIp
      ? `${attack.sourceIp}`
      : attack.attackType || 'HONEYPOT';
    return this.spawnThreat('honeypot', 2, info, attack.targetPort ? `PORT:${attack.targetPort}` : undefined);
  }

  handleBotnetC2(c2: FeodoC2): THREE.Vector3 | null {
    const info = c2.malware || 'BOTNET';
    return this.spawnThreat('c2', 4, `C2: ${info}`, c2.ip ? `${c2.ip}:${c2.port}` : undefined);
  }

  handleRansomwareVictim(victim: RansomwareVictim): THREE.Vector3 | null {
    const pos = this.spawnThreat('ransomware', 8, `${victim.group}`, victim.domain);
    this.tension = Math.min(1, this.tension + 0.2);
    // Delayed secondary info
    if (victim.victim) {
      setTimeout(() => {
        this.spawnThreat('ransomware', 2, victim.victim, victim.sector);
      }, 400);
    }
    return pos;
  }

  handlePhishing(phish: PhishingURL): THREE.Vector3 | null {
    const target = phish.targetBrand || 'PHISH';
    return this.spawnThreat('phishing', 2, target, phish.domain);
  }

  handleMaliciousCert(entry: SSLBlacklistEntry): THREE.Vector3 | null {
    const info = entry.malware || 'BAD CERT';
    return this.spawnThreat('cert', 2, info, entry.sha1?.substring(0, 16));
  }

  handleBruteforce(attack: BruteforceAttack): THREE.Vector3 | null {
    return this.spawnThreat('bruteforce', 2, attack.sourceIp || 'BRUTE', attack.service?.toUpperCase());
  }

  handleTorNode(node: TorExitNode): THREE.Vector3 | null {
    return this.spawnThreat('tor', 1, node.nickname || 'TOR', node.fingerprint?.substring(0, 12));
  }

  handleBreach(breach: HIBPBreach): THREE.Vector3 | null {
    const countStr = breach.pwnCount > 1000000
      ? `${(breach.pwnCount / 1000000).toFixed(1)}M`
      : `${(breach.pwnCount / 1000).toFixed(0)}K`;
    const pos = this.spawnThreat('breach', 10, breach.title, `${countStr} RECORDS`);
    this.tension = Math.min(1, this.tension + 0.3);

    // Spawn multiple data fragments for major breaches
    if (breach.pwnCount > 100000) {
      setTimeout(() => {
        const dataTypes = breach.dataClasses?.slice(0, 3).join(' • ') || 'PASSWORDS';
        this.spawnThreat('breach', 3, dataTypes);
      }, 300);
    }
    return pos;
  }

  handleSpamhaus(drop: SpamhausDrop): THREE.Vector3 | null {
    return this.spawnThreat('hijack', 3, drop.cidr, `${drop.numAddresses} IPs`);
  }

  handleBGPEvent(event: BGPEvent): THREE.Vector3 | null {
    const burst = event.severity === 'critical' ? 6 : event.severity === 'high' ? 4 : 2;
    const type = event.eventType?.toUpperCase() || 'BGP';
    return this.spawnThreat('bgp', burst, `${type}: ${event.prefix}`, event.asNumber ? `AS${event.asNumber}` : undefined);
  }

  // === PUBLIC API ===

  setOnNodeHover(cb: (node: any) => void) {}
  setOnNodeSelect(cb: (node: any) => void) {}

  setPalette(key: string) {
    const theme = THEMES[key];
    if (!theme) return;

    currentTheme = theme;
    console.log(`[Visual] Theme: ${theme.name}`);

    // Update scene background
    this.scene.background = new THREE.Color(theme.void);
    this.dominantColor.set(theme.void);

    // Update all existing particles to use new ambient color
    const ambientColor = new THREE.Color(theme.ambient);
    for (const p of this.particles) {
      p.targetColor.copy(ambientColor);
      p.color.copy(ambientColor);
    }

    // Update data rain color
    if (this.rainMaterial) {
      this.rainMaterial.uniforms.themeColor = { value: new THREE.Color(theme.rain) };
    }

    // Update bloom intensity (base is set dynamically in render loop, this just adjusts for theme)
    // Theme bloom multipliers are relative - the render loop handles actual values

    // Store visualizer settings for use in updateVisualizer
    this.visualizerHue = theme.visualizer.hue;
    this.visualizerSaturation = theme.visualizer.saturation;
  }

  getPalettes() {
    return Object.entries(THEMES).map(([key, theme]) => ({
      key,
      name: theme.name
    }));
  }
  getStats() {
    return {
      nodes: this.particleCount,
      formation: FORMATIONS[this.currentFormationIndex].name,
      tension: this.tension,
    };
  }

  // Set waveform data from audio engine
  setWaveformData(data: Float32Array) {
    this.waveformData = data;
  }

  private onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    // Resize visualizer canvas
    if (this.visualizerCanvas) {
      this.visualizerCanvas.width = w;
    }

    // Resize data stream canvas
    if (this.dataStreamCanvas) {
      this.dataStreamCanvas.width = w;
      this.dataStreamCanvas.height = h;
    }
  }

  dispose() {
    this.labelContainer.remove();
    if (this.visualizerCanvas) this.visualizerCanvas.remove();
    if (this.dataStreamCanvas) this.dataStreamCanvas.remove();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
    this.trailGeometry.dispose();
    this.trailMaterial.dispose();
    this.rainGeometry.dispose();
    this.rainMaterial.dispose();
    this.packetGeometry.dispose();
    this.packetMaterial.dispose();
    this.renderer.dispose();
  }
}

export type PaletteKey = string;
