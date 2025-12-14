# Ghostwire

**Real-time threat intelligence, rendered as art.**

Ghostwire transforms live cybersecurity threat data into an immersive audiovisual experience. Every sound and visual represents real malicious activity happening right now.

**Live Demo:** [ghostwire.ghostlaboratory.net](https://ghostwire.ghostlaboratory.net)

---

## Features

- Generative audiovisual experience driven by real-time data
- Evolving ambient soundscape that never repeats
- Multiple visual themes and musical modes
- Works on desktop and mobile

---

## Tech Stack

**Backend:** Bun, TypeScript, Fly.io
**Frontend:** Vite, Three.js, Tone.js, TypeScript, Cloudflare Pages

## Architecture

```
┌───────────────────────────────────────────────────────┐
│                       Frontend                        │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────────┐  │
│  │  Three.js   │ │   Tone.js   │ │  UI & Events   │  │
│  │  (Visuals)  │ │   (Audio)   │ │                │  │
│  └─────────────┘ └─────────────┘ └────────────────┘  │
│                         │                             │
│                  WebSocket (wss://)                   │
└─────────────────────────┼─────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────┐
│                       Backend                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │             Bun WebSocket Server                │  │
│  │        Event Aggregation & Processing           │  │
│  └─────────────────────────────────────────────────┘  │
│                         │                             │
│               Threat Intelligence                     │
│                     Sources                           │
└───────────────────────────────────────────────────────┘
```

---

## Local Development

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)

### Backend

```bash
cd backend
bun install
bun run src/index.ts
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

---

## License

MIT
