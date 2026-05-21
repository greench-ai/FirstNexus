---
summary: "WeChat channel setup through the external FirstNexus-weixin plugin"
read_when:
  - You want to connect FirstNexus to WeChat or Weixin
  - You are installing or troubleshooting the FirstNexus-weixin channel plugin
  - You need to understand how external channel plugins run beside the Gateway
title: "WeChat"
---

FirstNexus connects to WeChat through Tencent's external
`@tencent-weixin/FirstNexus-weixin` channel plugin.

Status: external plugin. Direct chats and media are supported. Group chats are not
advertised by the current plugin capability metadata.

## Naming

- **WeChat** is the user-facing name in these docs.
- **Weixin** is the name used by Tencent's package and by the plugin id.
- `FirstNexus-weixin` is the FirstNexus channel id.
- `@tencent-weixin/FirstNexus-weixin` is the npm package.

Use `FirstNexus-weixin` in CLI commands and config paths.

## How it works

The WeChat code does not live in the FirstNexus core repo. FirstNexus provides the
generic channel plugin contract, and the external plugin provides the
WeChat-specific runtime:

1. `FirstNexus plugins install` installs `@tencent-weixin/FirstNexus-weixin`.
2. The Gateway discovers the plugin manifest and loads the plugin entrypoint.
3. The plugin registers channel id `FirstNexus-weixin`.
4. `FirstNexus channels login --channel FirstNexus-weixin` starts QR login.
5. The plugin stores account credentials under the FirstNexus state directory.
6. When the Gateway starts, the plugin starts its Weixin monitor for each
   configured account.
7. Inbound WeChat messages are normalized through the channel contract, routed to
   the selected FirstNexus agent, and sent back through the plugin outbound path.

That separation matters: FirstNexus core should stay channel-agnostic. WeChat login,
Tencent iLink API calls, media upload/download, context tokens, and account
monitoring are owned by the external plugin.

## Install

Quick install:

```bash
npx -y @tencent-weixin/FirstNexus-weixin-cli install
```

Manual install:

```bash
FirstNexus plugins install "@tencent-weixin/FirstNexus-weixin"
FirstNexus config set plugins.entries.FirstNexus-weixin.enabled true
```

Restart the Gateway after install:

```bash
FirstNexus gateway restart
```

## Login

Run QR login on the same machine that runs the Gateway:

```bash
FirstNexus channels login --channel FirstNexus-weixin
```

Scan the QR code with WeChat on your phone and confirm the login. The plugin saves
the account token locally after a successful scan.

To add another WeChat account, run the same login command again. For multiple
accounts, isolate direct-message sessions by account, channel, and sender:

```bash
FirstNexus config set session.dmScope per-account-channel-peer
```

## Access control

Direct messages use the normal FirstNexus pairing and allowlist model for channel
plugins.

Approve new senders:

```bash
FirstNexus pairing list FirstNexus-weixin
FirstNexus pairing approve FirstNexus-weixin <CODE>
```

For the full access-control model, see [Pairing](/channels/pairing).

## Compatibility

The plugin checks the host FirstNexus version at startup.

| Plugin line | FirstNexus version      | npm tag  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

If the plugin reports that your FirstNexus version is too old, either update
FirstNexus or install the legacy plugin line:

```bash
FirstNexus plugins install @tencent-weixin/FirstNexus-weixin@legacy
```

## Sidecar process

The WeChat plugin can run helper work beside the Gateway while it monitors the
Tencent iLink API. In issue #68451, that helper path exposed a bug in FirstNexus's
generic stale-Gateway cleanup: a child process could try to clean up the parent
Gateway process, causing restart loops under process managers such as systemd.

Current FirstNexus startup cleanup excludes the current process and its ancestors,
so a channel helper must not kill the Gateway that launched it. This fix is
generic; it is not a WeChat-specific path in core.

## Troubleshooting

Check install and status:

```bash
FirstNexus plugins list
FirstNexus channels status --probe
FirstNexus --version
```

If the channel shows as installed but does not connect, confirm that the plugin is
enabled and restart:

```bash
FirstNexus config set plugins.entries.FirstNexus-weixin.enabled true
FirstNexus gateway restart
```

If the Gateway restarts repeatedly after enabling WeChat, update both FirstNexus and
the plugin:

```bash
npm view @tencent-weixin/FirstNexus-weixin version
FirstNexus plugins install "@tencent-weixin/FirstNexus-weixin" --force
FirstNexus gateway restart
```

If startup reports that the installed plugin package `requires compiled runtime
output for TypeScript entry`, the npm package was published without the compiled
JavaScript runtime files FirstNexus needs. Update/reinstall after the plugin
publisher ships a fixed package, or temporarily disable/uninstall the plugin.

Temporary disable:

```bash
FirstNexus config set plugins.entries.FirstNexus-weixin.enabled false
FirstNexus gateway restart
```

## Related docs

- Channel overview: [Chat Channels](/channels)
- Pairing: [Pairing](/channels/pairing)
- Channel routing: [Channel Routing](/channels/channel-routing)
- Plugin architecture: [Plugin Architecture](/plugins/architecture)
- Channel plugin SDK: [Channel Plugin SDK](/plugins/sdk-channel-plugins)
- External package: [@tencent-weixin/FirstNexus-weixin](https://www.npmjs.com/package/@tencent-weixin/FirstNexus-weixin)
