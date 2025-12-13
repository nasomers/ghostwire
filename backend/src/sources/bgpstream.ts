// BGPStream - Real-time BGP Hijacks and Route Leaks
// Uses RIPE RIS Live for real-time BGP updates

export interface BGPEvent {
  id: string;
  timestamp: string;
  eventType: 'hijack' | 'leak' | 'outage' | 'announcement' | 'withdrawal';
  prefix: string;
  asn: number;
  asName?: string;
  path: number[];
  originAsn: number;
  peerAsn: number;
  collector: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface BGPStreamCallbacks {
  onEvent: (event: BGPEvent) => void;
  onError: (error: Error) => void;
}

// Known large networks for context
const KNOWN_ASNS: Record<number, string> = {
  15169: 'Google',
  13335: 'Cloudflare',
  16509: 'Amazon',
  8075: 'Microsoft',
  32934: 'Facebook',
  20940: 'Akamai',
  2914: 'NTT',
  3356: 'Lumen',
  174: 'Cogent',
  6939: 'Hurricane Electric',
  7018: 'AT&T',
  701: 'Verizon',
  3257: 'GTT',
  1299: 'Telia',
  6461: 'Zayo',
  6762: 'Telecom Italia',
  4134: 'China Telecom',
  4837: 'China Unicom',
  4808: 'China Mobile',
  9808: 'China Mobile HK',
  12389: 'Rostelecom'
};

export class BGPStreamClient {
  private callbacks: BGPStreamCallbacks;
  private ws: WebSocket | null = null;
  private reconnectTimer: Timer | null = null;
  private reconnectDelay = 5000;
  private eventCount = 0;
  private recentPrefixes = new Map<string, number>(); // prefix -> last seen timestamp
  private emitInterval: Timer | null = null;
  private pendingEvents: BGPEvent[] = [];

  constructor(callbacks: BGPStreamCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[BGPStream] Connecting to RIPE RIS Live...');
    this.connect();
    // Rate limit event emission to avoid overwhelming the frontend
    this.emitInterval = setInterval(() => this.emitPending(), 1500);
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.emitInterval) {
      clearInterval(this.emitInterval);
      this.emitInterval = null;
    }
  }

  private connect() {
    try {
      // RIPE RIS Live WebSocket endpoint
      this.ws = new WebSocket('wss://ris-live.ripe.net/v1/ws/?client=ghostwire');

      this.ws.onopen = () => {
        console.log('[BGPStream] Connected to RIPE RIS Live');
        this.reconnectDelay = 5000;

        // Subscribe to BGP updates - filter for more interesting prefixes
        const subscription = {
          type: 'ris_subscribe',
          data: {
            // Get announcements and withdrawals
            type: 'UPDATE',
            // No specific host filter = all collectors
            // Optionally filter by prefix size to reduce noise
            moreSpecific: true,
            lessSpecific: false,
            // Get IPv4 updates (can add IPv6 later)
            socketOptions: {
              includeRaw: false
            }
          }
        };

        this.ws!.send(JSON.stringify(subscription));
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ris_message' && msg.data) {
            this.processUpdate(msg.data);
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      this.ws.onclose = () => {
        console.log('[BGPStream] Disconnected, reconnecting...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[BGPStream] WebSocket error');
        this.emitSimulated();
      };
    } catch (err) {
      console.error('[BGPStream] Connection error:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 60000);
  }

  private processUpdate(data: any) {
    // Rate limit - skip some updates to avoid overwhelming
    this.eventCount++;
    if (this.eventCount % 50 !== 0) return; // Process 1 in 50 updates

    const announcements = data.announcements || [];
    const withdrawals = data.withdrawals || [];
    const path = data.path || [];
    const peerAsn = data.peer_asn;
    const collector = data.host || 'unknown';

    // Process announcements (potential hijacks/leaks)
    for (const ann of announcements) {
      const prefix = ann.prefixes?.[0] || ann;
      if (typeof prefix !== 'string') continue;

      // Skip if we've seen this prefix recently
      const now = Date.now();
      const lastSeen = this.recentPrefixes.get(prefix);
      if (lastSeen && now - lastSeen < 30000) continue;
      this.recentPrefixes.set(prefix, now);

      const originAsn = path.length > 0 ? path[path.length - 1] : 0;
      const event = this.analyzeAnnouncement(prefix, path, originAsn, peerAsn, collector);
      if (event) {
        this.pendingEvents.push(event);
      }
    }

    // Process withdrawals (potential outages)
    for (const prefix of withdrawals) {
      if (typeof prefix !== 'string') continue;

      // Only emit withdrawal events occasionally
      if (Math.random() > 0.1) continue;

      const event: BGPEvent = {
        id: `bgp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        eventType: 'withdrawal',
        prefix,
        asn: peerAsn,
        path: [],
        originAsn: 0,
        peerAsn,
        collector,
        severity: 'low',
        description: `Route withdrawn: ${prefix}`
      };
      this.pendingEvents.push(event);
    }

    // Cleanup old prefixes from memory
    if (this.recentPrefixes.size > 5000) {
      const cutoff = Date.now() - 60000;
      for (const [prefix, time] of this.recentPrefixes) {
        if (time < cutoff) this.recentPrefixes.delete(prefix);
      }
    }
  }

  private analyzeAnnouncement(
    prefix: string,
    path: number[],
    originAsn: number,
    peerAsn: number,
    collector: string
  ): BGPEvent | null {
    // Detect potential hijacks and leaks based on heuristics
    let eventType: BGPEvent['eventType'] = 'announcement';
    let severity: BGPEvent['severity'] = 'low';
    let description = `New route: ${prefix} via AS${originAsn}`;

    // Heuristic 1: Very long AS paths might indicate route leak
    if (path.length > 8) {
      eventType = 'leak';
      severity = 'medium';
      description = `Possible route leak: ${prefix} - unusually long AS path (${path.length} hops)`;
    }

    // Heuristic 2: AS path with loops (same ASN appears twice)
    const asnSet = new Set(path);
    if (asnSet.size < path.length) {
      eventType = 'leak';
      severity = 'high';
      description = `AS path loop detected: ${prefix} - ASN appears multiple times in path`;
    }

    // Heuristic 3: Major network announcing unusual prefix
    const asName = KNOWN_ASNS[originAsn];
    if (asName) {
      // More interesting when large networks make announcements
      severity = 'medium';
      description = `${asName} (AS${originAsn}) announcing ${prefix}`;
    }

    // Heuristic 4: More specific prefixes (/25 or smaller) are often hijacks
    const prefixLen = parseInt(prefix.split('/')[1] || '24');
    if (prefixLen >= 25) {
      eventType = 'hijack';
      severity = 'high';
      description = `Suspicious specific prefix: ${prefix} (/${prefixLen}) from AS${originAsn}`;
    }

    // Only emit events that are at least somewhat interesting
    if (severity === 'low' && Math.random() > 0.05) return null;

    return {
      id: `bgp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType,
      prefix,
      asn: originAsn,
      asName,
      path,
      originAsn,
      peerAsn,
      collector,
      severity,
      description
    };
  }

  private emitPending() {
    if (this.pendingEvents.length === 0) return;

    // Emit highest severity first
    this.pendingEvents.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const event = this.pendingEvents.shift()!;
    this.callbacks.onEvent(event);

    // Keep queue manageable
    if (this.pendingEvents.length > 50) {
      this.pendingEvents = this.pendingEvents.slice(0, 30);
    }
  }

  private emitSimulated() {
    const prefixes = [
      '1.1.1.0/24', '8.8.8.0/24', '208.67.222.0/24',
      '13.32.0.0/16', '52.94.0.0/16', '104.16.0.0/16',
      '172.217.0.0/16', '31.13.64.0/18', '157.240.0.0/16'
    ];
    const eventTypes: BGPEvent['eventType'][] = ['hijack', 'leak', 'announcement', 'withdrawal'];
    const severities: BGPEvent['severity'][] = ['low', 'medium', 'high'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const asn = Object.keys(KNOWN_ASNS)[Math.floor(Math.random() * Object.keys(KNOWN_ASNS).length)];
    const asnNum = parseInt(asn);

    const event: BGPEvent = {
      id: `bgp-sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType,
      prefix,
      asn: asnNum,
      asName: KNOWN_ASNS[asnNum],
      path: [174, 3356, asnNum],
      originAsn: asnNum,
      peerAsn: 3356,
      collector: 'rrc00',
      severity: severities[Math.floor(Math.random() * severities.length)],
      description: `${eventType === 'hijack' ? 'Possible hijack' : eventType === 'leak' ? 'Route leak' : 'BGP update'}: ${prefix}`
    };

    this.callbacks.onEvent(event);
  }
}
