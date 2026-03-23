#!/usr/bin/env bash
# ============================================================
# NexusClaw — One-shot installer
# Usage: bash install.sh
# ============================================================

set -e

REPO="https://github.com/greench-ai/nexusclaw.git"
INSTALL_DIR="$HOME/nexusclaw"
BIN_DIR="$HOME/bin"
CONFIG_DIR="$HOME/.nexusclaw"
GATEWAY_PORT=19789

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}▸${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}!${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }
header()  { echo -e "\n${BOLD}$1${NC}"; echo "────────────────────────────────────────"; }

# ── Check requirements ────────────────────────────────────────
header "NexusClaw Installer"

# Node.js
if ! command -v node &>/dev/null; then
  error "Node.js not found. Install Node.js 22+: https://nodejs.org"
fi
NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 22 ]; then
  error "Node.js 22+ required (found $NODE_VER). Upgrade: https://nodejs.org"
fi
success "Node.js $NODE_VER"

# pnpm
if ! command -v pnpm &>/dev/null; then
  info "Installing pnpm..."
  npm install -g pnpm
fi
success "pnpm $(pnpm --version)"

# git
if ! command -v git &>/dev/null; then
  error "Git not found. Install: sudo apt-get install git"
fi
success "git $(git --version | cut -d' ' -f3)"

# ── Clone or update ───────────────────────────────────────────
header "Repository"

if [ -d "$INSTALL_DIR/.git" ]; then
  info "Updating existing repo at $INSTALL_DIR..."
  cd "$INSTALL_DIR"
  git pull --ff-only
  success "Repo updated"
else
  info "Cloning to $INSTALL_DIR..."
  git clone "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  success "Repo cloned"
fi

# ── Install dependencies ──────────────────────────────────────
header "Dependencies"

info "Installing npm packages..."
pnpm install --no-frozen-lockfile 2>&1 | tail -3
success "Dependencies installed"

# ── Build ─────────────────────────────────────────────────────
header "Build"

info "Building gateway..."
pnpm build 2>/dev/null
success "Gateway built"

info "Building UI..."
pnpm ui:build 2>/dev/null
success "UI built"

# ── openclaw compat symlink ───────────────────────────────────
ln -sf "$INSTALL_DIR" "$INSTALL_DIR/node_modules/openclaw" 2>/dev/null || true
success "openclaw compat symlink set"

# ── Binary ────────────────────────────────────────────────────
header "Binary"

mkdir -p "$BIN_DIR"

cat > "$BIN_DIR/nexusclaw" << EOF
#!/bin/bash
exec node $INSTALL_DIR/nexusclaw.mjs "\$@"
EOF
chmod +x "$BIN_DIR/nexusclaw"
success "Binary installed at $BIN_DIR/nexusclaw"

# Add ~/bin to PATH in .bashrc if not already there
if ! grep -q 'export PATH="$HOME/bin' "$HOME/.bashrc" 2>/dev/null; then
  echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.bashrc"
  info "Added ~/bin to PATH in ~/.bashrc"
fi

# Remove any old alias that shadows the binary
if grep -q 'alias nexusclaw=' "$HOME/.bashrc" 2>/dev/null; then
  sed -i '/alias nexusclaw=/d' "$HOME/.bashrc"
  warn "Removed old nexusclaw alias from ~/.bashrc"
fi

export PATH="$BIN_DIR:$PATH"

# ── Config ────────────────────────────────────────────────────
header "Config"

mkdir -p "$CONFIG_DIR/workspace/skills"
mkdir -p "$INSTALL_DIR/library"

if [ ! -f "$CONFIG_DIR/nexusclaw.json" ]; then
  cat > "$CONFIG_DIR/nexusclaw.json" << EOF
{
  "gateway": {
    "port": $GATEWAY_PORT,
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
  success "Config created at $CONFIG_DIR/nexusclaw.json"
else
  success "Config already exists — skipped"
fi

# ── Skills ────────────────────────────────────────────────────
header "Skills"

if [ -d "$INSTALL_DIR/skills" ]; then
  cp -r "$INSTALL_DIR/skills/"* "$CONFIG_DIR/workspace/skills/" 2>/dev/null || true
  success "Skills installed: $(ls $CONFIG_DIR/workspace/skills/ | tr '\n' ' ')"
else
  warn "No skills directory found in repo"
fi

# ── API Key ───────────────────────────────────────────────────
header "API Key"

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo ""
  echo -e "  Enter your ${BOLD}Anthropic API key${NC} (starts with sk-ant-)"
  echo -e "  Get one at: ${BLUE}https://console.anthropic.com${NC}"
  echo -e "  Leave blank to skip (set later with: nexusclaw secrets configure)"
  echo ""
  read -rsp "  API key: " API_KEY
  echo ""
  if [ -n "$API_KEY" ]; then
    systemctl --user set-environment ANTHROPIC_API_KEY="$API_KEY" 2>/dev/null || \
      echo "export ANTHROPIC_API_KEY='$API_KEY'" >> "$HOME/.bashrc"
    success "API key saved"
  else
    warn "Skipped — run 'nexusclaw secrets configure' to set later"
  fi
else
  success "ANTHROPIC_API_KEY already set in environment"
fi

# ── Gateway service ───────────────────────────────────────────
header "Gateway Service"

"$BIN_DIR/nexusclaw" gateway install 2>/dev/null || true
systemctl --user daemon-reload 2>/dev/null || true
systemctl --user start nexusclaw-gateway.service 2>/dev/null || true
sleep 2

if systemctl --user is-active nexusclaw-gateway.service &>/dev/null; then
  success "Gateway service running on port $GATEWAY_PORT"
else
  warn "Service may not be running — try: nexusclaw gateway start"
fi

# ── Cron jobs ─────────────────────────────────────────────────
header "Cron Jobs"

EXISTING=$("$BIN_DIR/nexusclaw" cron list 2>/dev/null | grep -c "evoclaw\|memory-save\|library-update" || echo 0)

if [ "$EXISTING" -lt 3 ]; then
  "$BIN_DIR/nexusclaw" cron add --name "evoclaw-heartbeat" \
    --cron "*/15 * * * *" --session isolated \
    --message "Run skill: evoclaw/heartbeat" 2>/dev/null && success "Cron: evoclaw-heartbeat" || warn "Cron: evoclaw-heartbeat (already exists or gateway not ready)"

  "$BIN_DIR/nexusclaw" cron add --name "memory-save" \
    --cron "*/30 * * * *" --session isolated \
    --message "Run skill: memory-save/run" 2>/dev/null && success "Cron: memory-save" || warn "Cron: memory-save (already exists or gateway not ready)"

  "$BIN_DIR/nexusclaw" cron add --name "library-update" \
    --cron "0 * * * *" --session isolated \
    --message "Run skill: library-update/run" 2>/dev/null && success "Cron: library-update" || warn "Cron: library-update (already exists or gateway not ready)"
else
  success "Cron jobs already configured — skipped"
fi

# ── Done ──────────────────────────────────────────────────────
header "Done"

echo ""
echo -e "  ${GREEN}${BOLD}NexusClaw installed successfully!${NC}"
echo ""
echo -e "  ${BOLD}Version:${NC}   $("$BIN_DIR/nexusclaw" --version 2>/dev/null || echo 'NexusClaw 1.0.0')"
echo -e "  ${BOLD}Gateway:${NC}   http://localhost:$GATEWAY_PORT"
echo -e "  ${BOLD}Config:${NC}    $CONFIG_DIR/nexusclaw.json"
echo -e "  ${BOLD}Skills:${NC}    $(ls $CONFIG_DIR/workspace/skills/ 2>/dev/null | wc -l) installed"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "  1. Reload your shell:  ${BLUE}source ~/.bashrc${NC}"
echo -e "  2. Open dashboard:     ${BLUE}nexusclaw dashboard${NC}"
echo -e "  3. Run onboarding:     ${BLUE}nexusclaw onboard${NC}"
echo ""
echo -e "  ${BOLD}Docs:${NC}"
echo -e "  Install guide:  $INSTALL_DIR/docs/install.md"
echo -e "  Deploy guide:   $INSTALL_DIR/docs/deploy.md"
echo ""
