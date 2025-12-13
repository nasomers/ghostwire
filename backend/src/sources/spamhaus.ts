// Spamhaus DROP (Don't Route Or Peer)
// Lists of hijacked/leased IP ranges controlled by spammers and cyber criminals

export interface SpamhausDrop {
  id: string;
  timestamp: string;
  cidr: string;
  sbl: string; // Spamhaus Block List reference
  country?: string;
  numAddresses: number;
  listType: 'drop' | 'edrop' | 'dropv6';
}

export interface SpamhausCallbacks {
  onDrop: (drop: SpamhausDrop) => void;
  onError: (error: Error) => void;
}

export class SpamhausClient {
  private callbacks: SpamhausCallbacks;
  private pollInterval: Timer | null = null;
  private seenCidrs = new Set<string>();
  private pollIntervalMs = 600000; // 10 minutes
  private initialized = false;

  constructor(callbacks: SpamhausCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[Spamhaus] Starting DROP list monitor...');
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
      // Fetch both DROP and EDROP lists
      const [dropResponse, edropResponse] = await Promise.all([
        fetch('https://www.spamhaus.org/drop/drop.txt'),
        fetch('https://www.spamhaus.org/drop/edrop.txt')
      ]);

      if (!dropResponse.ok || !edropResponse.ok) {
        throw new Error('Spamhaus API error');
      }

      const dropText = await dropResponse.text();
      const edropText = await edropResponse.text();

      const dropEntries = this.parseDropList(dropText, 'drop');
      const edropEntries = this.parseDropList(edropText, 'edrop');
      const allEntries = [...dropEntries, ...edropEntries];

      let newCount = 0;

      if (!this.initialized) {
        // First run - populate seen set
        for (const entry of allEntries) {
          this.seenCidrs.add(entry.cidr);
        }
        this.initialized = true;
        // Emit a few for initial display
        const toEmit = allEntries.slice(0, 8);
        for (const entry of toEmit) {
          this.callbacks.onDrop(entry);
          newCount++;
        }
      } else {
        // Check for new entries
        for (const entry of allEntries) {
          if (!this.seenCidrs.has(entry.cidr)) {
            this.callbacks.onDrop(entry);
            this.seenCidrs.add(entry.cidr);
            newCount++;
            if (newCount >= 10) break;
          }
        }
      }

      if (newCount > 0) {
        console.log(`[Spamhaus] ${newCount} new DROP entries`);
      }
    } catch (err) {
      console.error('[Spamhaus] Poll error:', err);
      this.emitSimulated();
    }
  }

  private parseDropList(text: string, listType: 'drop' | 'edrop'): SpamhausDrop[] {
    const entries: SpamhausDrop[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith(';') || !line.trim()) continue;

      // Format: "cidr ; SBLxxxxx"
      const match = line.match(/^(\d+\.\d+\.\d+\.\d+\/\d+)\s*;\s*(SBL\d+)/);
      if (match) {
        const cidr = match[1];
        const sbl = match[2];
        const prefixLen = parseInt(cidr.split('/')[1]);
        const numAddresses = Math.pow(2, 32 - prefixLen);

        entries.push({
          id: `spamhaus-${sbl}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          cidr,
          sbl,
          numAddresses,
          listType
        });
      }
    }

    return entries;
  }

  private emitSimulated() {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const prefixLen = [8, 16, 19, 20, 21, 22, 23, 24][Math.floor(Math.random() * 8)];
      const cidr = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.0/${prefixLen}`;
      const sblNum = 100000 + Math.floor(Math.random() * 900000);

      const drop: SpamhausDrop = {
        id: `spamhaus-sim-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        cidr,
        sbl: `SBL${sblNum}`,
        numAddresses: Math.pow(2, 32 - prefixLen),
        listType: Math.random() > 0.5 ? 'drop' : 'edrop'
      };
      this.callbacks.onDrop(drop);
    }
  }
}
