---
summary: "CLI reference for `FirstNexus tasks` (background task ledger and Task Flow state)"
read_when:
  - You want to inspect, audit, or cancel background task records
  - You are documenting Task Flow commands under `FirstNexus tasks flow`
title: "`FirstNexus tasks`"
---

Inspect durable background tasks and Task Flow state. With no subcommand,
`FirstNexus tasks` is equivalent to `FirstNexus tasks list`.

See [Background Tasks](/automation/tasks) for the lifecycle and delivery model.

## Usage

```bash
FirstNexus tasks
FirstNexus tasks list
FirstNexus tasks list --runtime acp
FirstNexus tasks list --status running
FirstNexus tasks show <lookup>
FirstNexus tasks notify <lookup> state_changes
FirstNexus tasks cancel <lookup>
FirstNexus tasks audit
FirstNexus tasks maintenance
FirstNexus tasks maintenance --apply
FirstNexus tasks flow list
FirstNexus tasks flow show <lookup>
FirstNexus tasks flow cancel <lookup>
```

## Root Options

- `--json`: output JSON.
- `--runtime <name>`: filter by kind: `subagent`, `acp`, `cron`, or `cli`.
- `--status <name>`: filter by status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, or `lost`.

## Subcommands

### `list`

```bash
FirstNexus tasks list [--runtime <name>] [--status <name>] [--json]
```

Lists tracked background tasks newest first.

### `show`

```bash
FirstNexus tasks show <lookup> [--json]
```

Shows one task by task ID, run ID, or session key.

### `notify`

```bash
FirstNexus tasks notify <lookup> <done_only|state_changes|silent>
```

Changes the notification policy for a running task.

### `cancel`

```bash
FirstNexus tasks cancel <lookup>
```

Cancels a running background task.

### `audit`

```bash
FirstNexus tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Surfaces stale, lost, delivery-failed, or otherwise inconsistent task and Task Flow records. Lost tasks retained until `cleanupAfter` are warnings; expired or unstamped lost tasks are errors.

### `maintenance`

```bash
FirstNexus tasks maintenance [--apply] [--json]
```

Previews or applies task and Task Flow reconciliation, cleanup stamping, pruning,
and stale cron run session registry cleanup.
For cron tasks, reconciliation uses persisted run logs/job state before marking an
old active task `lost`, so completed cron runs do not become false audit errors
just because the in-memory Gateway runtime state is gone. Offline CLI audit is
not authoritative for the Gateway's process-local cron active-job set. CLI tasks
with a run id/source id are marked `lost` when their live Gateway run context is
gone, even if an old child-session row remains.
When applied, maintenance also prunes `cron:<jobId>:run:<uuid>` session registry
rows older than 7 days while preserving currently running cron jobs and leaving
non-cron session rows untouched.

### `flow`

```bash
FirstNexus tasks flow list [--status <name>] [--json]
FirstNexus tasks flow show <lookup> [--json]
FirstNexus tasks flow cancel <lookup>
```

Inspects or cancels durable Task Flow state under the task ledger.

## Related

- [CLI reference](/cli)
- [Background tasks](/automation/tasks)
