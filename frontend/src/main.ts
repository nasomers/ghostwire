// Ghostwire - Main Entry Point
// Generative audiovisual art from internet threat data

import {
  GhostwireSocket,
  type URLhausHit,
  type GreyNoiseData,
  type DShieldAttack,
  type FeodoC2,
  type RansomwareVictim,
  type PhishingURL,
  type SSLBlacklistEntry,
  type BruteforceAttack,
  type TorExitNode,
  type HIBPBreach,
  type SpamhausDrop,
  type BGPEvent,
  type GhostwireEvent
} from './socket';
import { AudioEngine } from './audio';
import { VisualEngine, type PaletteKey } from './visuals';
import './style.css';

// Configuration
const WS_URL = import.meta.env.PROD
  ? 'wss://ghostwire-api.ghostlaboratory.net/ws'
  : 'wss://10.0.0.100:3333/ws';

// DOM elements
const bootScreen = document.getElementById('boot-screen')!;
const bootOutput = document.getElementById('boot-output')!;
const overlay = document.getElementById('overlay')!;
const statusEl = document.getElementById('status')!;
const startBtn = document.getElementById('start-btn')! as HTMLButtonElement;
const canvas = document.getElementById('canvas')! as HTMLCanvasElement;

// Stats elements
const statsUrlhaus = document.getElementById('stats-urlhaus')!;
const statsGreynoise = document.getElementById('stats-greynoise')!;
const statsDshield = document.getElementById('stats-dshield')!;
const statsFeodo = document.getElementById('stats-feodo')!;
const statsRansomware = document.getElementById('stats-ransomware')!;
const statsPhishing = document.getElementById('stats-phishing')!;
const statsSslbl = document.getElementById('stats-sslbl')!;
const statsBruteforce = document.getElementById('stats-bruteforce')!;
const statsTor = document.getElementById('stats-tor')!;
const statsHibp = document.getElementById('stats-hibp')!;
const statsSpamhaus = document.getElementById('stats-spamhaus')!;
const statsBgp = document.getElementById('stats-bgp')!;
const statsParticles = document.getElementById('stats-particles')!;
const statsEventRate = document.getElementById('stats-event-rate')!;

// Event feed elements
const eventFeed = document.getElementById('event-feed')!;
const feedList = document.getElementById('feed-list')!;
const feedPulse = document.getElementById('feed-status')!;

// Geographic labels container
const geoLabels = document.getElementById('geo-labels')!;

// Threat info panel elements
const threatInfo = document.getElementById('threat-info')!;
const threatType = document.getElementById('threat-type')!;
const threatSource = document.getElementById('threat-source')!;
const threatCountry = document.getElementById('threat-country')!;
const threatName = document.getElementById('threat-name')!;
const threatTime = document.getElementById('threat-time')!;
const threatHits = document.getElementById('threat-hits')!;
const threatDetails = document.getElementById('threat-details')!;
const threatRelated = document.getElementById('threat-related')!;
const threatClose = document.getElementById('threat-close')!;

// Max events in feed
const MAX_FEED_EVENTS = 50;

// Country code to screen position (percentage from top-left)
// Based on simple mercator-ish projection
const COUNTRY_SCREEN_POS: Record<string, [number, number]> = {
  'US': [22, 38], 'CA': [20, 28], 'MX': [18, 45],
  'BR': [32, 65], 'AR': [28, 78], 'CO': [26, 52],
  'UK': [48, 32], 'GB': [48, 32], 'DE': [52, 35], 'FR': [49, 38], 'NL': [51, 33],
  'ES': [46, 42], 'IT': [53, 42], 'PL': [55, 34], 'UA': [58, 35],
  'RU': [65, 28], 'CN': [75, 40], 'JP': [85, 40], 'KR': [82, 42],
  'IN': [72, 50], 'PK': [68, 45], 'ID': [78, 60], 'AU': [82, 75],
  'ZA': [55, 75], 'NG': [52, 55], 'EG': [57, 48],
  'IR': [62, 45], 'SA': [60, 50], 'AE': [62, 52],
  'VN': [78, 52], 'TH': [76, 52], 'SG': [77, 58], 'MY': [77, 56],
  'TR': [58, 42], 'IL': [58, 46], 'SE': [54, 26], 'NO': [52, 24],
  'FI': [56, 24], 'AT': [53, 38], 'CH': [51, 38], 'BE': [50, 35],
  'CZ': [54, 36], 'RO': [56, 40], 'HU': [55, 38], 'GR': [55, 44],
};

// Country codes to full names
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico',
  'BR': 'Brazil', 'AR': 'Argentina', 'CO': 'Colombia',
  'UK': 'United Kingdom', 'GB': 'United Kingdom', 'DE': 'Germany', 'FR': 'France', 'NL': 'Netherlands',
  'ES': 'Spain', 'IT': 'Italy', 'PL': 'Poland', 'UA': 'Ukraine',
  'RU': 'Russia', 'CN': 'China', 'JP': 'Japan', 'KR': 'South Korea',
  'IN': 'India', 'PK': 'Pakistan', 'ID': 'Indonesia', 'AU': 'Australia',
  'ZA': 'South Africa', 'NG': 'Nigeria', 'EG': 'Egypt',
  'IR': 'Iran', 'SA': 'Saudi Arabia', 'AE': 'UAE',
  'VN': 'Vietnam', 'TH': 'Thailand', 'SG': 'Singapore', 'MY': 'Malaysia',
  'TR': 'Turkey', 'IL': 'Israel', 'SE': 'Sweden', 'NO': 'Norway',
  'FI': 'Finland', 'AT': 'Austria', 'CH': 'Switzerland', 'BE': 'Belgium',
  'CZ': 'Czechia', 'RO': 'Romania', 'HU': 'Hungary', 'GR': 'Greece',
};

// Control elements
const controlsPanel = document.getElementById('controls-panel')!;
const toggleControlsBtn = document.getElementById('toggle-controls')!;
const volumeSlider = document.getElementById('volume-slider')! as HTMLInputElement;
const reverbSlider = document.getElementById('reverb-slider')! as HTMLInputElement;
const rootSelect = document.getElementById('root-select')! as HTMLSelectElement;
const scaleSelect = document.getElementById('scale-select')! as HTMLSelectElement;
const paletteSelect = document.getElementById('palette-select')! as HTMLSelectElement;

// Engine instances
let socket: GhostwireSocket;
let audio: AudioEngine;
let visuals: VisualEngine;

// State
let isRunning = false;
let lastFrameTime = 0;
let controlsVisible = false;

// Event counts
const eventCounts = {
  urlhaus: 0,
  greynoise: 0,
  dshield: 0,
  feodo: 0,
  ransomware: 0,
  phishing: 0,
  sslbl: 0,
  bruteforce: 0,
  tor: 0,
  hibp: 0,
  spamhaus: 0,
  bgp: 0
};

// Last seen details for each event type
const lastSeen: Record<string, string> = {
  urlhaus: '',
  greynoise: '',
  dshield: '',
  feodo: '',
  ransomware: '',
  phishing: '',
  sslbl: '',
  bruteforce: '',
  tor: ''
};

// Severity levels for events
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Format relative time
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

// Show geographic label for country
function showGeoLabel(country: string | undefined, severity: Severity, detail?: string) {
  if (!country || !geoLabels) return;

  const code = country.toUpperCase();
  const pos = COUNTRY_SCREEN_POS[code];
  if (!pos) return; // Unknown country

  const name = COUNTRY_NAMES[code] || country;

  const label = document.createElement('div');
  label.className = `geo-label${severity === 'critical' ? ' severity-critical' : severity === 'high' ? ' severity-high' : ''}`;
  label.style.left = `${pos[0]}%`;
  label.style.top = `${pos[1]}%`;
  label.textContent = detail ? `${name} · ${detail}` : name;

  geoLabels.appendChild(label);

  // Remove after animation completes
  setTimeout(() => {
    if (label.parentNode) {
      label.parentNode.removeChild(label);
    }
  }, 3500);
}

// Add event to the live feed
function addFeedEvent(
  type: string,
  severity: Severity,
  content: string,
  meta: { country?: string; source?: string; detail?: string } = {}
) {
  // Create event element
  const event = document.createElement('div');
  event.className = `feed-event severity-${severity}`;

  const time = new Date();

  event.innerHTML = `
    <div class="event-header">
      <span class="event-type ${type}">${type}</span>
      <span class="event-time" data-time="${time.getTime()}">${formatRelativeTime(time)}</span>
    </div>
    <div class="event-content">${content}</div>
    ${meta.country || meta.source ? `
      <div class="event-meta">
        ${meta.country ? `<span class="country">${meta.country}</span>` : ''}
        ${meta.source ? `<span class="source">${meta.source}</span>` : ''}
      </div>
    ` : ''}
  `;

  // Add to top of feed
  feedList.insertBefore(event, feedList.firstChild);

  // Trim old events
  while (feedList.children.length > MAX_FEED_EVENTS) {
    feedList.removeChild(feedList.lastChild!);
  }

  // Pulse the indicator
  feedPulse.style.animation = 'none';
  feedPulse.offsetHeight; // Trigger reflow
  feedPulse.style.animation = '';
}

// Boot sequence messages
const BOOT_SEQUENCE = [
  { text: 'GHOSTWIRE v2.0.1 - Threat Intelligence Visualizer', type: 'info', delay: 100 },
  { text: '(c) 2025 Ghost Laboratory - All rights reserved', type: 'dim', delay: 50 },
  { text: '', type: '', delay: 200 },
  { text: 'Initializing system...', type: '', delay: 300 },
  { text: '', type: '', delay: 100 },
  { text: '[BOOT] Loading kernel modules...', type: 'dim', delay: 150 },
  { text: '[  OK  ] threat_parser.ko', type: 'ok', delay: 80 },
  { text: '[  OK  ] geo_resolver.ko', type: 'ok', delay: 60 },
  { text: '[  OK  ] audio_synth.ko', type: 'ok', delay: 70 },
  { text: '[  OK  ] webgl_renderer.ko', type: 'ok', delay: 90 },
  { text: '', type: '', delay: 100 },
  { text: '[INIT] Starting threat intelligence feeds...', type: 'dim', delay: 200 },
  { text: '  → URLhaus (Malware Distribution)', type: 'ok', delay: 60 },
  { text: '  → DShield (Honeypot Network)', type: 'ok', delay: 50 },
  { text: '  → Feodo Tracker (Botnet C2)', type: 'ok', delay: 55 },
  { text: '  → RansomWatch (Ransomware Leaks)', type: 'ok', delay: 65 },
  { text: '  → OpenPhish (Phishing URLs)', type: 'ok', delay: 45 },
  { text: '  → SSLBL (Malicious Certs)', type: 'ok', delay: 50 },
  { text: '  → Blocklist.de (Brute Force)', type: 'ok', delay: 55 },
  { text: '  → Tor Project (Exit Nodes)', type: 'ok', delay: 60 },
  { text: '  → Have I Been Pwned (Breaches)', type: 'ok', delay: 70 },
  { text: '  → Spamhaus DROP (IP Hijacks)', type: 'ok', delay: 65 },
  { text: '  → RIPE RIS Live (BGP Events)', type: 'ok', delay: 80 },
  { text: '', type: '', delay: 150 },
  { text: '[NET] Establishing secure WebSocket connection...', type: 'dim', delay: 300 },
  { text: '  Protocol: WSS/TLS 1.3', type: 'info', delay: 100 },
  { text: '  Endpoint: threat-stream.ghostwire.local', type: 'info', delay: 80 },
  { text: '[  OK  ] Connection established', type: 'ok', delay: 200 },
  { text: '', type: '', delay: 100 },
  { text: '[AUDIO] Initializing Web Audio API...', type: 'dim', delay: 150 },
  { text: '  Sample rate: 48000 Hz', type: 'info', delay: 60 },
  { text: '  Channels: Stereo + Spatial', type: 'info', delay: 50 },
  { text: '[  OK  ] Audio context ready', type: 'ok', delay: 100 },
  { text: '', type: '', delay: 100 },
  { text: '[GPU] Initializing WebGL 2.0 renderer...', type: 'dim', delay: 200 },
  { text: '  Shader compilation: OK', type: 'ok', delay: 80 },
  { text: '  Post-processing: Enabled', type: 'info', delay: 60 },
  { text: '  Max particles: 500', type: 'info', delay: 50 },
  { text: '[  OK  ] GPU acceleration active', type: 'ok', delay: 100 },
  { text: '', type: '', delay: 200 },
  { text: 'System ready.', type: 'ok', delay: 300 },
  { text: '', type: '', delay: 500 },
];

async function runBootSequence(): Promise<void> {
  // Clear any previous output
  bootOutput.innerHTML = '';

  return new Promise(async (resolve) => {
    for (const line of BOOT_SEQUENCE) {
      await new Promise(r => setTimeout(r, line.delay));

      const lineEl = document.createElement('div');
      lineEl.className = `boot-line ${line.type}`;
      lineEl.textContent = line.text;
      bootOutput.appendChild(lineEl);

      // Auto-scroll to bottom
      bootOutput.scrollTop = bootOutput.scrollHeight;
    }

    // Small delay before hiding
    await new Promise(r => setTimeout(r, 500));

    // Hide boot screen
    bootScreen.classList.add('hidden');

    resolve();
  });
}

// Initialize socket connection
function initSocket() {
  socket = new GhostwireSocket(WS_URL);

  socket.onStatus((status) => {
    const statusText = document.getElementById('connection-status');
    if (statusText) {
      statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      statusText.className = `status-${status}`;
    }

    if (status === 'connected') {
      statusEl.textContent = 'Connected to threat intelligence stream';
      startBtn.disabled = false;
    } else if (status === 'connecting') {
      statusEl.textContent = 'Establishing connection...';
    } else {
      statusEl.textContent = 'Connection lost - Reconnecting...';
    }
  });

  socket.onEvent((event: GhostwireEvent) => {
    if (event.type === 'welcome') {
      console.log('[Ghostwire] Welcome:', event.data);
      return;
    }

    if (!isRunning) return;

    // Route events to appropriate handlers
    try {
      switch (event.type) {
        case 'urlhaus': {
          const hit = event.data as URLhausHit;
          eventCounts.urlhaus++;
          audio.playMalwareUrl(hit);
          visuals.handleMalwareUrl(hit);
          const threat = hit.threat || 'malware';
          lastSeen.urlhaus = threat;
          addFeedEvent(
            'malware',
            'high',
            `<strong>${threat}</strong> distribution: ${hit.host}`,
            { source: 'URLhaus' }
          );
          break;
        }

        case 'greynoise': {
          const data = event.data as GreyNoiseData;
          eventCounts.greynoise = data.scannerCount;
          audio.updateNoiseFloor(data);
          visuals.updateScannerNoise(data);
          lastSeen.greynoise = data.topTags?.[0] || data.scannerTypes?.[0] || 'mass scanning';
          // Don't add to feed - too frequent, just update stats
          break;
        }

        case 'dshield': {
          const attack = event.data as DShieldAttack;
          eventCounts.dshield++;
          audio.playHoneypotAttack(attack);
          visuals.handleHoneypotAttack(attack);
          lastSeen.dshield = `port ${attack.targetPort}`;
          addFeedEvent(
            'honeypot',
            'medium',
            `<strong>${attack.attackType || 'Attack'}</strong> on port ${attack.targetPort}`,
            { country: attack.country, source: 'DShield' }
          );
          showGeoLabel(attack.country, 'medium', `port ${attack.targetPort}`);
          break;
        }

        case 'feodo': {
          const c2 = event.data as FeodoC2;
          eventCounts.feodo++;
          audio.playBotnetC2(c2);
          visuals.handleBotnetC2(c2);
          lastSeen.feodo = c2.malware || 'Botnet';
          addFeedEvent(
            'c2',
            'high',
            `<strong>${c2.malware || 'Botnet'}</strong> C2 active: ${c2.ip}:${c2.port}`,
            { country: c2.country, source: 'Feodo Tracker' }
          );
          showGeoLabel(c2.country, 'high', c2.malware || 'C2');
          break;
        }

        case 'ransomware': {
          const victim = event.data as RansomwareVictim;
          eventCounts.ransomware++;
          audio.playRansomwareVictim(victim);
          visuals.handleRansomwareVictim(victim);
          lastSeen.ransomware = victim.group;
          addFeedEvent(
            'ransomware',
            'critical',
            `<strong>${victim.group}</strong> claimed victim: ${victim.victim}`,
            { country: victim.country, source: `Sector: ${victim.sector || 'Unknown'}` }
          );
          showGeoLabel(victim.country, 'critical', victim.group);
          break;
        }

        case 'phishing': {
          const phish = event.data as PhishingURL;
          eventCounts.phishing++;
          audio.playPhishing(phish);
          visuals.handlePhishing(phish);
          lastSeen.phishing = phish.targetBrand || phish.domain;
          addFeedEvent(
            'phishing',
            'medium',
            `Phishing site${phish.targetBrand ? ` targeting <strong>${phish.targetBrand}</strong>` : ''}: ${phish.domain}`,
            { source: 'OpenPhish' }
          );
          break;
        }

        case 'sslbl': {
          const entry = event.data as SSLBlacklistEntry;
          eventCounts.sslbl++;
          audio.playMaliciousCert(entry);
          visuals.handleMaliciousCert(entry);
          lastSeen.sslbl = entry.malware;
          addFeedEvent(
            'cert',
            'medium',
            `Malicious cert: <strong>${entry.malware}</strong> - ${entry.listingReason}`,
            { source: 'SSLBL' }
          );
          break;
        }

        case 'bruteforce': {
          const attack = event.data as BruteforceAttack;
          eventCounts.bruteforce++;
          audio.playBruteforce(attack);
          visuals.handleBruteforce(attack);
          const attackType = attack.attackType || 'SSH';
          lastSeen.bruteforce = attackType;
          addFeedEvent(
            'bruteforce',
            'low',
            `<strong>${attackType}</strong> brute force from ${attack.ip}`,
            { country: attack.country, source: 'Blocklist.de' }
          );
          showGeoLabel(attack.country, 'low', attackType);
          break;
        }

        case 'tor': {
          const node = event.data as TorExitNode;
          eventCounts.tor++;
          audio.playTorNode(node);
          visuals.handleTorNode(node);
          lastSeen.tor = node.nickname || node.ip;
          addFeedEvent(
            'tor',
            'info',
            `Tor exit node: <strong>${node.nickname || node.ip}</strong>`,
            { country: node.country, source: 'Tor Project' }
          );
          showGeoLabel(node.country, 'info', 'TOR');
          break;
        }

        case 'hibp': {
          const breach = event.data as HIBPBreach;
          eventCounts.hibp++;
          audio.playBreach(breach);
          visuals.handleBreach(breach);
          lastSeen.hibp = breach.title;
          const pwnCount = breach.pwnCount.toLocaleString();
          addFeedEvent(
            'breach',
            'critical',
            `<strong>${breach.title}</strong> breach: ${pwnCount} accounts`,
            { source: 'HIBP' }
          );
          break;
        }

        case 'spamhaus': {
          const drop = event.data as SpamhausDrop;
          eventCounts.spamhaus++;
          audio.playSpamhaus(drop);
          visuals.handleSpamhaus(drop);
          lastSeen.spamhaus = drop.cidr;
          const addrCount = drop.numAddresses.toLocaleString();
          addFeedEvent(
            'hijack',
            'high',
            `Hijacked range: <strong>${drop.cidr}</strong> (${addrCount} IPs)`,
            { source: 'Spamhaus' }
          );
          break;
        }

        case 'bgp': {
          const bgpEvent = event.data as BGPEvent;
          eventCounts.bgp++;
          audio.playBGPEvent(bgpEvent);
          visuals.handleBGPEvent(bgpEvent);
          lastSeen.bgp = bgpEvent.prefix;
          const severity = bgpEvent.severity === 'critical' ? 'critical' :
                          bgpEvent.severity === 'high' ? 'high' : 'medium';
          const asName = bgpEvent.asName || `AS${bgpEvent.asn}`;
          addFeedEvent(
            'bgp',
            severity,
            `<strong>${bgpEvent.eventType.toUpperCase()}</strong>: ${bgpEvent.prefix} via ${asName}`,
            { source: 'BGPStream' }
          );
          break;
        }
      }
    } catch (err) {
      console.error('[Ghostwire] Event handler error:', err);
    }
  });

  socket.connect();
}

// Start the experience (after user interaction for audio context)
async function start() {
  startBtn.disabled = true;
  statusEl.textContent = 'Initializing...';

  // Fade out intro overlay first
  overlay.classList.add('hidden');

  // Run boot sequence after intro fades
  await new Promise(r => setTimeout(r, 300));
  bootScreen.classList.remove('hidden');
  await runBootSequence();

  try {
    await audio.init();
    isRunning = true;

    // Show stats, controls, event feed, and instructions
    document.getElementById('stats')?.classList.add('visible');
    document.getElementById('controls-container')?.classList.add('visible');
    document.getElementById('event-feed')?.classList.add('visible');
    document.getElementById('instructions')?.classList.add('visible');

    // Start render loop
    lastFrameTime = performance.now();
    requestAnimationFrame(renderLoop);
  } catch (err) {
    console.error('[Ghostwire] Failed to start audio:', err);
    statusEl.textContent = 'Audio initialization failed - Check browser permissions';
    startBtn.disabled = false;
    bootScreen.classList.add('hidden');
    overlay.classList.remove('hidden');
  }
}

// Main render loop
function renderLoop(currentTime: number) {
  if (!isRunning) return;

  try {
    const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1); // Cap delta
    lastFrameTime = currentTime;

    // Update engines
    audio.update(deltaTime);
    visuals.update(deltaTime);
    visuals.render();

    // Update stats display
    updateStats();
  } catch (err) {
    console.error('[Ghostwire] Render loop error:', err);
  }

  requestAnimationFrame(renderLoop);
}

// Update stats display
function updateStats() {
  if (statsUrlhaus) statsUrlhaus.textContent = eventCounts.urlhaus.toLocaleString();
  if (statsGreynoise) statsGreynoise.textContent = eventCounts.greynoise.toLocaleString();
  if (statsDshield) statsDshield.textContent = eventCounts.dshield.toLocaleString();
  if (statsFeodo) statsFeodo.textContent = eventCounts.feodo.toLocaleString();
  if (statsRansomware) statsRansomware.textContent = eventCounts.ransomware.toLocaleString();
  if (statsPhishing) statsPhishing.textContent = eventCounts.phishing.toLocaleString();
  if (statsSslbl) statsSslbl.textContent = eventCounts.sslbl.toLocaleString();
  if (statsBruteforce) statsBruteforce.textContent = eventCounts.bruteforce.toLocaleString();
  if (statsTor) statsTor.textContent = eventCounts.tor.toLocaleString();
  if (statsHibp) statsHibp.textContent = eventCounts.hibp.toLocaleString();
  if (statsSpamhaus) statsSpamhaus.textContent = eventCounts.spamhaus.toLocaleString();
  if (statsBgp) statsBgp.textContent = eventCounts.bgp.toLocaleString();

  // Update detail text with last seen info
  const setDetail = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
  };
  setDetail('stats-urlhaus-detail', lastSeen.urlhaus);
  setDetail('stats-greynoise-detail', lastSeen.greynoise);
  setDetail('stats-dshield-detail', lastSeen.dshield);
  setDetail('stats-feodo-detail', lastSeen.feodo);
  setDetail('stats-ransomware-detail', lastSeen.ransomware);
  setDetail('stats-phishing-detail', lastSeen.phishing);
  setDetail('stats-sslbl-detail', lastSeen.sslbl);
  setDetail('stats-bruteforce-detail', lastSeen.bruteforce);
  setDetail('stats-tor-detail', lastSeen.tor);
  setDetail('stats-hibp-detail', lastSeen.hibp);
  setDetail('stats-spamhaus-detail', lastSeen.spamhaus);
  setDetail('stats-bgp-detail', lastSeen.bgp);

  const stats = visuals.getStats();
  if (statsParticles) statsParticles.textContent = stats.nodes.toString();
  if (statsEventRate) statsEventRate.textContent = stats.tension.toFixed(2);
}

// Setup control event listeners
function setupControls() {
  // Toggle controls panel
  if (toggleControlsBtn && controlsPanel) {
    toggleControlsBtn.addEventListener('click', () => {
      controlsVisible = !controlsVisible;
      controlsPanel.classList.toggle('visible', controlsVisible);
      toggleControlsBtn.textContent = controlsVisible ? '▼ Controls' : '▲ Controls';
    });
  }

  // Volume
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      const value = parseFloat(volumeSlider.value);
      audio.setMasterVolume(value);
    });
  }

  // Reverb
  if (reverbSlider) {
    reverbSlider.addEventListener('input', () => {
      const value = parseFloat(reverbSlider.value);
      audio.setReverbAmount(value);
    });
  }

  // Root note
  if (rootSelect) {
    rootSelect.addEventListener('change', () => {
      audio.setRoot(rootSelect.value);
    });
  }

  // Scale
  if (scaleSelect) {
    scaleSelect.addEventListener('change', () => {
      audio.setScale(scaleSelect.value as any);
    });
  }

  // Color palette
  if (paletteSelect) {
    paletteSelect.addEventListener('change', () => {
      visuals.setPalette(paletteSelect.value as PaletteKey);
    });
  }
}

// Update relative timestamps in feed
function updateFeedTimestamps() {
  const timeElements = feedList.querySelectorAll('.event-time[data-time]');
  timeElements.forEach((el) => {
    const timestamp = parseInt(el.getAttribute('data-time') || '0', 10);
    if (timestamp) {
      el.textContent = formatRelativeTime(new Date(timestamp));
    }
  });
}

// Show/hide threat info panel
function showThreatInfo(node: any | null) {
  if (!node || !threatInfo) {
    threatInfo?.classList.add('hidden');
    return;
  }

  // Update panel class for color styling
  threatInfo.className = `threat-info ${node.type}`;

  // Update content
  const typeNames: Record<string, string> = {
    malware: 'MALWARE URL',
    ransomware: 'RANSOMWARE',
    c2: 'BOTNET C2',
    honeypot: 'HONEYPOT ATTACK',
    phishing: 'PHISHING',
    cert: 'MALICIOUS CERT',
    bruteforce: 'BRUTE FORCE',
    tor: 'TOR EXIT NODE',
    breach: 'DATA BREACH',
    hijack: 'IP HIJACK',
    bgp: 'BGP EVENT',
    scanner: 'SCANNER'
  };

  threatType.textContent = typeNames[node.type] || node.type.toUpperCase();

  // Source (IP or domain)
  if (node.meta) {
    threatSource.textContent = node.meta.ip || node.meta.domain || node.meta.url || '-';
    threatName.textContent = node.meta.threat || node.meta.malware || '-';
    threatTime.textContent = node.meta.timestamp ? formatRelativeTime(new Date(node.meta.timestamp)) : '-';

    // Build details
    let detailsHtml = '';
    if (node.meta.asName) detailsHtml += `<div>AS: ${node.meta.asName}</div>`;
    if (node.meta.details) {
      for (const [key, val] of Object.entries(node.meta.details)) {
        if (val && typeof val !== 'object') {
          detailsHtml += `<div>${key}: ${val}</div>`;
        }
      }
    }
    threatDetails.innerHTML = detailsHtml;
  } else {
    threatSource.textContent = '-';
    threatName.textContent = '-';
    threatTime.textContent = '-';
    threatDetails.innerHTML = '';
  }

  // Country
  const countryCode = node.country || '';
  const countryName = COUNTRY_NAMES[countryCode] || countryCode || '-';
  threatCountry.textContent = countryName;

  // Hit count (reputation)
  threatHits.textContent = node.hitCount?.toString() || '1';

  // Related nodes count
  const relatedCount = node.connections?.length || 0;
  threatRelated.textContent = `${relatedCount} connected nodes`;
}

// Setup threat info panel
function setupThreatInfo() {
  // Close button
  if (threatClose) {
    threatClose.addEventListener('click', () => {
      threatInfo?.classList.add('hidden');
    });
  }

  // Wire up visual engine callbacks
  visuals.setOnNodeSelect((node) => {
    showThreatInfo(node);
  });

  visuals.setOnNodeHover((node) => {
    // Could show a tooltip here if desired
  });
}

// Initialize everything
function init() {
  console.log('[Ghostwire] Initializing...');
  console.log(`[Ghostwire] Connecting to ${WS_URL}`);

  // Create engines
  audio = new AudioEngine();
  visuals = new VisualEngine(canvas);

  // Set up UI
  startBtn.addEventListener('click', start);
  startBtn.disabled = true;
  setupControls();
  setupThreatInfo();

  // Connect to backend
  initSocket();

  // Update timestamps every 10 seconds
  setInterval(updateFeedTimestamps, 10000);
}

// Start on DOM ready
function bootstrap() {
  // Hide boot screen initially (will show after Enter click)
  bootScreen.classList.add('hidden');

  // Initialize main app
  init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
