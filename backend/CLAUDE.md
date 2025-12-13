# Ghostwire Backend

WebSocket server that aggregates threat intelligence feeds and streams events to the frontend visualization.

## Architecture

```
index.ts                 - Entry point (re-exports src/index)
src/
├── index.ts             - Main server, WebSocket handling, event broadcasting
└── sources/             - Threat feed clients
    ├── urlhaus.ts       - Malware URL database (abuse.ch)
    ├── greynoise.ts     - Internet scanner statistics
    ├── dshield.ts       - SANS honeypot attack data
    ├── feodo.ts         - Botnet C2 tracker (abuse.ch)
    ├── ransomwatch.ts   - Ransomware victim announcements
    ├── openphish.ts     - Phishing URL feed
    ├── sslbl.ts         - Malicious SSL certificates (abuse.ch)
    ├── blocklistde.ts   - Bruteforce attack IPs
    ├── tor.ts           - Tor exit node list
    ├── hibp.ts          - Have I Been Pwned breaches
    ├── spamhaus.ts      - Hijacked IP ranges (DROP list)
    ├── bgpstream.ts     - BGP route hijacks/leaks (RIPE RIS)
    ├── ris-live.ts      - Real-time BGP stream
    ├── abuseipdb.ts     - (unused) IP reputation
    ├── threatfox.ts     - (unused) IOC database
    └── malwarebazaar.ts - (unused) Malware samples
```

## Server

- **Runtime**: Bun with native WebSocket support via `Bun.serve()`
- **Port**: 3333
- **Endpoints**:
  - `GET /` - Health check
  - `GET /ws` - WebSocket upgrade

## Event Flow

1. Source clients poll/stream external APIs on intervals
2. New events are queued with rate limiting (drip feed for dramatic effect)
3. `broadcast()` sends JSON to all connected WebSocket clients
4. Frontend receives typed `GhostwireEvent` objects

## Rate Limiting

Events are throttled to create better audiovisual pacing:
- URLhaus: 500ms between malware hits
- DShield: 800ms between honeypot attacks
- Feodo: 1000ms between C2 detections
- Bruteforce: 300ms between attacks
- Phishing: 600ms between URLs
- Other feeds: Real-time or batch intervals

## Development

```bash
# Install dependencies
~/.bun/bin/bun install

# Run development server
~/.bun/bin/bun run index.ts

# Run with hot reload
~/.bun/bin/bun --hot run index.ts
```

## Deployment

Deployed to Fly.io at `ghostwire-api.ghostlaboratory.net`

```bash
# Deploy
~/.fly/bin/fly deploy

# View logs
~/.fly/bin/fly logs

# Check status
~/.fly/bin/fly status
```

Configuration in `fly.toml`:
- Region: ord (Chicago)
- Memory: 512MB
- Auto-stop when idle, auto-start on request

## Adding a New Source

1. Create `src/sources/newsource.ts`:
   - Define data interface
   - Create client class with polling/streaming logic
   - Export type and client

2. Update `src/index.ts`:
   - Import client and type
   - Add to `GhostwireEventType` union
   - Add to `GhostwireEvent.data` union
   - Initialize client and wire up event handler
   - Add throttling if needed

3. Update frontend to handle new event type

## External APIs Used

| Source | API | Auth |
|--------|-----|------|
| URLhaus | abuse.ch API | None |
| GreyNoise | Community API | API key |
| DShield | SANS ISC API | None |
| Feodo | abuse.ch API | None |
| RansomWatch | GitHub raw | None |
| OpenPhish | Feed URL | None |
| SSLBL | abuse.ch API | None |
| Blocklist.de | Feed URL | None |
| Tor | Onionoo API | None |
| HIBP | API v3 | API key |
| Spamhaus | DROP list | None |
| BGPStream | RIPE RIS Live | None |
