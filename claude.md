# Ghostwire

## Concept

Ghostwire is a generative audiovisual art installation that transforms **dark internet threat data** into ambient music and real-time visuals. It's a glimpse into the hidden side of the internet — the constant churn of malware, botnets, ransomware gangs, phishing campaigns, brute force attacks, data breaches, BGP hijacks, and anonymous traffic flowing through the shadows.

**The aesthetic is surveillance noir** — you're peering through a terminal into a world you shouldn't see. Deep blacks, monochrome with single accent colors bleeding through, things half-seen emerging from void. The audio is spectral and corrupted — ghostly transmissions intercepted from the dark side.

Hosted at `ghostwire.ghostlaboratory.net`

---

## Design Philosophy

### Visual: Emergence from Void
- **Monochrome foundation** — deep blacks, dark teals/greens
- **Single accent colors** per threat type that pulse and fade
- **Fog and depth** — particles emerge from darkness, fade back into it
- **Shadow world map** — faint continent silhouettes, threat origins illuminate regions
- **Network topology** — thin connection lines between related threats
- **Cryptographic texture** — hex dumps, encrypted strings, IP addresses as visual texture
- **Aggressive glitching** — horizontal tearing, RGB split, signal dropout during severe events
- **Particle trails** — afterglow effect on moving threat nodes
- **Bloom post-processing** — soft glow on bright elements
- **Vortex death effect** — particles spiral inward when expiring
- **Boot sequence** — terminal-style initialization sequence on start

### Audio: Spectral Corruption
- **Spectral textures** — ghostly, detuned drones with very slow attacks
- **Corrupted signals** — bit-crushing, tape warble, buffer stutter, radio static
- **Subterranean bass** — 20-40Hz infrasound rumble as the "heartbeat"
- **Tension architecture** — effects respond to threat intensity:
  - Low activity = vast void reverb (spacious, empty)
  - High activity = tight reverb, more corruption, filter opens
- **No drums** — purely synthesized, generative ambient

---

## Data Sources (Dark Internet Focus)

All sources are free or have free tiers:

| Source | Category | Character |
|--------|----------|-----------|
| **URLhaus** | Malware URLs | *Violence* — corrupted signal bursts, bit-crushed hits |
| **GreyNoise** | Scanner Noise | *Static* — constant whisper noise floor, the hum of probing |
| **DShield** | Honeypot Attacks | *Percussion* — stutter hits, mechanical hammering |
| **Feodo Tracker** | Botnet C2 | *Command pulse* — rhythmic, mechanical, ominous |
| **RansomWatch** | Ransomware Victims | *Dread* — maximum tension, dissonant chords, bass drops |
| **OpenPhish** | Phishing URLs | *Deception* — almost-pleasant chimes that feel wrong |
| **SSLBL** | Malicious Certs | *Spectral* — FM synthesis, ghostly modulation |
| **Blocklist.de** | Brute Force | *Aggression* — persistent hammering, mechanical repetition |
| **Tor Exit Nodes** | Dark Web | *Anonymous whisper* — long reverb tails, mysterious |
| **Have I Been Pwned** | Data Breaches | *Catastrophe* — massive low drones, breach scale affects intensity |
| **Spamhaus DROP** | IP Hijacks | *Network Corruption* — metallic strikes, infrastructure threat |
| **RIPE RIS Live** | BGP Events | *Infrastructure Alarm* — metallic synths, route hijack alerts |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Threat Intelligence Feeds                                   │
│  (URLhaus, DShield, Feodo, RansomWatch, OpenPhish, SSLBL,   │
│   Blocklist.de, Tor, GreyNoise, HIBP, Spamhaus, BGPStream)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Backend      │
              │   (Bun/Fly.io)  │
              │                 │
              │ - Polls feeds   │
              │ - Rate limits   │
              │ - WebSocket out │
              │   Port 3333     │
              └────────┬────────┘
                       │ WSS
                       ▼
              ┌─────────────────┐
              │   Cloudflare    │
              │     Pages       │
              │                 │
              │ Three.js visuals│
              │ Tone.js audio   │
              │ Boot sequence   │
              │ Live event feed │
              └─────────────────┘
```

---

## Audio Engine (v4)

### Layers
1. **Subterranean Bass** — constant sub-bass drone (C0-C1), LFO-modulated intensity
2. **Void Drones** — detuned sine/triangle clusters, very slow attack/release
3. **Whisper Noise** — brown/pink noise through auto-filter, the constant hum
4. **Event Synths** — triggered by threat events, each source has signature sound

### Tension System
- `threatAccumulator` builds with events, decays over time
- Drives `globalTension` (0-1) which modulates:
  - Reverb blend (void ↔ tight)
  - Filter cutoff (darker ↔ brighter)
  - Bit crusher depth (clean ↔ degraded)
  - Feedback delay amount
  - Pitch shift wobble (tape warble)
  - Noise floor level

### Scales
- Phrygian (default) — Spanish/dark
- Minor — classic dark
- Dorian — jazz-inflected dark
- Locrian — most unstable
- Harmonic Minor — exotic tension

---

## Visual Engine (v4)

### Layers (back to front)
1. **Void** — deep black with subtle fog
2. **Shadow World Map** — faint continent silhouettes
3. **Network Topology** — thin lines connecting threat nodes
4. **Ambient Particles** — slow-drifting background texture
5. **Threat Particles** — event-driven, colored by source, with trails
6. **Cryptographic Rain** — falling text streams (hex, IPs, encoded strings)
7. **Glitch Text Overlays** — floating threat names during major events
8. **Post-processing** — bloom, chromatic aberration, glitches, vignette

### Color Palettes
Switchable themes in Controls panel:

**Ghostwire (default)**
- Background: #010504 (near-black with green tint)
- Accents: blood red, hot pink, purple, orange, cyan, etc.

**Cyberpunk**
- Background: #0a0015 (deep purple void)
- Accents: neon magenta, cyan, yellow

**Noir**
- Background: #000000 (pure black)
- Accents: all shades of matrix green

**Blood Moon**
- Background: #0a0000 (dark crimson void)
- Accents: red/crimson spectrum

**Arctic**
- Background: #000508 (cold blue-black)
- Accents: ice blue, cyan, teal spectrum

### Glitch Effects
- Horizontal tearing (scanline displacement)
- RGB chromatic aberration (increases with tension)
- Signal noise injection
- Occasional full-frame flicker
- Rolling bar artifacts during severe events

### Interactive Features
- Click threat nodes for detailed info panel
- Hover to highlight connected threats
- Reputation tracking (repeat attackers grow larger)
- Geographic labels on attacks

---

## Tech Stack

**Backend**
- Bun runtime (native, no Node.js)
- Bun.serve() with native WebSocket
- HTTPS with self-signed certs (required for AudioWorklet)
- Deployed on Fly.io

**Frontend**
- Vite for dev/build
- Three.js for WebGL visuals
- Tone.js for audio synthesis
- Vanilla TypeScript
- Deployed on Cloudflare Pages

---

## Project Structure

```
~/projects/ghostwire/
├── claude.md              # This file
├── .gitignore
├── backend/
│   ├── src/
│   │   ├── index.ts       # Main server, WebSocket, routing
│   │   └── sources/       # Threat feed clients
│   │       ├── urlhaus.ts
│   │       ├── greynoise.ts
│   │       ├── dshield.ts
│   │       ├── feodo.ts
│   │       ├── ransomwatch.ts
│   │       ├── openphish.ts
│   │       ├── sslbl.ts
│   │       ├── blocklistde.ts
│   │       ├── tor.ts
│   │       ├── hibp.ts        # Have I Been Pwned breaches
│   │       ├── spamhaus.ts    # Spamhaus DROP list
│   │       └── bgpstream.ts   # RIPE RIS Live BGP events
│   ├── certs/             # SSL certificates
│   ├── fly.toml           # Fly.io config
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.ts        # Entry, event routing, boot sequence
│   │   ├── socket.ts      # WebSocket client
│   │   ├── audio.ts       # Tone.js engine (v4 - spectral/corrupted)
│   │   ├── visuals.ts     # Three.js engine (v4 - void/shadow/bloom)
│   │   └── style.css      # UI styling
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── wrangler.toml      # Cloudflare Pages config
│
└── .env                   # API keys (gitignored)
```

---

## UI Features

### Intro Screen
- Glitch-animated title
- Threat source indicators
- "Enter" button to start experience
- Expandable "What is this?" section

### Boot Sequence
- Terminal-style initialization after clicking Enter
- Displays system initialization, feed connections, audio/GPU setup
- Builds atmosphere before main visualization

### Live Threat Feed
- Real-time scrolling event log
- Color-coded by severity (critical, high, medium, low, info)
- Shows threat type, content, country, source
- Relative timestamps

### Stats Panel
- Live counts per threat category
- Last seen details
- Node count and tension level
- Connection status

### Controls Panel
- Volume and reverb sliders
- Musical key (root note + scale)
- Visual theme selector

### Threat Info Panel
- Click any node to see details
- Shows source IP/domain, country, threat name
- Hit count (reputation), connected nodes
- Timestamps and additional metadata

---

## Deployment

### Backend (Fly.io)
```bash
cd backend
fly launch
fly deploy
```

### Frontend (Cloudflare Pages)
```bash
cd frontend
bun run build
# Connect to Cloudflare Pages via GitHub integration
# Or: npx wrangler pages deploy dist
```

---

## Running Locally

```bash
# Terminal 1: Backend
cd backend && bun run src/index.ts

# Terminal 2: Frontend
cd frontend && bun run dev
```

Backend runs on `https://localhost:3333` (HTTPS required)
Frontend runs on `https://localhost:5173`

---

## Environment Variables

```env
GREYNOISE_API_KEY=xxx  # Optional, falls back to simulation
```

Most feeds are public/free and don't require auth.
