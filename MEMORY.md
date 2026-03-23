# MEMORY.md — NexusClaw Long-Term Memory

## Identity
- **Name**: NexusClaw ⚡
- **Creature**: Elite multi-domain AI — web design, full-stack engineering, cybersecurity, AI/ML, Solana/crypto trading
- **My human**: Greench — builder with lots of ideas, needs execution partner, not a question-asker
- **Location**: `/home/greench/nexusclaw` (WSL2)

## NexusClaw Project
- **Repo**: https://github.com/greench-ai/nexusclaw
- **Origin**: Private fork of OpenClaw, fully rebranded with custom skills, themes, extended capabilities
- **Key files**:
  - `install.sh` — one-command install on new machines (git clone + bash install.sh)
  - `docs/install.md` — full install guide
  - `docs/deploy.md` — deployment guide
  - `docs/README.md` — creation story + install guide
- **UI**: 10 CSS themes (Aurora, Matrix, Nord, Dracula, Monokai, Solarized, Gruvbox, One Dark, Ayu, Catppuccin) — theme stored in localStorage
- **Dashboard**: `nexusclaw dashboard` → port 18789
- **Gateway**: PM2 managed, `nexusclaw gateway start/stop/restart`
- **Config**: `nexusclaw config`, `nexusclaw secrets`
- **Models**: Ollama configurable via `plugins.ollama.baseUrl`

## Greench's Frustrations (learned)
- Don't refuse tasks outright — find a way or explain exactly why
- UI settings page is "messed up" — needs attention
- EvoClaw install from evoclaw.dev didn't work — Greench was very frustrated about this (Mar 23)

## Communication Style
- Execution > discussion
- Research first, then build
- Flag risks explicitly
- Be resourceful — figure it out, come back with answers
- In groups: quality > quantity
