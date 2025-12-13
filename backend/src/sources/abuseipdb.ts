// AbuseIPDB - Crowd-sourced malicious IP reports
// Polls the blacklist endpoint for recently reported IPs

export interface AbuseIPDBEntry {
  ipAddress: string;
  abuseConfidenceScore: number;
  countryCode: string;
  lastReportedAt: string;
  totalReports: number;
  categories: number[];
}

export interface AbuseIPDBCallbacks {
  onEntry: (entry: AbuseIPDBEntry) => void;
  onError: (error: Error) => void;
}

// Category mapping for reference
export const ABUSE_CATEGORIES: Record<number, string> = {
  1: 'DNS Compromise',
  2: 'DNS Poisoning',
  3: 'Fraud Orders',
  4: 'DDoS Attack',
  5: 'FTP Brute-Force',
  6: 'Ping of Death',
  7: 'Phishing',
  8: 'Fraud VoIP',
  9: 'Open Proxy',
  10: 'Web Spam',
  11: 'Email Spam',
  12: 'Blog Spam',
  13: 'VPN IP',
  14: 'Port Scan',
  15: 'Hacking',
  16: 'SQL Injection',
  17: 'Spoofing',
  18: 'Brute-Force',
  19: 'Bad Web Bot',
  20: 'Exploited Host',
  21: 'Web App Attack',
  22: 'SSH',
  23: 'IoT Targeted'
};

export class AbuseIPDBClient {
  private apiKey: string;
  private callbacks: AbuseIPDBCallbacks;
  private pollInterval: Timer | null = null;
  private seenIPs = new Set<string>();
  private pollIntervalMs = 60000; // 1 minute (rate limited)

  constructor(apiKey: string, callbacks: AbuseIPDBCallbacks) {
    this.apiKey = apiKey;
    this.callbacks = callbacks;
  }

  async start() {
    if (!this.apiKey) {
      console.log('[AbuseIPDB] No API key configured, skipping');
      return;
    }

    console.log('[AbuseIPDB] Starting polling...');
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
      // Get blacklist - IPs with high abuse confidence
      const response = await fetch('https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=75&limit=50', {
        headers: {
          'Key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log('[AbuseIPDB] Rate limited, backing off');
          return;
        }
        throw new Error(`AbuseIPDB API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data) {
        return;
      }

      let newCount = 0;

      for (const raw of data.data) {
        // Skip if we've seen this IP recently
        if (this.seenIPs.has(raw.ipAddress)) {
          continue;
        }

        const entry: AbuseIPDBEntry = {
          ipAddress: raw.ipAddress,
          abuseConfidenceScore: raw.abuseConfidenceScore,
          countryCode: raw.countryCode || 'XX',
          lastReportedAt: raw.lastReportedAt,
          totalReports: raw.totalReports || 1,
          categories: [] // Blacklist endpoint doesn't include categories
        };

        this.callbacks.onEntry(entry);
        this.seenIPs.add(raw.ipAddress);
        newCount++;
      }

      // Limit memory usage - keep last 1000 IPs
      if (this.seenIPs.size > 1000) {
        const arr = Array.from(this.seenIPs);
        this.seenIPs = new Set(arr.slice(-500));
      }

      if (newCount > 0) {
        console.log(`[AbuseIPDB] ${newCount} new abuse reports`);
      }
    } catch (err) {
      console.error('[AbuseIPDB] Poll error:', err);
      this.callbacks.onError(err as Error);
    }
  }
}
