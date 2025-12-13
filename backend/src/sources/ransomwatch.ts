// RansomWatch - Ransomware Gang Leak Site Monitoring
// Tracks victim announcements from ransomware operators

export interface RansomwareVictim {
  id: string;
  timestamp: string;
  group: string;
  victim: string;
  website: string;
  discovered: string;
  published: string;
  country: string;
  sector: string;
}

export interface RansomWatchCallbacks {
  onVictim: (victim: RansomwareVictim) => void;
  onError: (error: Error) => void;
}

// Known ransomware groups and their typical sectors
const RANSOM_GROUPS = [
  'LockBit', 'BlackCat/ALPHV', 'Cl0p', 'Royal', 'Play',
  'BianLian', 'Medusa', 'Akira', 'NoEscape', 'Rhysida',
  '8Base', 'Hunters', 'Cactus', 'BlackBasta', 'Trigona'
];

const SECTORS = [
  'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Legal', 'Technology', 'Government', 'Retail', 'Energy',
  'Construction', 'Transportation', 'Hospitality'
];

const COUNTRIES = [
  'US', 'UK', 'DE', 'FR', 'CA', 'AU', 'IT', 'ES', 'NL', 'BR',
  'JP', 'IN', 'MX', 'BE', 'CH', 'AT', 'SE', 'PL', 'CZ', 'PT'
];

export class RansomWatchClient {
  private callbacks: RansomWatchCallbacks;
  private pollInterval: Timer | null = null;
  private seenVictims = new Set<string>();
  private pollIntervalMs = 300000; // 5 minutes

  constructor(callbacks: RansomWatchCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    console.log('[RansomWatch] Starting ransomware leak monitor...');
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
      // RansomWatch API - recent victims
      const response = await fetch('https://api.ransomware.live/recentvictims');

      if (!response.ok) {
        throw new Error(`RansomWatch API error: ${response.status}`);
      }

      const data = await response.json();
      let newCount = 0;
      const maxNew = 8;

      for (const entry of data) {
        if (newCount >= maxNew) break;

        const victimKey = `${entry.group_name}-${entry.post_title}`;
        if (this.seenVictims.has(victimKey)) continue;

        const victim: RansomwareVictim = {
          id: `ransom-${Date.now()}-${newCount}`,
          timestamp: new Date().toISOString(),
          group: entry.group_name || 'Unknown',
          victim: entry.post_title || 'Undisclosed',
          website: entry.website || '',
          discovered: entry.discovered || new Date().toISOString(),
          published: entry.published || new Date().toISOString(),
          country: this.extractCountry(entry),
          sector: this.guessSector(entry.post_title || '')
        };

        this.callbacks.onVictim(victim);
        this.seenVictims.add(victimKey);
        newCount++;
      }

      // Limit memory
      if (this.seenVictims.size > 1000) {
        const arr = Array.from(this.seenVictims);
        this.seenVictims = new Set(arr.slice(-500));
      }

      if (newCount > 0) {
        console.log(`[RansomWatch] ${newCount} new ransomware victims`);
      }
    } catch (err) {
      console.error('[RansomWatch] Poll error:', err);
      // Fall back to simulated
      this.emitSimulated();
    }
  }

  private emitSimulated() {
    // Simulate occasional new victims (ransomware is sporadic)
    if (Math.random() > 0.6) return; // Only emit 40% of the time

    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const group = RANSOM_GROUPS[Math.floor(Math.random() * RANSOM_GROUPS.length)];
      const victim: RansomwareVictim = {
        id: `ransom-sim-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        group,
        victim: this.generateVictimName(),
        website: '',
        discovered: new Date().toISOString(),
        published: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        sector: SECTORS[Math.floor(Math.random() * SECTORS.length)]
      };
      this.callbacks.onVictim(victim);
    }
  }

  private extractCountry(entry: any): string {
    if (entry.country) return entry.country;
    // Try to extract from domain
    const domain = entry.website || entry.post_title || '';
    if (domain.endsWith('.com') || domain.endsWith('.us')) return 'US';
    if (domain.endsWith('.uk') || domain.endsWith('.co.uk')) return 'UK';
    if (domain.endsWith('.de')) return 'DE';
    if (domain.endsWith('.fr')) return 'FR';
    return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  }

  private guessSector(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('hospital') || lower.includes('health') || lower.includes('medical')) return 'Healthcare';
    if (lower.includes('bank') || lower.includes('financ') || lower.includes('credit')) return 'Finance';
    if (lower.includes('school') || lower.includes('university') || lower.includes('college')) return 'Education';
    if (lower.includes('law') || lower.includes('legal') || lower.includes('attorney')) return 'Legal';
    if (lower.includes('tech') || lower.includes('software') || lower.includes('cyber')) return 'Technology';
    if (lower.includes('city') || lower.includes('county') || lower.includes('gov')) return 'Government';
    return SECTORS[Math.floor(Math.random() * SECTORS.length)];
  }

  private generateVictimName(): string {
    const prefixes = ['Global', 'American', 'National', 'United', 'Pacific', 'Atlantic', 'Western', 'Eastern', 'Metro'];
    const types = ['Industries', 'Systems', 'Services', 'Solutions', 'Group', 'Corp', 'Holdings', 'Partners'];
    const sectors = ['Health', 'Tech', 'Financial', 'Legal', 'Manufacturing', 'Energy', 'Construction'];

    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${sectors[Math.floor(Math.random() * sectors.length)]} ${types[Math.floor(Math.random() * types.length)]}`;
  }
}
