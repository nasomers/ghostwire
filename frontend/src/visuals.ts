// Ghostwire Visual Engine v5 - Neural Storm
// Abstract neural network visualization - synapses firing across darkness

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
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
  connections: number[]; // IDs of connected neurons
  state: 'resting' | 'firing' | 'refractory';
  brightness: number;
  targetBrightness: number;
  refractoryTimer: number;
  baseSize: number;
}

interface Pulse {
  id: number;
  fromNeuron: number;
  toNeuron: number;
  progress: number; // 0 to 1
  speed: number;
  color: THREE.Color;
  intensity: number;
  threatType: string;
}

interface CascadeEvent {
  neuronId: number;
  delay: number;
  color: THREE.Color;
  threatType: string;
  intensity: number;
}

// === COLORS ===

const VOID_COLOR = 0x020304;

const THREAT_COLORS: Record<string, number> = {
  malware:    0xff2244,  // red
  ransomware: 0xff0055,  // hot pink/red
  c2:         0xff6600,  // orange
  honeypot:   0xffaa00,  // amber
  phishing:   0xaaff00,  // yellow-green
  cert:       0x00ffaa,  // teal
  bruteforce: 0x00aaff,  // cyan
  tor:        0x8844ff,  // purple
  scanner:    0x4488ff,  // blue
  breach:     0xffffff,  // white flash
  hijack:     0xff4400,  // orange-red
  bgp:        0xcc44ff,  // magenta
};

// === MOBILE DETECTION ===

function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth < 768);
}

// === NEURAL STORM ENGINE ===

export class VisualEngine {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private isMobileDevice: boolean;

  // Neural network
  private neurons: Neuron[] = [];
  private pulses: Pulse[] = [];
  private pendingCascades: CascadeEvent[] = [];
  private neuronCount: number;
  private maxConnections: number;
  private connectionDistance = 60;

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

  // State
  private time = 0;
  private tension = 0;
  private pulseIdCounter = 0;

  // Camera drift
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraOffset = new THREE.Vector3(0, 0, 200);
  private cameraDriftAngle = 0;
  private cameraDriftSpeed = 0.02;

  // Callbacks
  private onNodeHover: ((node: any) => void) | null = null;
  private onNodeSelect: ((node: any) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isMobileDevice = isMobile();

    // Mobile-optimized settings
    if (this.isMobileDevice) {
      this.neuronCount = 300;  // Fewer neurons on mobile
      this.maxConnections = 4;
      console.log('[Neural Storm] Mobile mode: reduced particle count');
    } else {
      this.neuronCount = 800;
      this.maxConnections = 6;
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VOID_COLOR);

    // Camera - wide FOV for immersion
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(0, 0, 200);

    // Renderer with mobile-friendly settings
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: this.isMobileDevice ? 'low-power' : 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobileDevice ? 1.5 : 2));

    // Handle WebGL context loss
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[Neural Storm] WebGL context lost');
    });

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('[Neural Storm] WebGL context restored');
      this.initNeuronRendering();
      this.initAxonRendering();
      this.initPulseRendering();
    });

    // Post-processing with bloom (reduced on mobile)
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomResolution = this.isMobileDevice
      ? new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2)
      : new THREE.Vector2(window.innerWidth, window.innerHeight);

    this.bloomPass = new UnrealBloomPass(
      bloomResolution,
      this.isMobileDevice ? 1.2 : 2.0,   // strength - stronger bloom
      this.isMobileDevice ? 0.4 : 0.6,   // radius - wider glow
      0.3   // threshold - lower = more things bloom
    );
    this.composer.addPass(this.bloomPass);

    // Build the neural network
    this.generateNetwork();
    this.initNeuronRendering();
    this.initAxonRendering();
    this.initPulseRendering();

    window.addEventListener('resize', this.onResize.bind(this));

    console.log(`[Neural Storm] Initialized with ${this.neurons.length} neurons`);
  }

  // === NETWORK GENERATION ===

  private generateNetwork() {
    // Generate neurons spread across 3D space
    const spread = 150;

    for (let i = 0; i < this.neuronCount; i++) {
      // Use spherical distribution for even spread
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spread * Math.cbrt(Math.random()); // Cube root for volume distribution

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi) * 0.5; // Flatten z for more screen coverage

      this.neurons.push({
        id: i,
        position: new THREE.Vector3(x, y, z),
        connections: [],
        state: 'resting',
        brightness: 0.4 + Math.random() * 0.2, // Brighter ambient glow
        targetBrightness: 0.4,
        refractoryTimer: 0,
        baseSize: 2.0 + Math.random() * 1.0, // Larger base size
      });
    }

    // Connect nearby neurons
    for (let i = 0; i < this.neurons.length; i++) {
      const neuron = this.neurons[i];
      const candidates: { id: number; dist: number }[] = [];

      for (let j = 0; j < this.neurons.length; j++) {
        if (i === j) continue;
        const dist = neuron.position.distanceTo(this.neurons[j].position);
        if (dist < this.connectionDistance) {
          candidates.push({ id: j, dist });
        }
      }

      // Sort by distance and take closest
      candidates.sort((a, b) => a.dist - b.dist);
      const connectionCount = Math.min(
        this.maxConnections,
        Math.floor(2 + Math.random() * 3),
        candidates.length
      );

      for (let k = 0; k < connectionCount; k++) {
        const targetId = candidates[k].id;
        if (!neuron.connections.includes(targetId)) {
          neuron.connections.push(targetId);
        }
        // Bidirectional
        if (!this.neurons[targetId].connections.includes(i)) {
          this.neurons[targetId].connections.push(i);
        }
      }
    }

    console.log(`[Neural Storm] Network generated: ${this.neurons.length} neurons, ~${this.neurons.reduce((sum, n) => sum + n.connections.length, 0)} connections`);
  }

  // === RENDERING SETUP ===

  private initNeuronRendering() {
    const positions = new Float32Array(this.neurons.length * 3);
    const colors = new Float32Array(this.neurons.length * 3);
    const sizes = new Float32Array(this.neurons.length);
    const brightness = new Float32Array(this.neurons.length);

    for (let i = 0; i < this.neurons.length; i++) {
      const n = this.neurons[i];
      positions[i * 3] = n.position.x;
      positions[i * 3 + 1] = n.position.y;
      positions[i * 3 + 2] = n.position.z;
      // Vibrant cyan/teal neurons
      colors[i * 3] = 0.2;     // R - slight red for warmth
      colors[i * 3 + 1] = 0.9; // G - strong green
      colors[i * 3 + 2] = 1.0; // B - full blue
      sizes[i] = n.baseSize;
      brightness[i] = n.brightness;
    }

    this.neuronGeometry = new THREE.BufferGeometry();
    this.neuronGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.neuronGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.neuronGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.neuronGeometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));

    this.neuronMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute float brightness;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vBrightness;

        void main() {
          vColor = color;
          vBrightness = brightness;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * pixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vBrightness;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;

          // Soft glow falloff
          float alpha = smoothstep(0.5, 0.0, dist);
          float glow = exp(-dist * 4.0) * vBrightness;

          vec3 finalColor = vColor * (vBrightness + glow);
          gl_FragColor = vec4(finalColor, alpha * vBrightness);
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
    // Count total connections for buffer size
    let connectionCount = 0;
    for (const neuron of this.neurons) {
      connectionCount += neuron.connections.length;
    }

    const positions = new Float32Array(connectionCount * 6); // 2 points per line, 3 coords each
    const colors = new Float32Array(connectionCount * 6);
    let idx = 0;

    for (const neuron of this.neurons) {
      for (const targetId of neuron.connections) {
        const target = this.neurons[targetId];

        // Start point
        positions[idx * 6] = neuron.position.x;
        positions[idx * 6 + 1] = neuron.position.y;
        positions[idx * 6 + 2] = neuron.position.z;
        // End point
        positions[idx * 6 + 3] = target.position.x;
        positions[idx * 6 + 4] = target.position.y;
        positions[idx * 6 + 5] = target.position.z;

        // Very dim teal color - axons should be subtle
        colors[idx * 6] = 0.02;      // R
        colors[idx * 6 + 1] = 0.06;  // G
        colors[idx * 6 + 2] = 0.08;  // B
        colors[idx * 6 + 3] = 0.02;
        colors[idx * 6 + 4] = 0.06;
        colors[idx * 6 + 5] = 0.08;

        idx++;
      }
    }

    this.axonGeometry = new THREE.BufferGeometry();
    this.axonGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.axonGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.axonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tension: { value: 0 },
      },
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
          vec3 finalColor = vColor * (1.0 + tension * 0.5);
          gl_FragColor = vec4(finalColor, 0.15 + tension * 0.1);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.axonLines = new THREE.LineSegments(this.axonGeometry, this.axonMaterial);
    this.scene.add(this.axonLines);
  }

  private maxPulses = 1000;

  private initPulseRendering() {
    this.maxPulses = this.isMobileDevice ? 300 : 1000;
    const positions = new Float32Array(this.maxPulses * 3);
    const colors = new Float32Array(this.maxPulses * 3);
    const sizes = new Float32Array(this.maxPulses);

    this.pulseGeometry = new THREE.BufferGeometry();
    this.pulseGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.pulseGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.pulseGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.pulseMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z) * pixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;

          float glow = exp(-dist * 3.0);
          gl_FragColor = vec4(vColor * glow * 2.0, glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pulsePoints = new THREE.Points(this.pulseGeometry, this.pulseMaterial);
    this.scene.add(this.pulsePoints);
  }

  // === FIRING MECHANICS ===

  private fireNeuron(neuronId: number, color: THREE.Color, threatType: string, intensity: number = 1) {
    const neuron = this.neurons[neuronId];
    if (!neuron || neuron.state !== 'resting') return;

    // Fire the neuron
    neuron.state = 'firing';
    neuron.targetBrightness = 1.0 * intensity;
    neuron.refractoryTimer = 0.5 + Math.random() * 0.3; // Refractory period

    // Spawn pulses to connected neurons
    for (const targetId of neuron.connections) {
      this.pulses.push({
        id: this.pulseIdCounter++,
        fromNeuron: neuronId,
        toNeuron: targetId,
        progress: 0,
        speed: 1.5 + Math.random() * 1.0, // Variable speed
        color: color.clone(),
        intensity,
        threatType,
      });
    }
  }

  private triggerCascade(neuronId: number, color: THREE.Color, threatType: string, intensity: number, depth: number = 0) {
    if (depth > 5) return; // Limit cascade depth

    // Cascade probability based on tension and depth
    const cascadeChance = 0.4 + this.tension * 0.4 - depth * 0.1;

    const neuron = this.neurons[neuronId];
    for (const targetId of neuron.connections) {
      if (Math.random() < cascadeChance) {
        const delay = 0.1 + Math.random() * 0.2;
        this.pendingCascades.push({
          neuronId: targetId,
          delay,
          color: color.clone(),
          threatType,
          intensity: intensity * 0.8, // Decay
        });
      }
    }
  }

  // === THREAT HANDLERS ===

  private spawnThreat(threatType: string, burstSize: number = 1) {
    const color = new THREE.Color(THREAT_COLORS[threatType] || 0xffffff);

    // Add tension
    this.tension = Math.min(1, this.tension + 0.05 * burstSize);

    // Fire random neurons
    for (let i = 0; i < burstSize; i++) {
      const neuronId = Math.floor(Math.random() * this.neurons.length);
      this.fireNeuron(neuronId, color, threatType, 1.0);

      // Maybe trigger cascade
      if (Math.random() < 0.3 + this.tension * 0.4) {
        this.triggerCascade(neuronId, color, threatType, 0.8, 0);
      }
    }
  }

  handleMalwareUrl(hit: URLhausHit) {
    this.spawnThreat('malware', 2);
  }

  handleGreyNoise(data: GreyNoiseData) {
    this.spawnThreat('scanner', 1);
  }

  // Alias for GreyNoise scanner data
  updateScannerNoise(data: GreyNoiseData) {
    // Scanner noise creates ambient low-level activity
    if (data.scannerCount > 0) {
      this.spawnThreat('scanner', Math.min(3, Math.floor(data.scannerCount / 100)));
    }
  }

  handleHoneypotAttack(attack: DShieldAttack) {
    this.spawnThreat('honeypot', 2);
  }

  handleBotnetC2(c2: FeodoC2) {
    this.spawnThreat('c2', 3);
  }

  handleRansomwareVictim(victim: RansomwareVictim) {
    // Big event - major cascade
    this.spawnThreat('ransomware', 5);
    this.tension = Math.min(1, this.tension + 0.2);
  }

  handlePhishing(phish: PhishingURL) {
    this.spawnThreat('phishing', 2);
  }

  handleMaliciousCert(entry: SSLBlacklistEntry) {
    this.spawnThreat('cert', 1);
  }

  handleBruteforce(attack: BruteforceAttack) {
    this.spawnThreat('bruteforce', 2);
  }

  handleTorNode(node: TorExitNode) {
    this.spawnThreat('tor', 1);
  }

  handleBreach(breach: HIBPBreach) {
    // Massive event - storm
    this.spawnThreat('breach', 8);
    this.tension = Math.min(1, this.tension + 0.3);
  }

  handleSpamhaus(drop: SpamhausDrop) {
    this.spawnThreat('hijack', 2);
  }

  handleBGPEvent(bgpEvent: BGPEvent) {
    const burst = bgpEvent.severity === 'critical' ? 4 :
                  bgpEvent.severity === 'high' ? 3 : 2;
    this.spawnThreat('bgp', burst);
  }

  // === UPDATE LOOP ===

  update(deltaTime: number) {
    this.time += deltaTime;

    // Tension decay
    this.tension = Math.max(0, this.tension - deltaTime * 0.08);

    // Update neurons
    this.updateNeurons(deltaTime);

    // Update pulses
    this.updatePulses(deltaTime);

    // Process pending cascades
    this.processCascades(deltaTime);

    // Update camera drift
    this.updateCamera(deltaTime);

    // Update uniforms
    this.neuronMaterial.uniforms.time.value = this.time;
    this.axonMaterial.uniforms.time.value = this.time;
    this.axonMaterial.uniforms.tension.value = this.tension;

    // Update bloom based on tension
    this.bloomPass.strength = 1.2 + this.tension * 0.8;
  }

  private updateNeurons(deltaTime: number) {
    const brightnessAttr = this.neuronGeometry.attributes.brightness as THREE.BufferAttribute;
    const colorAttr = this.neuronGeometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < this.neurons.length; i++) {
      const neuron = this.neurons[i];

      // Update refractory timer
      if (neuron.state === 'firing' || neuron.state === 'refractory') {
        neuron.refractoryTimer -= deltaTime;
        if (neuron.refractoryTimer <= 0) {
          neuron.state = 'resting';
          neuron.targetBrightness = 0.4 + Math.random() * 0.2;
        } else if (neuron.state === 'firing' && neuron.refractoryTimer < 0.3) {
          neuron.state = 'refractory';
        }
      }

      // Smooth brightness transition
      neuron.brightness += (neuron.targetBrightness - neuron.brightness) * deltaTime * 8;
      brightnessAttr.array[i] = neuron.brightness;

      // Ambient pulse
      const ambientPulse = 0.05 * Math.sin(this.time * 2 + i * 0.1);
      if (neuron.state === 'resting') {
        neuron.brightness = Math.max(0.1, neuron.brightness + ambientPulse * deltaTime);
      }
    }

    brightnessAttr.needsUpdate = true;
  }

  private updatePulses(deltaTime: number) {
    const positions = this.pulseGeometry.attributes.position as THREE.BufferAttribute;
    const colors = this.pulseGeometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.pulseGeometry.attributes.size as THREE.BufferAttribute;

    const completedPulses: number[] = [];

    for (let i = 0; i < this.pulses.length && i < this.maxPulses; i++) {
      const pulse = this.pulses[i];
      pulse.progress += deltaTime * pulse.speed;

      if (pulse.progress >= 1) {
        completedPulses.push(i);

        // Pulse arrived - maybe trigger cascade
        const targetNeuron = this.neurons[pulse.toNeuron];
        if (targetNeuron && targetNeuron.state === 'resting') {
          const cascadeChance = 0.2 + this.tension * 0.5;
          if (Math.random() < cascadeChance) {
            this.fireNeuron(pulse.toNeuron, pulse.color, pulse.threatType, pulse.intensity * 0.7);
          }
        }
      } else {
        // Interpolate position
        const from = this.neurons[pulse.fromNeuron].position;
        const to = this.neurons[pulse.toNeuron].position;
        const pos = new THREE.Vector3().lerpVectors(from, to, pulse.progress);

        positions.array[i * 3] = pos.x;
        positions.array[i * 3 + 1] = pos.y;
        positions.array[i * 3 + 2] = pos.z;

        colors.array[i * 3] = pulse.color.r;
        colors.array[i * 3 + 1] = pulse.color.g;
        colors.array[i * 3 + 2] = pulse.color.b;

        // Pulse size varies along path - bigger and brighter
        const sizePulse = Math.sin(pulse.progress * Math.PI);
        sizes.array[i] = 4.0 * sizePulse * pulse.intensity;
      }
    }

    // Remove completed pulses (in reverse order)
    for (let i = completedPulses.length - 1; i >= 0; i--) {
      this.pulses.splice(completedPulses[i], 1);
    }

    // Clear unused slots
    for (let i = this.pulses.length; i < this.maxPulses; i++) {
      sizes.array[i] = 0;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
  }

  private processCascades(deltaTime: number) {
    const ready: CascadeEvent[] = [];

    for (let i = this.pendingCascades.length - 1; i >= 0; i--) {
      this.pendingCascades[i].delay -= deltaTime;
      if (this.pendingCascades[i].delay <= 0) {
        ready.push(this.pendingCascades.splice(i, 1)[0]);
      }
    }

    for (const cascade of ready) {
      this.fireNeuron(cascade.neuronId, cascade.color, cascade.threatType, cascade.intensity);
    }
  }

  private updateCamera(deltaTime: number) {
    // Slow drift around the network
    this.cameraDriftAngle += this.cameraDriftSpeed * deltaTime;

    const driftRadius = 30 + this.tension * 20;
    const driftX = Math.cos(this.cameraDriftAngle) * driftRadius;
    const driftY = Math.sin(this.cameraDriftAngle * 0.7) * driftRadius * 0.5;
    const driftZ = 180 + Math.sin(this.cameraDriftAngle * 0.3) * 30 - this.tension * 40;

    this.cameraOffset.set(driftX, driftY, driftZ);

    const targetPos = this.cameraTarget.clone().add(this.cameraOffset);
    this.camera.position.lerp(targetPos, deltaTime * 2);
    this.camera.lookAt(this.cameraTarget);
  }

  // === RENDERING ===

  render() {
    this.composer.render();
  }

  // === PUBLIC API ===

  setOnNodeHover(callback: (node: any) => void) {
    this.onNodeHover = callback;
  }

  setOnNodeSelect(callback: (node: any) => void) {
    this.onNodeSelect = callback;
  }

  setPalette(key: string) {
    // Could implement palette switching if needed
  }

  getPalettes() {
    return [{ key: 'neural', name: 'Neural Storm' }];
  }

  getStats() {
    return {
      nodes: this.neurons.length,
      pulses: this.pulses.length,
      tension: this.tension,
    };
  }

  private onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    // Update bloom resolution
    if (this.isMobileDevice) {
      this.bloomPass.resolution.set(w / 2, h / 2);
    } else {
      this.bloomPass.resolution.set(w, h);
    }
  }

  dispose() {
    this.neuronGeometry.dispose();
    this.neuronMaterial.dispose();
    this.axonGeometry.dispose();
    this.axonMaterial.dispose();
    this.pulseGeometry.dispose();
    this.pulseMaterial.dispose();
    this.renderer.dispose();
  }
}
