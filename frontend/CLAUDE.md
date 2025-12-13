# Ghostwire Frontend

Generative audiovisual art installation driven by real-time internet threat intelligence data.

## Architecture

```
main.ts          - Entry point, UI orchestration, event routing
├── socket.ts    - WebSocket client, event type definitions
├── audio.ts     - Tone.js audio engine (2000+ lines)
└── visuals.ts   - Three.js visual engine (2000+ lines)
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
- **Synthesis**: Tone.js with multiple synth types (PolySynth, MonoSynth, FMSynth, MetalSynth, MembraneSynth, NoiseSynth)
- **Effects chain**: Reverb → Delay → Filter → Distortion → BitCrusher → Compressor → Limiter
- **Musical system**: Dark scales (Phrygian, Locrian, Harmonic Minor), key drift via circle of fifths
- **Tension system**: 0-10 scale affecting filter cutoff, reverb, distortion
- **Regional voices**: Different timbres for geographic regions (Asia=metallic, Europe=orchestral, etc.)
- **Counterpoint**: Threat types assigned to octave registers for polyphonic layering
- **Dynamic features**: Heartbeat pulse, stutter gates, stingers, build-ups, drops
- **Call-and-response**: Repeat attackers get inverted musical answers
- **Crescendo chains**: Sequential attacks from same country build intensity

### Visual Engine (`visuals.ts`)
- **Renderer**: Three.js with WebGL, bloom post-processing
- **Globe**: Wireframe sphere with latitude/longitude lines
- **Particles**: Point cloud with 50,000 max particles, shader-based rendering
- **Attack arcs**: Bezier curves from source to target with decay
- **Mood system**: Calm/Alert/Chaos phases with color shifts
- **Camera**: Auto-wandering with smooth interpolation, zoom storytelling
- **Tension scars**: Radial marks from high-tension moments
- **Activity ghosts**: Faint echoes during quiet periods
- **Clustering**: Threat type clusters with labels

## Development

```bash
# Install dependencies
~/.bun/bin/bun install

# Development server (uses vite despite CLAUDE.md template)
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

### Modifying audio behavior
- Tension affects global filter/reverb in `updateTensionEffects()`
- Each threat type has a `play*()` method with its own sound design
- Use `getScaleNote(degree, octave)` for scale-aware notes
- Use `getCounterpointNote(type, degree)` for register-aware notes

### Modifying visual behavior
- Particle colors defined in `PARTICLE_COLORS`
- Globe colors in mood system `moodPalettes`
- Animation in `animate()` loop
- Cluster positions updated in `updateClusters()`
