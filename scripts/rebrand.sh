#!/usr/bin/env bash
# NexusClaw — Rebrand Script
# Run from the root of your nexusclaw fork after cloning.
# Performs all string replacements to rename nexusclaw → nexusclaw.

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[rebrand]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Sanity check ──────────────────────────────────────────────────────────────
if [ ! -f "package.json" ]; then
  fail "Run this from the root of your nexusclaw fork."
fi

if ! grep -q '"nexusclaw"' package.json 2>/dev/null; then
  fail "This doesn't look like an NexusClaw fork (no 'nexusclaw' in package.json)."
fi

log "Starting NexusClaw → NexusClaw rebrand..."
log "Creating backup branch..."
git checkout -b pre-rebrand-backup 2>/dev/null || true
git checkout - 2>/dev/null || true

# ── Directories to process ───────────────────────────────────────────────────
DIRS="src apps packages scripts"
EXTS="ts tsx js jsx svelte html json sh md yaml yml toml"

build_ext_pattern() {
  local pattern=""
  for ext in $EXTS; do
    [ -n "$pattern" ] && pattern="$pattern,"
    pattern="${pattern}*.${ext}"
  done
  echo "$pattern"
}

INCLUDE_PATTERN=$(build_ext_pattern)

do_replace() {
  local from="$1"
  local to="$2"
  log "Replacing: '$from' → '$to'"
  for dir in $DIRS; do
    [ -d "$dir" ] || continue
    find "$dir" -type f \( \
      -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
      -o -name "*.svelte" -o -name "*.html" -o -name "*.json" \
      -o -name "*.sh" -o -name "*.md" -o -name "*.yaml" \
      -o -name "*.yml" -o -name "*.toml" \
    \) ! -path "*/node_modules/*" ! -path "*/.git/*" \
    | xargs sed -i "s|${from}|${to}|g" 2>/dev/null || true
  done
}

# ── String replacements (order matters) ──────────────────────────────────────
do_replace "NexusClaw"     "NexusClaw"
do_replace "nexusclaw"     "nexusclaw"
do_replace "NEXUSCLAW"     "NEXUSCLAW"
do_replace "nexus-claw"    "nexus-claw"
do_replace "nexusclaw\.ai" "nexusclaw.local"

# ── Config paths ──────────────────────────────────────────────────────────────
do_replace '\.nexusclaw/'  '.nexusclaw/'
do_replace '"\.nexusclaw"' '".nexusclaw"'

# ── Rename files ──────────────────────────────────────────────────────────────
log "Renaming files..."

[ -f "nexusclaw.mjs" ]         && git mv nexusclaw.mjs nexusclaw.mjs && ok "nexusclaw.mjs → nexusclaw.mjs"
[ -f "nexusclaw.podman.env" ]  && git mv nexusclaw.podman.env nexusclaw.podman.env && ok "nexusclaw.podman.env → nexusclaw.podman.env"

# ── Root files ────────────────────────────────────────────────────────────────
log "Patching root files..."
[ -f "package.json" ]   && sed -i 's/"nexusclaw"/"nexusclaw"/g; s|nexusclaw/nexusclaw|greench/nexusclaw|g' package.json
[ -f "pyproject.toml" ] && sed -i 's/nexusclaw/nexusclaw/g' pyproject.toml

# ── Verify ────────────────────────────────────────────────────────────────────
log "Verifying..."
REMAINING=$(grep -r "NexusClaw\|nexusclaw\|NEXUSCLAW" \
  src/ apps/ packages/ scripts/ \
  --include="*.ts" --include="*.js" --include="*.svelte" \
  --include="*.html" --include="*.json" --include="*.sh" \
  2>/dev/null | grep -v node_modules | grep -v ".git" | wc -l || echo 0)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Rebrand complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
if [ "$REMAINING" -gt 0 ]; then
  echo -e "${RED}  Warning: $REMAINING references to 'nexusclaw' still remain.${NC}"
  echo "  Run this to find them:"
  echo "  grep -r 'NexusClaw\\|nexusclaw' src/ apps/ packages/ --include='*.ts'"
else
  ok "No remaining nexusclaw references found."
fi
echo ""
echo "Next step: copy bootstrap files — see docs/integration-guide.md"
