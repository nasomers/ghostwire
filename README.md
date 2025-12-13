# Ghostwire

**Real-time threat intelligence, rendered as art.**

Ghostwire transforms live cybersecurity threat data into an immersive audiovisual experience. Every sound and visual represents real malicious activity happening right now—malware spreading, ransomware victims announced, botnets receiving commands, attacks hitting honeypots worldwide.

**Live Demo:** [ghostwire.ghostlaboratory.net](https://ghostwire.ghostlaboratory.net)

---

## Features

### Visual Engine
- **Morphing particle formations** — 600 particles flow between 11 geometric shapes (sphere, torus, helix, tesseract, DNA helix, neural network, and more)
- **4D Tesseract** — Rotating hypercube projection with glitch effects on critical events
- **Icosahedron core** — Pulsing geometric centerpiece
- **Energy conduits** — Axon-like connections between threat nodes with traveling data packets
- **Post-processing** — Bloom, chromatic aberration, and mood-based color grading
- **6 color themes** — Ghostwire, Cyberpunk, Matrix, Blood Moon, Arctic, Void

### Audio Engine
- **Generative music system** — Evolving dark ambient soundscape that never repeats
- **Voice choir** — Three-voice formant-filtered pads for atmospheric depth
- **Shard rain** — Crystalline texture layer reactive to threat activity
- **Tension system** — Music intensity builds with attack volume, featuring dramatic drops and stingers
- **10 musical scales** — Phrygian, Locrian, Harmonic Minor, Japanese, Blues, and more
- **Key modulation** — Drifts through circle of fifths every few minutes

### Real-time Data
- **12 threat intelligence feeds** — Aggregated from industry-leading sources
- **3D floating text** — Threat details materialize in space
- **Scrolling ticker** — Continuous stream of live events
- **Geographic visualization** — Attack origins labeled on wireframe globe

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
- **3D Graphics:** [Three.js](https://threejs.org) with custom shaders and post-processing
- **Audio:** [Tone.js](https://tonejs.github.io) — Web Audio synthesis
- **Language:** TypeScript
- **Deployment:** [Cloudflare Pages](https://pages.cloudflare.com)

---

## Local Development

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)

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

# Deploy (requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID)
wrangler pages deploy dist --project-name=ghostwire
```

---

## Controls

### Audio
- **Volume** — Master output level
- **Key** — Root note (C through B)
- **Mode** — Musical scale (Phrygian, Minor, Dorian, etc.)

### Visual
- **Theme** — Color palette selection
- **Mouse drag** — Rotate camera view

---

## Sound Design

Each threat type has a unique sonic signature:

| Threat | Sound |
|--------|-------|
| Malware URLs | Metallic plucks with filter sweeps |
| Honeypot Attacks | Low percussion with sub-bass |
| Botnet C2 | Sharp FM synthesis with delay |
| Ransomware | Glitchy bursts + voice choir swell + stinger |
| Phishing | High spectral pads |
| Bad Certs | Filtered bell tones |
| Brute Force | Rhythmic pulses |
| Tor Nodes | Ethereal ghost ambience |
| Scanners | Granular noise textures |
| Breaches | Impact hits + voice choir swell |
| IP Hijacks | Modulated bass growls |
| BGP Events | Atmospheric rumbles + tension builders |

---

## Project Structure

```
ghostwire/
├── backend/
│   ├── src/
│   │   ├── index.ts          # WebSocket server & event aggregation
│   │   └── sources/          # Threat feed clients
│   ├── Dockerfile
│   └── fly.toml
│
├── frontend/
│   ├── src/
│   │   ├── main.ts           # Entry point, event routing
│   │   ├── socket.ts         # WebSocket client
│   │   ├── audio.ts          # Tone.js generative audio (~2700 lines)
│   │   ├── visuals.ts        # Three.js rendering (~3700 lines)
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
