# NexusClaw — Deployment Guide

> How to deploy NexusClaw on a new machine (VPS, Raspberry Pi, workstation, WSL2).

---

## Prerequisites on the target machine

```bash
# Node.js 22+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# Git
sudo apt-get install -y git
```

---

## Option A — Clone and build from source

### 1. Clone

```bash
git clone https://github.com/greench-ai/nexusclaw.git ~/nexusclaw
cd ~/nexusclaw
```

### 2. Install & build

```bash
pnpm install --no-frozen-lockfile
pnpm build
pnpm ui:build
```

### 3. Binary wrapper

```bash
mkdir -p ~/bin
cat > ~/bin/nexusclaw << 'EOF'
#!/bin/bash
exec node /home/$(whoami)/nexusclaw/nexusclaw.mjs "$@"
EOF
chmod +x ~/bin/nexusclaw
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 4. openclaw compat symlink

```bash
ln -sf ~/nexusclaw ~/nexusclaw/node_modules/openclaw
```

### 5. Config

```bash
mkdir -p ~/.nexusclaw/workspace/skills
cp ~/nexusclaw/skills/* ~/.nexusclaw/workspace/skills/ -r

cat > ~/.nexusclaw/nexusclaw.json << 'EOF'
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
EOF
```

### 6. API key

```bash
systemctl --user set-environment ANTHROPIC_API_KEY=sk-ant-...
# or
nexusclaw secrets configure
```

### 7. Service

```bash
nexusclaw gateway install
nexusclaw gateway start
nexusclaw gateway status
```

### 8. Cron jobs

```bash
nexusclaw cron add --name "evoclaw-heartbeat" --cron "*/15 * * * *" \
  --session isolated --message "Run skill: evoclaw/heartbeat"

nexusclaw cron add --name "memory-save" --cron "*/30 * * * *" \
  --session isolated --message "Run skill: memory-save/run"

nexusclaw cron add --name "library-update" --cron "0 * * * *" \
  --session isolated --message "Run skill: library-update/run"
```

---

## Option B — VPS with public access

Same as Option A, plus expose the gateway externally.

### Change bind mode

```bash
nexusclaw config set gateway.bind lan
nexusclaw gateway restart
```

Or for Tailscale:

```bash
nexusclaw config set gateway.bind tailnet
nexusclaw gateway restart
```

### Nginx reverse proxy (HTTPS)

```nginx
server {
    listen 443 ssl;
    server_name nexusclaw.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:19789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

```bash
sudo certbot --nginx -d nexusclaw.yourdomain.com
sudo systemctl reload nginx
```

Connect from anywhere:

```
https://nexusclaw.yourdomain.com/#token=<your-token>
```

---

## Option C — Docker

```dockerfile
FROM node:22-slim

WORKDIR /app
COPY . .

RUN npm install -g pnpm && \
    pnpm install --no-frozen-lockfile && \
    pnpm build && \
    pnpm ui:build && \
    ln -sf /app /app/node_modules/openclaw

ENV NEXUSCLAW_GATEWAY_PORT=19789
EXPOSE 19789

CMD ["node", "nexusclaw.mjs", "gateway", "--port", "19789", \
     "--bind", "lan", "--allow-unconfigured"]
```

```bash
# Build
docker build -t nexusclaw .

# Run
docker run -d \
  --name nexusclaw \
  -p 19789:19789 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -v nexusclaw-data:/root/.nexusclaw \
  nexusclaw
```

Using the existing `Dockerfile` in the repo:

```bash
docker compose up -d
```

---

## Option D — Raspberry Pi

Same as Option A. Recommended specs: Pi 4 / 4GB+.

```bash
# Node 22 on ARM
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Enable lingering so service runs without login
loginctl enable-linger $USER
```

Then follow Option A steps.

---

## Updating NexusClaw

```bash
cd ~/nexusclaw
git pull
pnpm install --no-frozen-lockfile
pnpm build
pnpm ui:build
nexusclaw gateway restart
```

---

## Backing up

Files to back up:

```bash
~/.nexusclaw/nexusclaw.json       # config
~/.nexusclaw/credentials/         # API keys + auth tokens
~/.nexusclaw/cron/               # cron job definitions
~/.nexusclaw/workspace/          # agent workspace + skills
~/.nexusclaw/memory/             # agent memory
~/nexusclaw/library/             # library docs
```

Quick backup:

```bash
tar -czf nexusclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.nexusclaw ~/nexusclaw/library
```

---

## Multi-machine setup

Run one gateway per machine. Each machine has its own:
- `~/.nexusclaw/` config and credentials
- Cron jobs (re-add on each machine)
- Workspace and memory

To share memory across machines, sync `~/.nexusclaw/workspace/` via
rsync, Syncthing, or git.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `nexusclaw: command not found` | Check `~/bin` is in PATH; remove alias in `~/.bashrc` |
| `disconnected (1006)` | Client ID mismatch — rebuild UI after any rename changes |
| `Config invalid` | Run `nexusclaw doctor --fix` |
| `Cannot find package 'openclaw'` | Re-run: `ln -sf ~/nexusclaw ~/nexusclaw/node_modules/openclaw` |
| Gateway won't start | Check `nexusclaw gateway status`, read `/tmp/nexusclaw/*.log` |
| Missing deps at runtime | Run `pnpm add -w <package>` then `pnpm build` |
| Port 19789 in use | `lsof -i :19789` then kill the process, or change port in config |
| UI unstyled / wrong colors | Hard refresh `Ctrl+Shift+R` after `pnpm ui:build` |

---

## Port reference

| Port | Service |
|------|---------|
| 19789 | Gateway WebSocket + HTTP UI |
| 19791 | Browser control server |
