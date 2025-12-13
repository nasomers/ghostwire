// WebSocket client for connecting to Ghostwire backend

export type EventType =
  | 'urlhaus'
  | 'greynoise'
  | 'dshield'
  | 'feodo'
  | 'ransomware'
  | 'phishing'
  | 'sslbl'
  | 'bruteforce'
  | 'tor'
  | 'hibp'
  | 'spamhaus'
  | 'bgp'
  | 'welcome';

// URLhaus malware URL entries
export interface URLhausHit {
  id: string;
  dateAdded: string;
  url: string;
  urlStatus: string;
  threat: string;
  tags: string[];
  host: string;
  reporter: string;
}

// GreyNoise scanner statistics (ambient noise)
export interface GreyNoiseData {
  scannerCount: number;
  scannerTypes: string[];
  topPorts: number[];
  topTags: string[];
}

// DShield honeypot attack data
export interface DShieldAttack {
  id: string;
  timestamp: string;
  sourceIP: string;
  targetPort: number;
  protocol: string;
  attackType: string;
  country: string;
  reports: number;
}

// Feodo Tracker - Botnet C2 servers
export interface FeodoC2 {
  id: string;
  timestamp: string;
  ip: string;
  port: number;
  malware: string;
  status: 'online' | 'offline';
  country: string;
  asName: string;
  firstSeen: string;
  lastOnline: string;
}

// RansomWatch - Ransomware victim announcements
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

// OpenPhish - Phishing URLs
export interface PhishingURL {
  id: string;
  timestamp: string;
  url: string;
  domain: string;
  targetBrand?: string;
  protocol: string;
}

// SSLBL - Malicious SSL certificates
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

// Blocklist.de - Brute force attack reports
export interface BruteforceAttack {
  id: string;
  timestamp: string;
  ip: string;
  attackType: string;
  reportCount?: number;
  country?: string;
}

// Tor - Dark web exit nodes
export interface TorExitNode {
  id: string;
  timestamp: string;
  ip: string;
  nickname: string;
  fingerprint: string;
  bandwidth: number;
  country: string;
  flags: string[];
  firstSeen: string;
  lastSeen: string;
  exitPolicy: string;
}

// HIBP - Data breach notifications
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

// Spamhaus DROP - Hijacked IP ranges
export interface SpamhausDrop {
  id: string;
  timestamp: string;
  cidr: string;
  sbl: string;
  country?: string;
  numAddresses: number;
  listType: 'drop' | 'edrop' | 'dropv6';
}

// BGPStream - BGP hijacks and route leaks
export interface BGPEvent {
  id: string;
  timestamp: string;
  eventType: 'hijack' | 'leak' | 'outage' | 'announcement' | 'withdrawal';
  prefix: string;
  asn: number;
  asName?: string;
  path: number[];
  originAsn: number;
  peerAsn: number;
  collector: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// Welcome message on connect
export interface WelcomeData {
  message: string;
  sources: string[];
  clientCount: number;
  sourceDescriptions?: Record<string, string>;
}

export type EventData =
  | URLhausHit
  | GreyNoiseData
  | DShieldAttack
  | FeodoC2
  | RansomwareVictim
  | PhishingURL
  | SSLBlacklistEntry
  | BruteforceAttack
  | TorExitNode
  | HIBPBreach
  | SpamhausDrop
  | BGPEvent
  | WelcomeData;

export interface GhostwireEvent {
  type: EventType;
  data: EventData;
}

type EventCallback = (event: GhostwireEvent) => void;
type StatusCallback = (status: 'connecting' | 'connected' | 'disconnected') => void;

export class GhostwireSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private eventCallbacks: EventCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private reconnectTimer: number | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    this.notifyStatus('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[Ghostwire] Connected to backend');
      this.reconnectDelay = 1000;
      this.notifyStatus('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as GhostwireEvent;
        this.notifyEvent(data);
      } catch (err) {
        console.error('[Ghostwire] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[Ghostwire] Disconnected');
      this.notifyStatus('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      console.error('[Ghostwire] WebSocket error');
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onEvent(callback: EventCallback) {
    this.eventCallbacks.push(callback);
  }

  onStatus(callback: StatusCallback) {
    this.statusCallbacks.push(callback);
  }

  private notifyEvent(event: GhostwireEvent) {
    for (const cb of this.eventCallbacks) {
      cb(event);
    }
  }

  private notifyStatus(status: 'connecting' | 'connected' | 'disconnected') {
    for (const cb of this.statusCallbacks) {
      cb(status);
    }
  }
}
