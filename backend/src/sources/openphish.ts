// OpenPhish - Free Phishing URL Feed
// Active phishing sites targeting credentials and financial data

export interface PhishingURL {
  id: string;
  timestamp: string;
  url: string;
  domain: string;
  targetBrand?: string;
  protocol: string;
}

export interface OpenPhishCallbacks {
  onPhish: (phish: PhishingURL) => void;
  onError: (error: Error) => void;
}

export class OpenPhishClient {
  private callbacks: OpenPhishCallbacks;
  private pollInterval: Timer | null = null;
  private seenUrls = new Set<string>();
  private pollIntervalMs = 300000; // 5 minutes (feed updates every 12 hours, but we drip feed)
  private urlQueue: PhishingURL[] = [];
  private dripInterval: Timer | null = null;

  constructor(callbacks: OpenPhishCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[OpenPhish] Starting phishing feed...');
    await this.poll();
    this.pollInterval = setInterval(() => this.poll(), this.pollIntervalMs);

    // Drip feed URLs every 3 seconds
    this.dripInterval = setInterval(() => this.dripFeed(), 3000);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.dripInterval) {
      clearInterval(this.dripInterval);
      this.dripInterval = null;
    }
  }

  private dripFeed() {
    if (this.urlQueue.length > 0) {
      const phish = this.urlQueue.shift()!;
      this.callbacks.onPhish(phish);
    }
  }

  private async poll() {
    try {
      const response = await fetch('https://openphish.com/feed.txt', {
        headers: {
          'User-Agent': 'Ghostwire-ThreatViz/1.0'
        }
      });

      if (!response.ok) {
        console.log('[OpenPhish] Feed returned ' + response.status);
        return;
      }

      const text = await response.text();
      const urls = text.trim().split('\n').filter(u => u.startsWith('http'));

      let newCount = 0;
      const maxNew = 30; // Cap how many we queue per poll

      for (const url of urls) {
        if (newCount >= maxNew) break;
        if (this.seenUrls.has(url)) continue;

        try {
          const parsed = new URL(url);
          const phish: PhishingURL = {
            id: `phish-${Date.now()}-${newCount}`,
            timestamp: new Date().toISOString(),
            url: url,
            domain: parsed.hostname,
            targetBrand: this.detectTargetBrand(url),
            protocol: parsed.protocol.replace(':', '')
          };

          this.urlQueue.push(phish);
          this.seenUrls.add(url);
          newCount++;
        } catch {
          // Invalid URL, skip
        }
      }

      // Limit memory
      if (this.seenUrls.size > 5000) {
        const arr = Array.from(this.seenUrls);
        this.seenUrls = new Set(arr.slice(-2500));
      }

      if (newCount > 0) {
        console.log(`[OpenPhish] ${newCount} new phishing URLs queued`);
      }
    } catch (err) {
      console.error('[OpenPhish] Poll error:', err);
    }
  }

  private detectTargetBrand(url: string): string | undefined {
    const lowerUrl = url.toLowerCase();
    const brands = [
      'paypal', 'microsoft', 'apple', 'google', 'amazon', 'netflix',
      'facebook', 'instagram', 'linkedin', 'twitter', 'dropbox', 'adobe',
      'chase', 'wellsfargo', 'bankofamerica', 'citibank', 'usbank',
      'outlook', 'office365', 'onedrive', 'icloud', 'docusign',
      'fedex', 'ups', 'dhl', 'usps', 'walmart', 'ebay', 'coinbase'
    ];

    for (const brand of brands) {
      if (lowerUrl.includes(brand)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }
    return undefined;
  }
}
