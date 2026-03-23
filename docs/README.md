# ⚔ NexusClaw

> A private fork of OpenClaw — rebranded, extended, and built for serious use.

---

## What is NexusClaw?

NexusClaw started as OpenClaw — an open-source personal AI gateway. We took the source, forked it privately, and rebuilt it into something more focused:

- **Full rebrand** — every reference to OpenClaw replaced with NexusClaw
- **Custom UI themes** — 10 hand-tuned themes (Aurora, Midnight, Void, Matrix, and more)
- **Custom skills** — evoclaw, memory-save, library-update, image-create, web-search
- **Extended config** — tuned defaults, cron jobs, agent model settings
- **Chrome extension** — connect from any tab
- **Clean install** — one script, any machine

The gateway runs locally on port **19789**, serves a full web dashboard, and connects to any AI provider — Anthropic, Ollama, OpenAI, OpenRouter, and more.

---

## How NexusClaw was built

### 1. Fork
We started from the OpenClaw repository and created a private fork at `github.com/greench-ai/nexusclaw`.

### 2. Rebrand
A rebrand script replaced all `openclaw` → `nexusclaw` references across:
- Source files (`src/`, `packages/`, `apps/`)
- Extension configs (`nexusclaw.plugin.json`)
- Swift/Kotlin mobile code
- Binary name (`nexusclaw.mjs`)
- UI package name (`@nexusclaw/ui`)

The one exception: a backward-compat alias in `src/plugin-sdk/infra-runtime.ts` keeps `resolvePreferredOpenClawTmpDir` exported so existing extensions don't break.

### 3. Bootstrap files
Custom files were added on top of the fork:
- `ui/themes/themes.css` — 10 themes mapped to the UI's CSS variable system
- `ui/themes/switcher.ts` — theme switcher logic
- `ui/ClaudePreview.svelte` — live streaming response panel (ported to a native Lit web component)
- `skills/` — 5 custom agent skills
- `config/nexusclaw.json` — tuned default config
- `extensions/chrome/` — Chrome extension with NexusClaw branding

### 4. UI wiring
- Theme CSS imported at the top of `ui/src/styles.css`
- ThemeSwitcher mounted in `dashboard-header.ts`
- ClaudePreview registered as `<claude-preview>` web component in the chat view
- Fixed client ID mismatch: `openclaw-control-ui` → `nexusclaw-control-ui` in `app-gateway.ts`

### 5. Build fixes
Several issues were resolved to get a clean build:
- `pnpm auto-install-peers=false` — prevented npm registry lookups for the private package
- `@nexusclaw/ui` package name fix — `pnpm --filter` wasn't matching the old name
- `openclaw` node_modules symlink — extensions import `openclaw/plugin-sdk/...`, symlink resolves to the nexusclaw root
- Full `exports` map in `package.json` — exposes all plugin-sdk subpaths
- `tsdown-build.mjs` patched — optional runtime deps (`sharp`, `jiti`, `node-edge-tts`, etc.) no longer cause fatal build errors
- 8 optional runtime deps added to root `package.json`

### 6. Config & service
- Config schema migrated from `agent.*` → `agents.defaults`
- Gateway installed as a systemd user service
- 3 cron jobs registered via CLI

---

## Requirements

| Tool | Version | Required |
|------|---------|----------|
| Node.js | ≥ 22.16.0 | ✅ |
| pnpm | ≥ 10.x | ✅ |
| git | any | ✅ |
| curl | any | ✅ |
| python3 | any | ○ optional |
| ffmpeg | any | ○ optional |

**OS:** Linux, macOS, WSL2, Raspberry Pi

---

## Install on a new machine

Two commands. That's it.

```bash
git clone https://github.com/greench-ai/nexusclaw.git
bash nexusclaw/install.sh
```

The installer will:

1. **Check & install system dependencies** — Node.js 22, git, curl, build tools
2. **Ask about optional tools** — ffmpeg (voice), python3 (code execution)
3. **Install Node packages** — `pnpm install`
4. **Build** — gateway (`pnpm build`) + UI (`pnpm ui:build`)
5. **Install the binary** — `~/bin/nexusclaw`
6. **Create config** — `~/.nexusclaw/nexusclaw.json`
7. **Install skills** — 5 skills into `~/.nexusclaw/workspace/skills/`
8. **Prompt for API key** — Anthropic (or skip and configure later)
9. **Start the gateway** — systemd user service on port 19789
10. **Add cron jobs** — evoclaw (15m), memory-save (30m), library-update (1h)

After install:

```bash
source ~/.bashrc
nexusclaw dashboard
```

Open the URL it prints in your browser.

---

## First run

```bash
# Check everything is working
nexusclaw --version
nexusclaw gateway status

# Interactive setup wizard (models, channels, workspace)
nexusclaw onboard

# Configure API keys
nexusclaw secrets configure

# Add Ollama or other local models
nexusclaw models
```

---

## Dashboard

```bash
nexusclaw dashboard
```

Opens at: `http://localhost:19789/#token=<your-token>`

From here you can:
- Chat with the agent
- Configure settings
- View cron jobs and logs
- Manage sessions and memory

---

## Chrome Extension

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select: `~/nexusclaw/extensions/chrome/`
5. Open extension popup → set gateway URL: `http://localhost:19789`

---

## Key paths

| Path | What |
|------|------|
| `~/nexusclaw/` | Source code |
| `~/.nexusclaw/nexusclaw.json` | Config |
| `~/.nexusclaw/workspace/` | Agent workspace |
| `~/.nexusclaw/workspace/skills/` | Installed skills |
| `~/.nexusclaw/cron/` | Cron job definitions |
| `~/.nexusclaw/credentials/` | API keys & tokens |
| `~/.nexusclaw/memory/` | Agent memory |
| `~/nexusclaw/library/` | Library docs |
| `/tmp/nexusclaw/*.log` | Gateway logs |

---

## Useful commands

```bash
# Gateway
nexusclaw gateway start/stop/restart/status

# Dashboard
nexusclaw dashboard

# Config
nexusclaw config set <key> <value>
nexusclaw doctor --fix

# Secrets / API keys
nexusclaw secrets configure

# Models
nexusclaw models

# Cron
nexusclaw cron list
nexusclaw cron add ...

# Onboarding
nexusclaw onboard
```

---

## Updating

```bash
cd ~/nexusclaw
git pull
pnpm install --no-frozen-lockfile
pnpm build && pnpm ui:build
nexusclaw gateway restart
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `nexusclaw: command not found` | `source ~/.bashrc` |
| `disconnected (1006)` | Rebuild UI: `pnpm ui:build` |
| `Config invalid` | `nexusclaw doctor --fix` |
| `Cannot find package 'openclaw'` | `ln -sf ~/nexusclaw ~/nexusclaw/node_modules/openclaw` |
| Gateway won't start | `nexusclaw gateway status` — check `/tmp/nexusclaw/*.log` |
| UI wrong colors | Hard refresh `Ctrl+Shift+R` |
| Port 19789 in use | `lsof -i :19789` then kill, or change port in config |

---

## Deploy on other machines

See [`docs/deploy.md`](deploy.md) for:
- VPS with public HTTPS access
- Docker / docker-compose
- Raspberry Pi
- Multi-machine setup
- Backup guide
