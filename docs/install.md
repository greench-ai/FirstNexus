# NexusClaw — Installation Guide

> Private fork of OpenClaw, rebranded and extended with custom skills, themes, and tooling.
> Gateway port: **19789** | Config: `~/.nexusclaw/` | Binary: `nexusclaw`

---

## Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 22.16.0 |
| pnpm | ≥ 10.x |
| Git | any recent |
| OS | Linux, macOS, WSL2 |

---

## 1. Clone the repo

```bash
git clone https://github.com/greench-ai/nexusclaw.git
cd nexusclaw
```

---

## 2. Install dependencies

```bash
# pnpm 10 is required — install if missing
npm install -g pnpm

# Install all workspace deps
pnpm install --no-frozen-lockfile
```

> **Note:** `auto-install-peers=false` is set in `.npmrc` — this prevents pnpm from
> trying to fetch the private `nexusclaw` package from the npm registry.

---

## 3. Build

```bash
# Build the gateway/CLI (outputs to dist/)
pnpm build

# Build the web UI (outputs to dist/control-ui/)
pnpm ui:build
```

---

## 4. Install the `nexusclaw` binary

Add `~/bin` to your PATH if not already there, then create the binary wrapper:

```bash
mkdir -p ~/bin

cat > ~/bin/nexusclaw << 'EOF'
#!/bin/bash
exec node /path/to/nexusclaw/nexusclaw.mjs "$@"
EOF

chmod +x ~/bin/nexusclaw
```

Replace `/path/to/nexusclaw` with your actual clone path (e.g. `/home/greench/nexusclaw`).

Add to `~/.bashrc` if `~/bin` isn't in PATH:

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Remove any old aliases that shadow the binary:

```bash
# Check for conflicts
grep -n "nexusclaw" ~/.bashrc

# Remove any alias lines found (e.g. alias nexusclaw="openclaw --profile nexusclaw")
```

Verify:

```bash
nexusclaw --version
# NexusClaw 1.0.0 (...)
```

---

## 5. Create config directory

```bash
mkdir -p ~/.nexusclaw
mkdir -p ~/.nexusclaw/workspace/skills
```

Create `~/.nexusclaw/nexusclaw.json`:

```json
{
  "gateway": {
    "port": 19789,
    "bind": "loopback",
    "mode": "local"
  },
  "agents": {
    "defaults": {
      "sandbox": { "mode": "off" },
      "model": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": []
      }
    }
  }
}
```

---

## 6. Install skills

```bash
# Copy the bundled skills into the workspace
cp -r nexusclaw/skills/* ~/.nexusclaw/workspace/skills/
```

Included skills:
- `evoclaw` — Soul evolution heartbeat
- `memory-save` — Memory consolidation
- `library-update` — Library documentation
- `image-create` — Image generation
- `web-search` — Web search

---

## 7. Create library directory

```bash
mkdir -p ~/nexusclaw/library
```

---

## 8. Set your API key

```bash
nexusclaw secrets configure
```

Or set via systemd environment (see Section 10):

```bash
systemctl --user set-environment ANTHROPIC_API_KEY=sk-ant-...
```

---

## 9. Fix the openclaw module alias

The extensions import from `openclaw/plugin-sdk/...`. Since the package is now
named `nexusclaw`, a compatibility symlink is required:

```bash
ln -sf ~/nexusclaw ~/nexusclaw/node_modules/openclaw
```

This is already in the repo — only needed if you wipe `node_modules`.

---

## 10. Install and start the gateway service

```bash
# Install as systemd user service
nexusclaw gateway install

# Start the service
nexusclaw gateway start

# Verify
nexusclaw gateway status
```

The gateway will auto-start on login.

---

## 11. Add cron jobs

The gateway must be running first:

```bash
nexusclaw cron add \
  --name "evoclaw-heartbeat" \
  --cron "*/15 * * * *" \
  --session isolated \
  --message "Run skill: evoclaw/heartbeat"

nexusclaw cron add \
  --name "memory-save" \
  --cron "*/30 * * * *" \
  --session isolated \
  --message "Run skill: memory-save/run"

nexusclaw cron add \
  --name "library-update" \
  --cron "0 * * * *" \
  --session isolated \
  --message "Run skill: library-update/run"
```

Verify:

```bash
nexusclaw cron list
```

---

## 12. Open the dashboard

```bash
nexusclaw dashboard
```

Copy the URL with token into Chrome:

```
http://localhost:19789/#token=<your-token>
```

---

## 13. Chrome Extension (optional)

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select: `~/nexusclaw/extensions/chrome/`
5. Open the extension popup → set gateway URL: `http://localhost:19789`

---

## Verify everything

```bash
nexusclaw --version          # NexusClaw 1.0.0
nexusclaw gateway status     # listening on 19789
nexusclaw cron list          # 3 jobs
ls ~/.nexusclaw/workspace/skills/   # 5 skills
ls ~/nexusclaw/library/             # exists
```

---

## Useful commands

```bash
nexusclaw gateway start/stop/restart/status
nexusclaw dashboard           # open UI with token
nexusclaw cron list/add/run
nexusclaw secrets configure   # set API keys
nexusclaw doctor --fix        # fix config issues
nexusclaw config set <key> <value>
```
