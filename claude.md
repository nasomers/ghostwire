# Ghostwire

## Concept

Ghostwire is a generative audiovisual art installation that transforms **dark internet threat data** into ambient music and real-time visuals. It's a glimpse into the hidden side of the internet — the constant churn of malware, botnets, ransomware gangs, phishing campaigns, brute force attacks, data breaches, BGP hijacks, and anonymous traffic flowing through the shadows.

**The aesthetic is surveillance noir** — you're peering through a terminal into a world you shouldn't see. Deep blacks, monochrome with single accent colors bleeding through, things half-seen emerging from void. The audio is spectral and corrupted — ghostly transmissions intercepted from the dark side.

**Live Site:** https://ghostwire.ghostlaboratory.net
**API:** https://ghostwire-api.ghostlaboratory.net
**GitHub:** https://github.com/nasomers/ghostwire

---

## Design Philosophy

### Visual: Emergence from Void
- **Monochrome foundation** — deep blacks, dark teals/greens
- **Single accent colors** per threat type that pulse and fade
- **Fog and depth** — particles emerge from darkness, fade back into it
- **Shadow world map** — faint continent silhouettes, threat origins illuminate regions
- **Network topology** — thin connection lines between related threats
- **Cryptographic texture** — hex dumps, encrypted strings, IP addresses as visual texture
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

## Data Sources (12 Threat Intelligence Feeds)

All sources are free or have free tiers:

| Source | Category | Audio Character |
|--------|----------|-----------------|
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
┌─────────────────────────────────────────────────────────────────┐
│                    Threat Intelligence Feeds                     │
│  URLhaus, DShield, Feodo, RansomWatch, OpenPhish, SSLBL,        │
│  Blocklist.de, Tor, GreyNoise, HIBP, Spamhaus, BGPStream        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │     Backend     │
                  │   Bun + Fly.io  │
                  │                 │
                  │ • Polls feeds   │
                  │ • Drip-feeds    │
                  │   events (rate  │
                  │   limiting)     │
                  │ • WebSocket     │
                  │   broadcast     │
                  └────────┬────────┘
                           │ WSS (port 3333)
                           │ ghostwire-api.ghostlaboratory.net
                           ▼
                  ┌─────────────────┐
                  │    Frontend     │
                  │ Cloudflare Pages│
                  │                 │
                  │ • Three.js      │
                  │   WebGL visuals │
                  │ • Tone.js audio │
                  │ • Boot sequence │
                  │ • Live feed UI  │
                  └─────────────────┘
                    ghostwire.ghostlaboratory.net
```

---

## Audio Engine

### Synth Architecture

**Background Layers (always playing)**
- `subDrone` — constant sub-bass oscillator (20-40Hz), the "heartbeat"
- `voidDrone1/2` — detuned sine/triangle clusters, PolySynth (8 voices each)
- `whisperNoise` — brown/pink noise through auto-filter, constant hum
- `ghostPad` — ethereal pad with slow attack (16 voices)

**Event Synths (triggered by threats)**
- `malwareSynth` — MonoSynth with sawtooth, for corrupted signals
- `spectralSynth` — PolySynth (32 voices), ghostly melodic hits
- `c2Pulse` — MonoSynth with square wave, command pulses
- `honeypotDrone` — MonoSynth for attack drones
- `ransomDrone` — PolySynth (12 voices), dissonant dread chords
- `phishChime` — PolySynth, deceptive almost-pleasant tones
- `bruteHammer` — MembraneSynth, aggressive percussion
- `torWhisper` — PolySynth, anonymous whispers
- `metallicSynth` — MetalSynth, alarm hits
- `glitchSynth` — NoiseSynth, corruption bursts
- `fmGhost` — FMSynth, spectral modulation
- `infraBass` — MonoSynth, sub-bass impacts
- `stutterSynth` — MembraneSynth, stutter percussion
- `staticBurst` — NoiseSynth, interference

**Effects Chain**
```
Synths → darkFilter → feedbackDelay → distortion →
       → bitCrusher → pitchShift → voidReverb/tightReverb →
       → masterCompressor → masterGain
```

### Rate Limiting System

All event handlers are rate-limited to prevent polyphony overflow:

```typescript
private throttleEvent(eventType: string, minIntervalMs: number): boolean {
  const now = Tone.now() * 1000;
  const lastTime = this.lastEventTime[eventType] || 0;
  if (now - lastTime < minIntervalMs) return false;
  this.lastEventTime[eventType] = now;
  return true;
}
```

**Rate limits by event type:**

| Event | Interval | Reason |
|-------|----------|--------|
| honeypot | 80ms | Light synth usage |
| bruteforce | 80ms | Light synth usage |
| malware | 100ms | 1 note spectralSynth |
| phishing | 100ms | 1-2 notes |
| cert | 100ms | Light |
| c2 | 120ms | 2 notes c2Pulse |
| spamhaus | 120ms | Multiple synths |
| tor | 150ms | torWhisper + ghostPad (16 poly) |
| breach | 150ms | 4 notes spectralSynth cascade |
| bgp | 150ms | Multiple synths |
| ransomware | 200ms | 3-note chord on ransomDrone (12 poly) |

### Tension System

- `threatAccumulator` builds with events, decays over time
- Drives `globalTension` (0-1) which modulates:
  - Reverb blend (void ↔ tight)
  - Filter cutoff (darker ↔ brighter)
  - Bit crusher depth (clean ↔ degraded)
  - Feedback delay amount
  - Pitch shift wobble (tape warble)
  - Noise floor level

### Musical Scales (user-selectable)

- **Phrygian** (default) — Spanish/dark, minor 2nd tension
- **Minor** — classic dark
- **Dorian** — jazz-inflected dark
- **Locrian** — most unstable, diminished
- **Harmonic Minor** — exotic tension

---

## Visual Engine

### Rendering Stack

Three.js with custom shader pipeline:

1. **Scene Layer** — 3D particle field
2. **Render Pass** — standard scene render
3. **Bloom Pass** — UnrealBloomPass for glow effects
4. **Custom Shader Pass** — post-processing:
   - Vignette
   - Chromatic aberration (tension-modulated)
   - Noise grain
   - Scanline effects

### Color Palettes

Switchable themes in Controls panel:

**Ghostwire (default)**
- Void: `#010504` (near-black with green tint)
- Ambient: `#0a1f0a` (dark forest)
- Accents: blood red, hot pink, purple, orange, cyan per threat type

**Cyberpunk**
- Void: `#0a0015` (deep purple)
- Ambient: `#1a0030` (purple haze)
- Accents: neon magenta, cyan, yellow

**Noir**
- Void: `#000000` (pure black)
- Ambient: `#050505` (near-black)
- Accents: matrix green spectrum

**Blood Moon**
- Void: `#0a0000` (dark crimson)
- Ambient: `#1a0505` (blood haze)
- Accents: red/crimson spectrum

**Arctic**
- Void: `#000508` (cold blue-black)
- Ambient: `#051520` (frozen)
- Accents: ice blue, cyan, teal

### Particle System

- Threat nodes positioned by IP geolocation
- Size scales with reputation (repeat attackers grow)
- Trails follow movement
- Vortex spiral on expiration
- Color by threat type

---

## Tech Stack

**Backend**
- Runtime: Bun (native, no Node.js)
- Server: Bun.serve() with native WebSocket
- TLS: Conditional (disabled in production, Fly.io handles SSL)
- Deployment: Fly.io (Docker container, ord region)
- Domain: ghostwire-api.ghostlaboratory.net

**Frontend**
- Build: Vite 6
- 3D: Three.js 0.182
- Audio: Tone.js 15.1
- Language: TypeScript 5.7
- Deployment: Cloudflare Pages
- Domain: ghostwire.ghostlaboratory.net

---

## Project Structure

```
ghostwire/
├── claude.md              # This file (project context for Claude)
├── README.md              # GitHub readme
├── .gitignore
│
├── backend/
│   ├── src/
│   │   ├── index.ts       # Main server, WebSocket, event aggregation
│   │   └── sources/       # Threat feed clients (12 sources)
│   │       ├── urlhaus.ts
│   │       ├── greynoise.ts
│   │       ├── dshield.ts
│   │       ├── feodo.ts
│   │       ├── ransomwatch.ts
│   │       ├── openphish.ts
│   │       ├── sslbl.ts
│   │       ├── blocklistde.ts
│   │       ├── tor.ts
│   │       ├── hibp.ts
│   │       ├── spamhaus.ts
│   │       └── bgpstream.ts
│   ├── Dockerfile         # Bun runtime container
│   ├── fly.toml           # Fly.io deployment config
│   ├── package.json
│   └── bun.lock
│
├── frontend/
│   ├── src/
│   │   ├── main.ts        # Entry point, event routing, boot sequence, UI
│   │   ├── socket.ts      # WebSocket client with reconnection
│   │   ├── audio.ts       # Tone.js engine (synths, effects, tension)
│   │   ├── visuals.ts     # Three.js engine (particles, shaders, palettes)
│   │   └── style.css      # UI styling (dark theme)
│   ├── index.html         # Main HTML with all UI panels
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── .env                   # API keys (gitignored)
```

---

## UI Components

### Intro Screen
- Glitch-animated "GHOSTWIRE" title
- Threat source indicator dots
- "Enter" button (starts boot sequence)
- Expandable "What is this?" section with legend

### Boot Sequence
- Terminal-style initialization after clicking Enter
- Displays: system init, feed connections, audio/GPU setup
- Builds atmosphere before main visualization

### Live Threat Feed (right side)
- Real-time scrolling event log
- Color-coded by severity: critical (red), high (orange), medium (yellow), low (cyan), info (white)
- Shows: threat type, content preview, country flag, source
- Relative timestamps ("2s ago")

### Stats Panel (top right)
- Live counts per threat category with last-seen details
- Categories: Malware, Honeypot, Botnet C2, Ransomware, Phishing, Bad Certs, Brute Force, Tor, Scanners, Breaches, IP Hijacks, BGP
- Footer: node count, tension level
- Connection status indicator

### Controls Panel (bottom)
- Collapsible (▲ Controls button)
- **Audio**: Volume slider, Reverb slider
- **Musical Key**: Root note (C-B), Scale (Phrygian, Minor, Dorian, Locrian, Harmonic Minor)
- **Visual**: Theme selector (Ghostwire, Cyberpunk, Noir, Blood Moon, Arctic)

### Threat Info Panel (click node)
- Appears on node click
- Shows: threat type badge, source IP/domain, country, threat name, timestamp, hit count
- Related nodes count
- Close button

### Instructions Panel (bottom left)
- CLICK node for details
- HOVER to highlight related
- Note about node size = repeat attackers

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

# Custom domain
fly certs create ghostwire-api.ghostlaboratory.net
# Add CNAME: ghostwire-api.ghostlaboratory.net -> ghostwire-api.fly.dev
# IMPORTANT: Disable Cloudflare proxy for API domain (grey cloud)
```

### Frontend (Cloudflare Pages)

```bash
cd frontend

# Build
bun run build

# Deploy (requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID)
wrangler pages deploy dist --project-name=ghostwire

# Custom domain configured in Cloudflare dashboard
# ghostwire.ghostlaboratory.net -> ghostwire.pages.dev
```

---

## Running Locally

```bash
# Generate self-signed certs for local HTTPS (required for AudioWorklet)
cd backend
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost'

# Terminal 1: Backend
cd backend && bun run src/index.ts

# Terminal 2: Frontend
cd frontend && bun run dev
```

- Backend: `https://localhost:3333` (WSS endpoint: `wss://localhost:3333/ws`)
- Frontend: `https://localhost:5173`

Update `WS_URL` in `frontend/src/main.ts` to switch between local and production:
```typescript
const WS_URL = import.meta.env.PROD
  ? 'wss://ghostwire-api.ghostlaboratory.net/ws'
  : 'wss://localhost:3333/ws';
```

---

## Environment Variables

```env
# Backend (.env)
GREYNOISE_API_KEY=xxx    # Optional, falls back to simulation
NODE_ENV=production      # Set on Fly.io to disable TLS (handled by proxy)

# Frontend build/deploy
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ACCOUNT_ID=xxx
```

Most feeds are public/free and don't require authentication.

---

## Known Issues & Solutions

### Audio Scheduling Errors
**Problem:** "time must be greater than last scheduled time" errors with NoiseSynth
**Solution:** NoiseSynth is monophonic. Use single trigger instead of loops, add time offset (0.05s)

### Max Polyphony Exceeded
**Problem:** PolySynths dropping notes during event bursts
**Solution:** Unified rate limiting via `throttleEvent()` on all handlers. Interval based on notes per event and synth polyphony.

### 502 Bad Gateway on Fly.io
**Problem:** Backend trying to use TLS internally when Fly.io handles it
**Solution:** Set `NODE_ENV=production` secret, conditionally disable TLS

### Wrangler Authentication
**Problem:** Interactive prompts failing in CI/scripts
**Solution:** Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` env vars

---

## Git Workflow

```bash
# After making changes
cd /home/ghost/projects/ghostwire

# Build frontend
cd frontend && bun run build

# Deploy frontend
CLOUDFLARE_API_TOKEN="..." CLOUDFLARE_ACCOUNT_ID="..." wrangler pages deploy dist --project-name=ghostwire

# Commit and push
git add -A
git commit -m "Description of changes"
git push

# Deploy backend (if changed)
cd backend && fly deploy
```
