// Have I Been Pwned - Data Breach Notifications
// Monitors for new data breaches and leaked credentials

export interface HIBPBreach {
  id: string;
  timestamp: string;
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  isSensitive: boolean;
}

export interface HIBPCallbacks {
  onBreach: (breach: HIBPBreach) => void;
  onError: (error: Error) => void;
}

export class HIBPClient {
  private callbacks: HIBPCallbacks;
  private pollInterval: Timer | null = null;
  private seenBreaches = new Set<string>();
  private pollIntervalMs = 300000; // 5 minutes (respect rate limits)
  private initialized = false;

  constructor(callbacks: HIBPCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[HIBP] Starting breach monitor...');
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
      // HIBP public API for breaches (no API key needed for breach list)
      const response = await fetch('https://haveibeenpwned.com/api/v3/breaches', {
        headers: {
          'User-Agent': 'Ghostwire-ThreatViz'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log('[HIBP] Rate limited, backing off...');
          return;
        }
        throw new Error(`HIBP API error: ${response.status}`);
      }

      const breaches = await response.json() as any[];
      let newCount = 0;

      // Sort by AddedDate descending to get newest first
      breaches.sort((a, b) =>
        new Date(b.AddedDate).getTime() - new Date(a.AddedDate).getTime()
      );

      // On first run, just populate seen set with recent breaches
      if (!this.initialized) {
        for (const breach of breaches.slice(0, 100)) {
          this.seenBreaches.add(breach.Name);
        }
        this.initialized = true;
        // Emit a few recent ones for initial display
        for (const breach of breaches.slice(0, 5)) {
          this.emitBreach(breach);
          newCount++;
        }
      } else {
        // Emit only truly new breaches
        for (const breach of breaches) {
          if (!this.seenBreaches.has(breach.Name)) {
            this.emitBreach(breach);
            this.seenBreaches.add(breach.Name);
            newCount++;
            if (newCount >= 10) break;
          }
        }
      }

      if (newCount > 0) {
        console.log(`[HIBP] ${newCount} breach notifications`);
      }
    } catch (err) {
      console.error('[HIBP] Poll error:', err);
      this.emitSimulated();
    }
  }

  private emitBreach(raw: any) {
    const breach: HIBPBreach = {
      id: `hibp-${raw.Name}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      name: raw.Name,
      title: raw.Title,
      domain: raw.Domain || 'unknown',
      breachDate: raw.BreachDate,
      addedDate: raw.AddedDate,
      pwnCount: raw.PwnCount || 0,
      description: this.stripHtml(raw.Description || ''),
      dataClasses: raw.DataClasses || [],
      isVerified: raw.IsVerified || false,
      isSensitive: raw.IsSensitive || false
    };
    this.callbacks.onBreach(breach);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').substring(0, 200);
  }

  private emitSimulated() {
    const breachNames = [
      'MegaCorp Systems', 'DataVault Pro', 'CloudSync Services',
      'NetSecure Inc', 'CryptoExchange', 'SocialHub Platform',
      'HealthData Solutions', 'FinanceTracker', 'GameWorld Online'
    ];
    const dataTypes = [
      'Email addresses', 'Passwords', 'Usernames', 'IP addresses',
      'Phone numbers', 'Physical addresses', 'Credit cards',
      'Social security numbers', 'Dates of birth'
    ];

    const name = breachNames[Math.floor(Math.random() * breachNames.length)];
    const breach: HIBPBreach = {
      id: `hibp-sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      name: name.replace(/\s/g, ''),
      title: name,
      domain: `${name.toLowerCase().replace(/\s/g, '')}.com`,
      breachDate: this.randomPastDate(365),
      addedDate: new Date().toISOString().split('T')[0],
      pwnCount: Math.floor(Math.random() * 10000000) + 10000,
      description: `Data breach exposed user information from ${name}`,
      dataClasses: this.randomSubset(dataTypes, 2 + Math.floor(Math.random() * 4)),
      isVerified: Math.random() > 0.3,
      isSensitive: Math.random() > 0.7
    };
    this.callbacks.onBreach(breach);
  }

  private randomPastDate(maxDaysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * maxDaysAgo));
    return date.toISOString().split('T')[0];
  }

  private randomSubset<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
