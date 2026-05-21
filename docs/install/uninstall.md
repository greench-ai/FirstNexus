---
summary: "Uninstall FirstNexus completely (CLI, service, state, workspace)"
read_when:
  - You want to remove FirstNexus from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

Two paths:

- **Easy path** if `FirstNexus` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
FirstNexus uninstall
```

Non-interactive (automation / npx):

```bash
FirstNexus uninstall --all --yes --non-interactive
npx -y FirstNexus uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
FirstNexus gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
FirstNexus gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${NEXISCLAW_STATE_DIR:-$HOME/.FirstNexus}"
```

If you set `NEXISCLAW_CONFIG_PATH` to a custom location outside the state dir, delete that file too.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.FirstNexus/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g FirstNexus
pnpm remove -g FirstNexus
bun remove -g FirstNexus
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/FirstNexus.app
```

Notes:

- If you used profiles (`--profile` / `NEXISCLAW_PROFILE`), repeat step 3 for each state dir (defaults are `~/.FirstNexus-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `FirstNexus` is missing.

### macOS (launchd)

Default label is `ai.FirstNexus.gateway` (or `ai.FirstNexus.<profile>`; legacy `com.FirstNexus.*` may still exist):

```bash
launchctl bootout gui/$UID/ai.FirstNexus.gateway
rm -f ~/Library/LaunchAgents/ai.FirstNexus.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.FirstNexus.<profile>`. Remove any legacy `com.FirstNexus.*` plists if present.

### Linux (systemd user unit)

Default unit name is `FirstNexus-gateway.service` (or `FirstNexus-gateway-<profile>.service`):

```bash
systemctl --user disable --now FirstNexus-gateway.service
rm -f ~/.config/systemd/user/FirstNexus-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `FirstNexus Gateway` (or `FirstNexus Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "FirstNexus Gateway"
Remove-Item -Force "$env:USERPROFILE\.FirstNexus\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.FirstNexus-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://FirstNexus.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g FirstNexus@latest`.
Remove it with `npm rm -g FirstNexus` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `FirstNexus ...` / `bun run FirstNexus ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.

## Related

- [Install overview](/install)
- [Migration guide](/install/migrating)
