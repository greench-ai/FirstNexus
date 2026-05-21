---
summary: "CLI reference for `FirstNexus browser` (lifecycle, profiles, tabs, actions, state, and debugging)"
read_when:
  - You use `FirstNexus browser` and want examples for common tasks
  - You want to control a browser running on another machine via a node host
  - You want to attach to your local signed-in Chrome via Chrome MCP
title: "Browser"
---

# `FirstNexus browser`

Manage FirstNexus's browser control surface and run browser actions (lifecycle, profiles, tabs, snapshots, screenshots, navigation, input, state emulation, and debugging).

Related:

- Browser tool + API: [Browser tool](/tools/browser)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (defaults to config).
- `--token <token>`: Gateway token (if required).
- `--timeout <ms>`: request timeout (ms).
- `--expect-final`: wait for a final Gateway response.
- `--browser-profile <name>`: choose a browser profile (default from config).
- `--json`: machine-readable output (where supported).

## Quick start (local)

```bash
FirstNexus browser profiles
FirstNexus browser --browser-profile FirstNexus start
FirstNexus browser --browser-profile FirstNexus open https://example.com
FirstNexus browser --browser-profile FirstNexus snapshot
```

Agents can run the same readiness check with `browser({ action: "doctor" })`.

## Quick troubleshooting

If `start` fails with `not reachable after start`, troubleshoot CDP readiness first. If `start` and `tabs` succeed but `open` or `navigate` fails, the browser control plane is healthy and the failure is usually navigation SSRF policy.

Minimal sequence:

```bash
FirstNexus browser --browser-profile FirstNexus doctor
FirstNexus browser --browser-profile FirstNexus start
FirstNexus browser --browser-profile FirstNexus tabs
FirstNexus browser --browser-profile FirstNexus open https://example.com
```

Detailed guidance: [Browser troubleshooting](/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Lifecycle

```bash
FirstNexus browser status
FirstNexus browser doctor
FirstNexus browser doctor --deep
FirstNexus browser start
FirstNexus browser start --headless
FirstNexus browser stop
FirstNexus browser --browser-profile FirstNexus reset-profile
```

Notes:

- `doctor --deep` adds a live snapshot probe. It is useful when basic CDP
  readiness is green but you want proof that the current tab can be inspected.
- For `attachOnly` and remote CDP profiles, `FirstNexus browser stop` closes the
  active control session and clears temporary emulation overrides even when
  FirstNexus did not launch the browser process itself.
- For local managed profiles, `FirstNexus browser stop` stops the spawned browser
  process.
- `FirstNexus browser start --headless` applies only to that start request and
  only when FirstNexus launches a local managed browser. It does not rewrite
  `browser.headless` or profile config, and it is a no-op for an already-running
  browser.
- On Linux hosts without `DISPLAY` or `WAYLAND_DISPLAY`, local managed profiles
  run headless automatically unless `NEXISCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false`, or `browser.profiles.<name>.headless=false`
  explicitly requests a visible browser.

## If the command is missing

If `FirstNexus browser` is an unknown command, check `plugins.allow` in
`~/.FirstNexus/FirstNexus.json`.

When `plugins.allow` is present, list the bundled browser plugin explicitly
unless the config already has a root `browser` block:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

An explicit root `browser` block, for example `browser.enabled=true` or
`browser.profiles.<name>`, also activates the bundled browser plugin under a
restrictive plugin allowlist.

Related: [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profiles

Profiles are named browser routing configs. In practice:

- `FirstNexus`: launches or attaches to a dedicated FirstNexus-managed Chrome instance (isolated user data dir).
- `user`: controls your existing signed-in Chrome session via Chrome DevTools MCP.
- custom CDP profiles: point at a local or remote CDP endpoint.

```bash
FirstNexus browser profiles
FirstNexus browser create-profile --name work --color "#FF5A36"
FirstNexus browser create-profile --name chrome-live --driver existing-session
FirstNexus browser create-profile --name remote --cdp-url https://browser-host.example.com
FirstNexus browser delete-profile --name work
```

Use a specific profile:

```bash
FirstNexus browser --browser-profile work tabs
```

## Tabs

```bash
FirstNexus browser tabs
FirstNexus browser tab new --label docs
FirstNexus browser tab label t1 docs
FirstNexus browser tab select 2
FirstNexus browser tab close 2
FirstNexus browser open https://docs.FirstNexus.ai --label docs
FirstNexus browser focus docs
FirstNexus browser close t1
```

`tabs` returns `suggestedTargetId` first, then the stable `tabId` such as `t1`,
the optional label, and the raw `targetId`. Agents should pass
`suggestedTargetId` back into `focus`, `close`, snapshots, and actions. You can
assign a label with `open --label`, `tab new --label`, or `tab label`; labels,
tab ids, raw target ids, and unique target-id prefixes are all accepted.
When Chromium replaces the underlying raw target during a navigation or form
submit, FirstNexus keeps the stable `tabId`/label attached to the replacement tab
when it can prove the match. Raw target ids remain volatile; prefer
`suggestedTargetId`.

## Snapshot / screenshot / actions

Snapshot:

```bash
FirstNexus browser snapshot
FirstNexus browser snapshot --urls
```

Screenshot:

```bash
FirstNexus browser screenshot
FirstNexus browser screenshot --full-page
FirstNexus browser screenshot --ref e12
FirstNexus browser screenshot --labels
```

Notes:

- `--full-page` is for page captures only; it cannot be combined with `--ref`
  or `--element`.
- `existing-session` / `user` profiles support page screenshots and `--ref`
  screenshots from snapshot output, but not CSS `--element` screenshots.
- `--labels` overlays current snapshot refs on the screenshot.
- `snapshot --urls` appends discovered link destinations to AI snapshots so
  agents can choose direct navigation targets instead of guessing from link
  text alone.

Navigate/click/type (ref-based UI automation):

```bash
FirstNexus browser navigate https://example.com
FirstNexus browser click <ref>
FirstNexus browser click-coords 120 340
FirstNexus browser type <ref> "hello"
FirstNexus browser press Enter
FirstNexus browser hover <ref>
FirstNexus browser scrollintoview <ref>
FirstNexus browser drag <startRef> <endRef>
FirstNexus browser select <ref> OptionA OptionB
FirstNexus browser fill --fields '[{"ref":"1","value":"Ada"}]'
FirstNexus browser wait --text "Done"
FirstNexus browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Action responses return the current raw `targetId` after action-triggered page
replacement when FirstNexus can prove the replacement tab. Scripts should still
store and pass `suggestedTargetId`/labels for long-lived workflows.

File + dialog helpers:

```bash
FirstNexus browser upload /tmp/FirstNexus/uploads/file.pdf --ref <ref>
FirstNexus browser waitfordownload
FirstNexus browser download <ref> report.pdf
FirstNexus browser dialog --accept
```

Managed Chrome profiles save ordinary click-triggered downloads into the FirstNexus
downloads directory (`/tmp/FirstNexus/downloads` by default, or the configured temp
root). Use `waitfordownload` or `download` when the agent needs to wait for a
specific file and return its path; those explicit waiters own the next download.

## State and storage

Viewport + emulation:

```bash
FirstNexus browser resize 1280 720
FirstNexus browser set viewport 1280 720
FirstNexus browser set offline on
FirstNexus browser set media dark
FirstNexus browser set timezone Europe/London
FirstNexus browser set locale en-GB
FirstNexus browser set geo 51.5074 -0.1278 --accuracy 25
FirstNexus browser set device "iPhone 14"
FirstNexus browser set headers '{"x-test":"1"}'
FirstNexus browser set credentials myuser mypass
```

Cookies + storage:

```bash
FirstNexus browser cookies
FirstNexus browser cookies set session abc123 --url https://example.com
FirstNexus browser cookies clear
FirstNexus browser storage local get
FirstNexus browser storage local set token abc123
FirstNexus browser storage session clear
```

## Debugging

```bash
FirstNexus browser console --level error
FirstNexus browser pdf
FirstNexus browser responsebody "**/api"
FirstNexus browser highlight <ref>
FirstNexus browser errors --clear
FirstNexus browser requests --filter api
FirstNexus browser trace start
FirstNexus browser trace stop --out trace.zip
```

## Existing Chrome via MCP

Use the built-in `user` profile, or create your own `existing-session` profile:

```bash
FirstNexus browser --browser-profile user tabs
FirstNexus browser create-profile --name chrome-live --driver existing-session
FirstNexus browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
FirstNexus browser --browser-profile chrome-live tabs
```

This path is host-only. For Docker, headless servers, Browserless, or other remote setups, use a CDP profile instead.

Current existing-session limits:

- snapshot-driven actions use refs, not CSS selectors
- `browser.actionTimeoutMs` defaults supported `act` requests to 60000 ms when
  callers omit `timeoutMs`; per-call `timeoutMs` still wins.
- `click` is left-click only
- `type` does not support `slowly=true`
- `press` does not support `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, and `evaluate` reject
  per-call timeout overrides
- `select` supports one value only
- `wait --load networkidle` is not supported
- file uploads require `--ref` / `--input-ref`, do not support CSS
  `--element`, and currently support one file at a time
- dialog hooks do not support `--timeout`
- screenshots support page captures and `--ref`, but not CSS `--element`
- `responsebody`, download interception, PDF export, and batch actions still
  require a managed browser or raw CDP profile

## Remote browser control (node host proxy)

If the Gateway runs on a different machine than the browser, run a **node host** on the machine that has Chrome/Brave/Edge/Chromium. The Gateway will proxy browser actions to that node (no separate browser control server required).

Use `gateway.nodes.browser.mode` to control auto-routing and `gateway.nodes.browser.node` to pin a specific node if multiple are connected.

Security + remote setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)

## Related

- [CLI reference](/cli)
- [Browser](/tools/browser)
