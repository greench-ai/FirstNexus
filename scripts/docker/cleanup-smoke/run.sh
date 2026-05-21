#!/usr/bin/env bash
set -euo pipefail

cd /repo

export NEXISCLAW_STATE_DIR="/tmp/FirstNexus-test"
export NEXISCLAW_CONFIG_PATH="${NEXISCLAW_STATE_DIR}/FirstNexus.json"

echo "==> Build"
if ! pnpm build >/tmp/FirstNexus-cleanup-build.log 2>&1; then
  cat /tmp/FirstNexus-cleanup-build.log
  exit 1
fi

echo "==> Seed state"
mkdir -p "${NEXISCLAW_STATE_DIR}/credentials"
mkdir -p "${NEXISCLAW_STATE_DIR}/agents/main/sessions"
echo '{}' >"${NEXISCLAW_CONFIG_PATH}"
echo 'creds' >"${NEXISCLAW_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${NEXISCLAW_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
if ! pnpm FirstNexus reset --scope config+creds+sessions --yes --non-interactive >/tmp/FirstNexus-cleanup-reset.log 2>&1; then
  cat /tmp/FirstNexus-cleanup-reset.log
  exit 1
fi

test ! -f "${NEXISCLAW_CONFIG_PATH}"
test ! -d "${NEXISCLAW_STATE_DIR}/credentials"
test ! -d "${NEXISCLAW_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${NEXISCLAW_STATE_DIR}/credentials"
echo '{}' >"${NEXISCLAW_CONFIG_PATH}"

echo "==> Uninstall (state only)"
if ! pnpm FirstNexus uninstall --state --yes --non-interactive >/tmp/FirstNexus-cleanup-uninstall.log 2>&1; then
  cat /tmp/FirstNexus-cleanup-uninstall.log
  exit 1
fi

test ! -d "${NEXISCLAW_STATE_DIR}"

echo "OK"
