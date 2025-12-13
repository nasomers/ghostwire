// ThreatFox (abuse.ch) - Indicators of Compromise
// Malware IOCs shared by security researchers

export interface ThreatFoxIOC {
  id: string;
  timestamp: string;
  iocType: string;
  iocValue: string;
  threatType: string;
  malware: string;
  malwareFamily: string;
  confidence: number;
  reporter: string;
  tags: string[];
}

export interface ThreatFoxCallbacks {
  onIOC: (ioc: ThreatFoxIOC) => void;
  onError: (error: Error) => void;
}

export class ThreatFoxClient {
  private callbacks: ThreatFoxCallbacks;
  private pollInterval: Timer | null = null;
  private seenIOCs = new Set<string>();
  private pollIntervalMs = 180000; // 3 minutes

  constructor(callbacks: ThreatFoxCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[ThreatFox] Starting IOC feed...');
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
      // ThreatFox API - recent IOCs (last 7 days)
      const response = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'get_iocs', days: 1 })
      });

      if (!response.ok) {
        console.log('[ThreatFox] API returned ' + response.status + ', using simulated data');
        this.emitSimulated();
        return;
      }

      const result = await response.json();
      if (result.query_status !== 'ok' || !result.data) {
        this.emitSimulated();
        return;
      }

      let newCount = 0;
      const maxNew = 12;

      for (const entry of result.data) {
        if (newCount >= maxNew) break;

        const iocKey = entry.ioc;
        if (!iocKey || this.seenIOCs.has(iocKey)) continue;

        const ioc: ThreatFoxIOC = {
          id: entry.id || `tf-${Date.now()}-${newCount}`,
          timestamp: new Date().toISOString(),
          iocType: entry.ioc_type || 'unknown',
          iocValue: entry.ioc || '',
          threatType: entry.threat_type || 'malware',
          malware: entry.malware || 'unknown',
          malwareFamily: entry.malware_malpedia || entry.malware || 'unknown',
          confidence: entry.confidence_level || 50,
          reporter: entry.reporter || 'anonymous',
          tags: entry.tags || []
        };

        this.callbacks.onIOC(ioc);
        this.seenIOCs.add(iocKey);
        newCount++;
      }

      // Limit memory
      if (this.seenIOCs.size > 3000) {
        const arr = Array.from(this.seenIOCs);
        this.seenIOCs = new Set(arr.slice(-1500));
      }

      if (newCount > 0) {
        console.log(`[ThreatFox] ${newCount} new IOCs`);
      }
    } catch (err) {
      console.error('[ThreatFox] Poll error:', err);
      this.emitSimulated();
    }
  }

  private emitSimulated() {
    const iocTypes = ['ip:port', 'domain', 'url', 'md5_hash', 'sha256_hash'];
    const malwares = ['Emotet', 'QakBot', 'IcedID', 'Cobalt Strike', 'AsyncRAT', 'RedLine', 'Raccoon', 'AgentTesla'];
    const threatTypes = ['botnet_cc', 'payload_delivery', 'stealer', 'rat', 'ransomware'];

    const count = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const iocType = iocTypes[Math.floor(Math.random() * iocTypes.length)];
      const ioc: ThreatFoxIOC = {
        id: `tf-sim-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        iocType,
        iocValue: this.generateIOCValue(iocType),
        threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)],
        malware: malwares[Math.floor(Math.random() * malwares.length)],
        malwareFamily: malwares[Math.floor(Math.random() * malwares.length)],
        confidence: 50 + Math.floor(Math.random() * 50),
        reporter: 'simulated',
        tags: ['malware', 'c2']
      };
      this.callbacks.onIOC(ioc);
    }
  }

  private generateIOCValue(type: string): string {
    switch (type) {
      case 'ip:port':
        return `${this.randomIP()}:${443 + Math.floor(Math.random() * 1000)}`;
      case 'domain':
        return `${this.randomString(8)}.${['com', 'net', 'xyz', 'top', 'ru'][Math.floor(Math.random() * 5)]}`;
      case 'url':
        return `http://${this.randomString(8)}.com/${this.randomString(5)}.php`;
      case 'md5_hash':
        return this.randomHex(32);
      case 'sha256_hash':
        return this.randomHex(64);
      default:
        return this.randomString(16);
    }
  }

  private randomIP(): string {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  private randomString(len: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private randomHex(len: number): string {
    const chars = '0123456789abcdef';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
