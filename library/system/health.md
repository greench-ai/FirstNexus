# Health Check

**Last updated:** 2026-05-12T16:04:00Z

## Gateway Health

| Check | Status |
|-------|--------|
| Service | ✅ Running (systemd) |
| PID | 15298 |
| RPC probe | ✅ ok |
| Gateway bind | ✅ 127.0.0.1:19789 |

## Cron Jobs

| Job | Enabled | Consecutive Errors | Last Error |
|-----|---------|-------------------|------------|
| library-update | ✅ | 4 | HTTP 401: User not found |
| evoclaw-heartbeat | ✅ | 8 | Channel is required |

## Warnings

1. **library-update delivery failing** — Cron job is running but announce delivery fails with auth error
2. **evoclaw-heartbeat channel missing** — No delivery channel configured

## Recommendations

- For `library-update`: Check if `delivery.mode: "none"` would work, or fix authentication
- For `evoclaw-heartbeat`: Set `delivery.channel` explicitly in cron job config
