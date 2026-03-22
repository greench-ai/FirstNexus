# System Health
> Last checked: 2026-03-22 23:04 CET

## Gateway
- ✅ Running on port 19789 (loopback)
- ✅ Config valid, no issues or warnings
- ✅ Model: anthropic/claude-opus-4-6

## Cron Health
- ✅ memory-autosave: healthy (0 consecutive errors)
- ⚠️ library-update: 1 consecutive error (auth)
- ❌ memory-save: 3 consecutive errors (channel config)
- ❌ evoclaw-heartbeat: 5 consecutive errors (channel config)

## Recommendations
1. Fix delivery channel on `memory-save` and `evoclaw-heartbeat` cron jobs
2. Monitor library-update for recurring auth errors
