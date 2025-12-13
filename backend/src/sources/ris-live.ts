// RIPE RIS Live BGP Stream Client
// Connects to wss://ris-live.ripe.net/v1/ws/ and streams BGP updates

export type BGPUpdateType = 'announcement' | 'withdrawal';

export interface BGPUpdate {
  type: BGPUpdateType;
  timestamp: number;
  peer: string;
  peerAsn: string;
  host: string; // RRC collector (rrc00, rrc01, etc.)
  path: number[]; // AS path
  prefixes: string[];
}

export interface RISLiveCallbacks {
  onUpdate: (update: BGPUpdate) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: Error) => void;
}

export class RISLiveClient {
  private ws: WebSocket | null = null;
  private callbacks: RISLiveCallbacks;
  private reconnectTimer: Timer | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  constructor(callbacks: RISLiveCallbacks) {
    this.callbacks = callbacks;
  }

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    console.log('[RIS Live] Connecting...');
    this.ws = new WebSocket('wss://ris-live.ripe.net/v1/ws/?client=ghostwire');

    this.ws.onopen = () => {
      console.log('[RIS Live] Connected');
      this.reconnectDelay = 1000; // Reset on successful connection

      // Subscribe to all BGP updates
      // Can filter by prefix, path, host, etc. but we want everything
      this.ws!.send(JSON.stringify({
        type: 'ris_subscribe',
        data: {
          // Empty = subscribe to all updates
          // Could add: prefix, path, host, socketOptions
        }
      }));

      this.callbacks.onConnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);

        if (msg.type === 'ris_message') {
          const data = msg.data;

          // Process announcements
          if (data.announcements && data.announcements.length > 0) {
            for (const ann of data.announcements) {
              this.callbacks.onUpdate({
                type: 'announcement',
                timestamp: data.timestamp,
                peer: data.peer,
                peerAsn: data.peer_asn,
                host: data.host,
                path: data.path || [],
                prefixes: ann.prefixes || []
              });
            }
          }

          // Process withdrawals
          if (data.withdrawals && data.withdrawals.length > 0) {
            this.callbacks.onUpdate({
              type: 'withdrawal',
              timestamp: data.timestamp,
              peer: data.peer,
              peerAsn: data.peer_asn,
              host: data.host,
              path: data.path || [],
              prefixes: data.withdrawals
            });
          }
        }
      } catch (err) {
        console.error('[RIS Live] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[RIS Live] Disconnected');
      this.callbacks.onDisconnect();
      this.scheduleReconnect();
    };

    this.ws.onerror = (event) => {
      console.error('[RIS Live] WebSocket error');
      this.callbacks.onError(new Error('WebSocket error'));
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    console.log(`[RIS Live] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
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
}
