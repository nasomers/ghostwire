// URLhaus (abuse.ch) - Malware URL Feed
// Uses the public CSV/text feed which doesn't require auth

export interface URLhausEntry {
  id: string;
  dateAdded: string;
  url: string;
  urlStatus: string;
  threat: string;
  tags: string[];
  host: string;
  reporter: string;
}

export interface URLhausCallbacks {
  onEntry: (entry: URLhausEntry) => void;
  onError: (error: Error) => void;
}

export class URLhausClient {
  private callbacks: URLhausCallbacks;
  private pollInterval: Timer | null = null;
  private seenIds = new Set<string>();
  private pollIntervalMs = 60000; // 1 minute

  constructor(callbacks: URLhausCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[URLhaus] Starting polling...');
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
      // Use the public online hosts feed (plain text, no auth)
      // This gives us currently active malware distribution sites
      const response = await fetch('https://urlhaus.abuse.ch/downloads/text_online/');

      if (!response.ok) {
        throw new Error(`URLhaus feed error: ${response.status}`);
      }

      const text = await response.text();
      const lines = text.split('\n').filter(line => line && !line.startsWith('#'));

      let newCount = 0;
      const maxNew = 20; // Limit how many we emit per poll

      for (const line of lines) {
        if (newCount >= maxNew) break;

        const url = line.trim();
        if (!url || this.seenIds.has(url)) continue;

        // Parse host from URL
        let host = '';
        try {
          host = new URL(url).hostname;
        } catch {
          host = url.split('/')[2] || url;
        }

        // Generate a pseudo-ID from the URL
        const id = Buffer.from(url).toString('base64').slice(0, 16);

        const entry: URLhausEntry = {
          id,
          dateAdded: new Date().toISOString(),
          url,
          urlStatus: 'online',
          threat: this.guessThreatType(url),
          tags: [],
          host,
          reporter: 'urlhaus'
        };

        this.callbacks.onEntry(entry);
        this.seenIds.add(url);
        newCount++;
      }

      // Limit memory - keep last 5000 URLs
      if (this.seenIds.size > 5000) {
        const arr = Array.from(this.seenIds);
        this.seenIds = new Set(arr.slice(-2500));
      }

      if (newCount > 0) {
        console.log(`[URLhaus] ${newCount} new malware URLs`);
      }
    } catch (err) {
      console.error('[URLhaus] Poll error:', err);
      this.callbacks.onError(err as Error);
    }
  }

  // Guess threat type from URL patterns
  private guessThreatType(url: string): string {
    const lower = url.toLowerCase();

    if (lower.includes('emotet') || lower.includes('.dll')) return 'emotet';
    if (lower.includes('qakbot') || lower.includes('qbot')) return 'qakbot';
    if (lower.includes('icedid')) return 'icedid';
    if (lower.includes('cobalt')) return 'cobaltstrike';
    if (lower.includes('.exe')) return 'malware_download';
    if (lower.includes('.js') || lower.includes('.vbs')) return 'script_dropper';
    if (lower.includes('phish') || lower.includes('login') || lower.includes('verify')) return 'phishing';
    if (lower.includes('.zip') || lower.includes('.rar')) return 'archive_payload';

    return 'malware_download';
  }
}
