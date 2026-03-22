# Cron History
> Append-only log of cron runs

## 2026-03-22

### 23:04 CET — library-update
- **Status:** running (this run)
- **Previous run:** error (auth) @ ~22:04
- **Consecutive errors before this:** 1

### Active Cron Jobs Summary
| Job | Schedule | Last Status | Consecutive Errors |
|-----|----------|-------------|-------------------|
| library-update | `0 * * * *` | error (auth) | 1 |
| memory-save | `*/30 * * * *` | error (channel missing) | 3 |
| memory-autosave | every 1h | ok | 0 |
| evoclaw-heartbeat | `*/15 * * * *` | error (channel missing) | 5 |

### ⚠️ Issues Detected
- **memory-save** and **evoclaw-heartbeat** failing with: "Channel is required (no configured channels detected)"
  - Fix: Set `delivery.channel` explicitly on these jobs
- **library-update** had an auth error on last run — this run is the recovery attempt
