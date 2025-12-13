// Ghostwire Backend
// Aggregates threat data feeds and exposes WebSocket for frontend

import { URLhausClient, type URLhausEntry } from './sources/urlhaus';
import { GreyNoiseClient, type GreyNoiseStats } from './sources/greynoise';
import { DShieldClient, type DShieldAttack } from './sources/dshield';
import { FeodoClient, type FeodoC2 } from './sources/feodo';
import { RansomWatchClient, type RansomwareVictim } from './sources/ransomwatch';
import { OpenPhishClient, type PhishingURL } from './sources/openphish';
import { SSLBLClient, type SSLBlacklistEntry } from './sources/sslbl';
import { BlocklistDeClient, type AttackReport } from './sources/blocklistde';
import { TorClient, type TorExitNode } from './sources/tor';
import { HIBPClient, type HIBPBreach } from './sources/hibp';
import { SpamhausClient, type SpamhausDrop } from './sources/spamhaus';
import { BGPStreamClient, type BGPEvent } from './sources/bgpstream';

// Event types sent to frontend
export type GhostwireEventType =
  | 'urlhaus'
  | 'greynoise'
  | 'dshield'
  | 'feodo'
  | 'ransomware'
  | 'phishing'
  | 'sslbl'
  | 'bruteforce'
  | 'tor'
  | 'hibp'
  | 'spamhaus'
  | 'bgp';

export interface GhostwireEvent {
  type: GhostwireEventType;
  data:
    | URLhausEntry
    | GreyNoiseStats
    | DShieldAttack
    | FeodoC2
    | RansomwareVictim
    | PhishingURL
    | SSLBlacklistEntry
    | AttackReport
    | TorExitNode
    | HIBPBreach
    | SpamhausDrop
    | BGPEvent;
}

// Track connected frontend clients
const clients = new Set<WebSocket>();

// Broadcast event to all connected clients
function broadcast(event: GhostwireEvent) {
  const msg = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// Rate limiting for URLhaus - drip feed the malware hits
let pendingURLhausEntries: URLhausEntry[] = [];
let urlhausDripTimer: Timer | null = null;

function throttledURLhausBroadcast(entry: URLhausEntry) {
  pendingURLhausEntries.push(entry);

  // Start drip timer if not running
  if (!urlhausDripTimer) {
    urlhausDripTimer = setInterval(() => {
      if (pendingURLhausEntries.length > 0) {
        const e = pendingURLhausEntries.shift()!;
        broadcast({ type: 'urlhaus', data: e });
      } else {
        clearInterval(urlhausDripTimer!);
        urlhausDripTimer = null;
      }
    }, 500); // One malware hit every 500ms for dramatic effect
  }
}

// Rate limiting for DShield honeypot attacks
let pendingDShieldAttacks: DShieldAttack[] = [];
let dshieldDripTimer: Timer | null = null;

function throttledDShieldBroadcast(attack: DShieldAttack) {
  pendingDShieldAttacks.push(attack);

  if (!dshieldDripTimer) {
    dshieldDripTimer = setInterval(() => {
      if (pendingDShieldAttacks.length > 0) {
        const a = pendingDShieldAttacks.shift()!;
        broadcast({ type: 'dshield', data: a });
      } else {
        clearInterval(dshieldDripTimer!);
        dshieldDripTimer = null;
      }
    }, 800); // Honeypot attacks every 800ms
  }
}


// Rate limiting for Tor exit nodes
let pendingTorNodes: TorExitNode[] = [];
let torDripTimer: Timer | null = null;

function throttledTorBroadcast(node: TorExitNode) {
  pendingTorNodes.push(node);

  if (!torDripTimer) {
    torDripTimer = setInterval(() => {
      if (pendingTorNodes.length > 0) {
        const n = pendingTorNodes.shift()!;
        broadcast({ type: 'tor', data: n });
      } else {
        clearInterval(torDripTimer!);
        torDripTimer = null;
      }
    }, 2000); // Tor nodes every 2s (ambient, slow)
  }
}

// === Initialize Data Sources ===

// URLhaus - Malware URLs (abuse.ch)
const urlhaus = new URLhausClient({
  onEntry: throttledURLhausBroadcast,
  onError: (error) => console.error('[Ghostwire] URLhaus error:', error)
});

// GreyNoise - Scanner activity (ambient noise)
const greynoise = new GreyNoiseClient(
  process.env.GREYNOISE_API_KEY || '',
  {
    onStats: (stats) => broadcast({ type: 'greynoise', data: stats }),
    onError: (error) => console.error('[Ghostwire] GreyNoise error:', error)
  }
);

// DShield - Honeypot attacks (SANS ISC)
const dshield = new DShieldClient({
  onAttack: throttledDShieldBroadcast,
  onError: (error) => console.error('[Ghostwire] DShield error:', error)
});

// Feodo Tracker - Botnet C2 servers (abuse.ch)
const feodo = new FeodoClient({
  onC2: (c2) => broadcast({ type: 'feodo', data: c2 }),
  onError: (error) => console.error('[Ghostwire] Feodo error:', error)
});

// RansomWatch - Ransomware leak site victims
const ransomwatch = new RansomWatchClient({
  onVictim: (victim) => broadcast({ type: 'ransomware', data: victim }),
  onError: (error) => console.error('[Ghostwire] RansomWatch error:', error)
});

// OpenPhish - Phishing URLs (free feed)
const openphish = new OpenPhishClient({
  onPhish: (phish) => broadcast({ type: 'phishing', data: phish }),
  onError: (error) => console.error('[Ghostwire] OpenPhish error:', error)
});

// SSLBL - Malicious SSL certs (abuse.ch)
const sslbl = new SSLBLClient({
  onEntry: (entry) => broadcast({ type: 'sslbl', data: entry }),
  onError: (error) => console.error('[Ghostwire] SSLBL error:', error)
});

// Blocklist.de - Brute force attack reports
const blocklistde = new BlocklistDeClient({
  onAttack: (attack) => broadcast({ type: 'bruteforce', data: attack }),
  onError: (error) => console.error('[Ghostwire] Blocklist.de error:', error)
});

// Tor - Dark web exit nodes
const tor = new TorClient({
  onExitNode: throttledTorBroadcast,
  onError: (error) => console.error('[Ghostwire] Tor error:', error)
});

// HIBP - Data breach notifications
const hibp = new HIBPClient({
  onBreach: (breach) => broadcast({ type: 'hibp', data: breach }),
  onError: (error) => console.error('[Ghostwire] HIBP error:', error)
});

// Spamhaus - Hijacked IP ranges
const spamhaus = new SpamhausClient({
  onDrop: (drop) => broadcast({ type: 'spamhaus', data: drop }),
  onError: (error) => console.error('[Ghostwire] Spamhaus error:', error)
});

// BGPStream - BGP hijacks and route leaks
const bgpstream = new BGPStreamClient({
  onEvent: (event) => broadcast({ type: 'bgp', data: event }),
  onError: (error) => console.error('[Ghostwire] BGPStream error:', error)
});

// Active sources tracking
const activeSources: string[] = [];

// Start the server
const PORT = parseInt(process.env.PORT || '3333');
const USE_TLS = process.env.NODE_ENV !== 'production' &&
  await Bun.file('./key.pem').exists() &&
  await Bun.file('./cert.pem').exists();

const server = Bun.serve({
  hostname: '0.0.0.0',
  port: PORT,
  ...(USE_TLS ? {
    tls: {
      key: Bun.file('./key.pem'),
      cert: Bun.file('./cert.pem'),
    },
  } : {}),

  fetch(req, server) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response('ok');
    }

    // Status endpoint
    if (url.pathname === '/status') {
      return Response.json({
        sources: activeSources,
        clients: clients.size
      });
    }

    // WebSocket upgrade
    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return undefined;
    }

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    return new Response('Ghostwire API - Threat Intelligence Stream', {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  },

  websocket: {
    open(ws) {
      console.log('[Ghostwire] Client connected');
      clients.add(ws);

      ws.send(JSON.stringify({
        type: 'welcome',
        data: {
          message: 'Connected to Ghostwire - The Dark Side of the Internet',
          sources: activeSources,
          clientCount: clients.size,
          sourceDescriptions: {
            urlhaus: 'Malware distribution URLs',
            greynoise: 'Internet-wide scanner noise',
            dshield: 'Honeypot attack traffic',
            feodo: 'Botnet command & control servers',
            ransomware: 'Ransomware gang leak site victims',
            phishing: 'Active phishing campaigns',
            sslbl: 'Malicious SSL certificates',
            bruteforce: 'Brute force attack reports',
            tor: 'Dark web exit nodes',
            hibp: 'Data breach notifications',
            spamhaus: 'Hijacked IP ranges (DROP list)',
            bgp: 'BGP hijacks and route leaks'
          }
        }
      }));
    },

    message(ws, message) {
      // Could add subscription filtering later
    },

    close(ws) {
      console.log('[Ghostwire] Client disconnected');
      clients.delete(ws);
    },
  },
});

const protocol = USE_TLS ? 'https' : 'http';
console.log(`[Ghostwire] Server running on ${protocol}://0.0.0.0:${server.port}`);

// Connect to all data sources
async function startSources() {
  console.log('[Ghostwire] Starting threat intelligence feeds...\n');

  // URLhaus - always available, no auth
  await urlhaus.start();
  activeSources.push('urlhaus');

  // GreyNoise - simulates if no API key
  await greynoise.start();
  activeSources.push('greynoise');

  // DShield - public honeypot data
  await dshield.start();
  activeSources.push('dshield');

  // Feodo Tracker - botnet C2s
  await feodo.start();
  activeSources.push('feodo');

  // RansomWatch - ransomware victims
  await ransomwatch.start();
  activeSources.push('ransomware');

  // OpenPhish - phishing URLs
  await openphish.start();
  activeSources.push('phishing');

  // SSLBL - malicious SSL certs
  await sslbl.start();
  activeSources.push('sslbl');

  // Blocklist.de - brute force attacks
  await blocklistde.start();
  activeSources.push('bruteforce');

  // Tor - dark web exit nodes
  await tor.start();
  activeSources.push('tor');

  // HIBP - data breach notifications
  await hibp.start();
  activeSources.push('hibp');

  // Spamhaus - hijacked IP ranges
  await spamhaus.start();
  activeSources.push('spamhaus');

  // BGPStream - BGP hijacks and route leaks
  await bgpstream.start();
  activeSources.push('bgp');

  console.log(`\n[Ghostwire] ✓ Active sources: ${activeSources.join(', ')}`);
  console.log('[Ghostwire] Streaming threat intelligence to connected clients...\n');
}

startSources();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Ghostwire] Shutting down...');
  urlhaus.stop();
  greynoise.stop();
  dshield.stop();
  feodo.stop();
  ransomwatch.stop();
  openphish.stop();
  sslbl.stop();
  blocklistde.stop();
  tor.stop();
  hibp.stop();
  spamhaus.stop();
  bgpstream.stop();
  server.stop();
  process.exit(0);
});
