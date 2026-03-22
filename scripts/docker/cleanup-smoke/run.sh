#!/usr/bin/env bash
set -euo pipefail

cd /repo

export NEXUSCLAW_STATE_DIR="/tmp/nexusclaw-test"
export NEXUSCLAW_CONFIG_PATH="${NEXUSCLAW_STATE_DIR}/nexusclaw.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${NEXUSCLAW_STATE_DIR}/credentials"
mkdir -p "${NEXUSCLAW_STATE_DIR}/agents/main/sessions"
echo '{}' >"${NEXUSCLAW_CONFIG_PATH}"
echo 'creds' >"${NEXUSCLAW_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${NEXUSCLAW_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm nexusclaw reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${NEXUSCLAW_CONFIG_PATH}"
test ! -d "${NEXUSCLAW_STATE_DIR}/credentials"
test ! -d "${NEXUSCLAW_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${NEXUSCLAW_STATE_DIR}/credentials"
echo '{}' >"${NEXUSCLAW_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm nexusclaw uninstall --state --yes --non-interactive

test ! -d "${NEXUSCLAW_STATE_DIR}"

echo "OK"
