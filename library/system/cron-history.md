# Cron History
> Append-only log of cron runs

## 2026-03-23

### 00:04 CET — library-update
- **Status:** running (this run)
- **Previous run:** error @ 23:04
- **Consecutive errors before this:** 2

## 2026-03-22

### 23:04 CET — library-update
- **Status:** error
- **Consecutive errors:** 2

### Active Cron Jobs Summary (as of 2026-03-23 00:04 CET)
| Job | Schedule | Last Status | Consecutive Errors |
|-----|----------|-------------|-------------------|
| library-update | `0 * * * *` | error | 2 |
| memory-save | `*/30 * * * *` | error (channel missing) | 5 |
| memory-autosave | every 1h | ok | 0 |
| evoclaw-heartbeat | `*/15 * * * *` | error (channel missing) | 6 |

### ⚠️ Issues Detected
- **memory-save** (5 errors) and **evoclaw-heartbeat** (6 errors) failing with: "Channel is required (no configured channels detected)"
  - Fix: Set `delivery.channel` explicitly on these jobs, or use `delivery.mode: "none"`
- **library-update** had 2 consecutive errors — this run is the recovery attempt
