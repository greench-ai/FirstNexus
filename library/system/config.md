# System Configuration

**Last updated:** 2026-05-12T16:04:00Z

## Gateway

- **Service:** systemd (enabled)
- **PID:** 15298
- **State:** active, sub running
- **Bind:** loopback (127.0.0.1)
- **Port:** 19789
- **Dashboard:** http://127.0.0.1:19789/

## Runtime Environment

- **OS:** Linux 6.17.0-23-generic (x64)
- **Node:** v22.22.2
- **Shell:** bash
- **User:** sativabox

## Paths

- **Config:** `~/.nexusclaw/nexusclaw.json`
- **Workspace:** `~/.nexusclaw/workspace/`
- **Library:** `~/nexusclaw/library/`
- **Logs:** `/tmp/nexusclaw/nexusclaw-2026-05-12.log`

## Cron Jobs

| Job | Status | Errors |
|-----|--------|--------|
| library-update | error (auth) | 4 consecutive |
| evoclaw-heartbeat | error (channel req.) | 8 consecutive |

## Health Notes

- Gateway is running normally
- library-update has authentication errors (delivery issue)
- evoclaw-heartbeat missing channel configuration
