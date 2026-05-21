---
summary: "Redirect: flow commands live under `FirstNexus tasks flow`"
read_when:
  - You encounter `FirstNexus flows` in older docs or release notes
  - You want a quick TaskFlow inspection reference
title: "Flows (redirect)"
---

# `FirstNexus tasks flow`

There is no top-level `FirstNexus flows` command. Durable TaskFlow inspection lives under `FirstNexus tasks flow`.

## Subcommands

```bash
FirstNexus tasks flow list   [--json] [--status <name>]
FirstNexus tasks flow show   <lookup> [--json]
FirstNexus tasks flow cancel <lookup>
```

| Subcommand | Description                | Arguments / options                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | List tracked TaskFlows.    | `--json` machine-readable output; `--status <name>` filter (see status values below). |
| `show`     | Show one TaskFlow.         | `<lookup>` flow id or owner key; `--json` machine-readable output.                    |
| `cancel`   | Cancel a running TaskFlow. | `<lookup>` flow id or owner key.                                                      |

`<lookup>` accepts either a flow id (returned by `list` / `show`) or the flow's owner key (the stable identifier the owning subsystem uses to track the flow).

### Status filter values

`--status` on `list` accepts one of:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Examples

```bash
FirstNexus tasks flow list
FirstNexus tasks flow list --status running
FirstNexus tasks flow list --json
FirstNexus tasks flow show flow_abc123
FirstNexus tasks flow show flow_abc123 --json
FirstNexus tasks flow cancel flow_abc123
```

For full TaskFlow concepts and authoring see [TaskFlow](/automation/taskflow). For the parent `tasks` command see [tasks CLI reference](/cli/tasks).

## Related

- [CLI reference](/cli)
- [Automation](/automation)
- [TaskFlow](/automation/taskflow)
