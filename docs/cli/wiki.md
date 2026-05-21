---
summary: "CLI reference for `FirstNexus wiki` (memory-wiki vault status, search, compile, lint, apply, bridge, and Obsidian helpers)"
read_when:
  - You want to use the memory-wiki CLI
  - You are documenting or changing `FirstNexus wiki`
title: "Wiki"
---

# `FirstNexus wiki`

Inspect and maintain the `memory-wiki` vault.

Provided by the bundled `memory-wiki` plugin.

Related:

- [Memory Wiki plugin](/plugins/memory-wiki)
- [Memory Overview](/concepts/memory)
- [CLI: memory](/cli/memory)

## What it is for

Use `FirstNexus wiki` when you want a compiled knowledge vault with:

- wiki-native search and page reads
- provenance-rich syntheses
- contradiction and freshness reports
- bridge imports from the active memory plugin
- optional Obsidian CLI helpers

## Common commands

```bash
FirstNexus wiki status
FirstNexus wiki doctor
FirstNexus wiki init
FirstNexus wiki ingest ./notes/alpha.md
FirstNexus wiki compile
FirstNexus wiki lint
FirstNexus wiki search "alpha"
FirstNexus wiki search "who should I ask about Teams?" --mode route-question
FirstNexus wiki get entity.alpha --from 1 --lines 80

FirstNexus wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

FirstNexus wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

FirstNexus wiki bridge import
FirstNexus wiki unsafe-local import

FirstNexus wiki obsidian status
FirstNexus wiki obsidian search "alpha"
FirstNexus wiki obsidian open syntheses/alpha-summary.md
FirstNexus wiki obsidian command workspace:quick-switcher
FirstNexus wiki obsidian daily
```

## Commands

### `wiki status`

Inspect current vault mode, health, and Obsidian CLI availability.

Use this first when you are unsure whether the vault is initialized, bridge mode
is healthy, or Obsidian integration is available.

When bridge mode is active and configured to read memory artifacts, this command
queries the running Gateway so it sees the same active memory plugin context as
agent/runtime memory.

### `wiki doctor`

Run wiki health checks and surface configuration or vault problems.

When bridge mode is active and configured to read memory artifacts, this command
queries the running Gateway before building the report. Disabled bridge imports
and bridge configs that do not read memory artifacts remain local/offline.

Typical issues include:

- bridge mode enabled without public memory artifacts
- invalid or missing vault layout
- missing external Obsidian CLI when Obsidian mode is expected

### `wiki init`

Create the wiki vault layout and starter pages.

This initializes the root structure, including top-level indexes and cache
directories.

### `wiki ingest <path-or-url>`

Import content into the wiki source layer.

Notes:

- URL ingest is controlled by `ingest.allowUrlIngest`
- imported source pages keep provenance in frontmatter
- auto-compile can run after ingest when enabled

### `wiki compile`

Rebuild indexes, related blocks, dashboards, and compiled digests.

This writes stable machine-facing artifacts under:

- `.FirstNexus-wiki/cache/agent-digest.json`
- `.FirstNexus-wiki/cache/claims.jsonl`

If `render.createDashboards` is enabled, compile also refreshes report pages.

### `wiki lint`

Lint the vault and report:

- structural issues
- provenance gaps
- contradictions
- open questions
- low-confidence pages/claims
- stale pages/claims

Run this after meaningful wiki updates.

### `wiki search <query>`

Search wiki content.

Behavior depends on config:

- `search.backend`: `shared` or `local`
- `search.corpus`: `wiki`, `memory`, or `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence`, or
  `raw-claim`

Use `wiki search` when you want wiki-specific ranking or provenance details.
For one broad shared recall pass, prefer `FirstNexus memory search` when the
active memory plugin exposes shared search.

Search modes help the agent choose the right surface:

- `find-person`: aliases, handles, socials, canonical IDs, and person pages
- `route-question`: ask-for/best-used-for hints and relationship context
- `source-evidence`: source pages and structured evidence fields
- `raw-claim`: structured claim text with claim/evidence metadata

Examples:

```bash
FirstNexus wiki search "bgroux" --mode find-person
FirstNexus wiki search "who knows Teams rollout?" --mode route-question
FirstNexus wiki search "maintainer-whois" --mode source-evidence
FirstNexus wiki search "strong route Teams" --mode raw-claim --json
```

Text output includes `Claim:` and `Evidence:` lines when a result matches a
structured claim. JSON output additionally exposes `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds`, and
`evidenceSourceIds` for agent-side drilldown.

### `wiki get <lookup>`

Read a wiki page by id or relative path.

Examples:

```bash
FirstNexus wiki get entity.alpha
FirstNexus wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Apply narrow mutations without freeform page surgery.

Supported flows include:

- create/update a synthesis page
- update page metadata
- attach source ids
- add questions
- add contradictions
- update confidence/status
- write structured claims

This command exists so the wiki can evolve safely without manually editing
managed blocks.

### `wiki bridge import`

Import public memory artifacts from the active memory plugin into bridge-backed
source pages.

Use this in `bridge` mode when you want the latest exported memory artifacts
pulled into the wiki vault.

For active bridge artifact reads, the CLI routes the import through Gateway RPC
so the import uses the runtime memory plugin context. If bridge imports are
disabled or artifact reads are turned off, the command keeps the local/offline
zero-import behavior.

### `wiki unsafe-local import`

Import from explicitly configured local paths in `unsafe-local` mode.

This is intentionally experimental and same-machine only.

### `wiki obsidian ...`

Obsidian helper commands for vaults running in Obsidian-friendly mode.

Subcommands:

- `status`
- `search`
- `open`
- `command`
- `daily`

These require the official `obsidian` CLI on `PATH` when
`obsidian.useOfficialCli` is enabled.

## Practical usage guidance

- Use `wiki search` + `wiki get` when provenance and page identity matter.
- Use `wiki apply` instead of hand-editing managed generated sections.
- Use `wiki lint` before trusting contradictory or low-confidence content.
- Use `wiki compile` after bulk imports or source changes when you want fresh
  dashboards and compiled digests immediately.
- Use `wiki bridge import` when bridge mode depends on newly exported memory
  artifacts.

## Configuration tie-ins

`FirstNexus wiki` behavior is shaped by:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

See [Memory Wiki plugin](/plugins/memory-wiki) for the full config model.

## Related

- [CLI reference](/cli)
- [Memory wiki](/plugins/memory-wiki)
