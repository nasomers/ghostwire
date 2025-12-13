# Ghostwire

**Real-time threat intelligence, rendered as art.**

Ghostwire transforms live cybersecurity threat data into an immersive audiovisual experience. Every sound and visual represents real malicious activity happening right now—malware spreading, ransomware victims announced, botnets receiving commands, attacks hitting honeypots worldwide.

**Live Demo:** [ghostwire.ghostlaboratory.net](https://ghostwire.ghostlaboratory.net)

---

## Features

- **Real-time threat visualization** — Watch attacks materialize as glowing nodes on a 3D particle field
- **Generative audio** — Each threat type triggers unique synthesized sounds, creating an evolving dark ambient soundscape
- **12 threat intelligence feeds** — Aggregates data from industry-leading sources
- **Interactive exploration** — Click nodes to inspect threat details, hover to highlight related attacks
- **Customizable experience** — Multiple color palettes, musical scales, and audio controls

---

## Threat Intelligence Sources

| Source | Data Type | Description |
|--------|-----------|-------------|
| **URLhaus** | Malware URLs | Active malware distribution sites |
| **DShield** | Honeypot Attacks | Real-time attacks on SANS honeypots |
| **Feodo Tracker** | Botnet C2 | Command & control server tracking |
| **Ransomwatch** | Ransomware Victims | Newly announced ransomware victims |
| **OpenPhish** | Phishing | Active phishing campaigns |
| **SSLBL** | Bad Certificates | Malicious SSL certificates |
| **Blocklist.de** | Brute Force | SSH/FTP brute force attackers |
| **Tor Exit Nodes** | Dark Web | Tor network exit points |
| **GreyNoise** | Scanners | Internet-wide scanner activity |
| **Have I Been Pwned** | Breaches | Data breach announcements |
| **Spamhaus DROP** | IP Hijacks | Hijacked IP ranges |
| **BGPStream** | BGP Events | Route hijacks and leaks |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Three.js   │  │   Tone.js   │  │   Event Processing  │  │
│  │  WebGL      │  │   Web Audio │  │   & UI              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                    WebSocket (wss://)                        │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                         Backend                              │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────────┐    │
│  │              Bun WebSocket Server                    │    │
│  │         Event Aggregation & Rate Limiting            │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ URLhaus  │ DShield  │  Feodo   │ Ransom-  │ OpenPhish│   │
│  │          │          │          │  watch   │          │   │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤   │
│  │  SSLBL   │Blocklist │   Tor    │GreyNoise │   HIBP   │   │
│  ├──────────┼──────────┴──────────┴──────────┴──────────┤   │
│  │ Spamhaus │              BGPStream                     │   │
│  └──────────┴───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
- **Runtime:** [Bun](https://bun.sh) — Fast JavaScript runtime with native WebSocket support
- **Language:** TypeScript
- **Deployment:** [Fly.io](https://fly.io) (Docker container)

### Frontend
- **Build Tool:** [Vite](https://vite.dev)
- **3D Graphics:** [Three.js](https://threejs.org) with custom GLSL shaders
- **Audio:** [Tone.js](https://tonejs.github.io) — Web Audio synthesis
- **Language:** TypeScript
- **Deployment:** [Cloudflare Pages](https://pages.cloudflare.com)

---

## Local Development

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- Node.js 18+ (for Vite)

### Backend Setup

```bash
cd backend
bun install

# Generate self-signed certs for local HTTPS/WSS
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost'

# Start the server
bun run src/index.ts
```

The backend runs on `https://localhost:3333` with WebSocket endpoint at `wss://localhost:3333/ws`.

### Frontend Setup

```bash
cd frontend
bun install

# Update WS_URL in src/main.ts to point to your local backend
# const WS_URL = 'wss://localhost:3333/ws';

# Start dev server
bun run dev
```

The frontend dev server runs on `https://localhost:5173`.

---

## Deployment

### Backend (Fly.io)

```bash
cd backend

# First-time setup
fly launch --no-deploy
fly secrets set NODE_ENV=production

# Deploy
fly deploy
```

### Frontend (Cloudflare Pages)

```bash
cd frontend

# Build
bun run build

# Deploy (requires CLOUDFLARE_API_TOKEN)
wrangler pages deploy dist --project-name=ghostwire
```

---

## Configuration

### Audio Controls
- **Volume** — Master output level
- **Reverb** — Spatial depth and atmosphere

### Musical Settings
- **Root Note** — Base frequency (C through B)
- **Scale** — Phrygian, Minor, Dorian, Locrian, Harmonic Minor

### Visual Themes
- **Ghostwire** — Default green/cyan palette
- **Cyberpunk** — Neon pink and purple
- **Noir** — Monochrome with subtle accents
- **Blood Moon** — Deep reds and oranges
- **Arctic** — Cool blues and whites

---

## Sound Design

Each threat type has a unique sonic signature:

| Threat | Sound |
|--------|-------|
| Malware URLs | Metallic FM synthesis with distortion |
| Honeypot Attacks | Low drones with sub-bass |
| Botnet C2 | Sharp percussion with delay |
| Ransomware | Glitchy noise bursts |
| Phishing | High spectral pads |
| Bad Certs | Filtered sweeps |
| Brute Force | Rhythmic pulses |
| Tor Nodes | Ethereal ambience |
| Scanners | Granular textures |
| Breaches | Impact hits |
| IP Hijacks | Modulated bass |
| BGP Events | Atmospheric rumbles |

---

## Project Structure

```
ghostwire/
├── backend/
│   ├── src/
│   │   ├── index.ts          # WebSocket server & event aggregation
│   │   └── sources/          # Threat feed clients
│   │       ├── urlhaus.ts
│   │       ├── dshield.ts
│   │       ├── feodo.ts
│   │       ├── ransomwatch.ts
│   │       ├── openphish.ts
│   │       ├── sslbl.ts
│   │       ├── blocklistde.ts
│   │       ├── tor.ts
│   │       ├── greynoise.ts
│   │       ├── hibp.ts
│   │       ├── spamhaus.ts
│   │       └── bgpstream.ts
│   ├── Dockerfile
│   └── fly.toml
│
├── frontend/
│   ├── src/
│   │   ├── main.ts           # Application entry point
│   │   ├── audio.ts          # Tone.js audio engine
│   │   ├── visuals.ts        # Three.js rendering
│   │   └── style.css         # UI styling
│   ├── index.html
│   └── vite.config.ts
│
└── README.md
```

---

## License

MIT

---

## Credits

Built with threat data from:
- [abuse.ch](https://abuse.ch) (URLhaus, Feodo Tracker, SSLBL)
- [SANS DShield](https://dshield.org)
- [Ransomwatch](https://ransomwatch.telemetry.ltd)
- [OpenPhish](https://openphish.com)
- [Blocklist.de](https://blocklist.de)
- [Tor Project](https://torproject.org)
- [GreyNoise](https://greynoise.io)
- [Have I Been Pwned](https://haveibeenpwned.com)
- [Spamhaus](https://spamhaus.org)
- [BGPStream](https://bgpstream.com)
