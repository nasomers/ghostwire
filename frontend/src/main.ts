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

// Threat ticker elements
const threatTicker = document.getElementById('threat-ticker')!;
const tickerContent = document.getElementById('ticker-content')!;

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
const MAX_TICKER_ITEMS = 20;

// Ticker scroll state
let tickerScrollPos = 0;
const TICKER_SCROLL_SPEED = 50; // pixels per second
let tickerPaused = false;

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
const keySelect = document.getElementById('key-select')! as HTMLSelectElement;
const modeSelect = document.getElementById('mode-select')! as HTMLSelectElement;
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

// HUD tracking
let totalBreachRecords = 0;
let eventTimestamps: number[] = [];  // For events/min calculation

// Enhanced threat feed tracking
interface ThreatFeedItem {
  type: string;
  content: string;
  severity: Severity;
  country?: string;
  count: number;
  lastTime: number;
  actor?: string;  // Threat actor/group name
  details?: Record<string, string>;  // Extra details for expand view
  sparkline: number[];  // Last 12 time buckets (5s each = 60s)
}

const threatFeedItems: Map<string, ThreatFeedItem> = new Map();
const sparklineHistory: Map<string, number[]> = new Map();  // Per-type event counts
const SPARKLINE_BUCKETS = 12;  // 12 x 5 seconds = 60 seconds
const SPARKLINE_INTERVAL = 5000;  // 5 seconds per bucket
let lastSparklineUpdate = Date.now();

// Known threat actors/groups
const KNOWN_ACTORS: Record<string, string[]> = {
  ransomware: ['LockBit', 'BlackCat', 'Cl0p', 'Play', 'Royal', 'Akira', 'BianLian', 'Medusa', 'NoEscape', '8Base', 'Rhysida', 'Hunters', 'Cactus', 'BlackBasta'],
  malware: ['Emotet', 'QakBot', 'IcedID', 'Raccoon', 'RedLine', 'Vidar', 'AsyncRAT', 'AgentTesla', 'FormBook', 'Snake', 'PikaBot', 'DarkGate'],
  c2: ['Cobalt Strike', 'Metasploit', 'Sliver', 'Brute Ratel', 'Havoc', 'PoshC2', 'Mythic'],
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

// Show geographic label for country (disabled for Neural Storm visualization)
function showGeoLabel(country: string | undefined, severity: Severity, detail?: string) {
  // Disabled - Neural Storm doesn't use geographic positioning
  return;
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

// Detect threat actor from content
function detectThreatActor(type: string, content: string): string | undefined {
  const actors = KNOWN_ACTORS[type];
  if (!actors) return undefined;
  const contentLower = content.toLowerCase();
  return actors.find(actor => contentLower.includes(actor.toLowerCase()));
}

// Generate sparkline SVG path
function generateSparkline(data: number[], _color: string): string {
  if (!data.length) return '';
  const max = Math.max(...data, 1);
  const width = 60;
  const height = 16;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 2) - 1; // Leave 1px margin
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Color is applied via CSS class on parent element
  return `<svg viewBox="0 0 ${width} ${height}"><path d="M${points.replace(/ /g, ' L')}" /></svg>`;
}

// Update ticker continuous scroll
function updateTickerScroll(deltaTime: number) {
  if (!tickerContent || tickerPaused) return;

  const contentWidth = tickerContent.scrollWidth;
  const containerWidth = threatTicker?.clientWidth || window.innerWidth;

  // Only scroll if content is wider than container
  if (contentWidth <= containerWidth) {
    tickerScrollPos = 0;
    tickerContent.style.transform = 'translateX(0)';
    return;
  }

  // Move scroll position
  tickerScrollPos += TICKER_SCROLL_SPEED * deltaTime;

  // When an item fully scrolls off the left, move it to the end
  const firstChild = tickerContent.firstElementChild as HTMLElement;
  if (firstChild) {
    const itemWidth = firstChild.offsetWidth;
    if (tickerScrollPos >= itemWidth) {
      // Move this item to the end
      tickerContent.appendChild(firstChild);
      tickerScrollPos -= itemWidth;
    }
  }

  tickerContent.style.transform = `translateX(${-tickerScrollPos}px)`;
}

// Add event to the enhanced horizontal ticker
function addTickerItem(
  type: string,
  content: string,
  severity: Severity,
  country?: string,
  details?: Record<string, string>
) {
  if (!tickerContent) return;

  // Update sparkline history for this type
  if (!sparklineHistory.has(type)) {
    sparklineHistory.set(type, new Array(SPARKLINE_BUCKETS).fill(0));
  }
  const typeSparkline = sparklineHistory.get(type)!;
  typeSparkline[typeSparkline.length - 1]++;

  // Create grouping key (type + truncated content for similar events)
  const contentKey = content.split(/[→:]/).pop()?.trim().substring(0, 25) || content.substring(0, 25);
  const groupKey = `${type}:${contentKey}`;

  const now = Date.now();
  const actor = detectThreatActor(type, content);

  // Check if we should group with existing item in ticker
  const existing = threatFeedItems.get(groupKey);
  const existingElement = tickerContent.querySelector(`[data-key="${groupKey}"]`) as HTMLElement;

  if (existing && existingElement && (now - existing.lastTime) < 30000) {
    // Update existing item count
    existing.count++;
    existing.lastTime = now;
    existing.content = content;
    if (country) existing.country = country;
    if (actor) existing.actor = actor;
    existing.sparkline = [...typeSparkline];

    // Update the DOM element
    const countBadge = existingElement.querySelector('.ticker-count');
    if (countBadge) {
      countBadge.textContent = `×${existing.count}`;
      countBadge.className = `ticker-count${existing.count >= 10 ? ' critical' : existing.count >= 5 ? ' high' : ''}`;
    } else if (existing.count > 1) {
      // Add count badge
      const badge = document.createElement('span');
      badge.className = 'ticker-count';
      badge.textContent = `×${existing.count}`;
      existingElement.querySelector('.ticker-type')?.after(badge);
    }

    // Flash the item to indicate update
    existingElement.classList.add('ticker-updated');
    setTimeout(() => existingElement.classList.remove('ticker-updated'), 300);
  } else {
    // Create new item
    threatFeedItems.set(groupKey, {
      type,
      content,
      severity,
      country,
      count: 1,
      lastTime: now,
      actor,
      details,
      sparkline: [...typeSparkline],
    });

    const item = document.createElement('div');
    item.className = `ticker-item${severity === 'critical' ? ' critical' : severity === 'high' ? ' high' : ''}`;
    item.setAttribute('data-key', groupKey);

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    item.innerHTML = `
      <span class="ticker-type ${type}">${type.toUpperCase()}</span>
      ${actor ? `<span class="ticker-actor">${actor}</span>` : ''}
      <span class="ticker-content">${content}</span>
      ${country ? `<span class="ticker-country">${country}</span>` : ''}
      <span class="ticker-time">${timeStr}</span>
    `;

    // Click to expand
    item.addEventListener('click', () => expandTickerItem(groupKey));

    tickerContent.appendChild(item);

    // Limit ticker items
    while (tickerContent.children.length > MAX_TICKER_ITEMS) {
      const removed = tickerContent.firstChild as HTMLElement;
      const removedKey = removed?.getAttribute('data-key');
      if (removedKey) threatFeedItems.delete(removedKey);
      tickerContent.removeChild(removed);
    }
  }
}

// Expand ticker item to show details modal
function expandTickerItem(key: string) {
  const item = threatFeedItems.get(key);
  if (!item) return;

  // Color map for sparklines
  const typeColors: Record<string, string> = {
    ransomware: '#ff0066', malware: '#ff3344', c2: '#aa44ff',
    honeypot: '#ff6600', phishing: '#00ccff', bruteforce: '#ffaa00',
    tor: '#22aa44', cert: '#6644ff', breach: '#ff0044',
    hijack: '#ff3300', bgp: '#cc00ff',
  };
  const sparklineColor = typeColors[item.type] || '#33ff66';

  // Generate sparkline for modal
  const sparklineSvg = item.sparkline.length > 0 ? (() => {
    const data = item.sparkline;
    const max = Math.max(...data, 1);
    const width = 400;
    const height = 40;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (v / max) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' L');
    return `<svg viewBox="0 0 ${width} ${height}"><path d="M${points}" fill="none" stroke="${sparklineColor}" stroke-width="2" /></svg>`;
  })() : '';

  const modal = document.getElementById('threat-detail-modal');
  if (modal) {
    modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">
          <span class="modal-type ${item.type}">${item.type.toUpperCase()}</span>
          ${item.actor ? `<span class="modal-actor">${item.actor}</span>` : ''}
        </div>
        <button class="modal-close" onclick="closeThreatModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="modal-content-text">${item.content}</div>
        <div class="modal-meta">
          ${item.country ? `<div class="modal-meta-item"><span class="modal-meta-label">Location</span><span class="modal-meta-value">${item.country}</span></div>` : ''}
          <div class="modal-meta-item">
            <span class="modal-meta-label">Event Count</span>
            <span class="modal-meta-value">${item.count} in last 30s</span>
          </div>
          <div class="modal-meta-item">
            <span class="modal-meta-label">Severity</span>
            <span class="modal-meta-value">${item.severity.toUpperCase()}</span>
          </div>
          <div class="modal-meta-item">
            <span class="modal-meta-label">Last Seen</span>
            <span class="modal-meta-value">${new Date(item.lastTime).toLocaleTimeString()}</span>
          </div>
        </div>
        ${sparklineSvg ? `
        <div class="modal-sparkline ${item.type}">
          <div class="modal-sparkline-label">Activity (last 60s)</div>
          ${sparklineSvg}
        </div>` : ''}
      </div>
      <div class="modal-footer">
        <button class="modal-close-btn" onclick="closeThreatModal()">Close</button>
      </div>
    `;
    modal.classList.add('visible');
  }
}

// Update sparkline buckets periodically
function updateSparklineBuckets() {
  const now = Date.now();
  if (now - lastSparklineUpdate >= SPARKLINE_INTERVAL) {
    lastSparklineUpdate = now;
    // Shift all sparklines and add new empty bucket
    sparklineHistory.forEach((buckets, type) => {
      buckets.shift();
      buckets.push(0);
    });
  }
}

(window as any).closeThreatModal = function() {
  const modal = document.getElementById('threat-detail-modal');
  if (modal) {
    modal.classList.remove('visible');
  }
};

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

      // Auto-scroll to bottom (scroll both the output and the parent container for mobile)
      bootOutput.scrollTop = bootOutput.scrollHeight;
      bootScreen.scrollTop = bootScreen.scrollHeight;
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
      const audioReady = audio.isInitialized();

      // Track event timestamps for events/min calculation
      const now = Date.now();
      eventTimestamps.push(now);
      // Keep only last 60 seconds of timestamps
      const oneMinuteAgo = now - 60000;
      eventTimestamps = eventTimestamps.filter(t => t > oneMinuteAgo);

      switch (event.type) {
        case 'urlhaus': {
          const hit = event.data as URLhausHit;
          eventCounts.urlhaus++;
          if (audioReady) audio.playMalwareUrl(hit);
          const pos = visuals.handleMalwareUrl(hit);
          const threat = hit.threat || 'malware';
          lastSeen.urlhaus = threat;
          // 3D floating text + ticker
          visuals.spawnEventFragment('malware', `${threat}: ${hit.host}`, 'high', pos ?? undefined);
          addTickerItem('malware', `${threat} → ${hit.host}`, 'high');
          break;
        }

        case 'greynoise': {
          const data = event.data as GreyNoiseData;
          eventCounts.greynoise = data.scannerCount;
          if (audioReady) audio.updateNoiseFloor(data);
          visuals.updateScannerNoise(data);
          lastSeen.greynoise = data.topTags?.[0] || data.scannerTypes?.[0] || 'mass scanning';
          // Don't add to feed - too frequent, just update stats
          break;
        }

        case 'dshield': {
          const attack = event.data as DShieldAttack;
          eventCounts.dshield++;
          if (audioReady) audio.playHoneypotAttack(attack);
          const pos = visuals.handleHoneypotAttack(attack);
          lastSeen.dshield = `port ${attack.targetPort}`;
          const countryName = attack.country ? COUNTRY_NAMES[attack.country] || attack.country : '';
          visuals.spawnEventFragment('honeypot', `${attack.attackType || 'Attack'} :${attack.targetPort}`, 'medium', pos ?? undefined);
          // Geographic label
          if (pos && countryName) visuals.spawnGeoLabel(pos, countryName, 'medium');
          addTickerItem('honeypot', `${attack.attackType || 'Attack'} on port ${attack.targetPort}`, 'medium', countryName);
          break;
        }

        case 'feodo': {
          const c2 = event.data as FeodoC2;
          eventCounts.feodo++;
          if (audioReady) audio.playBotnetC2(c2);
          const pos = visuals.handleBotnetC2(c2);
          lastSeen.feodo = c2.malware || 'Botnet';
          const c2Country = c2.country ? COUNTRY_NAMES[c2.country] || c2.country : '';
          visuals.spawnEventFragment('c2', `${c2.malware || 'C2'} ${c2.ip}:${c2.port}`, 'high', pos ?? undefined);
          // Geographic label
          if (pos && c2Country) visuals.spawnGeoLabel(pos, c2Country, 'high');
          addTickerItem('c2', `${c2.malware || 'Botnet'} C2 active: ${c2.ip}`, 'high', c2Country);
          break;
        }

        case 'ransomware': {
          const victim = event.data as RansomwareVictim;
          eventCounts.ransomware++;
          if (audioReady) audio.playRansomwareVictim(victim);
          const pos = visuals.handleRansomwareVictim(victim);
          lastSeen.ransomware = victim.group;
          const victimCountry = victim.country ? COUNTRY_NAMES[victim.country] || victim.country : '';
          visuals.spawnEventFragment('ransomware', `${victim.group}: ${victim.victim}`, 'critical', pos ?? undefined);
          // Geographic label - always show for ransomware (critical)
          if (pos && victimCountry) visuals.spawnGeoLabel(pos, victimCountry, 'critical');
          addTickerItem('ransomware', `${victim.group} → ${victim.victim}`, 'critical', victimCountry);
          // Trigger tesseract glitch for ransomware
          visuals.triggerTesseractGlitch(1.0);
          break;
        }

        case 'phishing': {
          const phish = event.data as PhishingURL;
          eventCounts.phishing++;
          if (audioReady) audio.playPhishing(phish);
          const pos = visuals.handlePhishing(phish);
          lastSeen.phishing = phish.targetBrand || phish.domain;
          const phishContent = phish.targetBrand ? `${phish.targetBrand} → ${phish.domain}` : phish.domain;
          visuals.spawnEventFragment('phishing', phishContent, 'medium', pos ?? undefined);
          addTickerItem('phishing', phishContent, 'medium');
          break;
        }

        case 'sslbl': {
          const entry = event.data as SSLBlacklistEntry;
          eventCounts.sslbl++;
          if (audioReady) audio.playMaliciousCert(entry);
          const pos = visuals.handleMaliciousCert(entry);
          lastSeen.sslbl = entry.malware;
          visuals.spawnEventFragment('cert', `${entry.malware}`, 'medium', pos ?? undefined);
          addTickerItem('cert', `${entry.malware} - ${entry.listingReason}`, 'medium');
          break;
        }

        case 'bruteforce': {
          const attack = event.data as BruteforceAttack;
          eventCounts.bruteforce++;
          if (audioReady) audio.playBruteforce(attack);
          const pos = visuals.handleBruteforce(attack);
          const attackType = attack.attackType || 'SSH';
          lastSeen.bruteforce = attackType;
          const bfCountry = attack.country ? COUNTRY_NAMES[attack.country] || attack.country : '';
          visuals.spawnEventFragment('bruteforce', `${attackType} ${attack.ip}`, 'low', pos ?? undefined);
          // Geographic label - occasional for brute force (frequent events)
          if (pos && bfCountry && Math.random() < 0.3) visuals.spawnGeoLabel(pos, bfCountry, 'low');
          addTickerItem('bruteforce', `${attackType} brute force from ${attack.ip}`, 'low', bfCountry);
          break;
        }

        case 'tor': {
          const node = event.data as TorExitNode;
          eventCounts.tor++;
          if (audioReady) audio.playTorNode(node);
          const pos = visuals.handleTorNode(node);
          lastSeen.tor = node.nickname || node.ip;
          const torCountry = node.country ? COUNTRY_NAMES[node.country] || node.country : '';
          // Tor nodes are frequent - only spawn 3D text occasionally
          if (Math.random() < 0.3) {
            visuals.spawnEventFragment('tor', node.nickname || node.ip, 'low', pos ?? undefined);
            // Geographic label for tor
            if (pos && torCountry) visuals.spawnGeoLabel(pos, torCountry, 'low');
          }
          addTickerItem('tor', `Exit node: ${node.nickname || node.ip}`, 'low', torCountry);
          break;
        }

        case 'hibp': {
          const breach = event.data as HIBPBreach;
          eventCounts.hibp++;
          totalBreachRecords += breach.pwnCount;  // Track total records
          if (audioReady) audio.playBreach(breach);
          const pos = visuals.handleBreach(breach);
          lastSeen.hibp = breach.title;
          const pwnCount = breach.pwnCount.toLocaleString();
          visuals.spawnEventFragment('breach', `${breach.title}: ${pwnCount} pwned`, 'critical', pos ?? undefined);
          addTickerItem('breach', `${breach.title} breach: ${pwnCount} accounts`, 'critical');
          // Trigger tesseract glitch for major breaches
          visuals.triggerTesseractGlitch(breach.pwnCount > 1000000 ? 1.0 : 0.5);
          break;
        }

        case 'spamhaus': {
          const drop = event.data as SpamhausDrop;
          eventCounts.spamhaus++;
          if (audioReady) audio.playSpamhaus(drop);
          const pos = visuals.handleSpamhaus(drop);
          lastSeen.spamhaus = drop.cidr;
          const addrCount = drop.numAddresses.toLocaleString();
          visuals.spawnEventFragment('hijack', `${drop.cidr} (${addrCount} IPs)`, 'high', pos ?? undefined);
          addTickerItem('hijack', `Hijacked: ${drop.cidr} (${addrCount} IPs)`, 'high');
          break;
        }

        case 'bgp': {
          const bgpEvent = event.data as BGPEvent;
          eventCounts.bgp++;
          if (audioReady) audio.playBGPEvent(bgpEvent);
          const pos = visuals.handleBGPEvent(bgpEvent);
          lastSeen.bgp = bgpEvent.prefix;
          const severity = bgpEvent.severity === 'critical' ? 'critical' :
                          bgpEvent.severity === 'high' ? 'high' : 'medium';
          const asName = bgpEvent.asName || `AS${bgpEvent.asn}`;
          visuals.spawnEventFragment('bgp', `${bgpEvent.eventType}: ${bgpEvent.prefix}`, severity, pos ?? undefined);
          addTickerItem('bgp', `${bgpEvent.eventType.toUpperCase()}: ${bgpEvent.prefix} via ${asName}`, severity);
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

  // CRITICAL: Start audio context immediately on user gesture (required for mobile)
  // This must happen before any delays/animations
  try {
    const Tone = await import('tone');
    await Tone.start();
    console.log('[Ghostwire] Audio context started');
  } catch (err) {
    console.warn('[Ghostwire] Could not start audio context:', err);
  }

  // Fade out intro overlay first
  overlay.classList.add('hidden');

  // Run boot sequence after intro fades
  await new Promise(r => setTimeout(r, 300));
  bootScreen.classList.remove('hidden');
  await runBootSequence();

  // Mark as running and start render loop FIRST (before audio)
  isRunning = true;
  lastFrameTime = performance.now();
  requestAnimationFrame(renderLoop);

  // Show UI panels
  // Stats panel hidden - using 3D holographic HUD instead
  // document.getElementById('stats')?.classList.add('visible');
  document.getElementById('controls-container')?.classList.add('visible');
  document.getElementById('instructions')?.classList.add('visible');

  // Show threat ticker at top of screen
  if (threatTicker) {
    threatTicker.classList.remove('hidden');
    threatTicker.classList.add('visible');
    // Pause scroll on hover
    threatTicker.addEventListener('mouseenter', () => { tickerPaused = true; });
    threatTicker.addEventListener('mouseleave', () => { tickerPaused = false; });
  }

  // Initialize audio separately - if it fails, visuals still work
  try {
    await audio.init();
    console.log('[Ghostwire] Audio initialized successfully');
  } catch (err) {
    console.warn('[Ghostwire] Audio failed to initialize (visuals will still work):', err);
    // Don't block the experience - just log the error
    // User can still enjoy the visuals
  }
}

// Main render loop
function renderLoop(currentTime: number) {
  if (!isRunning) return;

  try {
    const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1); // Cap delta
    lastFrameTime = currentTime;

    // Update audio only if initialized
    if (audio.isInitialized()) {
      audio.update(deltaTime);
      // Pass waveform data to visuals for visualizer
      visuals.setWaveformData(audio.getWaveform());
    }

    // Always update and render visuals
    visuals.update(deltaTime);
    visuals.render();

    // Update sparkline time buckets
    updateSparklineBuckets();

    // Update ticker scroll
    updateTickerScroll(deltaTime);

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

  // Update 3D holographic HUD
  // Calculate total events across all feeds
  const totalEvents = eventCounts.urlhaus + eventCounts.dshield + eventCounts.feodo +
    eventCounts.ransomware + eventCounts.phishing + eventCounts.sslbl +
    eventCounts.bruteforce + eventCounts.tor + eventCounts.hibp +
    eventCounts.spamhaus + eventCounts.bgp;

  // Events per minute
  const eventsPerMin = eventTimestamps.length;

  // Format breach records
  let breachesDisplay: string;
  if (totalBreachRecords >= 1000000000) {
    breachesDisplay = `${(totalBreachRecords / 1000000000).toFixed(1)}B`;
  } else if (totalBreachRecords >= 1000000) {
    breachesDisplay = `${(totalBreachRecords / 1000000).toFixed(1)}M`;
  } else if (totalBreachRecords >= 1000) {
    breachesDisplay = `${(totalBreachRecords / 1000).toFixed(1)}K`;
  } else {
    breachesDisplay = totalBreachRecords.toString();
  }

  visuals.updateHUDStats({
    totalEvents,
    ransomware: eventCounts.ransomware,
    eventsPerMin,
    breaches: breachesDisplay,
  });
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

  // Key (root note)
  if (keySelect) {
    keySelect.addEventListener('change', () => {
      audio.setRoot(keySelect.value);
    });
  }

  // Mode (scale)
  if (modeSelect) {
    modeSelect.addEventListener('change', () => {
      audio.setScale(modeSelect.value as any);
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

// Mobile detection
function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth < 768);
}

// Populate device-specific messaging
function setupDeviceNote() {
  const deviceNote = document.getElementById('device-note');
  if (!deviceNote) return;

  if (isMobile()) {
    deviceNote.className = 'device-note mobile';
    deviceNote.innerHTML = `
      You're viewing in <strong>mobile mode</strong> — a streamlined experience optimized for your device.
      For the full audiovisual journey, we recommend visiting on desktop.
    `;
  } else {
    deviceNote.className = 'device-note desktop';
    deviceNote.innerHTML = `
      <strong>Desktop mode</strong> — full experience enabled
    `;
  }
}

// Start on DOM ready
function bootstrap() {
  // Hide boot screen initially (will show after Enter click)
  bootScreen.classList.add('hidden');

  // Set up device-specific messaging
  setupDeviceNote();

  // Initialize main app
  init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
