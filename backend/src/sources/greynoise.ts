// GreyNoise - Internet scanner/noise data
// Provides background "static" of machines constantly probing

export interface GreyNoiseStats {
  scannerCount: number;
  scannerTypes: string[];
  topPorts: number[];
  topTags: string[];
}

export interface GreyNoiseCallbacks {
  onStats: (stats: GreyNoiseStats) => void;
  onError: (error: Error) => void;
}

export class GreyNoiseClient {
  private apiKey: string;
  private callbacks: GreyNoiseCallbacks;
  private pollInterval: Timer | null = null;
  private pollIntervalMs = 300000; // 5 minutes (limited free tier)

  constructor(apiKey: string, callbacks: GreyNoiseCallbacks) {
    this.apiKey = apiKey;
    this.callbacks = callbacks;
  }

  async start() {
    if (!this.apiKey) {
      console.log('[GreyNoise] No API key configured, using simulated data');
      this.startSimulated();
      return;
    }

    console.log('[GreyNoise] Starting polling...');
    await this.poll();
    this.pollInterval = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Simulated scanner noise when no API key
  private startSimulated() {
    const emitSimulated = () => {
      const stats: GreyNoiseStats = {
        scannerCount: 50 + Math.floor(Math.random() * 100),
        scannerTypes: Math.random() > 0.3 ? ['benign', 'malicious'] : ['benign'],
        topPorts: [22, 23, 80, 443, 3389, 8080].slice(0, 3 + Math.floor(Math.random() * 3)),
        topTags: ['SSH Scanner', 'Web Crawler', 'Telnet Scanner', 'RDP Scanner']
          .slice(0, 2 + Math.floor(Math.random() * 2))
      };
      this.callbacks.onStats(stats);
    };

    emitSimulated();
    this.pollInterval = setInterval(emitSimulated, 30000); // Every 30s for ambient texture
  }

  private async poll() {
    try {
      // Query GreyNoise for scanner stats
      // Using the community API which has limited but free access
      const response = await fetch('https://api.greynoise.io/v3/community/stats', {
        headers: {
          'key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log('[GreyNoise] Rate limited');
          return;
        }
        throw new Error(`GreyNoise API error: ${response.status}`);
      }

      const data = await response.json();

      const stats: GreyNoiseStats = {
        scannerCount: data.stats?.total_ips || 100,
        scannerTypes: data.stats?.classifications || ['unknown'],
        topPorts: data.stats?.top_ports?.map((p: any) => p.port) || [22, 80, 443],
        topTags: data.stats?.top_tags?.map((t: any) => t.tag) || ['Scanner']
      };

      this.callbacks.onStats(stats);
      console.log(`[GreyNoise] Stats updated: ${stats.scannerCount} scanners`);
    } catch (err) {
      console.error('[GreyNoise] Poll error:', err);
      this.callbacks.onError(err as Error);

      // Fall back to simulated on error
      this.stop();
      this.startSimulated();
    }
  }
}
