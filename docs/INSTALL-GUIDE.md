# ⚡ NexusClaw — Install Guide

> Your AI agent, running on your machine. Forever.

---

## What you're installing

| Component | What it does |
|-----------|-------------|
| **NexusClaw Gateway** | The brain. HTTP API your agent runs behind. |
| **CLI** | `nexusclaw` — start/stop/status in your terminal. |
| **Control Dashboard** | Web UI at `http://localhost:19789` |
| **EvoClaw** | Your agent's heartbeat + memory. Runs every 15 min, automatically. |
| **Skills** | 60+ tools ready to use — no extra install needed. |

**Time:** ~10 minutes. No server required — runs on your laptop, desktop, or VPS.

---

## ⚡ Quick Install

One command. Everything installs.

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/greench-ai/nexusclaw/main/install.sh)"
```

Answer the prompts. Done.

---

## 📋 Requirements

- **Node.js** ≥ 22 — [nodejs.org](https://nodejs.org)
- **Git** — [git-scm.com](https://git-scm.com)
- **OS** — Linux · macOS · WSL2 (Windows Subsystem for Linux)

Check what's installed:

```bash
node --version   # must be ≥ 22
git --version
```

> ⚠️ If Node is missing or too old: `curl -fsSL https://fnm.vercel.app/install | bash && source ~/.bashrc && fnm install 22 && fnm use 22`

---

## Step-by-Step

### 1. Clone

```bash
git clone https://github.com/greench-ai/nexusclaw.git ~/nexusclaw
cd ~/nexusclaw
```

### 2. Install dependencies

```bash
# pnpm 10 is required (pnpm handles the workspace better than npm/yarn)
npm install -g pnpm

# Install everything
pnpm install --no-frozen-lockfile
```

### 3. Build

```bash
pnpm build        # gateway + CLI → dist/
pnpm ui:build     # control dashboard → dist/control-ui/
```

### 4. Set up the CLI

```bash
mkdir -p ~/bin

# Create the nexusclaw wrapper
cat > ~/bin/nexusclaw << 'EOF'
#!/bin/bash
exec node /home/YOUR_USER/nexusclaw/nexusclaw.mjs "$@"
EOF

chmod +x ~/bin/nexusclaw

# Add to your path
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Remove old aliases if they exist
grep -n "nexusclaw" ~/.bashrc
# If you see: alias nexusclaw="..." — delete that line
```

> ⚠️ **Replace `/home/YOUR_USER/`** with your actual home directory path. Run `echo $HOME` to check.

Verify:

```bash
nexusclaw --version
# NexusClaw 1.0.0 (...)
```

### 5. Start the gateway

```bash
nexusclaw gateway install   # install as a systemd user service
nexusclaw gateway start     # start it now
nexusclaw gateway status    # confirm it's running
```

You should see: `listening on 19789`

> 💡 **Systemd user service** means it auto-starts on login. No manual startup needed after a reboot.

### 6. Open the dashboard

```bash
nexusclaw dashboard
```

Then open in your browser:

```
http://localhost:19789
```

On first load you'll need a token. Get it with:

```bash
nexusclaw gateway status
```

Look for `token=` in the output. Paste it into the login screen.

### 7. Set your API key

```bash
nexusclaw secrets configure
```

Paste your Anthropic API key when prompted. NexusClaw uses this to power the agent.

> 🔑 **Your key lives locally.** Never sent anywhere except Anthropic's API directly.

---

## ✅ Verify everything is working

```bash
nexusclaw --version        # → NexusClaw 1.0.0 (...)
nexusclaw gateway status   # → listening on 19789
nexusclaw cron list        # → 3 jobs (evoclaw-heartbeat, memory-save, library-update)
ls ~/.nexusclaw/workspace/skills/   # → 60+ skill folders
```

---

## 🔧 Troubleshooting

### `nexusclaw: command not found`

```bash
echo $PATH | tr ':' '\n' | grep bin   # is ~/bin in the path?
# If not:
source ~/.bashrc
# Or manually:
export PATH="$HOME/bin:$PATH"
```

### Gateway won't start

```bash
nexusclaw gateway status
nexusclaw doctor --fix      # auto-diagnose and fix common issues
```

### Wrong Node version

```bash
node --version              # must say ≥ 22
# If too old:
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 22
fnm use 22
```

### Port 19789 is already in use

```bash
# Pick a different port:
nexusclaw gateway stop
nexusclaw config set gateway.port 19790
nexusclaw gateway start
```

---

## 🎛 Skills — what's included

No extra install needed. These are baked in:

| Category | Skills |
|---------|--------|
| 💬 Messaging | iMessage, WhatsApp, Telegram, Discord, Slack, SMS |
| 🗓️ Productivity | Apple Reminders, Things 3, Google Calendar, Notion |
| 🔍 Search | Web search, Brave, DuckDuckGo, Exa |
| 🎨 Generation | Image creation (DALL·E, ComfyUI, Replicate) |
| 🔐 Security | Healthcheck, node connect, SSH tools |
| 📊 Crypto | SOLHUNTER trading bot, Jupiter swap, token analysis |
| 🖥️ System | Tmux, Apple Notes, Bear, Obsidian, GitHub |
| 🗣️ Voice | ElevenLabs TTS, Whisper STT, voice calls |

Browse all skills: `clawhub search` or visit [clawhub.com](https://clawhub.com)

---

## 🔄 Updating NexusClaw

```bash
cd ~/nexusclaw
git pull                    # pull latest from GitHub
pnpm install               # install any new dependencies
pnpm build && pnpm ui:build # rebuild
nexusclaw gateway restart   # restart to pick up new code
```

---

## 💾 Where everything lives

```
~/.nexusclaw/
├── config/            # your gateway config
├── workspace/         # your agent's working directory
│   ├── SOUL.md       # your agent's identity
│   ├── MEMORY.md     # long-term memory
│   ├── memory/       # daily logs + experiences
│   └── skills/       # installed skills
├── library/           # code library cache
└── state/            # gateway state
```

---

## 🆘 Getting help

```bash
nexusclaw help                    # full command reference
nexusclaw doctor --fix            # diagnose + fix issues
nexusclaw config set -h           # config options
```

Or open an issue at [github.com/greench-ai/nexusclaw](https://github.com/greench-ai/nexusclaw)

---

*NexusClaw. Your agent. Your machine. Your rules.*
