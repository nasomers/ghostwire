// Ghostwire Visual Engine v6 - Acid Trip Neural Storm
// Abstract neural network with informative threat visualization

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

interface Neuron {
  id: number;
  position: THREE.Vector3;
  connections: number[];
  state: 'resting' | 'firing' | 'refractory';
  brightness: number;
  targetBrightness: number;
  color: THREE.Color;
  targetColor: THREE.Color;
  refractoryTimer: number;
  baseSize: number;
  lastThreatType: string;
}

interface Pulse {
  id: number;
  fromNeuron: number;
  toNeuron: number;
  progress: number;
  speed: number;
  color: THREE.Color;
  intensity: number;
  threatType: string;
}

interface FloatingLabel {
  element: HTMLDivElement;
  worldPos: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

interface Trail {
  position: THREE.Vector3;
  color: THREE.Color;
  life: number;
  size: number;
}

// === COLORS ===

const VOID_COLOR = 0x030506;
const AMBIENT_NEURON_COLOR = new THREE.Color(0x1a3a4a); // Dark teal when idle

const THREAT_COLORS: Record<string, number> = {
  malware:    0xff2244,  // red
  ransomware: 0xff0066,  // hot pink
  c2:         0xff6600,  // orange
  honeypot:   0xffaa00,  // amber
  phishing:   0xaaff00,  // lime
  cert:       0x00ffaa,  // cyan-green
  bruteforce: 0x00ccff,  // cyan
  tor:        0x9944ff,  // purple
  scanner:    0x4488ff,  // blue
  breach:     0xffffff,  // white
  hijack:     0xff4400,  // orange-red
  bgp:        0xdd44ff,  // magenta
};

const THREAT_LABELS: Record<string, string> = {
  malware:    'MALWARE',
  ransomware: 'RANSOMWARE',
  c2:         'BOTNET C2',
  honeypot:   'HONEYPOT',
  phishing:   'PHISHING',
  cert:       'BAD CERT',
  bruteforce: 'BRUTE FORCE',
  tor:        'TOR',
  scanner:    'SCANNER',
  breach:     'DATA BREACH',
  hijack:     'IP HIJACK',
  bgp:        'BGP ANOMALY',
};

// === CHROMATIC ABERRATION SHADER ===

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

      // Radial chromatic aberration
      vec2 dir = normalize(center);
      float aberration = amount * (1.0 + dist * 2.0);

      // Add time-based wobble
      aberration *= 1.0 + 0.3 * sin(time * 2.0 + dist * 10.0);

      vec2 rOffset = dir * aberration;
      vec2 bOffset = -dir * aberration;

      float r = texture2D(tDiffuse, vUv + rOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + bOffset).b;

      // Scanlines
      float scanline = sin(vUv.y * 800.0) * 0.04 + 1.0;

      gl_FragColor = vec4(r * scanline, g * scanline, b * scanline, 1.0);
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

  // Neural network
  private neurons: Neuron[] = [];
  private pulses: Pulse[] = [];
  private trails: Trail[] = [];
  private pendingCascades: Array<{neuronId: number; delay: number; color: THREE.Color; threatType: string; intensity: number}> = [];
  private neuronCount: number;
  private maxConnections: number;
  private connectionDistance = 50;

  // Floating labels
  private labelContainer: HTMLDivElement;
  private floatingLabels: FloatingLabel[] = [];

  // Rendering
  private neuronGeometry!: THREE.BufferGeometry;
  private neuronMaterial!: THREE.ShaderMaterial;
  private neuronPoints!: THREE.Points;
  private axonGeometry!: THREE.BufferGeometry;
  private axonMaterial!: THREE.ShaderMaterial;
  private axonLines!: THREE.LineSegments;
  private pulseGeometry!: THREE.BufferGeometry;
  private pulseMaterial!: THREE.ShaderMaterial;
  private pulsePoints!: THREE.Points;
  private trailGeometry!: THREE.BufferGeometry;
  private trailMaterial!: THREE.ShaderMaterial;
  private trailPoints!: THREE.Points;

  // State
  private time = 0;
  private tension = 0;
  private pulseIdCounter = 0;
  private maxPulses = 500;
  private maxTrails = 2000;
  private dominantColor = new THREE.Color(VOID_COLOR);

  // Camera
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraDriftAngle = 0;

  // Callbacks
  private onNodeHover: ((node: any) => void) | null = null;
  private onNodeSelect: ((node: any) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isMobileDevice = isMobile();

    // Settings based on device
    this.neuronCount = this.isMobileDevice ? 200 : 600;
    this.maxConnections = this.isMobileDevice ? 3 : 5;
    this.maxPulses = this.isMobileDevice ? 200 : 500;
    this.maxTrails = this.isMobileDevice ? 500 : 2000;

    // Create label container
    this.labelContainer = document.createElement('div');
    this.labelContainer.id = 'threat-labels';
    this.labelContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;overflow:hidden;';
    document.body.appendChild(this.labelContainer);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VOID_COLOR);

    // Camera
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(0, 0, 180);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: this.isMobileDevice ? 'low-power' : 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobileDevice ? 1.5 : 2));

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.isMobileDevice ? 1.5 : 2.5,
      0.5,
      0.2
    );
    this.composer.addPass(this.bloomPass);

    this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
    this.composer.addPass(this.chromaticPass);

    // Build network
    this.generateNetwork();
    this.initNeuronRendering();
    this.initAxonRendering();
    this.initPulseRendering();
    this.initTrailRendering();

    window.addEventListener('resize', this.onResize.bind(this));

    console.log(`[Neural Storm v6] ${this.neurons.length} neurons, acid trip mode`);
  }

  // === NETWORK ===

  private generateNetwork() {
    const spread = 120;

    for (let i = 0; i < this.neuronCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spread * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.7; // Flatten vertically
      const z = r * Math.cos(phi) * 0.4;

      this.neurons.push({
        id: i,
        position: new THREE.Vector3(x, y, z),
        connections: [],
        state: 'resting',
        brightness: 0.3,
        targetBrightness: 0.3,
        color: AMBIENT_NEURON_COLOR.clone(),
        targetColor: AMBIENT_NEURON_COLOR.clone(),
        refractoryTimer: 0,
        baseSize: 1.5 + Math.random() * 0.5,
        lastThreatType: '',
      });
    }

    // Connect neurons
    for (let i = 0; i < this.neurons.length; i++) {
      const neuron = this.neurons[i];
      const candidates: {id: number; dist: number}[] = [];

      for (let j = 0; j < this.neurons.length; j++) {
        if (i === j) continue;
        const dist = neuron.position.distanceTo(this.neurons[j].position);
        if (dist < this.connectionDistance) {
          candidates.push({id: j, dist});
        }
      }

      candidates.sort((a, b) => a.dist - b.dist);
      const count = Math.min(this.maxConnections, Math.floor(2 + Math.random() * 2), candidates.length);

      for (let k = 0; k < count; k++) {
        const targetId = candidates[k].id;
        if (!neuron.connections.includes(targetId)) {
          neuron.connections.push(targetId);
          if (!this.neurons[targetId].connections.includes(i)) {
            this.neurons[targetId].connections.push(i);
          }
        }
      }
    }
  }

  // === RENDERING SETUP ===

  private initNeuronRendering() {
    const positions = new Float32Array(this.neurons.length * 3);
    const colors = new Float32Array(this.neurons.length * 3);
    const sizes = new Float32Array(this.neurons.length);

    for (let i = 0; i < this.neurons.length; i++) {
      const n = this.neurons[i];
      positions[i * 3] = n.position.x;
      positions[i * 3 + 1] = n.position.y;
      positions[i * 3 + 2] = n.position.z;
      colors[i * 3] = n.color.r;
      colors[i * 3 + 1] = n.color.g;
      colors[i * 3 + 2] = n.color.b;
      sizes[i] = n.baseSize * n.brightness;
    }

    this.neuronGeometry = new THREE.BufferGeometry();
    this.neuronGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.neuronGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.neuronGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.neuronMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: {value: 0},
        pixelRatio: {value: this.renderer.getPixelRatio()},
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float pixelRatio;
        uniform float time;

        void main() {
          vColor = color;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);

          // Pulsing size
          float pulse = 1.0 + 0.2 * sin(time * 3.0 + position.x * 0.1);
          gl_PointSize = size * pulse * 15.0 * (150.0 / -mvPos.z) * pixelRatio;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;

          // Bright center, soft edge
          float glow = 1.0 - d * 1.8;
          glow = pow(glow, 1.5);

          gl_FragColor = vec4(vColor * 2.0, glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.neuronPoints = new THREE.Points(this.neuronGeometry, this.neuronMaterial);
    this.scene.add(this.neuronPoints);
  }

  private initAxonRendering() {
    let connectionCount = 0;
    for (const n of this.neurons) connectionCount += n.connections.length;

    const positions = new Float32Array(connectionCount * 6);
    const colors = new Float32Array(connectionCount * 6);
    let idx = 0;

    for (const neuron of this.neurons) {
      for (const targetId of neuron.connections) {
        const target = this.neurons[targetId];
        positions[idx * 6] = neuron.position.x;
        positions[idx * 6 + 1] = neuron.position.y;
        positions[idx * 6 + 2] = neuron.position.z;
        positions[idx * 6 + 3] = target.position.x;
        positions[idx * 6 + 4] = target.position.y;
        positions[idx * 6 + 5] = target.position.z;

        // Very dark teal
        const c = 0.03;
        colors[idx * 6] = c * 0.3;
        colors[idx * 6 + 1] = c * 0.8;
        colors[idx * 6 + 2] = c;
        colors[idx * 6 + 3] = c * 0.3;
        colors[idx * 6 + 4] = c * 0.8;
        colors[idx * 6 + 5] = c;
        idx++;
      }
    }

    this.axonGeometry = new THREE.BufferGeometry();
    this.axonGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.axonGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.axonMaterial = new THREE.ShaderMaterial({
      uniforms: {tension: {value: 0}},
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
          gl_FragColor = vec4(vColor * (1.0 + tension), 0.2 + tension * 0.15);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.axonLines = new THREE.LineSegments(this.axonGeometry, this.axonMaterial);
    this.scene.add(this.axonLines);
  }

  private initPulseRendering() {
    const positions = new Float32Array(this.maxPulses * 3);
    const colors = new Float32Array(this.maxPulses * 3);
    const sizes = new Float32Array(this.maxPulses);

    this.pulseGeometry = new THREE.BufferGeometry();
    this.pulseGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.pulseGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.pulseGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.pulseMaterial = new THREE.ShaderMaterial({
      uniforms: {pixelRatio: {value: this.renderer.getPixelRatio()}},
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 20.0 * (150.0 / -mvPos.z) * pixelRatio;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float glow = pow(1.0 - d * 2.0, 2.0);
          gl_FragColor = vec4(vColor * 3.0, glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pulsePoints = new THREE.Points(this.pulseGeometry, this.pulseMaterial);
    this.scene.add(this.pulsePoints);
  }

  private initTrailRendering() {
    const positions = new Float32Array(this.maxTrails * 3);
    const colors = new Float32Array(this.maxTrails * 3);
    const sizes = new Float32Array(this.maxTrails);

    this.trailGeometry = new THREE.BufferGeometry();
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.trailGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.trailMaterial = new THREE.ShaderMaterial({
      uniforms: {pixelRatio: {value: this.renderer.getPixelRatio()}},
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 8.0 * (150.0 / -mvPos.z) * pixelRatio;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSize;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * vSize;
          gl_FragColor = vec4(vColor, alpha * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.trailPoints = new THREE.Points(this.trailGeometry, this.trailMaterial);
    this.scene.add(this.trailPoints);
  }

  // === FIRING ===

  private fireNeuron(neuronId: number, color: THREE.Color, threatType: string, intensity: number = 1) {
    const neuron = this.neurons[neuronId];
    if (!neuron || neuron.state !== 'resting') return;

    neuron.state = 'firing';
    neuron.targetBrightness = 1.5 * intensity;
    neuron.targetColor = color.clone();
    neuron.lastThreatType = threatType;
    neuron.refractoryTimer = 0.8 + Math.random() * 0.4;

    // Spawn pulses
    for (const targetId of neuron.connections) {
      if (this.pulses.length < this.maxPulses) {
        this.pulses.push({
          id: this.pulseIdCounter++,
          fromNeuron: neuronId,
          toNeuron: targetId,
          progress: 0,
          speed: 1.2 + Math.random() * 0.8,
          color: color.clone(),
          intensity,
          threatType,
        });
      }
    }
  }

  private spawnThreat(threatType: string, burstSize: number = 1, label?: string) {
    const color = new THREE.Color(THREAT_COLORS[threatType] || 0xffffff);
    this.tension = Math.min(1, this.tension + 0.08 * burstSize);

    // Blend dominant color
    this.dominantColor.lerp(color, 0.3);

    for (let i = 0; i < burstSize; i++) {
      const neuronId = Math.floor(Math.random() * this.neurons.length);
      this.fireNeuron(neuronId, color, threatType, 1.0);

      // Add floating label on first burst
      if (i === 0 && !this.isMobileDevice) {
        this.addFloatingLabel(
          this.neurons[neuronId].position,
          label || THREAT_LABELS[threatType] || threatType.toUpperCase(),
          color
        );
      }

      // Cascade
      if (Math.random() < 0.4 + this.tension * 0.3) {
        for (const targetId of this.neurons[neuronId].connections) {
          if (Math.random() < 0.5) {
            this.pendingCascades.push({
              neuronId: targetId,
              delay: 0.1 + Math.random() * 0.15,
              color: color.clone(),
              threatType,
              intensity: 0.7,
            });
          }
        }
      }
    }
  }

  private addFloatingLabel(worldPos: THREE.Vector3, text: string, color: THREE.Color) {
    const el = document.createElement('div');
    el.className = 'threat-label';
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
    `;
    this.labelContainer.appendChild(el);

    // Trigger animation
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

  // === HANDLERS ===

  handleMalwareUrl(hit: URLhausHit) {
    this.spawnThreat('malware', 3, hit.threat || 'MALWARE');
  }

  handleGreyNoise(data: GreyNoiseData) {
    this.spawnThreat('scanner', 1);
  }

  updateScannerNoise(data: GreyNoiseData) {
    if (data.scannerCount > 0) {
      this.spawnThreat('scanner', Math.min(2, Math.floor(data.scannerCount / 200)));
    }
  }

  handleHoneypotAttack(attack: DShieldAttack) {
    this.spawnThreat('honeypot', 2, `ATTACK :${attack.targetPort}`);
  }

  handleBotnetC2(c2: FeodoC2) {
    this.spawnThreat('c2', 4, c2.malware || 'BOTNET C2');
  }

  handleRansomwareVictim(victim: RansomwareVictim) {
    this.spawnThreat('ransomware', 6, victim.group);
    this.tension = Math.min(1, this.tension + 0.25);
  }

  handlePhishing(phish: PhishingURL) {
    this.spawnThreat('phishing', 2, phish.targetBrand || 'PHISHING');
  }

  handleMaliciousCert(entry: SSLBlacklistEntry) {
    this.spawnThreat('cert', 2, entry.malware);
  }

  handleBruteforce(attack: BruteforceAttack) {
    this.spawnThreat('bruteforce', 2, attack.attackType || 'BRUTE FORCE');
  }

  handleTorNode(node: TorExitNode) {
    this.spawnThreat('tor', 1, node.nickname || 'TOR EXIT');
  }

  handleBreach(breach: HIBPBreach) {
    this.spawnThreat('breach', 8, breach.title);
    this.tension = Math.min(1, this.tension + 0.35);
  }

  handleSpamhaus(drop: SpamhausDrop) {
    this.spawnThreat('hijack', 3, drop.cidr);
  }

  handleBGPEvent(event: BGPEvent) {
    const burst = event.severity === 'critical' ? 5 : event.severity === 'high' ? 3 : 2;
    this.spawnThreat('bgp', burst, event.prefix);
  }

  // === UPDATE ===

  update(deltaTime: number) {
    this.time += deltaTime;
    this.tension = Math.max(0, this.tension - deltaTime * 0.06);

    // Dominant color fades back to void
    this.dominantColor.lerp(new THREE.Color(VOID_COLOR), deltaTime * 0.5);

    this.updateNeurons(deltaTime);
    this.updatePulses(deltaTime);
    this.updateTrails(deltaTime);
    this.processCascades(deltaTime);
    this.updateLabels(deltaTime);
    this.updateCamera(deltaTime);

    // Uniforms
    this.neuronMaterial.uniforms.time.value = this.time;
    this.axonMaterial.uniforms.tension.value = this.tension;

    // Post-processing responds to tension
    this.bloomPass.strength = 1.5 + this.tension * 1.5;
    this.chromaticPass.uniforms.amount.value = 0.002 + this.tension * 0.008;
    this.chromaticPass.uniforms.time.value = this.time;

    // Background color shifts
    this.scene.background = this.dominantColor.clone().multiplyScalar(0.15);
  }

  private updateNeurons(dt: number) {
    const colors = this.neuronGeometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.neuronGeometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < this.neurons.length; i++) {
      const n = this.neurons[i];

      // State transitions
      if (n.state === 'firing' || n.state === 'refractory') {
        n.refractoryTimer -= dt;
        if (n.refractoryTimer <= 0) {
          n.state = 'resting';
          n.targetBrightness = 0.3;
          n.targetColor = AMBIENT_NEURON_COLOR.clone();
        } else if (n.state === 'firing' && n.refractoryTimer < 0.4) {
          n.state = 'refractory';
        }
      }

      // Smooth transitions
      n.brightness += (n.targetBrightness - n.brightness) * dt * 6;
      n.color.lerp(n.targetColor, dt * 4);

      // Update buffers
      colors.array[i * 3] = n.color.r * n.brightness;
      colors.array[i * 3 + 1] = n.color.g * n.brightness;
      colors.array[i * 3 + 2] = n.color.b * n.brightness;
      sizes.array[i] = n.baseSize * (0.5 + n.brightness * 0.5);
    }

    colors.needsUpdate = true;
    sizes.needsUpdate = true;
  }

  private updatePulses(dt: number) {
    const pos = this.pulseGeometry.attributes.position as THREE.BufferAttribute;
    const col = this.pulseGeometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.pulseGeometry.attributes.size as THREE.BufferAttribute;
    const done: number[] = [];

    for (let i = 0; i < this.pulses.length && i < this.maxPulses; i++) {
      const p = this.pulses[i];
      p.progress += dt * p.speed;

      if (p.progress >= 1) {
        done.push(i);
        // Maybe cascade
        const target = this.neurons[p.toNeuron];
        if (target && target.state === 'resting' && Math.random() < 0.3 + this.tension * 0.4) {
          this.fireNeuron(p.toNeuron, p.color, p.threatType, p.intensity * 0.6);
        }
      } else {
        const from = this.neurons[p.fromNeuron].position;
        const to = this.neurons[p.toNeuron].position;
        const position = new THREE.Vector3().lerpVectors(from, to, p.progress);

        pos.array[i * 3] = position.x;
        pos.array[i * 3 + 1] = position.y;
        pos.array[i * 3 + 2] = position.z;
        col.array[i * 3] = p.color.r;
        col.array[i * 3 + 1] = p.color.g;
        col.array[i * 3 + 2] = p.color.b;
        sizes.array[i] = Math.sin(p.progress * Math.PI) * p.intensity;

        // Leave trail
        if (this.trails.length < this.maxTrails && Math.random() < 0.3) {
          this.trails.push({
            position: position.clone(),
            color: p.color.clone(),
            life: 1.0,
            size: 0.5 + Math.random() * 0.5,
          });
        }
      }
    }

    // Remove completed
    for (let i = done.length - 1; i >= 0; i--) {
      this.pulses.splice(done[i], 1);
    }

    // Clear unused
    for (let i = this.pulses.length; i < this.maxPulses; i++) {
      sizes.array[i] = 0;
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    sizes.needsUpdate = true;
  }

  private updateTrails(dt: number) {
    const pos = this.trailGeometry.attributes.position as THREE.BufferAttribute;
    const col = this.trailGeometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.trailGeometry.attributes.size as THREE.BufferAttribute;

    // Update and remove dead trails
    for (let i = this.trails.length - 1; i >= 0; i--) {
      this.trails[i].life -= dt * 2;
      if (this.trails[i].life <= 0) {
        this.trails.splice(i, 1);
      }
    }

    // Update buffers
    for (let i = 0; i < this.maxTrails; i++) {
      if (i < this.trails.length) {
        const t = this.trails[i];
        pos.array[i * 3] = t.position.x;
        pos.array[i * 3 + 1] = t.position.y;
        pos.array[i * 3 + 2] = t.position.z;
        col.array[i * 3] = t.color.r;
        col.array[i * 3 + 1] = t.color.g;
        col.array[i * 3 + 2] = t.color.b;
        sizes.array[i] = t.size * t.life;
      } else {
        sizes.array[i] = 0;
      }
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    sizes.needsUpdate = true;
  }

  private processCascades(dt: number) {
    for (let i = this.pendingCascades.length - 1; i >= 0; i--) {
      this.pendingCascades[i].delay -= dt;
      if (this.pendingCascades[i].delay <= 0) {
        const c = this.pendingCascades.splice(i, 1)[0];
        this.fireNeuron(c.neuronId, c.color, c.threatType, c.intensity);
      }
    }
  }

  private updateLabels(dt: number) {
    for (let i = this.floatingLabels.length - 1; i >= 0; i--) {
      const label = this.floatingLabels[i];
      label.lifetime += dt;

      if (label.lifetime >= label.maxLifetime) {
        label.element.style.opacity = '0';
        label.element.style.transform = 'translateY(-20px)';
        setTimeout(() => label.element.remove(), 300);
        this.floatingLabels.splice(i, 1);
        continue;
      }

      // Project to screen
      const projected = label.worldPos.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      // Only show if in front of camera
      if (projected.z < 1) {
        label.element.style.left = `${x}px`;
        label.element.style.top = `${y}px`;

        // Fade out near end
        if (label.lifetime > label.maxLifetime - 0.5) {
          const fade = (label.maxLifetime - label.lifetime) / 0.5;
          label.element.style.opacity = String(fade);
        }
      } else {
        label.element.style.opacity = '0';
      }
    }
  }

  private updateCamera(dt: number) {
    this.cameraDriftAngle += 0.015 * dt;

    const radius = 25 + this.tension * 15;
    const x = Math.cos(this.cameraDriftAngle) * radius;
    const y = Math.sin(this.cameraDriftAngle * 0.6) * radius * 0.4;
    const z = 160 - this.tension * 30 + Math.sin(this.cameraDriftAngle * 0.3) * 20;

    this.camera.position.lerp(new THREE.Vector3(x, y, z), dt * 1.5);
    this.camera.lookAt(this.cameraTarget);
  }

  render() {
    this.composer.render();
  }

  // === PUBLIC API ===

  setOnNodeHover(cb: (node: any) => void) { this.onNodeHover = cb; }
  setOnNodeSelect(cb: (node: any) => void) { this.onNodeSelect = cb; }
  setPalette(key: string) {}
  getPalettes() { return [{key: 'neural', name: 'Neural Storm'}]; }
  getStats() {
    return {nodes: this.neurons.length, pulses: this.pulses.length, tension: this.tension};
  }

  private onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  dispose() {
    this.labelContainer.remove();
    this.neuronGeometry.dispose();
    this.neuronMaterial.dispose();
    this.axonGeometry.dispose();
    this.axonMaterial.dispose();
    this.pulseGeometry.dispose();
    this.pulseMaterial.dispose();
    this.trailGeometry.dispose();
    this.trailMaterial.dispose();
    this.renderer.dispose();
  }
}

export type PaletteKey = string;
