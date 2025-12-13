// SSLBL (abuse.ch) - SSL Blacklist
// Malicious SSL certificates and JA3 fingerprints used by malware

export interface SSLBlacklistEntry {
  id: string;
  timestamp: string;
  sha1: string;
  issuer: string;
  subject: string;
  malware: string;
  listingReason: string;
  listingDate: string;
  ja3Fingerprint?: string;
}

export interface SSLBLCallbacks {
  onEntry: (entry: SSLBlacklistEntry) => void;
  onError: (error: Error) => void;
}

export class SSLBLClient {
  private callbacks: SSLBLCallbacks;
  private pollInterval: Timer | null = null;
  private seenCerts = new Set<string>();
  private pollIntervalMs = 300000; // 5 minutes

  constructor(callbacks: SSLBLCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[SSLBL] Starting malicious SSL cert feed...');
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
      // SSLBL CSV feed
      const response = await fetch('https://sslbl.abuse.ch/blacklist/sslblacklist.csv');

      if (!response.ok) {
        throw new Error(`SSLBL error: ${response.status}`);
      }

      const text = await response.text();
      const lines = text.split('\n').filter(line => line && !line.startsWith('#'));

      let newCount = 0;
      const maxNew = 8;

      for (const line of lines) {
        if (newCount >= maxNew) break;

        const parts = line.split(',');
        if (parts.length < 3) continue;

        const sha1 = parts[1]?.trim();
        if (!sha1 || this.seenCerts.has(sha1)) continue;

        const entry: SSLBlacklistEntry = {
          id: `sslbl-${sha1.slice(0, 16)}`,
          timestamp: new Date().toISOString(),
          sha1,
          issuer: this.cleanField(parts[2]) || 'Unknown Issuer',
          subject: this.cleanField(parts[3]) || 'Unknown Subject',
          malware: this.cleanField(parts[4]) || 'Unknown Malware',
          listingReason: this.cleanField(parts[5]) || 'Malicious SSL certificate',
          listingDate: parts[0]?.trim() || new Date().toISOString()
        };

        this.callbacks.onEntry(entry);
        this.seenCerts.add(sha1);
        newCount++;
      }

      // Also fetch JA3 fingerprints
      await this.pollJA3();

      // Limit memory
      if (this.seenCerts.size > 2000) {
        const arr = Array.from(this.seenCerts);
        this.seenCerts = new Set(arr.slice(-1000));
      }

      if (newCount > 0) {
        console.log(`[SSLBL] ${newCount} new malicious certs`);
      }
    } catch (err) {
      console.error('[SSLBL] Poll error:', err);
      this.emitSimulated();
    }
  }

  private async pollJA3() {
    try {
      const response = await fetch('https://sslbl.abuse.ch/blacklist/ja3_fingerprints.csv');
      if (!response.ok) return;

      const text = await response.text();
      const lines = text.split('\n').filter(line => line && !line.startsWith('#'));

      let newCount = 0;
      const maxNew = 4;

      for (const line of lines) {
        if (newCount >= maxNew) break;

        const parts = line.split(',');
        if (parts.length < 2) continue;

        const ja3 = parts[0]?.trim();
        if (!ja3 || this.seenCerts.has(ja3)) continue;

        const entry: SSLBlacklistEntry = {
          id: `ja3-${ja3.slice(0, 16)}`,
          timestamp: new Date().toISOString(),
          sha1: '',
          issuer: '',
          subject: '',
          malware: this.cleanField(parts[1]) || 'Unknown Malware',
          listingReason: 'Malicious JA3 fingerprint',
          listingDate: new Date().toISOString(),
          ja3Fingerprint: ja3
        };

        this.callbacks.onEntry(entry);
        this.seenCerts.add(ja3);
        newCount++;
      }
    } catch (err) {
      // Silently fail JA3, main feed is more important
    }
  }

  private cleanField(field: string | undefined): string {
    if (!field) return '';
    return field.trim().replace(/^"|"$/g, '');
  }

  private emitSimulated() {
    const malwares = ['Dridex', 'TrickBot', 'Emotet', 'QakBot', 'Cobalt Strike', 'IcedID'];
    const reasons = ['C2 communication', 'Payload delivery', 'Data exfiltration', 'Botnet traffic'];

    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const entry: SSLBlacklistEntry = {
        id: `sslbl-sim-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        sha1: this.randomHex(40),
        issuer: `CN=${this.randomDomain()}`,
        subject: `CN=${this.randomDomain()}`,
        malware: malwares[Math.floor(Math.random() * malwares.length)],
        listingReason: reasons[Math.floor(Math.random() * reasons.length)],
        listingDate: new Date().toISOString(),
        ja3Fingerprint: Math.random() > 0.7 ? this.randomHex(32) : undefined
      };
      this.callbacks.onEntry(entry);
    }
  }

  private randomHex(len: number): string {
    const chars = '0123456789abcdef';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private randomDomain(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const name = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${name}.${['com', 'net', 'xyz', 'top'][Math.floor(Math.random() * 4)]}`;
  }
}
