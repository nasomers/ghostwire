# Ghostwire Frontend

Generative audiovisual art installation driven by real-time internet threat intelligence data.

## Architecture

```
main.ts          - Entry point, UI orchestration, event routing
├── socket.ts    - WebSocket client, event type definitions
├── audio.ts     - Tone.js audio engine (~2700 lines)
└── visuals.ts   - Three.js visual engine (~3700 lines)
```

## Key Concepts

### Data Sources (12 threat feeds)
- **URLhaus** - Malware distribution URLs
- **GreyNoise** - Internet scanner activity
- **DShield** - Honeypot attack data
- **Feodo** - Botnet C2 servers
- **RansomWatch** - Ransomware victim announcements
- **OpenPhish** - Phishing URLs
- **SSLBL** - Malicious SSL certificates
- **Bruteforce** - Login attack attempts
- **Tor** - Exit node activity
- **HIBP** - Data breach notifications
- **Spamhaus** - Hijacked IP ranges
- **BGPStream** - Route hijacks/leaks

### Audio Engine (`audio.ts`)

**Synthesis & Effects:**
- Tone.js with multiple synth types (PolySynth, MonoSynth, FMSynth, MetalSynth, MembraneSynth, NoiseSynth)
- Effects chain: Reverb → Delay → Filter → Chorus → Compressor → Limiter
- Tension system (0-1 scale) affecting filter cutoff, reverb, delay feedback

**Musical System:**
- Dark scales: Phrygian, Locrian, Harmonic Minor, Dorian, Pentatonic, Blues, Japanese, Whole Tone
- Key drift via circle of fifths (modulates every ~3 minutes)
- Regional voice timbres (Asia=metallic, Europe=orchestral, Americas=warm, etc.)
- Counterpoint registers: threat types assigned to octave ranges for polyphonic layering

**Generative Features:**
- Evolution system with phases affecting timbre and progression
- Texture cycling (melody, chords, arps, drones)
- Chord progressions: dark, tense, ethereal, hopeful
- Call-and-response for repeat attackers

**Atmospheric Layers:**
- Voice choir: 3-voice formant-filtered pads (low/mid/high) with vibrato
- Shard rain: Reactive crystalline texture layer with bursts/cascades
- Evolving bass: Long filter-swept bass notes with 5 evolution types
- Noise floor: Pink noise through lowpass filter with LFO
- Breath/ghost synths for quiet moments

**Dramatic Elements:**
- Periodic drama system (18-30 second intervals)
- 9 tension builders: ominous cluster, cascade, rhythmic pulse, escalation, noise sweep, harmonic shift, glitch burst, deep throb, shimmer rise
- Stingers for critical events (ransomware, breaches, BGP hijacks)
- Build-ups with filter sweeps, sub-bass drops
- Heartbeat pulse, stutter gates

### Visual Engine (`visuals.ts`)

**Core Rendering:**
- Three.js with WebGL2
- Post-processing: UnrealBloomPass, ChromaticAberrationShader
- 6 color themes: Ghostwire, Cyberpunk, Matrix, Blood Moon, Arctic, Void

**Particle System:**
- 600 particles with shader-based rendering
- 11 morphing formations: sphere, torus, helix, cube, octahedron, galaxy, grid, waves, dna helix, data matrix, neural network
- Smooth transitions between formations
- Particle trails with fade

**3D Elements:**
- Wireframe globe with latitude/longitude lines
- Icosahedron core (radius 70, 60 vertices)
- 4D Tesseract projection with rotation and glitch effects
- Energy conduits/axon connections between nodes
- Data packets traveling along connections

**HUD & UI:**
- Glitch typography "GHOSTWIRE" title (intensifies with tension)
- 3D floating data fragments for threat events
- Continuous scrolling threat ticker (pauses on hover)
- Geographic labels for attack origins
- Threat info panel on node selection

**Camera System:**
- Auto-wandering with smooth interpolation
- Orbit, focus, and zoom modes
- Tension-reactive behavior

**Mood System:**
- Three phases: calm, alert, chaos
- Color palette shifts based on tension
- Activity ghosts during quiet periods

## Development

```bash
# Install dependencies
~/.bun/bin/bun install

# Development server
~/.bun/bin/bun run dev

# Production build
~/.bun/bin/bun run build

# Type check (has known Tone.js type issues that don't affect runtime)
bunx tsc --noEmit
```

## Deployment

- **Frontend**: Cloudflare Pages at ghostwire.ghostlaboratory.net
- **Backend**: Fly.io at ghostwire-api.ghostlaboratory.net

```bash
# Deploy frontend
CLOUDFLARE_API_TOKEN="..." CLOUDFLARE_ACCOUNT_ID="..." \
  ~/.local/bin/wrangler pages deploy dist --project-name=ghostwire
```

## Common Tasks

### Adding a new threat type
1. Add type definition in `socket.ts`
2. Add play method in `audio.ts` (use throttleEvent, addTension, getScaleNote)
3. Add visual handler in `visuals.ts` (addParticle, addAttackArc)
4. Add stats counter in `main.ts`
5. Add to ticker via `addTickerItem()`

### Modifying audio behavior
- Tension affects global filter/reverb in `addTension()`
- Each threat type has a `play*()` method with its own sound design
- Use `getScaleNote(degree, octave)` for scale-aware notes
- Use `getCounterpointNote(type, degree)` for register-aware notes
- Periodic drama in `triggerPeriodicDrama()`

### Modifying visual behavior
- Particle colors in theme palettes
- Formations defined in `FORMATIONS` array
- Animation in `update()` and `render()` loops
- HUD elements in `initHUD()` and `updateHUD()`
