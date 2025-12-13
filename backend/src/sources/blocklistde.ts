// Blocklist.de - Attack Reports from Intrusion Detection Systems
// IPs reported for SSH brute force, mail spam, web attacks, etc.

export interface AttackReport {
  id: string;
  timestamp: string;
  ip: string;
  attackType: string;
  reportCount?: number;
  country?: string;
}

export interface BlocklistDeCallbacks {
  onAttack: (attack: AttackReport) => void;
  onError: (error: Error) => void;
}

const ATTACK_FEEDS = [
  { url: 'https://lists.blocklist.de/lists/ssh.txt', type: 'ssh_bruteforce' },
  { url: 'https://lists.blocklist.de/lists/mail.txt', type: 'mail_spam' },
  { url: 'https://lists.blocklist.de/lists/apache.txt', type: 'web_attack' },
  { url: 'https://lists.blocklist.de/lists/bruteforcelogin.txt', type: 'bruteforce_login' },
];

export class BlocklistDeClient {
  private callbacks: BlocklistDeCallbacks;
  private pollInterval: Timer | null = null;
  private seenIPs = new Map<string, number>(); // IP -> timestamp
  private pollIntervalMs = 600000; // 10 minutes
  private attackQueue: AttackReport[] = [];
  private dripInterval: Timer | null = null;
  private currentFeedIndex = 0;

  constructor(callbacks: BlocklistDeCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[Blocklist.de] Starting attack feed...');
    await this.pollNextFeed();
    this.pollInterval = setInterval(() => this.pollNextFeed(), this.pollIntervalMs / ATTACK_FEEDS.length);

    // Drip feed attacks every 2 seconds
    this.dripInterval = setInterval(() => this.dripFeed(), 2000);
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
    if (this.attackQueue.length > 0) {
      const attack = this.attackQueue.shift()!;
      this.callbacks.onAttack(attack);
    }
  }

  private async pollNextFeed() {
    const feed = ATTACK_FEEDS[this.currentFeedIndex];
    this.currentFeedIndex = (this.currentFeedIndex + 1) % ATTACK_FEEDS.length;

    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Ghostwire-ThreatViz/1.0'
        }
      });

      if (!response.ok) {
        console.log(`[Blocklist.de] ${feed.type} feed returned ${response.status}`);
        return;
      }

      const text = await response.text();
      const ips = text.trim().split('\n').filter(line => this.isValidIP(line.trim()));

      // Shuffle and take a sample
      const shuffled = ips.sort(() => Math.random() - 0.5);
      const sample = shuffled.slice(0, 20);

      let newCount = 0;
      const now = Date.now();
      const cooldownMs = 3600000; // 1 hour cooldown per IP

      for (const ip of sample) {
        const lastSeen = this.seenIPs.get(ip);
        if (lastSeen && (now - lastSeen) < cooldownMs) continue;

        const attack: AttackReport = {
          id: `bl-${feed.type}-${Date.now()}-${newCount}`,
          timestamp: new Date().toISOString(),
          ip: ip.trim(),
          attackType: feed.type,
          country: this.guessCountryFromIP(ip)
        };

        this.attackQueue.push(attack);
        this.seenIPs.set(ip, now);
        newCount++;
      }

      // Limit memory - remove old entries
      if (this.seenIPs.size > 5000) {
        const cutoff = now - cooldownMs;
        for (const [ip, ts] of this.seenIPs) {
          if (ts < cutoff) this.seenIPs.delete(ip);
        }
      }

      if (newCount > 0) {
        console.log(`[Blocklist.de] ${newCount} ${feed.type} attacks queued`);
      }
    } catch (err) {
      console.error(`[Blocklist.de] ${feed.type} poll error:`, err);
    }
  }

  private isValidIP(str: string): boolean {
    // Basic IPv4 validation
    const parts = str.split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
      const num = parseInt(p, 10);
      return !isNaN(num) && num >= 0 && num <= 255;
    });
  }

  private guessCountryFromIP(ip: string): string | undefined {
    // First octet rough geographic guess (not accurate, just for visuals)
    const firstOctet = parseInt(ip.split('.')[0], 10);

    if (firstOctet >= 1 && firstOctet <= 126) return ['US', 'CA', 'MX'][Math.floor(Math.random() * 3)];
    if (firstOctet >= 128 && firstOctet <= 191) return ['DE', 'FR', 'GB', 'NL', 'RU'][Math.floor(Math.random() * 5)];
    if (firstOctet >= 192 && firstOctet <= 223) return ['CN', 'JP', 'KR', 'IN', 'AU'][Math.floor(Math.random() * 5)];

    return undefined;
  }
}
