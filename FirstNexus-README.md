# NexusClaw — Personal AI Gateway

> Self-hosted AI agent gateway. One command to install, fully yours.

---

## Quick Install

### macOS / Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/greench-ai/FirstNexus/main/install.sh | bash
```

Or with options:

```bash
curl -fsSL https://raw.githubusercontent.com/greench-ai/FirstNexus/main/install.sh | bash -s -- --no-onboard
```

### CLI Install (no root required)

```bash
curl -fsSL https://raw.githubusercontent.com/greench-ai/FirstNexus/main/install-cli.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/greench-ai/FirstNexus/main/install.ps1 | iex
```

---

## Requirements

- **Node.js** 22+ (installer handles this)
- **Git**
- **macOS, Linux, WSL, or Windows**

---

## What You Get

- **NexusClaw** — AI gateway with skills for web search, image generation, memory, and more
- **EvoClaw** — Self-evolving agent soul with structured memory and reflection
- **Pre-wired heartbeats** — Periodic memory consolidation, cron jobs, and health checks
- **10 UI themes** — Live-switchable dashboard
- **Plugin-ready** — Skills system for extensibility

---

## Post-Install

After install, run the onboarding wizard:

```bash
nexusclaw onboard
```

Or start the gateway:

```bash
nexusclaw gateway start
```

---

## Source-Based Install (for contributors)

```bash
# Clone the repo
git clone https://github.com/greench-ai/FirstNexus.git
cd FirstNexus

# Install dependencies
pnpm install

# Build
pnpm build

# Run
pnpm start
```

---

## Documentation

Full docs at [docs.nexusclaw.ai](https://docs.nexusclaw.ai)

---

## License

MIT — See [LICENSE](./LICENSE)
