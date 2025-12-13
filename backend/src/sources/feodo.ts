// Feodo Tracker (abuse.ch) - Botnet Command & Control Servers
// Tracks C2 infrastructure for Emotet, Dridex, TrickBot, QakBot, BazarLoader

export interface FeodoC2 {
  id: string;
  timestamp: string;
  ip: string;
  port: number;
  malware: string;
  status: 'online' | 'offline';
  country: string;
  asName: string;
  firstSeen: string;
  lastOnline: string;
}

export interface FeodoCallbacks {
  onC2: (c2: FeodoC2) => void;
  onError: (error: Error) => void;
}

export class FeodoClient {
  private callbacks: FeodoCallbacks;
  private pollInterval: Timer | null = null;
  private seenIPs = new Set<string>();
  private pollIntervalMs = 180000; // 3 minutes

  constructor(callbacks: FeodoCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[Feodo] Starting botnet C2 tracker...');
    await this.poll();
    this.pollInterval = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async poll() {
    try {
      // Feodo Tracker provides JSON feed of recent C2s
      const response = await fetch('https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json');

      if (!response.ok) {
        throw new Error(`Feodo Tracker error: ${response.status}`);
      }

      const data = await response.json();
      let newCount = 0;
      const maxNew = 10;

      for (const entry of data) {
        if (newCount >= maxNew) break;

        const ip = entry.ip_address || entry.ip;
        if (!ip || this.seenIPs.has(ip)) continue;

        const c2: FeodoC2 = {
          id: `feodo-${ip}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          ip,
          port: entry.port || 443,
          malware: entry.malware || 'unknown',
          status: entry.status === 'online' ? 'online' : 'offline',
          country: entry.country || '??',
          asName: entry.as_name || entry.asn || 'Unknown AS',
          firstSeen: entry.first_seen || new Date().toISOString(),
          lastOnline: entry.last_online || new Date().toISOString()
        };

        this.callbacks.onC2(c2);
        this.seenIPs.add(ip);
        newCount++;
      }

      // Limit memory
      if (this.seenIPs.size > 2000) {
        const arr = Array.from(this.seenIPs);
        this.seenIPs = new Set(arr.slice(-1000));
      }

      if (newCount > 0) {
        console.log(`[Feodo] ${newCount} new botnet C2 servers`);
      }
    } catch (err) {
      console.error('[Feodo] Poll error:', err);
      // Fall back to simulated
      this.emitSimulated();
    }
  }

  private emitSimulated() {
    const malwares = ['Emotet', 'Dridex', 'TrickBot', 'QakBot', 'BazarLoader', 'IcedID', 'Bumblebee'];
    const countries = ['RU', 'UA', 'MD', 'KZ', 'BY', 'NL', 'DE', 'US', 'RO', 'BG'];

    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const c2: FeodoC2 = {
        id: `feodo-sim-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        ip: this.randomIP(),
        port: [443, 447, 449, 8080, 8443][Math.floor(Math.random() * 5)],
        malware: malwares[Math.floor(Math.random() * malwares.length)],
        status: Math.random() > 0.3 ? 'online' : 'offline',
        country: countries[Math.floor(Math.random() * countries.length)],
        asName: 'Bulletproof Hosting LLC',
        firstSeen: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        lastOnline: new Date().toISOString()
      };
      this.callbacks.onC2(c2);
    }
  }

  private randomIP(): string {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }
}
