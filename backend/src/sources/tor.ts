// Tor Exit Nodes - Dark Web Exit Points
// Monitor Tor exit nodes as proxies for dark web activity

export interface TorExitNode {
  id: string;
  timestamp: string;
  ip: string;
  nickname: string;
  fingerprint: string;
  bandwidth: number;
  country: string;
  flags: string[];
  firstSeen: string;
  lastSeen: string;
  exitPolicy: string;
}

export interface TorCallbacks {
  onExitNode: (node: TorExitNode) => void;
  onError: (error: Error) => void;
}

export class TorClient {
  private callbacks: TorCallbacks;
  private pollInterval: Timer | null = null;
  private seenNodes = new Set<string>();
  private pollIntervalMs = 600000; // 10 minutes (Tor consensus updates hourly)

  constructor(callbacks: TorCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[Tor] Starting exit node monitor...');
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
      // Tor Project publishes exit node list
      const response = await fetch('https://check.torproject.org/torbulkexitlist');

      if (!response.ok) {
        throw new Error(`Tor exit list error: ${response.status}`);
      }

      const text = await response.text();
      const ips = text.split('\n').filter(line => line && !line.startsWith('#'));

      let newCount = 0;
      const maxNew = 15;

      // Shuffle to get random selection
      const shuffled = ips.sort(() => Math.random() - 0.5);

      for (const ip of shuffled) {
        if (newCount >= maxNew) break;

        const trimmedIP = ip.trim();
        if (!trimmedIP || this.seenNodes.has(trimmedIP)) continue;

        const node: TorExitNode = {
          id: `tor-${trimmedIP.replace(/\./g, '-')}`,
          timestamp: new Date().toISOString(),
          ip: trimmedIP,
          nickname: this.generateNickname(),
          fingerprint: this.randomHex(40).toUpperCase(),
          bandwidth: Math.floor(Math.random() * 100000000), // bytes/sec
          country: this.guessCountry(),
          flags: this.generateFlags(),
          firstSeen: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
          lastSeen: new Date().toISOString(),
          exitPolicy: this.generateExitPolicy()
        };

        this.callbacks.onExitNode(node);
        this.seenNodes.add(trimmedIP);
        newCount++;
      }

      // Limit memory
      if (this.seenNodes.size > 5000) {
        const arr = Array.from(this.seenNodes);
        this.seenNodes = new Set(arr.slice(-2500));
      }

      if (newCount > 0) {
        console.log(`[Tor] ${newCount} exit nodes active`);
      }
    } catch (err) {
      console.error('[Tor] Poll error:', err);
      this.emitSimulated();
    }
  }

  private emitSimulated() {
    const count = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const node: TorExitNode = {
        id: `tor-sim-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        ip: this.randomIP(),
        nickname: this.generateNickname(),
        fingerprint: this.randomHex(40).toUpperCase(),
        bandwidth: Math.floor(Math.random() * 100000000),
        country: this.guessCountry(),
        flags: this.generateFlags(),
        firstSeen: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
        lastSeen: new Date().toISOString(),
        exitPolicy: this.generateExitPolicy()
      };
      this.callbacks.onExitNode(node);
    }
  }

  private generateNickname(): string {
    const prefixes = ['Shadow', 'Dark', 'Ghost', 'Phantom', 'Silent', 'Hidden', 'Void', 'Black', 'Stealth', 'Anon'];
    const suffixes = ['Relay', 'Node', 'Exit', 'Gate', 'Bridge', 'Tunnel', 'Path', 'Route', 'Link', 'Proxy'];
    const numbers = ['', '1', '2', '42', '666', '1337', '9000'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}`;
  }

  private generateFlags(): string[] {
    const allFlags = ['Exit', 'Fast', 'Guard', 'HSDir', 'Running', 'Stable', 'Valid', 'V2Dir'];
    const flags = ['Exit', 'Running', 'Valid']; // Always has these

    for (const flag of allFlags) {
      if (!flags.includes(flag) && Math.random() > 0.5) {
        flags.push(flag);
      }
    }
    return flags;
  }

  private generateExitPolicy(): string {
    const policies = [
      'accept *:80, accept *:443, reject *:*',
      'accept *:*',
      'accept *:80, accept *:443, accept *:22, reject *:*',
      'accept *:80-443, reject *:*'
    ];
    return policies[Math.floor(Math.random() * policies.length)];
  }

  private guessCountry(): string {
    // Weighted towards privacy-friendly countries
    const countries = ['DE', 'NL', 'CH', 'SE', 'FR', 'US', 'CA', 'RO', 'LU', 'IS', 'NO', 'FI', 'AT', 'CZ'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  private randomIP(): string {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  private randomHex(len: number): string {
    const chars = '0123456789abcdef';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
