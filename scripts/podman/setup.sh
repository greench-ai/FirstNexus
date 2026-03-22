#!/usr/bin/env bash
# One-time host setup for rootless NexusClaw in Podman: creates the nexusclaw
# user, builds the image, loads it into that user's Podman store, and installs
# the launch script. Run from repo root with sudo capability.
#
# Usage: ./scripts/podman/setup.sh [--quadlet|--container]
#   --quadlet   Install systemd Quadlet so the container runs as a user service
#   --container Only install user + image + launch script; you start the container manually (default)
#   Or set NEXUSCLAW_PODMAN_QUADLET=1 (or 0) to choose without a flag.
#
# After this, start the gateway manually:
#   ./scripts/run-nexusclaw-podman.sh launch
#   ./scripts/run-nexusclaw-podman.sh launch setup   # onboarding wizard
# Or as the nexusclaw user: sudo -u nexusclaw /home/nexusclaw/run-nexusclaw-podman.sh
# If you used --quadlet, you can also: sudo systemctl --machine nexusclaw@ --user start nexusclaw.service
set -euo pipefail

NEXUSCLAW_USER="${NEXUSCLAW_PODMAN_USER:-nexusclaw}"
REPO_PATH="${NEXUSCLAW_REPO_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
RUN_SCRIPT_SRC="$REPO_PATH/scripts/run-nexusclaw-podman.sh"
QUADLET_TEMPLATE="$REPO_PATH/scripts/podman/nexusclaw.container.in"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing dependency: $1" >&2
    exit 1
  fi
}

is_writable_dir() {
  local dir="$1"
  [[ -n "$dir" && -d "$dir" && ! -L "$dir" && -w "$dir" && -x "$dir" ]]
}

is_safe_tmp_base() {
  local dir="$1"
  local mode=""
  local owner=""
  is_writable_dir "$dir" || return 1
  mode="$(stat -Lc '%a' "$dir" 2>/dev/null || true)"
  if [[ -n "$mode" ]]; then
    local perm=$((8#$mode))
    if (( (perm & 0022) != 0 && (perm & 01000) == 0 )); then
      return 1
    fi
  fi
  if is_root; then
    owner="$(stat -Lc '%u' "$dir" 2>/dev/null || true)"
    if [[ -n "$owner" && "$owner" != "0" ]]; then
      return 1
    fi
  fi
  return 0
}

resolve_image_tmp_dir() {
  if ! is_root && is_safe_tmp_base "${TMPDIR:-}"; then
    printf '%s' "$TMPDIR"
    return 0
  fi
  if is_safe_tmp_base "/var/tmp"; then
    printf '%s' "/var/tmp"
    return 0
  fi
  if is_safe_tmp_base "/tmp"; then
    printf '%s' "/tmp"
    return 0
  fi
  printf '%s' "/tmp"
}

is_root() { [[ "$(id -u)" -eq 0 ]]; }

run_root() {
  if is_root; then
    "$@"
  else
    sudo "$@"
  fi
}

run_as_user() {
  # When switching users, the caller's cwd may be inaccessible to the target
  # user (e.g. a private home dir). Wrap in a subshell that cd's to a
  # world-traversable directory so sudo/runuser don't fail with "cannot chdir".
  # TODO: replace with fully rootless podman build to eliminate the need for
  # user-switching entirely.
  local user="$1"
  shift
  if command -v sudo >/dev/null 2>&1; then
    ( cd /tmp 2>/dev/null || cd /; sudo -u "$user" "$@" )
  elif is_root && command -v runuser >/dev/null 2>&1; then
    ( cd /tmp 2>/dev/null || cd /; runuser -u "$user" -- "$@" )
  else
    echo "Need sudo (or root+runuser) to run commands as $user." >&2
    exit 1
  fi
}

run_as_nexusclaw() {
  # Avoid root writes into $NEXUSCLAW_HOME (symlink/hardlink/TOCTOU footguns).
  # Anything under the target user's home should be created/modified as that user.
  run_as_user "$NEXUSCLAW_USER" env HOME="$NEXUSCLAW_HOME" "$@"
}

escape_sed_replacement_pipe_delim() {
  # Escape replacement metacharacters for sed "s|...|...|g" replacement text.
  printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'
}

# Quadlet: opt-in via --quadlet or NEXUSCLAW_PODMAN_QUADLET=1
INSTALL_QUADLET=false
for arg in "$@"; do
  case "$arg" in
    --quadlet)   INSTALL_QUADLET=true ;;
    --container) INSTALL_QUADLET=false ;;
  esac
done
if [[ -n "${NEXUSCLAW_PODMAN_QUADLET:-}" ]]; then
  case "${NEXUSCLAW_PODMAN_QUADLET,,}" in
    1|yes|true)  INSTALL_QUADLET=true ;;
    0|no|false) INSTALL_QUADLET=false ;;
  esac
fi

require_cmd podman
if ! is_root; then
  require_cmd sudo
fi
if [[ ! -f "$REPO_PATH/Dockerfile" ]]; then
  echo "Dockerfile not found at $REPO_PATH. Set NEXUSCLAW_REPO_PATH to the repo root." >&2
  exit 1
fi
if [[ ! -f "$RUN_SCRIPT_SRC" ]]; then
  echo "Launch script not found at $RUN_SCRIPT_SRC." >&2
  exit 1
fi

generate_token_hex_32() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
    return 0
  fi
  if command -v od >/dev/null 2>&1; then
    # 32 random bytes -> 64 lowercase hex chars
    od -An -N32 -tx1 /dev/urandom | tr -d " \n"
    return 0
  fi
  echo "Missing dependency: need openssl or python3 (or od) to generate NEXUSCLAW_GATEWAY_TOKEN." >&2
  exit 1
}

user_exists() {
  local user="$1"
  if command -v getent >/dev/null 2>&1; then
    getent passwd "$user" >/dev/null 2>&1 && return 0
  fi
  id -u "$user" >/dev/null 2>&1
}

resolve_user_home() {
  local user="$1"
  local home=""
  if command -v getent >/dev/null 2>&1; then
    home="$(getent passwd "$user" 2>/dev/null | cut -d: -f6 || true)"
  fi
  if [[ -z "$home" && -f /etc/passwd ]]; then
    home="$(awk -F: -v u="$user" '$1==u {print $6}' /etc/passwd 2>/dev/null || true)"
  fi
  if [[ -z "$home" ]]; then
    home="/home/$user"
  fi
  printf '%s' "$home"
}

resolve_nologin_shell() {
  for cand in /usr/sbin/nologin /sbin/nologin /usr/bin/nologin /bin/false; do
    if [[ -x "$cand" ]]; then
      printf '%s' "$cand"
      return 0
    fi
  done
  printf '%s' "/usr/sbin/nologin"
}

# Create nexusclaw user (non-login, with home) if missing
if ! user_exists "$NEXUSCLAW_USER"; then
  NOLOGIN_SHELL="$(resolve_nologin_shell)"
  echo "Creating user $NEXUSCLAW_USER ($NOLOGIN_SHELL, with home)..."
  if command -v useradd >/dev/null 2>&1; then
    run_root useradd -m -s "$NOLOGIN_SHELL" "$NEXUSCLAW_USER"
  elif command -v adduser >/dev/null 2>&1; then
    # Debian/Ubuntu: adduser supports --disabled-password/--gecos. Busybox adduser differs.
    run_root adduser --disabled-password --gecos "" --shell "$NOLOGIN_SHELL" "$NEXUSCLAW_USER"
  else
    echo "Neither useradd nor adduser found, cannot create user $NEXUSCLAW_USER." >&2
    exit 1
  fi
else
  echo "User $NEXUSCLAW_USER already exists."
fi

NEXUSCLAW_HOME="$(resolve_user_home "$NEXUSCLAW_USER")"
NEXUSCLAW_UID="$(id -u "$NEXUSCLAW_USER" 2>/dev/null || true)"
NEXUSCLAW_CONFIG="$NEXUSCLAW_HOME/.nexusclaw"
LAUNCH_SCRIPT_DST="$NEXUSCLAW_HOME/run-nexusclaw-podman.sh"

# Prefer systemd user services (Quadlet) for production. Enable lingering early so rootless Podman can run
# without an interactive login.
if command -v loginctl &>/dev/null; then
  run_root loginctl enable-linger "$NEXUSCLAW_USER" 2>/dev/null || true
fi
if [[ -n "${NEXUSCLAW_UID:-}" && -d /run/user ]] && command -v systemctl &>/dev/null; then
  if [[ ! -d "/run/user/$NEXUSCLAW_UID" ]]; then
    run_root install -d -m 700 -o "$NEXUSCLAW_UID" -g "$NEXUSCLAW_UID" "/run/user/$NEXUSCLAW_UID" || true
  fi
  run_root mkdir -p "/run/user/$NEXUSCLAW_UID/containers" || true
  run_root chown "$NEXUSCLAW_UID:$NEXUSCLAW_UID" "/run/user/$NEXUSCLAW_UID/containers" || true
  run_root chmod 700 "/run/user/$NEXUSCLAW_UID/containers" || true
fi

mkdir_user_dirs_as_nexusclaw() {
  run_root install -d -m 700 -o "$NEXUSCLAW_UID" -g "$NEXUSCLAW_UID" "$NEXUSCLAW_HOME" "$NEXUSCLAW_CONFIG"
  run_root install -d -m 700 -o "$NEXUSCLAW_UID" -g "$NEXUSCLAW_UID" "$NEXUSCLAW_CONFIG/workspace"
}

ensure_subid_entry() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    return 1
  fi
  grep -q "^${NEXUSCLAW_USER}:" "$file" 2>/dev/null
}

if ! ensure_subid_entry /etc/subuid || ! ensure_subid_entry /etc/subgid; then
  echo "WARNING: ${NEXUSCLAW_USER} may not have subuid/subgid ranges configured." >&2
  echo "If rootless Podman fails, add 'nexusclaw:100000:65536' to both /etc/subuid and /etc/subgid." >&2
fi

mkdir_user_dirs_as_nexusclaw

IMAGE_TMP_BASE="$(resolve_image_tmp_dir)"
echo "Using temp base for image export: $IMAGE_TMP_BASE"
IMAGE_TAR_DIR="$(mktemp -d "${IMAGE_TMP_BASE%/}/nexusclaw-podman-image.XXXXXX")"
chmod 700 "$IMAGE_TAR_DIR"
IMAGE_TAR="$IMAGE_TAR_DIR/nexusclaw-image.tar"
cleanup_image_tar() {
  rm -rf "$IMAGE_TAR_DIR"
}
trap cleanup_image_tar EXIT

BUILD_ARGS=()
if [[ -n "${NEXUSCLAW_DOCKER_APT_PACKAGES:-}" ]]; then
  BUILD_ARGS+=(--build-arg "NEXUSCLAW_DOCKER_APT_PACKAGES=${NEXUSCLAW_DOCKER_APT_PACKAGES}")
fi
if [[ -n "${NEXUSCLAW_EXTENSIONS:-}" ]]; then
  BUILD_ARGS+=(--build-arg "NEXUSCLAW_EXTENSIONS=${NEXUSCLAW_EXTENSIONS}")
fi

echo "Building image nexusclaw:local..."
podman build -t nexusclaw:local -f "$REPO_PATH/Dockerfile" "${BUILD_ARGS[@]}" "$REPO_PATH"
echo "Saving image to $IMAGE_TAR ..."
podman save -o "$IMAGE_TAR" nexusclaw:local

echo "Loading image into $NEXUSCLAW_USER Podman store..."
run_as_nexusclaw podman load -i "$IMAGE_TAR"

echo "Installing launch script to $LAUNCH_SCRIPT_DST ..."
run_root install -m 0755 -o "$NEXUSCLAW_UID" -g "$NEXUSCLAW_UID" "$RUN_SCRIPT_SRC" "$LAUNCH_SCRIPT_DST"

if [[ ! -f "$NEXUSCLAW_CONFIG/.env" ]]; then
  TOKEN="$(generate_token_hex_32)"
  run_as_nexusclaw sh -lc "umask 077 && printf '%s\n' 'NEXUSCLAW_GATEWAY_TOKEN=$TOKEN' > '$NEXUSCLAW_CONFIG/.env'"
  echo "Generated NEXUSCLAW_GATEWAY_TOKEN and wrote it to $NEXUSCLAW_CONFIG/.env"
fi

if [[ ! -f "$NEXUSCLAW_CONFIG/nexusclaw.json" ]]; then
  run_as_nexusclaw sh -lc "umask 077 && cat > '$NEXUSCLAW_CONFIG/nexusclaw.json' <<'JSON'
{ \"gateway\": { \"mode\": \"local\" } }
JSON"
  echo "Wrote minimal config to $NEXUSCLAW_CONFIG/nexusclaw.json"
fi

if [[ "$INSTALL_QUADLET" == true ]]; then
  QUADLET_DIR="$NEXUSCLAW_HOME/.config/containers/systemd"
  QUADLET_DST="$QUADLET_DIR/nexusclaw.container"
  echo "Installing Quadlet to $QUADLET_DST ..."
  run_as_nexusclaw mkdir -p "$QUADLET_DIR"
  NEXUSCLAW_HOME_ESCAPED="$(escape_sed_replacement_pipe_delim "$NEXUSCLAW_HOME")"
  sed "s|{{NEXUSCLAW_HOME}}|$NEXUSCLAW_HOME_ESCAPED|g" "$QUADLET_TEMPLATE" | \
    run_as_nexusclaw sh -lc "cat > '$QUADLET_DST'"
  run_as_nexusclaw chmod 0644 "$QUADLET_DST"

  echo "Reloading and enabling user service..."
  run_root systemctl --machine "${NEXUSCLAW_USER}@" --user daemon-reload
  run_root systemctl --machine "${NEXUSCLAW_USER}@" --user enable --now nexusclaw.service
  echo "Quadlet installed and service started."
else
  echo "Container + launch script installed."
fi

echo
echo "Next:"
echo "  ./scripts/run-nexusclaw-podman.sh launch"
echo "  ./scripts/run-nexusclaw-podman.sh launch setup"
