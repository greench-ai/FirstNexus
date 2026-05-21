---
summary: "CLI reference for `FirstNexus plugins` (list, install, marketplace, uninstall, enable/disable, doctor)"
read_when:
  - You want to install or manage Gateway plugins or compatible bundles
  - You want to debug plugin load failures
title: "Plugins"
sidebarTitle: "Plugins"
---

Manage Gateway plugins, hook packs, and compatible bundles.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/tools/plugin">
    End-user guide for installing, enabling, and troubleshooting plugins.
  </Card>
  <Card title="Manage plugins" href="/plugins/manage-plugins">
    Quick examples for install, list, update, uninstall, and publishing.
  </Card>
  <Card title="Plugin bundles" href="/plugins/bundles">
    Bundle compatibility model.
  </Card>
  <Card title="Plugin manifest" href="/plugins/manifest">
    Manifest fields and config schema.
  </Card>
  <Card title="Security" href="/gateway/security">
    Security hardening for plugin installs.
  </Card>
</CardGroup>

## Commands

```bash
FirstNexus plugins list
FirstNexus plugins list --enabled
FirstNexus plugins list --verbose
FirstNexus plugins list --json
FirstNexus plugins search <query>
FirstNexus plugins search <query> --limit 20
FirstNexus plugins search <query> --json
FirstNexus plugins install <path-or-spec>
FirstNexus plugins inspect <id>
FirstNexus plugins inspect <id> --runtime
FirstNexus plugins inspect <id> --json
FirstNexus plugins inspect --all
FirstNexus plugins info <id>
FirstNexus plugins enable <id>
FirstNexus plugins disable <id>
FirstNexus plugins registry
FirstNexus plugins registry --refresh
FirstNexus plugins uninstall <id>
FirstNexus plugins doctor
FirstNexus plugins update <id-or-npm-spec>
FirstNexus plugins update --all
FirstNexus plugins marketplace list <marketplace>
FirstNexus plugins marketplace list <marketplace> --json
```

For slow install, inspect, uninstall, or registry-refresh investigation, run the
command with `NEXISCLAW_PLUGIN_LIFECYCLE_TRACE=1`. The trace writes phase timings
to stderr and keeps JSON output parseable. See [Debugging](/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix mode (`NEXISCLAW_NIX_MODE=1`), plugin lifecycle mutators are disabled. Use the Nix source for this install instead of `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, or `plugins disable`; for nix-FirstNexus, use the agent-first [Quick Start](https://github.com/FirstNexus/nix-FirstNexus#quick-start).
</Note>

<Note>
Bundled plugins ship with FirstNexus. Some are enabled by default (for example bundled model providers, bundled speech providers, and the bundled browser plugin); others require `plugins enable`.

Native FirstNexus plugins must ship `FirstNexus.plugin.json` with an inline JSON Schema (`configSchema`, even if empty). Compatible bundles use their own bundle manifests instead.

`plugins list` shows `Format: FirstNexus` or `Format: bundle`. Verbose list/info output also shows the bundle subtype (`codex`, `claude`, or `cursor`) plus detected bundle capabilities.
</Note>

### Install

```bash
FirstNexus plugins search "calendar"                   # search ClawHub plugins
FirstNexus plugins install <package>                      # npm by default
FirstNexus plugins install clawhub:<package>              # ClawHub only
FirstNexus plugins install npm:<package>                  # npm only
FirstNexus plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
FirstNexus plugins install git:github.com/<owner>/<repo>  # git repo
FirstNexus plugins install git:github.com/<owner>/<repo>@<ref>
FirstNexus plugins install <package> --force              # overwrite existing install
FirstNexus plugins install <package> --pin                # pin version
FirstNexus plugins install <package> --dangerously-force-unsafe-install
FirstNexus plugins install <path>                         # local path
FirstNexus plugins install <plugin>@<marketplace>         # marketplace
FirstNexus plugins install <plugin> --marketplace <name>  # marketplace (explicit)
FirstNexus plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Maintainers testing setup-time installs can override automatic plugin install
sources with guarded environment variables. See
[Plugin install overrides](/plugins/install-overrides).

<Warning>
Bare package names install from npm by default during the launch cutover. Use `clawhub:<package>` for ClawHub. Treat plugin installs like running code. Prefer pinned versions.
</Warning>

`plugins search` queries ClawHub for installable plugin packages and prints
install-ready package names. It searches code-plugin and bundle-plugin packages,
not skills. Use `FirstNexus skills search` for ClawHub skills.

<Note>
ClawHub is the primary distribution and discovery surface for most plugins. Npm
remains a supported fallback and direct-install path. FirstNexus-owned
`@FirstNexus/*` plugin packages are published on npm again; see the current list
on [npmjs.com/org/FirstNexus](https://www.npmjs.com/org/FirstNexus) or the
[plugin inventory](/plugins/plugin-inventory). Stable installs use `latest`.
Beta-channel installs and updates prefer the npm `beta` dist-tag when that tag
is available, then fall back to `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    If your `plugins` section is backed by a single-file `$include`, `plugins install/update/enable/disable/uninstall` write through to that included file and leave `FirstNexus.json` untouched. Root includes, include arrays, and includes with sibling overrides fail closed instead of flattening. See [Config includes](/gateway/configuration) for the supported shapes.

    If config is invalid during install, `plugins install` normally fails closed and tells you to run `FirstNexus doctor --fix` first. During Gateway startup and hot reload, invalid plugin config fails closed like any other invalid config; `FirstNexus doctor --fix` can quarantine the invalid plugin entry. The only documented install-time exception is a narrow bundled-plugin recovery path for plugins that explicitly opt into `FirstNexus.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` reuses the existing install target and overwrites an already-installed plugin or hook pack in place. Use it when you are intentionally reinstalling the same id from a new local path, archive, ClawHub package, or npm artifact. For routine upgrades of an already tracked npm plugin, prefer `FirstNexus plugins update <id-or-npm-spec>`.

    If you run `plugins install` for a plugin id that is already installed, FirstNexus stops and points you at `plugins update <id-or-npm-spec>` for a normal upgrade, or at `plugins install <package> --force` when you genuinely want to overwrite the current install from a different source.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` applies to npm installs only. It is not supported with `git:` installs; use an explicit git ref such as `git:github.com/acme/plugin@v1.2.3` when you want a pinned source. It is not supported with `--marketplace`, because marketplace installs persist marketplace source metadata instead of an npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is a break-glass option for false positives in the built-in dangerous-code scanner. It allows the install to continue even when the built-in scanner reports `critical` findings, but it does **not** bypass plugin `before_install` hook policy blocks and does **not** bypass scan failures.

    This CLI flag applies to plugin install/update flows. Gateway-backed skill dependency installs use the matching `dangerouslyForceUnsafeInstall` request override, while `FirstNexus skills install` remains a separate ClawHub skill download/install flow.

    If a plugin you published on ClawHub is blocked by a registry scan, use the publisher steps in [ClawHub](/clawhub/security).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` is also the install surface for hook packs that expose `FirstNexus.hooks` in `package.json`. Use `FirstNexus hooks` for filtered hook visibility and per-hook enablement, not package installation.

    Npm specs are **registry-only** (package name + optional **exact version** or **dist-tag**). Git/URL/file specs and semver ranges are rejected. Dependency installs run project-local with `--ignore-scripts` for safety, even when your shell has global npm install settings. Managed plugin npm roots inherit FirstNexus's package-level npm `overrides`, so host security pins apply to hoisted plugin dependencies too.

    Use `npm:<package>` when you want to make npm resolution explicit. Bare package specs also install directly from npm during the launch cutover.

    Bare specs and `@latest` stay on the stable track. FirstNexus date-stamped correction versions such as `2026.5.3-1` are stable releases for this check. If npm resolves either of those to a prerelease, FirstNexus stops and asks you to opt in explicitly with a prerelease tag such as `@beta`/`@rc` or an exact prerelease version such as `@1.2.3-beta.4`.

    If a bare install spec matches an official plugin id (for example `diffs`), FirstNexus installs the catalog entry directly. To install an npm package with the same name, use an explicit scoped spec (for example `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Use `git:<repo>` to install directly from a git repository. Supported forms include `git:github.com/owner/repo`, `git:owner/repo`, full `https://`, `ssh://`, `git://`, `file://`, and `git@host:owner/repo.git` clone URLs. Add `@<ref>` or `#<ref>` to check out a branch, tag, or commit before install.

    Git installs clone into a temporary directory, check out the requested ref when present, then use the normal plugin directory installer. That means manifest validation, dangerous-code scanning, package-manager install work, and install records behave like npm installs. Recorded git installs include the source URL/ref plus the resolved commit so `FirstNexus plugins update` can re-resolve the source later.

    After installing from git, use `FirstNexus plugins inspect <id> --runtime --json` to verify runtime registrations such as gateway methods and CLI commands. If the plugin registered a CLI root with `api.registerCli`, execute that command directly through the FirstNexus root CLI, for example `FirstNexus demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Supported archives: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native FirstNexus plugin archives must contain a valid `FirstNexus.plugin.json` at the extracted plugin root; archives that only contain `package.json` are rejected before FirstNexus writes install records.

    Use `npm-pack:<path.tgz>` when the file is an npm-pack tarball and you want
    to test the same managed npm-root install path used by registry installs,
    including `package-lock.json` verification, hoisted dependency scanning, and
    npm install records. Plain archive paths still install as local archives
    under the plugin extensions root.

    Claude marketplace installs are also supported.

  </Accordion>
</AccordionGroup>

ClawHub installs use an explicit `clawhub:<package>` locator:

```bash
FirstNexus plugins install clawhub:FirstNexus-codex-app-server
FirstNexus plugins install clawhub:FirstNexus-codex-app-server@1.2.3
```

Bare npm-safe plugin specs install from npm by default during the launch cutover:

```bash
FirstNexus plugins install FirstNexus-codex-app-server
```

Use `npm:` to make npm-only resolution explicit:

```bash
FirstNexus plugins install npm:FirstNexus-codex-app-server
FirstNexus plugins install npm:@scope/plugin-name@1.0.1
```

FirstNexus checks the advertised plugin API / minimum gateway compatibility before install. When the selected ClawHub version publishes a ClawPack artifact, FirstNexus downloads the versioned npm-pack `.tgz`, verifies the ClawHub digest header and the artifact digest, then installs it through the normal archive path. Older ClawHub versions without ClawPack metadata still install through the legacy package archive verification path. Recorded installs keep their ClawHub source metadata, artifact kind, npm integrity, npm shasum, tarball name, and ClawPack digest facts for later updates.
Unversioned ClawHub installs keep an unversioned recorded spec so `FirstNexus plugins update` can follow newer ClawHub releases; explicit version or tag selectors such as `clawhub:pkg@1.2.3` and `clawhub:pkg@beta` remain pinned to that selector.

#### Marketplace shorthand

Use `plugin@marketplace` shorthand when the marketplace name exists in Claude's local registry cache at `~/.claude/plugins/known_marketplaces.json`:

```bash
FirstNexus plugins marketplace list <marketplace-name>
FirstNexus plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` when you want to pass the marketplace source explicitly:

```bash
FirstNexus plugins install <plugin-name> --marketplace <marketplace-name>
FirstNexus plugins install <plugin-name> --marketplace <owner/repo>
FirstNexus plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
FirstNexus plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - a Claude known-marketplace name from `~/.claude/plugins/known_marketplaces.json`
    - a local marketplace root or `marketplace.json` path
    - a GitHub repo shorthand such as `owner/repo`
    - a GitHub repo URL such as `https://github.com/owner/repo`
    - a git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    For remote marketplaces loaded from GitHub or git, plugin entries must stay inside the cloned marketplace repo. FirstNexus accepts relative path sources from that repo and rejects HTTP(S), absolute-path, git, GitHub, and other non-path plugin sources from remote manifests.
  </Tab>
</Tabs>

For local paths and archives, FirstNexus auto-detects:

- native FirstNexus plugins (`FirstNexus.plugin.json`)
- Codex-compatible bundles (`.codex-plugin/plugin.json`)
- Claude-compatible bundles (`.claude-plugin/plugin.json` or the default Claude component layout)
- Cursor-compatible bundles (`.cursor-plugin/plugin.json`)

<Note>
Compatible bundles install into the normal plugin root and participate in the same list/info/enable/disable flow. Today, bundle skills, Claude command-skills, Claude `settings.json` defaults, Claude `.lsp.json` / manifest-declared `lspServers` defaults, Cursor command-skills, and compatible Codex hook directories are supported; other detected bundle capabilities are shown in diagnostics/info but are not yet wired into runtime execution.
</Note>

### List

```bash
FirstNexus plugins list
FirstNexus plugins list --enabled
FirstNexus plugins list --verbose
FirstNexus plugins list --json
FirstNexus plugins search <query>
FirstNexus plugins search <query> --limit 20
FirstNexus plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Show only enabled plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Switch from the table view to per-plugin detail lines with source/origin/version/activation metadata.
</ParamField>
<ParamField path="--json" type="boolean">
  Machine-readable inventory plus registry diagnostics and package dependency install state.
</ParamField>

<Note>
`plugins list` reads the persisted local plugin registry first, with a manifest-only derived fallback when the registry is missing or invalid. It is useful for checking whether a plugin is installed, enabled, and visible to cold startup planning, but it is not a live runtime probe of an already-running Gateway process. After changing plugin code, enablement, hook policy, or `plugins.load.paths`, restart the Gateway that serves the channel before expecting new `register(api)` code or hooks to run. For remote/container deployments, verify you are restarting the actual `FirstNexus gateway run` child, not only a wrapper process.

`plugins list --json` includes each plugin's `dependencyStatus` from `package.json`
`dependencies` and `optionalDependencies`. FirstNexus checks whether those package
names are present along the plugin's normal Node `node_modules` lookup path; it
does not import plugin runtime code, run a package manager, or repair missing
dependencies.
</Note>

`plugins search` is a remote ClawHub catalog lookup. It does not inspect local
state, mutate config, install packages, or load plugin runtime code. Search
results include the ClawHub package name, family, channel, version, summary, and
an install hint such as `FirstNexus plugins install clawhub:<package>`.

For bundled plugin work inside a packaged Docker image, bind-mount the plugin
source directory over the matching packaged source path, such as
`/app/extensions/synology-chat`. FirstNexus will discover that mounted source
overlay before `/app/dist/extensions/synology-chat`; a plain copied source
directory remains inert so normal packaged installs still use compiled dist.

For runtime hook debugging:

- `FirstNexus plugins inspect <id> --runtime --json` shows registered hooks and diagnostics from a module-loaded inspection pass. Runtime inspection never installs dependencies; use `FirstNexus doctor --fix` to clean legacy dependency state or recover missing downloadable plugins that are referenced by config.
- `FirstNexus gateway status --deep --require-rpc` confirms the reachable Gateway, service/process hints, config path, and RPC health.
- Non-bundled conversation hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) require `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` to avoid copying a local directory (adds to `plugins.load.paths`):

```bash
FirstNexus plugins install -l ./my-plugin
```

<Note>
`--force` is not supported with `--link` because linked installs reuse the source path instead of copying over a managed install target.

Use `--pin` on npm installs to save the resolved exact spec (`name@version`) in the managed plugin index while keeping the default behavior unpinned.
</Note>

### Plugin index

Plugin install metadata is machine-managed state, not user config. Installs and updates write it to `plugins/installs.json` under the active FirstNexus state directory. Its top-level `installRecords` map is the durable source of install metadata, including records for broken or missing plugin manifests. The `plugins` array is the manifest-derived cold registry cache. The file includes a do-not-edit warning and is used by `FirstNexus plugins update`, uninstall, diagnostics, and the cold plugin registry.

When FirstNexus sees shipped legacy `plugins.installs` records in config, runtime reads treat them as compatibility input without rewriting `FirstNexus.json`. Explicit plugin writes and `FirstNexus doctor --fix` move those records into the plugin index and remove the config key when config writes are allowed; if either write fails, the config records are kept so the install metadata is not lost.

### Uninstall

```bash
FirstNexus plugins uninstall <id>
FirstNexus plugins uninstall <id> --dry-run
FirstNexus plugins uninstall <id> --keep-files
```

`uninstall` removes plugin records from `plugins.entries`, the persisted plugin index, plugin allow/deny list entries, and linked `plugins.load.paths` entries when applicable. Unless `--keep-files` is set, uninstall also removes the tracked managed install directory when it is inside FirstNexus's plugin extensions root. For active memory plugins, the memory slot resets to `memory-core`.

<Note>
`--keep-config` is supported as a deprecated alias for `--keep-files`.
</Note>

### Update

```bash
FirstNexus plugins update <id-or-npm-spec>
FirstNexus plugins update --all
FirstNexus plugins update <id-or-npm-spec> --dry-run
FirstNexus plugins update @FirstNexus/voice-call
FirstNexus plugins update FirstNexus-codex-app-server --dangerously-force-unsafe-install
```

Updates apply to tracked plugin installs in the managed plugin index and tracked hook-pack installs in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    When you pass a plugin id, FirstNexus reuses the recorded install spec for that plugin. That means previously stored dist-tags such as `@beta` and exact pinned versions continue to be used on later `update <id>` runs.

    For npm installs, you can also pass an explicit npm package spec with a dist-tag or exact version. FirstNexus resolves that package name back to the tracked plugin record, updates that installed plugin, and records the new npm spec for future id-based updates.

    Passing the npm package name without a version or tag also resolves back to the tracked plugin record. Use this when a plugin was pinned to an exact version and you want to move it back to the registry's default release line.

  </Accordion>
  <Accordion title="Beta channel updates">
    `FirstNexus plugins update` reuses the tracked plugin spec unless you pass a new spec. `FirstNexus update` additionally knows the active FirstNexus update channel: on the beta channel, default-line npm and ClawHub plugin records try `@beta` first, then fall back to the recorded default/latest spec if no plugin beta release exists. That fallback is reported as a warning and does not fail the core update. Exact versions and explicit tags stay pinned to that selector.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Before a live npm update, FirstNexus checks the installed package version against the npm registry metadata. If the installed version and recorded artifact identity already match the resolved target, the update is skipped without downloading, reinstalling, or rewriting `FirstNexus.json`.

    When a stored integrity hash exists and the fetched artifact hash changes, FirstNexus treats that as npm artifact drift. The interactive `FirstNexus plugins update` command prints the expected and actual hashes and asks for confirmation before proceeding. Non-interactive update helpers fail closed unless the caller supplies an explicit continuation policy.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` is also available on `plugins update` as a break-glass override for built-in dangerous-code scan false positives during plugin updates. It still does not bypass plugin `before_install` policy blocks or scan-failure blocking, and it only applies to plugin updates, not hook-pack updates.
  </Accordion>
</AccordionGroup>

### Inspect

```bash
FirstNexus plugins inspect <id>
FirstNexus plugins inspect <id> --runtime
FirstNexus plugins inspect <id> --json
```

Inspect shows identity, load status, source, manifest capabilities, policy flags, diagnostics, install metadata, bundle capabilities, and any detected MCP or LSP server support without importing plugin runtime by default. Add `--runtime` to load the plugin module and include registered hooks, tools, commands, services, gateway methods, and HTTP routes. Runtime inspection reports missing plugin dependencies directly; installs and repairs stay in `FirstNexus plugins install`, `FirstNexus plugins update`, and `FirstNexus doctor --fix`.

Plugin-owned CLI commands are usually installed as root `FirstNexus` command groups, but plugins may also register nested commands under a core parent such as `FirstNexus nodes`. After `inspect --runtime` shows a command under `cliCommands`, run it at the listed path; for example a plugin that registers `demo-git` can be verified with `FirstNexus demo-git ping`.

Each plugin is classified by what it actually registers at runtime:

- **plain-capability** — one capability type (e.g. a provider-only plugin)
- **hybrid-capability** — multiple capability types (e.g. text + speech + images)
- **hook-only** — only hooks, no capabilities or surfaces
- **non-capability** — tools/commands/services but no capabilities

See [Plugin shapes](/plugins/architecture#plugin-shapes) for more on the capability model.

<Note>
The `--json` flag outputs a machine-readable report suitable for scripting and auditing. `inspect --all` renders a fleet-wide table with shape, capability kinds, compatibility notices, bundle capabilities, and hook summary columns. `info` is an alias for `inspect`.
</Note>

### Doctor

```bash
FirstNexus plugins doctor
```

`doctor` reports plugin load errors, manifest/discovery diagnostics, and compatibility notices. When everything is clean it prints `No plugin issues detected.`

If a configured plugin is present on disk but blocked by the loader's path-safety checks, config validation keeps the plugin entry and reports it as `present but blocked`. Fix the preceding blocked-plugin diagnostic, such as path ownership or world-writable permissions, instead of removing the `plugins.entries.<id>` or `plugins.allow` config.

For module-shape failures such as missing `register`/`activate` exports, rerun with `NEXISCLAW_PLUGIN_LOAD_DEBUG=1` to include a compact export-shape summary in the diagnostic output.

### Registry

```bash
FirstNexus plugins registry
FirstNexus plugins registry --refresh
FirstNexus plugins registry --json
```

The local plugin registry is FirstNexus's persisted cold read model for installed plugin identity, enablement, source metadata, and contribution ownership. Normal startup, provider owner lookup, channel setup classification, and plugin inventory can read it without importing plugin runtime modules.

Use `plugins registry` to inspect whether the persisted registry is present, current, or stale. Use `--refresh` to rebuild it from the persisted plugin index, config policy, and manifest/package metadata. This is a repair path, not a runtime activation path.

`FirstNexus doctor --fix` also repairs registry-adjacent managed npm drift: if an orphaned or recovered `@FirstNexus/*` package under the managed plugin npm root shadows a bundled plugin, doctor removes that stale package and rebuilds the registry so startup validates against the bundled manifest. Doctor also relinks the host `FirstNexus` package into managed npm plugins that declare `peerDependencies.FirstNexus`, so package-local runtime imports such as `FirstNexus/plugin-sdk/*` resolve after updates or npm repairs.

<Warning>
`NEXISCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is a deprecated break-glass compatibility switch for registry read failures. Prefer `plugins registry --refresh` or `FirstNexus doctor --fix`; the env fallback is only for emergency startup recovery while the migration rolls out.
</Warning>

### Marketplace

```bash
FirstNexus plugins marketplace list <source>
FirstNexus plugins marketplace list <source> --json
```

Marketplace list accepts a local marketplace path, a `marketplace.json` path, a GitHub shorthand like `owner/repo`, a GitHub repo URL, or a git URL. `--json` prints the resolved source label plus the parsed marketplace manifest and plugin entries.

## Related

- [Building plugins](/plugins/building-plugins)
- [CLI reference](/cli)
- [ClawHub](/clawhub)
